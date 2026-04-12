'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type ListingStatus = 'active' | 'draft' | 'rented' | 'archived'

interface MyListing {
  id: string
  address: string
  unit: string | null
  city: string
  state: string
  rent: number
  bedrooms: number
  bathrooms: number
  type: string
  status: ListingStatus
  images: string[]
  created_at: string
}

const STATUS_CONFIG: Record<ListingStatus, { label: string; dot: string; badge: string }> = {
  active:   { label: 'Active',   dot: 'bg-green-500', badge: 'bg-green-50 text-green-700 border-green-200' },
  draft:    { label: 'Draft',    dot: 'bg-stone-400', badge: 'bg-stone-100 text-stone-500 border-stone-200' },
  rented:   { label: 'Rented',   dot: 'bg-blue-500',  badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  archived: { label: 'Archived', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
}

function safeStatus(s: string): ListingStatus {
  return s in STATUS_CONFIG ? (s as ListingStatus) : 'draft'
}

export default function MyListingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [listings, setListings]     = useState<MyListing[]>([])
  const [loading, setLoading]       = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      if (!u || u.user_metadata?.role === 'landlord') {
        router.push('/')
        return
      }
      fetchListings(u.id)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchListings(userId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('listings')
      .select('id, address, unit, city, state, rent, bedrooms, bathrooms, type, status, images, created_at')
      .eq('landlord_id', userId)
      .order('created_at', { ascending: false })
    setListings((data as MyListing[]) ?? [])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setDeletingId(id)
    await supabase.from('listings').delete().eq('id', id)
    setListings((prev) => prev.filter((l) => l.id !== id))
    setDeletingId(null)
  }

  async function handleToggleStatus(listing: MyListing) {
    const next: ListingStatus = listing.status === 'active' ? 'archived' : 'active'
    setTogglingId(listing.id)
    await supabase.from('listings').update({ status: next }).eq('id', listing.id)
    setListings((prev) => prev.map((l) => l.id === listing.id ? { ...l, status: next } : l))
    setTogglingId(null)
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-light text-clay-dark mb-1">
              My <em className="text-terra">Listings</em>
            </h1>
            <p className="font-body text-muted text-sm">Rooms and spaces you&apos;ve posted on UTenancy.</p>
          </div>
          <Link
            href="/post-room"
            className="flex items-center gap-1.5 clay-grad text-white px-5 py-2.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-clay/20"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Post a Room
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-clay/30 border-t-clay animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24 border border-out-var rounded-2xl bg-white">
            <span className="material-symbols-outlined text-out-var text-6xl mb-4 block">home_work</span>
            <p className="font-head font-bold text-clay-dark text-lg mb-1">No listings yet</p>
            <p className="font-body text-muted text-sm mb-6">Post your first open room to get started.</p>
            <Link
              href="/post-room"
              className="inline-flex items-center gap-1.5 clay-grad text-white px-5 py-2.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-clay/20"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Post a Room
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => {
              const status = safeStatus(listing.status)
              const cfg = STATUS_CONFIG[status]
              const isClosedOut = status === 'rented' || status === 'archived'
              return (
                <div key={listing.id} className="bg-white rounded-2xl border border-out-var shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex gap-0">
                    {/* Thumbnail */}
                    <div className="w-28 flex-shrink-0 relative">
                      {listing.images?.length > 0 ? (
                        <img src={listing.images[0]} alt={listing.address} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-linen to-surf-lo flex items-center justify-center min-h-[96px]">
                          <span className="material-symbols-outlined text-out-var text-4xl">home</span>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 p-4 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <p className="font-head font-bold text-clay-dark text-sm truncate">
                            {listing.address}{listing.unit ? `, ${listing.unit}` : ''}
                          </p>
                          <p className="font-body text-muted text-xs">
                            {listing.city}{listing.state ? `, ${listing.state}` : ''}
                          </p>
                        </div>
                        {/* Status badge */}
                        <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-head font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 text-xs font-body text-muted mb-3">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-terra">bed</span>
                          {listing.bedrooms} bed
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-terra">bathtub</span>
                          {listing.bathrooms} bath
                        </span>
                        <span className="font-head font-black text-clay-dark text-sm ml-auto">
                          ${listing.rent.toLocaleString()}<span className="font-normal text-muted text-xs">/mo</span>
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <a href={`/listings/${listing.id}`}
                          className="flex-1 flex items-center justify-center gap-1 text-xs font-head font-semibold text-clay-dark border border-out-var rounded-lg py-1.5 hover:border-clay/40 hover:bg-surf-lo transition-all">
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          View
                        </a>
                        {!isClosedOut && (
                          <button
                            onClick={() => handleToggleStatus(listing)}
                            disabled={togglingId === listing.id}
                            className="flex-1 flex items-center justify-center gap-1 text-xs font-head font-semibold text-clay-dark border border-out-var rounded-lg py-1.5 hover:border-clay/40 hover:bg-surf-lo transition-all disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {listing.status === 'active' ? 'pause_circle' : 'play_circle'}
                            </span>
                            {togglingId === listing.id ? '…' : listing.status === 'active' ? 'Archive' : 'Activate'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(listing.id)}
                          disabled={deletingId === listing.id}
                          className="flex items-center justify-center gap-1 text-xs font-head font-semibold text-red-500 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          {deletingId === listing.id ? '…' : ''}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </main>
  )
}
