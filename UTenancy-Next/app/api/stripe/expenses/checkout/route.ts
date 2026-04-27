import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const PLATFORM_FEE_PERCENT = 0.02

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

/**
 * POST /api/stripe/expenses/checkout
 *
 * Creates a Stripe Checkout Session (payment mode) for a student paying
 * their share of a household expense. Funds are routed to the landlord's
 * Stripe Connect account via transfer_data, with a 2% platform fee.
 *
 * Body:
 *   {
 *     amount_cents:     number,   // e.g. 142500 for $1,425.00
 *     description:      string,   // e.g. "May rent — 1234 Westwood Blvd"
 *     landlord_user_id: string,   // Supabase user ID of the landlord
 *     household_id?:    string,
 *     expense_id?:      string,
 *   }
 *
 * Response: { url: string }  — redirect student here to pay
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe()

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

  let body: {
    amount_cents?: number
    description?: string
    landlord_user_id?: string
    household_id?: string
    expense_id?: string
  }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  const { amount_cents, description, landlord_user_id, household_id, expense_id } = body

  if (!amount_cents || amount_cents < 50) {
    return NextResponse.json({ error: 'amount_cents must be at least 50' }, { status: 400 })
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
    .select('stripe_connect_id, stripe_connect_enabled')
    .eq('id', landlord_user_id)
    .single()

  if (!landlordProfile?.stripe_connect_id) {
    return NextResponse.json({ error: 'Landlord has not connected a payout account yet' }, { status: 400 })
  }
  if (!landlordProfile.stripe_connect_enabled) {
    return NextResponse.json({ error: 'Landlord payout account is not fully activated' }, { status: 400 })
  }

  const origin = req.headers.get('origin') ?? 'https://utenancy.com'
  const applicationFee = Math.round(amount_cents * PLATFORM_FEE_PERCENT)

  try {
    const session = await stripe.checkout.sessions.create({
      mode:                 'payment',
      payment_method_types: ['us_bank_account', 'card'],
      line_items: [
        {
          price_data: {
            currency:     'usd',
            product_data: { name: description },
            unit_amount:  amount_cents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: { destination: landlordProfile.stripe_connect_id },
        metadata: {
          payer_user_id:    user.id,
          landlord_user_id: landlord_user_id,
          household_id:     household_id ?? '',
          expense_id:       expense_id ?? '',
        },
      },
      success_url: `${origin}/tenant/household?paid=${expense_id ?? 'ok'}`,
      cancel_url:  `${origin}/tenant/household?paid=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe expenses/checkout error:', err)
    return NextResponse.json(
      { error: 'Payment processing unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
