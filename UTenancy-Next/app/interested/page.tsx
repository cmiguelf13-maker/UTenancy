'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Listing } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

/* ── Find-or-create a conversation via the atomic RPC (handles RLS correctly) ── */
async function openConversation(
  supabase: ReturnType<typeof createClient>,
  listingId: string,
  userId: string,
  landlordId: string,
): Promise<string | null> {
  const { data: convId, error } = await supabase.rpc('open_conversation', {
    p_listing_id: listingId,
    p_user_a:     userId,
    p_user_b:     landlordId,
  })
  if (error || !convId) return null
  return convId as string
}

export default function InterestedPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [user,      setUser]      = useState<User | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [listings,  setListings]  = useState<Listing[]>([])
  const [messaging, setMessaging] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      if (!u) { router.push('/auth'); return }
      setUser(u)

      // Fetch listings the student has expressed interest in
      supabase
        .from('listing_interests')
        .select('listing:listings(*)')
        .eq('student_id', u.id)
        .then(({ data: interests }) => {
          if (interests) {
            const mapped = interests
              .map((r: any) => r.listing)
              .filter(Boolean) as Listing[]
            setListings(mapped)
          }
          setLoading(false)
        })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleMessage(listing: Listing) {
    if (!user) { router.push('/auth'); return }
    const key = listing.id
    setMessaging((prev) => new Set(prev).add(key))
    try {
      const convId = await openConversation(supabase, listing.id, user.id, listing.landlord_id)
      if (convId) router.push(`/messages/${convId}`)
    } catch (err) {
      console.error('[interested] message error:', err)
    } finally {
      setMessaging((prev) => { const s = new Set(prev); s.delete(key); return s })
    }
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-cream">
      <span className="spinner" style={{ borderColor: 'rgba(107,76,59,.2)', borderTopColor: '#6b4c3b', width: 32, height: 32 }} />
    </main>
  )

  return (
    <main className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-head font-semibold text-muted hover:text-clay transition-colors mb-5">
            <span className="material-symbols-outlined text-base">arrow_back</span> Back to Home
          </Link>
          <h1 className="font-display text-4xl font-light text-clay-dark mb-1">
            Interested <em>Properties</em>
          </h1>
          <p className="text-sm font-body text-muted">
            Properties you&apos;ve expressed interest in. Click any listing to view details or message the landlord directly.
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-linen rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-clay text-3xl">favorite</span>
            </div>
            <p className="font-head font-bold text-clay-dark mb-1">No interested properties yet</p>
            <p className="text-sm font-body text-muted mb-5">Browse listings and express interest to see them here.</p>
            <Link href="/#listings"
              className="clay-grad text-white px-6 py-2.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/20 inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-base">search</span>
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((listing) => {
              const img = listing.images?.[0]
              const isSending = messaging.has(listing.id)
              return (
                <div key={listing.id} className="bg-white rounded-2xl border border-out-var overflow-hidden shadow-sm hover:shadow-md hover:border-clay/30 transition-all flex flex-col">

                  {/* Clickable image + content area → listing detail */}
                  <Link href={`/listings/${listing.id}`} className="flex-1 block group">
                    {/* Image */}
                    <div className="relative h-44 overflow-hidden bg-gradient-to-br from-linen to-surf-lo">
                      {img ? (
                        <img src={img} alt={listing.address} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-out-var text-5xl">home</span>
                        </div>
                      )}
                      <span className={`absolute top-3 left-3 ${listing.type === 'open-room' ? 'bg-terra/90' : 'bg-clay/90'} text-white text-[10px] font-head font-bold px-2.5 py-1 rounded-full`}>
                        {listing.type === 'open-room' ? 'Open Room' : 'Group Formation'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <p className="font-head font-bold text-clay-dark text-sm leading-tight">
                        {listing.address}{listing.unit ? `, ${listing.unit}` : ''}
                      </p>
                      <p className="text-xs font-body text-muted">{listing.city}, {listing.state}</p>
                      <div className="flex items-center gap-3 text-xs font-body text-muted mt-2">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-terra">bed</span> {listing.bedrooms} bed
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-terra">bathtub</span> {listing.bathrooms} bath
                        </span>
                        <span className="ml-auto font-head font-black text-clay-dark text-sm">
                          ${listing.rent.toLocaleString()}<span className="font-normal text-muted text-xs">/mo</span>
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Message button — outside the Link so it doesn't navigate to detail */}
                  <div className="px-4 pb-4 pt-0">
                    <button
                      onClick={() => handleMessage(listing)}
                      disabled={isSending}
                      className="w-full bg-surf text-clay-dark font-head font-semibold text-sm py-2.5 rounded-xl hover:bg-linen border border-out-var transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-sm">chat_bubble</span>
                      {isSending ? 'Opening chat…' : 'Message Landlord'}
                    </button>
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
