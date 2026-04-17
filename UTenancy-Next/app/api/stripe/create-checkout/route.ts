import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Price IDs per tier — override via Vercel env vars if needed
const PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER ?? 'price_1TKM6aJF9e2N7acJJzJDJqb1',
  growth:  process.env.STRIPE_PRICE_GROWTH  ?? 'price_1TKM81JF9e2N7acJDS9pf2dX',
  pro:     process.env.STRIPE_PRICE_PRO     ?? 'price_1TKM93JF9e2N7acJMCD8DOoS',
}

// Lazy-init: Stripe v17+ validates the key at instantiation time, which
// throws during Next.js build when STRIPE_SECRET_KEY isn't present.
// Initialise inside the handler so it only runs at request time.
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

/**
 * POST /api/stripe/create-checkout
 *
 * Creates a Stripe Checkout session for the authenticated landlord
 * and returns the hosted checkout URL to redirect to.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe()

  // ── Parse tier from body (defaults to 'pro' for backwards-compat) ──
  let tier = 'pro'
  try {
    const body = await req.json()
    if (body?.tier && PRICE_IDS[body.tier]) tier = body.tier
  } catch { /* no body is fine */ }

  const priceId = PRICE_IDS[tier]

  // ── Auth: get session from Supabase cookies ──
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.user_metadata?.role !== 'landlord') {
    return NextResponse.json({ error: 'Only landlords can subscribe' }, { status: 403 })
  }

  // ── Fetch profile using the authenticated user's own session (no service key needed) ──
  // The user can always read and update their own profile row via RLS.
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, subscription_status')
    .eq('id', user.id)
    .single()

  // Already subscribed at this tier or higher — don't create another session
  const activeTiers = ['starter', 'growth', 'pro']
  if (profile?.subscription_status && activeTiers.includes(profile.subscription_status)) {
    return NextResponse.json({ error: 'Already subscribed' }, { status: 400 })
  }

  let customerId: string | null = profile?.stripe_customer_id ?? null

  try {
    if (!customerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.user_metadata?.first_name ?? ''} ${user.user_metadata?.last_name ?? ''}`.trim() || undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      // Persist the customer ID using the user's own session
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const origin = req.headers.get('origin') ?? 'https://utenancy.com'

    // ── Create Checkout Session ──
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/landlord?checkout=success&tier=${tier}`,
      cancel_url:  `${origin}/landlord?checkout=cancelled`,
      metadata: { supabase_user_id: user.id, tier },
      subscription_data: {
        metadata: { supabase_user_id: user.id, tier },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json(
      { error: 'Payment service unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
