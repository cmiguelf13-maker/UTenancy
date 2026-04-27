'use client'

import { useLanguage } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'
import { SubscriptionTier } from '@/lib/types'

/**
 * FeatureGate — wraps Pro/Growth/Starter-only content with an upgrade overlay.
 *
 * Usage:
 *   <FeatureGate currentTier={tier} requiredTier="pro">
 *     <AnalyticsChart />
 *   </FeatureGate>
 */

const TIER_RANK: Record<SubscriptionTier, number> = {
  free:    0,
  starter: 1,
  growth:  2,
  pro:     3,
}

const TIER_COLOR: Record<SubscriptionTier, string> = {
  free:    'bg-stone-100 text-stone-600',
  starter: 'bg-amber-50 text-amber-700',
  growth:  'bg-blue-50 text-blue-700',
  pro:     'clay-grad text-white',
}

interface Props {
  currentTier: SubscriptionTier
  requiredTier: SubscriptionTier
  children: React.ReactNode
  /** Shown inside the locked overlay instead of the default message */
  lockedMessage?: string
  /** If true, renders children blurred but visible; default false hides them */
  blur?: boolean
  onUpgrade?: () => void
}

export default function FeatureGate({
  currentTier,
  requiredTier,
  children,
  lockedMessage,
  blur = true,
  onUpgrade,
}: Props) {
  const { t } = useLanguage()
  const TIER_LABELS: Record<string, TranslationKey> = {
    free: 'tierFree', starter: 'tierStarter', growth: 'tierGrowth', pro: 'tierPro'
  }
  const tierLabel = t(TIER_LABELS[requiredTier] ?? 'tierFree')

  const hasAccess = TIER_RANK[currentTier] >= TIER_RANK[requiredTier]
  if (hasAccess) return <>{children}</>

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Blurred/hidden preview of the locked content */}
      <div className={blur ? 'blur-sm pointer-events-none select-none' : 'hidden'}>
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] p-6 text-center">
        {/* Tier badge */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-head font-bold mb-4 ${TIER_COLOR[requiredTier]}`}>
          <span className="material-symbols-outlined fill text-sm">workspace_premium</span>
          {tierLabel} {t('fgFeatureSuffix')}
        </span>

        <p className="font-head font-semibold text-espresso text-base mb-1">
          {lockedMessage ?? t('fgUpgradePrompt')}
        </p>
        <p className="text-sm font-body text-muted mb-5 max-w-xs">
          {t('fgUpgradeDesc')}
        </p>

        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="clay-grad text-white text-sm font-head font-semibold px-5 py-2.5 rounded-xl shadow-md hover:opacity-90 transition-opacity"
          >
            {t('fgUpgradeTo')} {tierLabel}
          </button>
        )}
      </div>
    </div>
  )
}
