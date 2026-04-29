import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})


// Maps a Stripe price ID to a UTenancy tier name
function tierFromPriceId(priceId: string | null | undefined): string {
  if (!priceId) return 'pro' // legacy fallback
  const map: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER ?? '']: 'starter',
    [process.env.STRIPE_PRICE_GROWTH  ?? '']: 'growth',
    [process.env.STRIPE_PRICE_PRO     ?? 'price_1TRcxuJdzdbivQloBF8TIHif']: 'pro',
  }
  return map[priceId] ?? 'pro'
}

function getSubscriptionUpdate(
  status: string,
  tier: string,
): { subscription_status: string; subscription_tier: string } {
  switch (status) {
    case 'active':
      return { subscription_status: tier, subscription_tier: tier }
    case 'past_due':
      return { subscription_status: 'past_due', subscription_tier: tier }
    case 'canceled':
    case 'cancelled':
    case 'unpaid':
    case 'incomplete_expired':
      return { subscription_status: 'cancelled', subscription_tier: 'free' }
    default:
      return { subscription_status: 'free', subscription_tier: 'free' }
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
      const session    = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const userId     = session.metadata?.supabase_user_id
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
      // Tier comes from metadata (set when creating the checkout session)
      const tier       = session.metadata?.tier ?? 'pro'

      if (userId) {
        await admin.from('profiles').update({
          subscription_status: tier,
          subscription_tier:   tier,
          stripe_customer_id:  customerId ?? undefined,
        }).eq('id', userId)
      } else if (customerId) {
        await admin.from('profiles').update({
          subscription_status: tier,
          subscription_tier:   tier,
        }).eq('stripe_customer_id', customerId)
      }

      /* ── Referral reward: give referring landlord 1 month of next tier ── */
      const resolvedUserId = userId ?? (customerId
        ? (await admin.from('profiles').select('id').eq('stripe_customer_id', customerId).single()).data?.id
        : null)

      if (resolvedUserId) {
        const { data: referral } = await admin
          .from('referrals')
          .select('id, referrer_id')
          .eq('referred_id', resolvedUserId)
          .eq('reward_applied', false)
          .single()

        if (referral) {
          // Look up referrer's current tier to determine the reward tier
          const { data: referrerProfile } = await admin
            .from('profiles')
            .select('subscription_tier, stripe_customer_id')
            .eq('id', referral.referrer_id)
            .single()

          const tierOrder = ['free', 'starter', 'growth', 'pro']
          const currentIdx = tierOrder.indexOf(referrerProfile?.subscription_tier ?? 'free')
          const rewardTier = tierOrder[Math.min(currentIdx + 1, tierOrder.length - 1)]

          // Apply a 1-month coupon to the referrer if they have a Stripe subscription
          if (referrerProfile?.stripe_customer_id) {
            try {
              const tierPriceMap: Record<string, number> = {
                starter: 2900, growth: 5900, pro: 12900,
              }
              const discountAmount = tierPriceMap[rewardTier] ?? 2900

              const coupon = await stripe.coupons.create({
                amount_off: discountAmount,
                currency:   'usd',
                duration:   'once',
                name:       `UTenancy Referral Reward — 1 month ${rewardTier}`,
              })

              const subs = await stripe.subscriptions.list({
                customer: referrerProfile.stripe_customer_id,
                status:   'active',
                limit:    1,
              })
              if (subs.data.length > 0) {
                await stripe.subscriptions.update(subs.data[0].id, {
                  discounts: [{ coupon: coupon.id }],
                })
              }
            } catch (err) {
              console.error('Referral reward Stripe error:', err)
            }
          }

          // Mark reward as applied regardless of Stripe result
          await admin
            .from('referrals')
            .update({ reward_applied: true, reward_tier: rewardTier })
            .eq('id', referral.id)
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      const userId     = sub.metadata?.supabase_user_id
      // Resolve tier from the first price item, or fall back to metadata
      const priceId    = sub.items?.data?.[0]?.price?.id
      const tier       = sub.metadata?.tier ?? tierFromPriceId(priceId)
      const update     = getSubscriptionUpdate(sub.status, tier)

      if (userId) {
        await admin.from('profiles').update(update).eq('id', userId)
      } else {
        await admin.from('profiles').update(update).eq('stripe_customer_id', customerId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      const userId     = sub.metadata?.supabase_user_id
      const cancelled  = { subscription_status: 'cancelled', subscription_tier: 'free' }

      if (userId) {
        await admin.from('profiles').update(cancelled).eq('id', userId)
      } else {
        await admin.from('profiles').update(cancelled).eq('stripe_customer_id', customerId)
      }
      break
    }

    // ── Stripe Connect: sync landlord payout account status ──
    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      const userId  = account.metadata?.supabase_user_id

      if (userId) {
        await admin.from('profiles').update({
          stripe_connect_enabled: account.charges_enabled && account.payouts_enabled,
        }).eq('id', userId)
      } else {
        // fall back to matching by connect ID
        await admin.from('profiles').update({
          stripe_connect_enabled: account.charges_enabled && account.payouts_enabled,
        }).eq('stripe_connect_id', account.id)
      }
      break
    }

    default:
      // Unhandled event type — return 200 so Stripe doesn't retry
      break
  }

  return NextResponse.json({ received: true })
}
