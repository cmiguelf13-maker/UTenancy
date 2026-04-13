import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'https://dzoigotkcaghqjyrotgp.supabase.co'

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6b2lnb3RrY2FnaHFqeXJvdGdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjg0MzksImV4cCI6MjA5MDkwNDQzOX0.coVY5stZKapQ_JiYek8ywckLC0VYumd4s_cNaNVmooE'

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

  const account = await stripe.accounts.retrieve(connectId)

  return NextResponse.json({
    connected:        account.details_submitted,
    charges_enabled:  account.charges_enabled,
    payouts_enabled:  account.payouts_enabled,
    connect_id:       connectId,
  })
}
