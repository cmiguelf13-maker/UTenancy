import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

/** Map a Stripe price's unit_amount (cents) to a UTenancy plan name */
function getPlanName(unitAmount: number | null | undefined): string {
  if (unitAmount === 2900)  return 'starter'
  if (unitAmount === 5900)  return 'growth'
  if (unitAmount === 12900) return 'pro'
  return 'pro' // fallback for any unrecognised paid amount
}

/**
 * Derive the subscription_status value to store, combining Stripe subscription
 * status with the price amount so we know which plan tier was purchased.
 */
function resolveStatus(stripeStatus: string, unitAmount?: number | null): string {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return getPlanName(unitAmount)
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'cancelled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'trial'
    default:
      return 'trial'
  }
}

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const customerId   = typeof session.customer === 'string' ? session.customer : session.customer?.id
      const userId       = session.client_reference_id || session.metadata?.supabase_user_id || null

      // Retrieve the subscription to determine the plan tier from the price amount
      let unitAmount: number | null = null
      if (session.subscription) {
        try {
          const sub  = await stripe.subscriptions.retrieve(session.subscription as string)
          unitAmount = sub.items.data[0]?.price?.unit_amount ?? null
        } catch { /* non-fatal — falls back to 'pro' */ }
      }

      const planStatus = getPlanName(unitAmount)

      if (userId) {
        await admin.from('profiles').update({
          subscription_status: planStatus,
          stripe_customer_id:  customerId ?? undefined,
        }).eq('id', userId)
      } else if (customerId) {
        await admin.from('profiles').update({
          subscription_status: planStatus,
        }).eq('stripe_customer_id', customerId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      const userId     = sub.metadata?.supabase_user_id
      const unitAmount = sub.items.data[0]?.price?.unit_amount ?? null
      const newStatus  = resolveStatus(sub.status, unitAmount)

      if (userId) {
        await admin.from('profiles').update({ subscription_status: newStatus }).eq('id', userId)
      } else {
        await admin.from('profiles').update({ subscription_status: newStatus }).eq('stripe_customer_id', customerId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      const userId     = sub.metadata?.supabase_user_id

      if (userId) {
        await admin.from('profiles').update({ subscription_status: 'trial' }).eq('id', userId)
      } else {
        await admin.from('profiles').update({ subscription_status: 'trial' }).eq('stripe_customer_id', customerId)
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
