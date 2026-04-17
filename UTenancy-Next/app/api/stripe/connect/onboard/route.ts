import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

/**
 * POST /api/stripe/connect/onboard
 *
 * Creates (or retrieves) a Stripe Connect Express account for the authenticated
 * landlord and returns an Account Link URL to complete onboarding.
 *
 * Once the landlord completes onboarding, Stripe redirects them back to
 * /landlord?connect=success (or connect=refresh on timeout).
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
  if (user.user_metadata?.role !== 'landlord') {
    return NextResponse.json({ error: 'Only landlords can connect a payout account' }, { status: 403 })
  }

  // Fetch existing Connect ID if any
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_id')
    .eq('id', user.id)
    .single()

  let connectId: string | null = profile?.stripe_connect_id ?? null

  const origin = req.headers.get('origin') ?? 'https://utenancy.com'

  try {
    if (!connectId) {
      // Create a new Express account
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        metadata: { supabase_user_id: user.id },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
      connectId = account.id

      // Persist the Connect account ID
      await supabase
        .from('profiles')
        .update({ stripe_connect_id: connectId })
        .eq('id', user.id)
    }

    // Generate an Account Link for onboarding / re-onboarding
    const accountLink = await stripe.accountLinks.create({
      account: connectId,
      refresh_url: `${origin}/landlord?connect=refresh`,
      return_url:  `${origin}/landlord?connect=success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err) {
    console.error('Stripe connect onboard error:', err)
    return NextResponse.json(
      { error: 'Payout account setup unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
