'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { SubscriptionTier } from '@/lib/types'
import FeatureGate from '@/components/FeatureGate'

interface HouseholdRow {
  id: string
  name: string
  listing_id: string
  listing_address: string
  listing_unit: string | null
  listing_city: string
  listing_state: string
  rent: number
  members: { id: string; full_name: string; avatar_url: string | null }[]
}

export default function LandlordHouseholdsPage() {
  const router = useRouter()
  const [tier, setTier]             = useState<SubscriptionTier>('free')
  const [households, setHouseholds] = useState<HouseholdRow[]>([])
  const [loading, setLoading]       = useState(true)

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

      /* ── Fetch households via landlord's listings ── */
      const { data: listings } = await supabase
        .from('listings')
        .select('id, address, unit, city, state, rent')
        .eq('landlord_id', user.id)
        .eq('status', 'filled')

      if (!listings || listings.length === 0) {
        setLoading(false)
        return
      }

      const listingIds = listings.map((l: { id: string }) => l.id)

      const { data: hhs } = await supabase
        .from('households')
        .select('id, name, listing_id')
        .in('listing_id', listingIds)

      if (!hhs || hhs.length === 0) {
        setLoading(false)
        return
      }

      const hhIds = hhs.map((h: { id: string }) => h.id)

      const { data: members } = await supabase
        .from('household_members')
        .select('household_id, user_id, profiles(id, full_name, avatar_url)')
        .in('household_id', hhIds)

      const listingMap: Record<string, { address: string; unit: string | null; city: string; state: string; rent: number }> = {}
      listings.forEach((l: { id: string; address: string; unit: string | null; city: string; state: string; rent: number }) => {
        listingMap[l.id] = { address: l.address, unit: l.unit, city: l.city, state: l.state, rent: l.rent }
      })

      const membersByHh: Record<string, { id: string; full_name: string; avatar_url: string | null }[]> = {}
      if (members) {
        members.forEach((m: { household_id: string; profiles: { id: string; full_name: string; avatar_url: string | null } | null }) => {
          if (!membersByHh[m.household_id]) membersByHh[m.household_id] = []
          if (m.profiles) {
            membersByHh[m.household_id].push({
              id: m.profiles.id,
              full_name: m.profiles.full_name,
              avatar_url: m.profiles.avatar_url,
            })
          }
        })
      }

      const rows: HouseholdRow[] = hhs.map((h: { id: string; name: string; listing_id: string }) => {
        const listing = listingMap[h.listing_id] ?? { address: '—', unit: null, city: '', state: '', rent: 0 }
        return {
          id: h.id,
          name: h.name,
          listing_id: h.listing_id,
          listing_address: listing.address,
          listing_unit: listing.unit,
          listing_city: listing.city,
          listing_state: listing.state,
          rent: listing.rent,
          members: membersByHh[h.id] ?? [],
        }
      })

      setHouseholds(rows)
      setLoading(false)
    }
    load()
  }, [router])

  const totalReceived = households.reduce((s, h) => s + h.rent, 0)
  const totalDue      = households.reduce((s, h) => s + h.rent, 0)

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
              <h1 className="font-head font-bold text-espresso text-lg">Households</h1>
              <p className="text-xs font-body text-muted">Tenants in your filled properties</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-head font-bold clay-grad text-white">
            <span className="material-symbols-outlined fill text-sm">workspace_premium</span>
            Starter+
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <FeatureGate
          currentTier={tier}
          requiredTier="starter"
          lockedMessage="Household management is available on Starter and above."
          onUpgrade={() => router.push('/landlord')}
        >
          <>
            {/* Revenue summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-out-var p-5 shadow-sm">
                <div className="w-10 h-10 clay-grad rounded-xl flex items-center justify-center shadow-md mb-3">
                  <span className="material-symbols-outlined fill text-white text-lg">payments</span>
                </div>
                <p className="font-display text-3xl font-light text-clay-dark italic">${totalReceived.toLocaleString()}</p>
                <p className="text-sm font-head font-semibold text-espresso mt-0.5">Monthly Received</p>
                <p className="text-xs font-body text-muted">From filled units</p>
              </div>
              <div className="bg-white rounded-2xl border border-out-var p-5 shadow-sm">
                <div className="w-10 h-10 bg-stone-200 rounded-xl flex items-center justify-center shadow-md mb-3">
                  <span className="material-symbols-outlined fill text-stone-500 text-lg">receipt_long</span>
                </div>
                <p className="font-display text-3xl font-light text-clay-dark italic">${totalDue.toLocaleString()}</p>
                <p className="text-sm font-head font-semibold text-espresso mt-0.5">Monthly Due</p>
                <p className="text-xs font-body text-muted">Expected across households</p>
              </div>
            </div>

            {/* Household list */}
            {households.length === 0 ? (
              <div className="bg-white rounded-2xl border border-out-var p-10 text-center shadow-sm">
                <span className="material-symbols-outlined text-5xl text-muted mb-3 block">home_work</span>
                <p className="font-head font-semibold text-espresso">No households yet</p>
                <p className="text-sm font-body text-muted mt-1">Households are created automatically when you approve a tenant application.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {households.map(hh => (
                  <div key={hh.id} className="bg-white rounded-2xl border border-out-var shadow-sm overflow-hidden">
                    {/* Property header */}
                    <div className="px-6 py-4 border-b border-out-var flex items-center justify-between">
                      <div>
                        <p className="font-head font-bold text-espresso">
                          {hh.listing_address}{hh.listing_unit ? ` #${hh.listing_unit}` : ''}
                        </p>
                        <p className="text-xs font-body text-muted">{hh.listing_city}, {hh.listing_state}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-xl font-light text-clay-dark italic">${hh.rent.toLocaleString()}<span className="text-xs font-body text-muted">/mo</span></p>
                        <p className="text-xs font-head text-muted">Rent</p>
                      </div>
                    </div>

                    {/* Members */}
                    <div className="px-6 py-4">
                      <p className="text-xs font-head font-bold text-muted uppercase tracking-wide mb-3">Tenants</p>
                      {hh.members.length === 0 ? (
                        <p className="text-sm font-body text-muted">No members recorded.</p>
                      ) : (
                        <div className="space-y-2">
                          {hh.members.map(m => (
                            <div key={m.id} className="flex items-center gap-3">
                              <div className="w-8 h-8 clay-grad rounded-full flex items-center justify-center flex-shrink-0">
                                {m.avatar_url ? (
                                  <img src={m.avatar_url} alt={m.full_name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span className="text-white font-head font-black text-xs">{m.full_name?.[0]?.toUpperCase() ?? '?'}</span>
                                )}
                              </div>
                              <p className="text-sm font-head font-semibold text-espresso">{m.full_name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        </FeatureGate>
      </div>
    </div>
  )
}
