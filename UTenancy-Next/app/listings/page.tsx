'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import ListingCard from '@/components/ListingCard'
import { LISTINGS, type Listing as MockListing, type ListingType } from '@/lib/listings'
import { createClient } from '@/lib/supabase'
import { getDistanceToNearestSchool } from '@/lib/distance'

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'most-interested'

export default function ListingsPage() {
  /* ── filter state ── */
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | ListingType>('all')
  const [priceMax, setPriceMax] = useState(3000)
  const [bedsFilter, setBedsFilter] = useState('Any')
  const [distanceFilter, setDistanceFilter] = useState('Any')
  const [moveInDate, setMoveInDate] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showFilters, setShowFilters] = useState(true)

  /* ── data state ── */
  const [dbListings, setDbListings] = useState<MockListing[]>([])
  const [loading, setLoading] = useState(true)

  /* ── fetch DB listings ── */
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) { setLoading(false); return }
        const mapped: MockListing[] = data.map((d: any) => ({
          id: d.id,
          slug: d.id,
          title: d.address,
          location: `${d.city}, ${d.state ?? 'CA'}`,
          price: d.rent,
          beds: d.bedrooms,
          baths: d.bathrooms,
          type: d.type === 'open-room' ? ('open' as const) : ('group' as const),
          interested: 0,
          img: d.images?.[0] ?? '',
          images: d.images ?? [],
          description: d.description,
          amenities: d.amenities,
          availableDate: d.available_date ?? undefined,
        }))
        setDbListings(mapped)
        setLoading(false)

        // Compute distances asynchronously
        data.forEach(async (d: any, idx: number) => {
          const info = await getDistanceToNearestSchool(d.address, d.city, d.state || 'CA')
          if (info) {
            setDbListings(prev =>
              prev.map((l, i) => i === idx ? { ...l, distanceMi: info.distanceMi, university: info.university } : l)
            )
          }
        })
      })
  }, [])

  const allListings = useMemo(() => [...dbListings, ...LISTINGS], [dbListings])

  /* ── derived: active filter count ── */
  const activeFilterCount = [
    typeFilter !== 'all',
    priceMax < 3000,
    bedsFilter !== 'Any',
    distanceFilter !== 'Any',
    !!moveInDate,
    !!search,
  ].filter(Boolean).length

  /* ── filtered + sorted ── */
  const filtered = useMemo(() => {
    let result = allListings.filter((l) => {
      if (search) {
        const q = search.toLowerCase()
        const inTitle = l.title.toLowerCase().includes(q)
        const inLocation = l.location.toLowerCase().includes(q)
        if (!inTitle && !inLocation) return false
      }
      if (typeFilter !== 'all' && l.type !== typeFilter) return false
      if (l.price > priceMax) return false
      if (bedsFilter === '1 Bed' && l.beds !== 1) return false
      if (bedsFilter === '2 Beds' && l.beds !== 2) return false
      if (bedsFilter === '3+ Beds' && l.beds < 3) return false
      if (distanceFilter !== 'Any' && l.distanceMi != null) {
        if (distanceFilter === 'Walking' && l.distanceMi > 0.5) return false
        if (distanceFilter === 'Bus / Bike' && l.distanceMi > 3) return false
      }
      if (moveInDate && l.availableDate) {
        if (new Date(l.availableDate) > new Date(moveInDate)) return false
      }
      return true
    })

    switch (sortBy) {
      case 'price-asc':  result = [...result].sort((a, b) => a.price - b.price); break
      case 'price-desc': result = [...result].sort((a, b) => b.price - a.price); break
      case 'most-interested': result = [...result].sort((a, b) => b.interested - a.interested); break
      case 'newest': default: break
    }

    return result
  }, [allListings, search, typeFilter, priceMax, bedsFilter, distanceFilter, moveInDate, sortBy])

  function clearFilters() {
    setSearch('')
    setTypeFilter('all')
    setPriceMax(3000)
    setBedsFilter('Any')
    setDistanceFilter('Any')
    setMoveInDate('')
    setSortBy('newest')
  }

  return (
    <div className="min-h-screen bg-surf-lo">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-out-var/40 sticky top-[64px] z-30">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex flex-col gap-4">
          {/* Top row: breadcrumb + title + toggle filters */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-xs font-head font-bold text-muted hover:text-clay-dark transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">arrow_back</span>Home
              </Link>
              <span className="text-out-var">/</span>
              <span className="text-xs font-head font-bold text-clay-dark">Browse Listings</span>
            </div>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs font-head font-bold text-clay underline underline-offset-2 hover:opacity-70 transition-opacity">
                  Clear all ({activeFilterCount})
                </button>
              )}
              <button
                onClick={() => setShowFilters(f => !f)}
                className={`flex items-center gap-1.5 text-xs font-head font-bold px-4 py-2 rounded-full border transition-all ${showFilters ? 'border-clay bg-clay/5 text-clay-dark' : 'border-out-var bg-linen text-muted'}`}
              >
                <span className="material-symbols-outlined text-sm">tune</span>
                Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </button>
            </div>
          </div>

          {/* Search + type toggle row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search bar */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or neighbourhood…"
                className="w-full pl-10 pr-4 py-2.5 bg-linen border border-out-var/40 rounded-full text-sm font-body text-clay-dark placeholder:text-outline focus:outline-none focus:ring-2 ring-clay/20 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-clay-dark transition-colors">
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>

            {/* Type tabs */}
            <div className="flex gap-2 flex-shrink-0">
              {(['all', 'open', 'group'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`toggle-btn text-xs font-head font-bold px-4 py-2.5 rounded-full border border-out-var bg-linen transition-all ${typeFilter === f ? 'active' : ''}`}
                >
                  {f === 'all' ? 'All' : f === 'open' ? 'Open Room' : 'Group Formation'}
                </button>
              ))}
            </div>
          </div>

          {/* Expandable sub-filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-5 items-center pt-1 pb-1 border-t border-out-var/30">
              {/* Price max */}
              <div className="flex items-center gap-3 flex-1 min-w-52">
                <label className="text-xs font-head font-bold text-muted uppercase tracking-widest whitespace-nowrap">Price max</label>
                <input
                  type="range"
                  min={500}
                  max={3000}
                  step={50}
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs font-head font-bold text-clay whitespace-nowrap w-16 text-right">${priceMax.toLocaleString()}</span>
              </div>

              {/* Distance */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-head font-bold text-muted uppercase tracking-widest whitespace-nowrap">Distance</label>
                <select
                  value={distanceFilter}
                  onChange={(e) => setDistanceFilter(e.target.value)}
                  className="text-xs font-head font-bold bg-linen border border-out-var/40 rounded-full px-3 py-2 text-clay-dark outline-none cursor-pointer"
                >
                  {['Any', 'Walking', 'Bus / Bike'].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>

              {/* Beds */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-head font-bold text-muted uppercase tracking-widest">Beds</label>
                <select
                  value={bedsFilter}
                  onChange={(e) => setBedsFilter(e.target.value)}
                  className="text-xs font-head font-bold bg-linen border border-out-var/40 rounded-full px-3 py-2 text-clay-dark outline-none cursor-pointer"
                >
                  {['Any', '1 Bed', '2 Beds', '3+ Beds'].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>

              {/* Move-in */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-head font-bold text-muted uppercase tracking-widest whitespace-nowrap">Move-in by</label>
                <input
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="text-xs font-head font-bold bg-linen border border-out-var/40 rounded-full px-3 py-2 text-clay-dark outline-none"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-xs font-head font-bold text-muted uppercase tracking-widest whitespace-nowrap">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-xs font-head font-bold bg-linen border border-out-var/40 rounded-full px-3 py-2 text-clay-dark outline-none cursor-pointer"
                >
                  <option value="newest">Newest first</option>
                  <option value="price-asc">Price: low → high</option>
                  <option value="price-desc">Price: high → low</option>
                  <option value="most-interested">Most interested</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        {/* Results count + active filter chips */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <p className="font-head font-bold text-clay-dark text-sm">
            {loading ? (
              <span className="text-muted">Loading listings…</span>
            ) : (
              <>{filtered.length} listing{filtered.length !== 1 ? 's' : ''} found</>
            )}
          </p>

          {/* Active filter chips */}
          <div className="flex flex-wrap gap-2">
            {typeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 bg-clay/10 text-clay-dark text-xs font-head font-bold px-3 py-1 rounded-full">
                {typeFilter === 'open' ? 'Open Room' : 'Group Formation'}
                <button onClick={() => setTypeFilter('all')} className="hover:text-clay transition-colors"><span className="material-symbols-outlined text-[11px]">close</span></button>
              </span>
            )}
            {priceMax < 3000 && (
              <span className="inline-flex items-center gap-1.5 bg-clay/10 text-clay-dark text-xs font-head font-bold px-3 py-1 rounded-full">
                Up to ${priceMax.toLocaleString()}
                <button onClick={() => setPriceMax(3000)} className="hover:text-clay transition-colors"><span className="material-symbols-outlined text-[11px]">close</span></button>
              </span>
            )}
            {bedsFilter !== 'Any' && (
              <span className="inline-flex items-center gap-1.5 bg-clay/10 text-clay-dark text-xs font-head font-bold px-3 py-1 rounded-full">
                {bedsFilter}
                <button onClick={() => setBedsFilter('Any')} className="hover:text-clay transition-colors"><span className="material-symbols-outlined text-[11px]">close</span></button>
              </span>
            )}
            {distanceFilter !== 'Any' && (
              <span className="inline-flex items-center gap-1.5 bg-clay/10 text-clay-dark text-xs font-head font-bold px-3 py-1 rounded-full">
                {distanceFilter}
                <button onClick={() => setDistanceFilter('Any')} className="hover:text-clay transition-colors"><span className="material-symbols-outlined text-[11px]">close</span></button>
              </span>
            )}
            {moveInDate && (
              <span className="inline-flex items-center gap-1.5 bg-clay/10 text-clay-dark text-xs font-head font-bold px-3 py-1 rounded-full">
                Move-in by {new Date(moveInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                <button onClick={() => setMoveInDate('')} className="hover:text-clay transition-colors"><span className="material-symbols-outlined text-[11px]">close</span></button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1.5 bg-clay/10 text-clay-dark text-xs font-head font-bold px-3 py-1 rounded-full">
                &ldquo;{search}&rdquo;
                <button onClick={() => setSearch('')} className="hover:text-clay transition-colors"><span className="material-symbols-outlined text-[11px]">close</span></button>
              </span>
            )}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden border border-out-var/40 animate-pulse">
                <div className="h-52 bg-linen" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-linen rounded-full w-3/4" />
                  <div className="h-3 bg-linen rounded-full w-1/2" />
                  <div className="flex justify-between mt-4">
                    <div className="h-6 bg-linen rounded-full w-24" />
                    <div className="h-4 bg-linen rounded-full w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-24">
            <span className="material-symbols-outlined text-out-var text-6xl mb-4 block">search_off</span>
            <p className="font-head font-bold text-clay-dark text-xl mb-2">No listings match your filters</p>
            <p className="font-body text-muted text-sm mb-8 max-w-xs mx-auto">Try widening your search or adjusting the price range, beds, or distance filters.</p>
            <button onClick={clearFilters} className="clay-grad text-white text-sm font-head font-bold px-8 py-3 rounded-full shadow-md">Clear All Filters</button>
          </div>
        )}

        {/* Listings grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && (
          <div className="mt-16 text-center bg-white rounded-3xl border border-out-var/40 py-12 px-6">
            <span className="material-symbols-outlined text-clay text-4xl mb-3 block">home_work</span>
            <p className="font-head font-bold text-clay-dark text-lg mb-2">Don&apos;t see the perfect place?</p>
            <p className="font-body text-muted text-sm mb-6 max-w-sm mx-auto">More listings are added every week as we expand to new universities. Join the waitlist to be first to know.</p>
            <Link href="/#waitlist" className="clay-grad text-white text-sm font-head font-bold px-8 py-3 rounded-full shadow-md inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-sm">notifications</span>Get Notified
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
