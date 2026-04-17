import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

/**
 * GET /api/stripe/connect/status
 *
 * Returns the landlord's Stripe Connect onboarding status.
 *
 * Response:
 *   { connected: boolean, charges_enabled: boolean, payouts_enabled: boolean, connect_id: string | null }
 */
export async function GET() {
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_id')
    .eq('id', user.id)
    .single()

  const connectId = profile?.stripe_connect_id ?? null

  if (!connectId) {
    return NextResponse.json({ connected: false, charges_enabled: false, payouts_enabled: false, connect_id: null })
  }

  try {
    const account = await stripe.accounts.retrieve(connectId)

    return NextResponse.json({
      connected:        account.details_submitted,
      charges_enabled:  account.charges_enabled,
      payouts_enabled:  account.payouts_enabled,
      connect_id:       connectId,
    })
  } catch (err) {
    console.error('Stripe connect status error:', err)
    return NextResponse.json(
      { error: 'Could not retrieve payout account status. Please try again.' },
      { status: 503 }
    )
  }
}
