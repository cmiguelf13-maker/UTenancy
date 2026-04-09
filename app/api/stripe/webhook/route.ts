import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})


function getSubscriptionStatus(status: string): string {
  switch (status) {
    case 'active':   return 'pro'
    case 'past_due': return 'past_due'
    case 'canceled':
    case 'cancelled':
    case 'unpaid':
    case 'incomplete_expired': return 'cancelled'
    default:         return 'free'
  }
}

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events to keep subscription status in sync
 * with the Supabase profiles table.
 *
 * Events handled:
 *   - checkout.session.completed       → activates subscription after payment
 *   - customer.subscription.updated    → syncs subscription status changes
 *   - customer.subscription.deleted    → marks subscription as cancelled
 *
 * User identification priority:
 *   1. session.client_reference_id  (set via ?client_reference_id= on payment link URL)
 *   2. session.metadata.supabase_user_id  (set by create-checkout API route)
 *   3. stripe_customer_id fallback  (looks up existing profile)
 */
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

  // Service-role client — bypasses RLS for reliable webhook writes
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session    = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id

      // Resolve user ID: client_reference_id (payment links) → metadata → customer ID fallback
      const userId =
        session.client_reference_id ||
        session.metadata?.supabase_user_id ||
        null

      if (userId) {
        await admin.from('profiles').update({
          subscription_status: 'pro',
          stripe_customer_id:  customerId ?? undefined,
        }).eq('id', userId)
      } else if (customerId) {
        // Last-resort: match by existing stripe_customer_id
        await admin.from('profiles').update({
          subscription_status: 'pro',
        }).eq('stripe_customer_id', customerId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      const userId     = sub.metadata?.supabase_user_id
      const newStatus  = getSubscriptionStatus(sub.status)

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
        await admin.from('profiles').update({ subscription_status: 'cancelled' }).eq('id', userId)
      } else {
        await admin.from('profiles').update({ subscription_status: 'cancelled' }).eq('stripe_customer_id', customerId)
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
