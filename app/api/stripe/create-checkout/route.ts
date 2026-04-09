import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const PRICE_ID = 'price_1TK6y0JF9e2N7acJeKFrzvXj'

// Public keys — already embedded in the browser bundle, safe to inline as fallbacks
// This guards against env var resolution issues in Vercel serverless functions
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'https://dzoigotkcaghqjyrotgp.supabase.co'

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6b2lnb3RrY2FnaHFqeXJvdGdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjg0MzksImV4cCI6MjA5MDkwNDQzOX0.coVY5stZKapQ_JiYek8ywckLC0VYumd4s_cNaNVmooE'

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

  // ── Auth: get session from Supabase cookies ──
  const cookieStore = await cookies()
  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
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

  // Already subscribed — don't create another session
  if (profile?.subscription_status === 'pro') {
    return NextResponse.json({ error: 'Already subscribed to Pro' }, { status: 400 })
  }

  let customerId: string | null = profile?.stripe_customer_id ?? null

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
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    success_url: `${origin}/landlord?checkout=success`,
    cancel_url:  `${origin}/landlord?checkout=cancelled`,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  })

  return NextResponse.json({ url: session.url })
}
