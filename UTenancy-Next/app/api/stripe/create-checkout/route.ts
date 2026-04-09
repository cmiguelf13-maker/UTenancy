import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

const PRICE_ID = 'price_1TK6y0JF9e2N7acJeKFrzvXj'

/**
 * POST /api/stripe/create-checkout
 *
 * Creates a Stripe Checkout session for the authenticated landlord
 * and returns the hosted checkout URL to redirect to.
 */
export async function POST(req: NextRequest) {
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

  // ── Fetch profile to get or create Stripe customer ──
  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id, subscription_status')
    .eq('id', user.id)
    .single()

  // Already subscribed — don't create another session
  if (profile?.subscription_status === 'pro') {
    return NextResponse.json({ error: 'Already subscribed to Pro' }, { status: 400 })
  }

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    // Create a new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.user_metadata?.first_name ?? ''} ${user.user_metadata?.last_name ?? ''}`.trim() || undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    // Persist the customer ID immediately
    await admin
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
