import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'https://dzoigotkcaghqjyrotgp.supabase.co'

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6b2lnb3RrY2FnaHFqeXJvdGdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjg0MzksImV4cCI6MjA5MDkwNDQzOX0.coVY5stZKapQ_JiYek8ywckLC0VYumd4s_cNaNVmooE'

// Platform fee: 2% on each expense payment (UTenancy revenue)
const PLATFORM_FEE_PERCENT = 0.02

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

/**
 * POST /api/stripe/expenses/pay
 *
 * Creates a Stripe PaymentIntent for a student paying their share of a
 * household expense. Funds are routed directly to the landlord's Stripe
 * Connect Express account via transfer_data.
 *
 * Body:
 *   {
 *     amount_cents: number,        // e.g. 7800 for $78.00
 *     description:  string,        // e.g. "October rent – The Scholar House"
 *     landlord_user_id: string,    // Supabase user ID of the landlord
 *     listing_id?: string,         // optional — for record keeping
 *   }
 *
 * Response:
 *   { client_secret: string }      // pass to Stripe.js confirmPayment()
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe()

  const cookieStore = await cookies()
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })

  // Auth — must be a logged-in student
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let body: { amount_cents?: number; description?: string; landlord_user_id?: string; listing_id?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  const { amount_cents, description, landlord_user_id, listing_id } = body

  if (!amount_cents || amount_cents < 50) {
    return NextResponse.json({ error: 'amount_cents must be at least 50 (50¢)' }, { status: 400 })
  }
  if (!description) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 })
  }
  if (!landlord_user_id) {
    return NextResponse.json({ error: 'landlord_user_id is required' }, { status: 400 })
  }

  // Look up landlord's Connect account
  const { data: landlordProfile } = await supabase
    .from('profiles')
    .select('stripe_connect_id')
    .eq('id', landlord_user_id)
    .single()

  if (!landlordProfile?.stripe_connect_id) {
    return NextResponse.json({ error: 'Landlord has not connected a payout account yet' }, { status: 400 })
  }

  // Verify landlord's Connect account can receive charges
  const account = await stripe.accounts.retrieve(landlordProfile.stripe_connect_id)
  if (!account.charges_enabled) {
    return NextResponse.json({ error: 'Landlord payout account is not fully activated' }, { status: 400 })
  }

  // Calculate platform fee (2%)
  const applicationFee = Math.round(amount_cents * PLATFORM_FEE_PERCENT)

  // Create PaymentIntent — funds go to landlord's Connect account, fee stays on platform
  const paymentIntent = await stripe.paymentIntents.create({
    amount:   amount_cents,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    description,
    application_fee_amount: applicationFee,
    transfer_data: {
      destination: landlordProfile.stripe_connect_id,
    },
    metadata: {
      payer_user_id:    user.id,
      landlord_user_id: landlord_user_id,
      listing_id:       listing_id ?? '',
    },
  })

  return NextResponse.json({ client_secret: paymentIntent.client_secret })
}
