'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Listing, SubscriptionTier } from '@/lib/types'
import FeatureGate from '@/components/FeatureGate'

/* ─── Types ──────────────────────────────────────────── */
interface MonthBucket {
  month: string   // e.g. "Jan", "Feb"
  revenue: number
  occupied: number
  total: number
}

/* ─── Helpers ────────────────────────────────────────── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function buildMonthlyData(listings: Listing[]): MonthBucket[] {
  const now   = new Date()
  const buckets: MonthBucket[] = []

  for (let i = 5; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = MONTHS[d.getMonth()]
    const rented  = listings.filter(l => l.status === 'rented').length
    const total   = listings.length
    // Simulate a realistic revenue curve (real data would come from Stripe)
    const revenue = rented * (listings.reduce((s, l) => s + l.rent, 0) / Math.max(total, 1))
    buckets.push({ month: label, revenue: Math.round(revenue), occupied: rented, total })
  }
  return buckets
}

/* ─── Mini bar chart (pure CSS) ─────────────────────── */
function BarChart({ data, max }: { data: MonthBucket[]; max: number }) {
  return (
    <div className="flex items-end gap-3 h-40 mt-4">
      {data.map((d, i) => {
        const pct = max > 0 ? (d.revenue / max) * 100 : 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-head text-muted">${(d.revenue/1000).toFixed(1)}k</span>
            <div className="w-full rounded-t-lg clay-grad opacity-80 transition-all" style={{ height: `${Math.max(pct, 4)}%` }} />
            <span className="text-[10px] font-head text-muted">{d.month}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Occupancy donut (CSS trick) ────────────────────── */
function OccupancyRing({ pct }: { pct: number }) {
  const stroke = 8
  const r      = 44
  const circ   = 2 * Math.PI * r
  const dash   = (pct / 100) * circ

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f0ebe5" strokeWidth={stroke} />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke="#c06848" strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-light text-clay-dark italic">{pct}%</span>
        <span className="text-[10px] font-head text-muted">occupied</span>
      </div>
    </div>
  )
}

/* ─── Applicant funnel ───────────────────────────────── */
function FunnelBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs font-head text-muted text-right shrink-0">{label}</span>
      <div className="flex-1 bg-linen rounded-full h-2.5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-xs font-head font-semibold text-espresso text-right">{count}</span>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────── */
export default function AnalyticsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [tier, setTier]         = useState<SubscriptionTier>('free')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.user_metadata?.role !== 'landlord') {
        router.replace('/auth'); return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single()

      setTier((profile?.subscription_tier ?? 'free') as SubscriptionTier)

      const { data: ls } = await supabase
        .from('listings')
        .select('*, interest_count:listing_interests(count)')
        .eq('landlord_id', user.id)

      setListings(ls ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  const monthly   = buildMonthlyData(listings)
  const maxRev    = Math.max(...monthly.map(m => m.revenue), 1)
  const active    = listings.filter(l => l.status === 'active').length
  const rented    = listings.filter(l => l.status === 'rented').length
  const totalRevenue = listings.filter(l => l.status === 'rented')
                                .reduce((s, l) => s + l.rent, 0)
  const occupancyPct = listings.length > 0 ? Math.round((rented / listings.length) * 100) : 0

  const totalInterest = listings.reduce((s, l) => {
    const n = Array.isArray(l.interest_count) ? (l.interest_count[0]?.count ?? 0) : (l.interest_count ?? 0)
    return s + Number(n)
  }, 0)

  const funnelMax = Math.max(totalInterest, 1)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surf-lo">
        <div className="w-8 h-8 border-2 border-clay rounded-full border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surf-lo pb-20">
      {/* Header */}
      <div className="bg-white border-b border-out-var px-6 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/landlord" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-linen transition-colors">
              <span className="material-symbols-outlined text-espresso">arrow_back</span>
            </Link>
            <div>
              <h1 className="font-head font-bold text-espresso text-lg">Analytics</h1>
              <p className="text-xs font-body text-muted">Portfolio performance overview</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-head font-bold clay-grad text-white">
            <span className="material-symbols-outlined fill text-sm">workspace_premium</span>
            Pro
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: 'home_work',      value: listings.length, label: 'Total Properties', sub: 'in your portfolio'  },
            { icon: 'check_circle',   value: active,          label: 'Active Listings',  sub: 'currently live'     },
            { icon: 'person_search',  value: totalInterest,   label: 'Total Applicants', sub: 'across all listings' },
            { icon: 'payments',       value: `$${totalRevenue.toLocaleString()}`, label: 'Monthly Revenue', sub: 'from rented units' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl border border-out-var p-5 shadow-sm">
              <div className="w-10 h-10 clay-grad rounded-xl flex items-center justify-center shadow-md mb-3">
                <span className="material-symbols-outlined fill text-white text-lg">{k.icon}</span>
              </div>
              <p className="font-display text-3xl font-light text-clay-dark italic">{k.value}</p>
              <p className="text-sm font-head font-semibold text-espresso mt-0.5">{k.label}</p>
              <p className="text-xs font-body text-muted">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Revenue chart — Pro only */}
        <FeatureGate
          currentTier={tier}
          requiredTier="growth"
          lockedMessage="Revenue charts are available on Growth and above."
          onUpgrade={() => router.push('/landlord')}
        >
          <div className="bg-white rounded-2xl border border-out-var p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-head font-bold text-espresso">Revenue (6 months)</h2>
              <span className="text-xs font-body text-muted">Rented units × monthly rent</span>
            </div>
            <BarChart data={monthly} max={maxRev} />
          </div>
        </FeatureGate>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Occupancy */}
          <FeatureGate
            currentTier={tier}
            requiredTier="starter"
            lockedMessage="Occupancy tracking is available on Starter and above."
            onUpgrade={() => router.push('/landlord')}
          >
            <div className="bg-white rounded-2xl border border-out-var p-6 shadow-sm">
              <h2 className="font-head font-bold text-espresso mb-4">Occupancy Rate</h2>
              <OccupancyRing pct={occupancyPct} />
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="font-display text-2xl font-light text-clay-dark italic">{rented}</p>
                  <p className="text-xs font-head text-muted">Rented</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-light text-clay-dark italic">{active}</p>
                  <p className="text-xs font-head text-muted">Active</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-light text-clay-dark italic">{listings.length - rented - active}</p>
                  <p className="text-xs font-head text-muted">Other</p>
                </div>
              </div>
            </div>
          </FeatureGate>

          {/* Applicant funnel — Pro only */}
          <FeatureGate
            currentTier={tier}
            requiredTier="growth"
            lockedMessage="The applicant funnel is available on Growth and above."
            onUpgrade={() => router.push('/landlord')}
          >
            <div className="bg-white rounded-2xl border border-out-var p-6 shadow-sm">
              <h2 className="font-head font-bold text-espresso mb-5">Applicant Funnel</h2>
              <div className="space-y-3">
                <FunnelBar label="Interested"  count={totalInterest}                      max={funnelMax} color="bg-clay"        />
                <FunnelBar label="Reviewed"    count={Math.round(totalInterest * 0.65)}   max={funnelMax} color="bg-terra"       />
                <FunnelBar label="Contacted"   count={Math.round(totalInterest * 0.40)}   max={funnelMax} color="bg-amber-400"   />
                <FunnelBar label="Toured"      count={Math.round(totalInterest * 0.20)}   max={funnelMax} color="bg-amber-300"   />
                <FunnelBar label="Placed"      count={rented}                             max={funnelMax} color="bg-green-400"   />
              </div>
              <p className="text-xs font-body text-muted mt-4">
                * Reviewed, contacted, toured stages are estimated from interest data. Connect tenant screening to get exact numbers.
              </p>
            </div>
          </FeatureGate>
        </div>

        {/* Property breakdown — Pro only */}
        <FeatureGate
          currentTier={tier}
          requiredTier="pro"
          lockedMessage="The detailed property breakdown table is a Pro feature."
          onUpgrade={() => router.push('/landlord')}
        >
          <div className="bg-white rounded-2xl border border-out-var shadow-sm overflow-hidden">
            <div className="p-6 border-b border-out-var">
              <h2 className="font-head font-bold text-espresso">Property Breakdown</h2>
              <p className="text-xs font-body text-muted mt-0.5">Revenue and applicant data per property</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-linen border-b border-out-var">
                    {['Property','Status','Beds','Rent/mo','Applicants','Rev. share'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-head font-bold text-muted uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-out-var">
                  {listings.map(l => {
                    const interestN = Array.isArray(l.interest_count)
                      ? (l.interest_count[0]?.count ?? 0)
                      : (l.interest_count ?? 0)
                    const share = totalRevenue > 0 && l.status === 'rented'
                      ? Math.round((l.rent / totalRevenue) * 100)
                      : 0
                    const badgeMap: Record<string, string> = {
                      active:   'bg-green-50 text-green-700 border border-green-200',
                      draft:    'bg-stone-100 text-stone-500 border border-stone-200',
                      rented:   'bg-blue-50 text-blue-700 border border-blue-200',
                      archived: 'bg-amber-50 text-amber-700 border border-amber-200',
                    }
                    const badge = badgeMap[l.status] ?? badgeMap.draft
                    return (
                      <tr key={l.id} className="hover:bg-surf-lo transition-colors">
                        <td className="px-5 py-4 font-head font-semibold text-espresso">{l.address}{l.unit ? ` #${l.unit}` : ''}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-head font-bold ${badge}`}>
                            {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-muted">{l.bedrooms}bd / {l.bathrooms}ba</td>
                        <td className="px-5 py-4 font-head font-semibold text-espresso">${l.rent.toLocaleString()}</td>
                        <td className="px-5 py-4 text-muted">{Number(interestN)}</td>
                        <td className="px-5 py-4">
                          {l.status === 'rented' ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 max-w-[80px] h-1.5 bg-linen rounded-full overflow-hidden">
                                <div className="h-full clay-grad rounded-full" style={{ width: `${share}%` }} />
                              </div>
                              <span className="text-xs font-head text-muted">{share}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {listings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted font-body">
                        No listings yet. Add properties from your dashboard.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </FeatureGate>
      </div>
    </div>
  )
}
