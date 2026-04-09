import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

// Raw body is required for Stripe signature verification — disable body parsing
export const config = { api: { bodyParser: false } }

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
 *   - checkout.session.completed       → activates Pro after payment
 *   - customer.subscription.updated    → syncs subscription status changes
 *   - customer.subscription.deleted    → marks subscription as cancelled
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
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const userId     = session.metadata?.supabase_user_id
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id

      if (userId) {
        await admin.from('profiles').update({
          subscription_status: 'pro',
          stripe_customer_id:  customerId ?? undefined,
        }).eq('id', userId)
      } else if (customerId) {
        // Fallback: look up by customer ID
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
      // Unhandled event type — return 200 so Stripe doesn't retry
      break
  }

  return NextResponse.json({ received: true })
}
