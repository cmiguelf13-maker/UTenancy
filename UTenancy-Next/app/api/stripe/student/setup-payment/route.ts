import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

/**
 * POST /api/stripe/student/setup-payment
 *
 * Creates (or retrieves) a Stripe Customer for the authenticated student,
 * then opens a Stripe Checkout Session in "setup" mode so they can securely
 * save a US bank account (ACH) or card for future expense payments.
 *
 * On success Stripe redirects to /tenant/household?payment=saved
 * On cancel  Stripe redirects to /tenant/household?payment=cancelled
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

  // Fetch or create Stripe customer for this student
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, first_name, last_name')
    .eq('id', user.id)
    .single()

  let customerId: string | null = profile?.stripe_customer_id ?? null

  const origin = req.headers.get('origin') ?? 'https://utenancy.com'

  try {
    if (!customerId) {
      const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
      const customer = await stripe.customers.create({
        email: user.email,
        name:  fullName || undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Checkout in setup mode — student saves bank account or card
    // us_bank_account enables ACH Direct Debit (fee-free for students)
    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      mode:                 'setup',
      payment_method_types: ['us_bank_account', 'card'],
      success_url:          `${origin}/tenant/household?payment=saved`,
      cancel_url:           `${origin}/tenant/household?payment=cancelled`,
      metadata:             { supabase_user_id: user.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe setup-payment error:', err)
    return NextResponse.json(
      { error: 'Payment setup unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
