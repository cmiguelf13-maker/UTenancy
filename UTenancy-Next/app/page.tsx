'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LISTINGS, type Listing as MockListing, type ListingType } from '@/lib/listings'
import { createClient } from '@/lib/supabase'
import { getDistanceToNearestSchool } from '@/lib/distance'
import ListingCard from '@/components/ListingCard'

/* ─── Scroll-reveal hook ─────────────────────── */
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) } }),
      { threshold: 0.12 },
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ─── Main page ──────────────────────────────── */
export default function HomePage() {
  useReveal()
  const router = useRouter()

  const [listingFilter, setListingFilter] = useState<'all' | ListingType>('all')
  const [waitlistType] = useState<'student' | 'landlord'>('landlord')
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle')
  const [priceMax, setPriceMax] = useState(3000)
  const [bedsFilter, setBedsFilter] = useState('Any')
  const [distanceFilter, setDistanceFilter] = useState('Any')
  const [moveInDate, setMoveInDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dbListings, setDbListings] = useState<MockListing[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Fetch current auth session
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUser(data.session?.user ?? null)
    })
  }, [])

  // Fetch active DB listings on mount
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) return
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

        // Compute distance using raw DB address fields (address, city, state)
        data.forEach(async (d: any, idx: number) => {
          const info = await getDistanceToNearestSchool(
            d.address,
            d.city,
            d.state || 'CA',
          )
          if (info) {
            setDbListings(prev => prev.map((l, i) =>
              i === idx ? { ...l, distanceMi: info.distanceMi, university: info.university } : l
            ))
          }
        })
      })
  }, [])

  const allListings = [...dbListings, ...LISTINGS]

  const filtered = allListings.filter((l) => {
    // Type filter
    if (listingFilter !== 'all' && l.type !== listingFilter) return false
    // Price filter
    if (l.price > priceMax) return false
    // Beds filter
    if (bedsFilter === '1 Bed' && l.beds !== 1) return false
    if (bedsFilter === '2 Beds' && l.beds !== 2) return false
    if (bedsFilter === '3+ Beds' && l.beds < 3) return false
    // Distance filter (only applies when distanceMi is known)
    if (distanceFilter !== 'Any' && l.distanceMi != null) {
      if (distanceFilter === 'Walking' && l.distanceMi > 0.5) return false
      if (distanceFilter === 'Bus / Bike' && l.distanceMi > 3) return false
    }
    // Move-in date filter (listing must be available on or before selected date)
    if (moveInDate && l.availableDate) {
      if (new Date(l.availableDate) > new Date(moveInDate)) return false
    }
    return true
  })

  function clearFilters() {
    setListingFilter('all')
    setPriceMax(3000)
    setBedsFilter('Any')
    setDistanceFilter('Any')
    setMoveInDate('')
  }

  function handleHeroSearch() {
    const q = searchQuery.trim()
    if (q) {
      router.push('/listings?q=' + encodeURIComponent(q))
    } else {
      router.push('/listings')
    }
  }

  async function handleWaitlistSubmit() {
    if (!waitlistEmail.trim() || waitlistStatus === 'loading') return
    setWaitlistStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail.trim(), type: waitlistType }),
      })
      if (res.ok) {
        setWaitlistStatus('success')
        setWaitlistEmail('')
      } else if (res.status === 409) {
        setWaitlistStatus('duplicate')
      } else {
        setWaitlistStatus('error')
      }
    } catch {
      setWaitlistStatus('error')
    }
  }

  return (
    <>
      {/* ── HERO ─────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 md:pt-28 pb-32 px-6 md:px-10">
        <div className="absolute -top-40 right-0 w-[700px] h-[700px] rounded-full opacity-25 blur-[140px] pointer-events-none" style={{ background: 'radial-gradient(circle,#fec8b6,#9c7060)' }} />
        <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] pointer-events-none" style={{ background: '#6b4c3b' }} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-white/80 border border-out-var rounded-full px-4 py-1.5 mb-8 f1 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-clay animate-pulse-dot" />
              <span className="text-xs font-head font-bold text-clay-dark tracking-widest uppercase">Now live for students · LA &amp; beyond</span>
            </div>

            {/* Headline */}
            <h1 className="f2 font-display text-5xl sm:text-6xl md:text-8xl font-light text-clay-dark leading-[.95] mb-6 tracking-tight">
              Your home<br />
              <em className="clay-grad-text font-medium">away from</em><br />
              campus.
            </h1>

            <p className="f3 font-body text-lg text-muted leading-relaxed max-w-xl mx-auto mb-10">
              UTenancy connects verified university students with open rooms and future roommates — find your place, meet your people.
            </p>

            {/* Search bar */}
            <div className="f4 max-w-2xl mx-auto mb-6">
              <div className="bg-white rounded-full shadow-2xl shadow-clay/15 p-2 flex items-center gap-2 border border-sand/70 focus-within:ring-2 ring-clay/20 transition-all">
                <div className="flex-1 flex items-center pl-4 gap-3">
                  <span className="material-symbols-outlined text-outline text-xl">location_on</span>
                  <input
                    className="w-full bg-transparent border-none focus:ring-0 text-stone font-body font-medium placeholder:text-outline text-sm outline-none"
                    placeholder="Search by university, city, or neighborhood…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleHeroSearch() }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-outline hover:text-muted transition-colors mr-1">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </div>
                <button
                  onClick={handleHeroSearch}
                  className="clay-grad text-white px-4 sm:px-7 py-3.5 rounded-full font-head font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all flex-shrink-0">
                  <span className="material-symbols-outlined text-sm">search</span>
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </div>

          </div>

          {/* Floating cards */}
          <div className="hidden lg:block relative mt-16 h-72">
            <div className="absolute left-0 top-4 w-64 bg-white rounded-2xl shadow-2xl shadow-clay/10 overflow-hidden border border-out-var animate-float-a">
              <Image src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80" alt="Heritage Commons" width={256} height={144} className="w-full h-36 object-cover" />
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-head font-bold text-clay-dark text-sm">Heritage Commons</p>
                  <span className="badge-open text-[10px] font-head font-bold px-2 py-0.5 rounded-full">Open Room</span>
                </div>
                <p className="text-xs text-muted font-body mb-2">Playa Vista, LA · 5 min walk</p>
                <p className="font-head font-black text-clay-dark text-base">$850<span className="text-xs font-normal text-muted">/mo per person</span></p>
              </div>
            </div>

            <div className="absolute right-0 top-0 w-64 bg-white rounded-2xl shadow-2xl shadow-clay/10 overflow-hidden border border-out-var animate-float-b">
              <Image src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80" alt="Venice Beach Lofts" width={256} height={144} className="w-full h-36 object-cover" />
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-head font-bold text-clay-dark text-sm">Venice Beach Lofts</p>
                  <span className="badge-group text-[10px] font-head font-bold px-2 py-0.5 rounded-full">Group Form.</span>
                </div>
                <p className="text-xs text-muted font-body mb-2">Venice, LA · 10 min bus</p>
                <p className="font-head font-black text-clay-dark text-base">$1,200<span className="text-xs font-normal text-muted">/mo per person</span></p>
              </div>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 top-4 w-64 bg-white rounded-2xl shadow-2xl shadow-clay/10 overflow-hidden border border-out-var animate-float-slow">
              <Image src="https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400&q=80" alt="Lincoln Blvd Apartments" width={256} height={144} className="w-full h-36 object-cover" />
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-head font-bold text-clay-dark text-sm">Lincoln Blvd Apts</p>
                  <span className="badge-open text-[10px] font-head font-bold px-2 py-0.5 rounded-full">Open Room</span>
                </div>
                <p className="text-xs text-muted font-body mb-2">Westchester, LA · 5 min walk</p>
                <p className="font-head font-black text-clay-dark text-base">$975<span className="text-xs font-normal text-muted">/mo per person</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────── */}
      <div className="bg-clay-dark py-5 overflow-hidden">
        <div className="marquee-track gap-16 items-center">
          {['Verified .edu only', 'Real-time availability', 'Open Room Finder', 'Roommate Messaging', 'Rent splitting built-in', 'University partnerships', 'Always free for students'].flatMap((t, i) => [
            <span key={`a${i}`} className="text-white/50 font-head font-black text-sm uppercase tracking-widest whitespace-nowrap">{t}</span>,
            <span key={`b${i}`} className="text-white/20 mx-4 text-xl">✦</span>,
          ])}
        </div>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────── */}
      <section id="how-it-works" className="py-28 px-6 md:px-10 bg-surf">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 reveal">
            <span className="feature-pill mb-4 inline-flex">For Students</span>
            <h2 className="font-display text-5xl md:text-6xl font-light text-clay-dark mt-4 mb-4">Finding a place<br /><em>shouldn&apos;t be this hard.</em></h2>
            <p className="font-body text-muted text-lg max-w-xl mx-auto">UTenancy makes it three steps. No sketchy strangers. No expired listings. No guessing who you&apos;ll live with.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-out-var via-clay/30 to-out-var" />
            {[
              { icon: 'verified_user', label: '01', title: 'Verify your .edu', body: 'Sign up with your university email. We verify it instantly — no manual review, no waiting. Students only, always.', bg: 'clay-grad shadow-clay/20', iconColor: 'text-cream fill' },
              { icon: 'search',        label: '02', title: 'Browse & filter',  body: 'Real listings with real availability. Filter by price per person, distance from campus, move-in date, and listing type.', bg: 'bg-linen', iconColor: 'text-clay' },
              { icon: 'handshake',     label: '03', title: 'Move in & split',  body: "Once you're in, UTenancy handles rent splitting and shared expenses — keeping your whole house on the same page.", bg: 'bg-sec-con', iconColor: 'text-clay' },
            ].map((step, i) => (
              <div key={step.label} className="reveal text-center px-4" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className={`w-14 h-14 ${step.bg} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl`}>
                  <span className={`material-symbols-outlined ${step.iconColor} text-2xl`}>{step.icon}</span>
                </div>
                <span className="text-xs font-head font-black text-terra uppercase tracking-widest">Step {step.label}</span>
                <h3 className="font-head text-2xl font-bold text-clay-dark mt-2 mb-3">{step.title}</h3>
                <p className="font-body text-muted leading-relaxed text-sm">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LISTINGS GRID ────────────────────────── */}
      <section id="listings" className="py-28 px-6 md:px-10 bg-surf-lo">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 reveal">
            <div>
              <span className="feature-pill mb-3 inline-flex">Sample Listings</span>
              <h2 className="font-display text-5xl md:text-6xl font-light text-clay-dark mt-3">Newest student<br /><em>homes near you.</em></h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'open'] as const).map((f) => (
                <button key={f} onClick={() => setListingFilter(f)} className={`toggle-btn text-xs font-head font-bold px-4 py-2.5 rounded-full border border-out-var bg-linen transition-all min-h-[40px] ${listingFilter === f ? 'active' : ''}`}>
                  {f === 'all' ? 'All' : 'Open Room'}
                </button>
              ))}
              <div className="relative">
                <button
                  disabled
                  className="text-xs font-head font-bold px-4 py-2.5 rounded-full border border-out-var/50 bg-linen/60 text-muted/50 cursor-not-allowed opacity-70 min-h-[40px]"
                >
                  Group Formation
                </button>
                <span className="absolute -top-2 -right-1 bg-clay text-white text-[8px] font-head font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none">Soon</span>
              </div>
            </div>
          </div>

          {/* Sub-filters */}
          <div className="reveal bg-white rounded-2xl p-4 md:p-5 mb-8 flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-center border border-out-var shadow-sm">
            <div className="flex items-center gap-3 w-full sm:flex-1 sm:min-w-0">
              <label className="text-xs font-head font-bold text-muted uppercase tracking-widest whitespace-nowrap">Price max</label>
              <input type="range" min={500} max={3000} value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} className="flex-1 h-2 accent-clay cursor-pointer" />
              <span className="text-xs font-head font-bold text-clay whitespace-nowrap">${priceMax.toLocaleString()}</span>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs font-head font-bold text-muted uppercase tracking-widest">Distance</label>
                <select
                  value={distanceFilter}
                  onChange={(e) => setDistanceFilter(e.target.value)}
                  className="text-xs font-head font-bold bg-linen border-none rounded-full px-3 py-2.5 text-clay-dark outline-none cursor-pointer"
                >
                  {['Any', 'Walking', 'Bus / Bike'].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-head font-bold text-muted uppercase tracking-widest">Beds</label>
                <select
                  value={bedsFilter}
                  onChange={(e) => setBedsFilter(e.target.value)}
                  className="text-xs font-head font-bold bg-linen border-none rounded-full px-3 py-2.5 text-clay-dark outline-none cursor-pointer"
                >
                  {['Any', '1 Bed', '2 Beds', '3+ Beds'].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-head font-bold text-muted uppercase tracking-widest">Move-in</label>
                <input
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="text-xs font-head font-bold bg-linen border-none rounded-full px-3 py-2.5 text-clay-dark outline-none"
                />
              </div>
              <button
                onClick={clearFilters}
                className="clay-grad text-white text-xs font-head font-bold px-5 py-2.5 rounded-full shadow-md sm:ml-auto"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-out-var text-5xl mb-4 block">search_off</span>
              <p className="font-head font-bold text-clay-dark text-lg mb-2">No listings match your filters</p>
              <p className="font-body text-muted text-sm mb-6">Try adjusting your criteria or clearing the filters.</p>
              <button onClick={clearFilters} className="clay-grad text-white text-sm font-head font-bold px-6 py-2.5 rounded-full shadow-md">Clear Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.slice(0, 9).map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/listings" className="inline-flex items-center gap-2 border-2 border-clay text-clay-dark font-head font-bold text-sm px-8 py-3.5 rounded-full hover:bg-clay hover:text-white transition-all">
              View All Listings <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── STUDENT FEATURES ─────────────────────── */}
      <section className="py-28 px-6 md:px-10 bg-cream overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="reveal">
              <span className="feature-pill mb-6 inline-flex">Student Features</span>
              <h2 className="font-display text-5xl md:text-6xl font-light text-clay-dark mt-4 mb-6">Find your room.<br /><em>Meet your people.</em></h2>
              <p className="font-body text-muted leading-relaxed mb-8 text-lg">UTenancy is built around how students actually find housing — slip into an existing group or form a new one together.</p>
              <ul className="space-y-6 mb-10">
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 clay-grad rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                    <span className="material-symbols-outlined text-white text-lg">door_open</span>
                  </div>
                  <div>
                    <p className="font-head font-bold text-clay-dark text-sm flex items-center gap-2">
                      Open Room
                      <span className="badge-open text-[10px] font-head font-bold px-2 py-0.5 rounded-full">Open Room</span>
                    </p>
                    <p className="font-body text-muted text-sm mt-1 leading-relaxed">Browse available rooms in existing student households. See who you&apos;d live with, their lifestyle, and apply with your verified student profile.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 clay-grad rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                    <span className="material-symbols-outlined text-white text-lg">chat_bubble</span>
                  </div>
                  <div>
                    <p className="font-head font-bold text-clay-dark text-sm">Roommate Messaging</p>
                    <p className="font-body text-muted text-sm mt-1 leading-relaxed">Chat directly with potential roommates before committing. Get to know your future housemates and find the right fit — all in the app.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-sec-con rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-clay text-lg">group_add</span>
                  </div>
                  <div>
                    <p className="font-head font-bold text-clay-dark text-sm">Group Formation</p>
                    <p className="font-body text-muted text-sm mt-1 leading-relaxed">Team up with other students to fill a whole unit together. Post your profile, find compatible housemates, and move in as a crew.</p>
                  </div>
                </li>
              </ul>
              <Link href="/listings?type=open" className="inline-flex items-center gap-2 clay-grad text-white font-head font-bold text-sm px-8 py-3.5 rounded-full shadow-lg hover:opacity-90 transition-all">
                Find a Room <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {/* Mock messaging card */}
            <div className="reveal relative" style={{ transitionDelay: '.15s' }}>
              <div className="absolute inset-0 rounded-3xl blur-3xl opacity-30 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 60% 40%, #9c7060 0%, #6b4c3b 60%, transparent 100%)', transform: 'scale(1.15)' }} />
              <div className="relative bg-white rounded-3xl border border-out-var max-w-sm mx-auto overflow-hidden"
                style={{ boxShadow: '0 32px 64px rgba(107,76,59,.22), 0 0 0 1px rgba(196,160,144,.18)' }}>

                {/* Chat header */}
                <div className="clay-grad px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center text-sm font-head font-black text-white" style={{ background: '#8b6355' }}>J</div>
                    <div>
                      <p className="font-head font-bold text-white text-sm">Jordan M.</p>
                      <p className="text-xs text-white/60 font-body">Heritage Commons · Open Room</p>
                    </div>
                    <span className="ml-auto inline-flex items-center gap-1 bg-white/20 text-white text-[10px] font-head font-bold px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-300" />Online
                    </span>
                  </div>
                </div>

                {/* Chat messages */}
                <div className="p-5 space-y-3 bg-surf-lo">
                  <div className="flex gap-2 items-end">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-head font-black text-white flex-shrink-0" style={{ background: '#8b6355' }}>J</div>
                    <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm border border-out-var/30 max-w-[200px]">
                      <p className="font-body text-stone text-xs leading-relaxed">Hey! Saw your profile — you&apos;re at LMU too? The room&apos;s available June 1st 🙌</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-end justify-end">
                    <div className="clay-grad rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm max-w-[200px]">
                      <p className="font-body text-white text-xs leading-relaxed">Yes! What&apos;s the vibe like? Do you guys study at home mostly?</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-head font-black text-white flex-shrink-0" style={{ background: '#8b6355' }}>J</div>
                    <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm border border-out-var/30 max-w-[200px]">
                      <p className="font-body text-stone text-xs leading-relaxed">Mix of both! Pretty chill house. Come see the place this weekend? 😊</p>
                    </div>
                  </div>
                </div>

                {/* Listing preview strip */}
                <div className="px-5 py-4 bg-white border-t border-out-var/40">
                  <p className="text-[10px] font-head font-bold text-muted uppercase tracking-widest mb-3">Listing</p>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-linen">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=100&q=80" alt="listing" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-head font-bold text-clay-dark text-xs truncate">Heritage Commons</p>
                      <p className="text-[10px] text-muted font-body">Playa Vista · $850/mo per person</p>
                      <span className="badge-open text-[9px] font-head font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block">Open Room</span>
                    </div>
                  </div>
                </div>

                {/* Input bar */}
                <div className="px-5 py-4 bg-white border-t border-out-var/40 flex items-center gap-2">
                  <div className="flex-1 bg-surf-lo rounded-full px-4 py-2.5 text-xs font-body text-muted">Message Jordan…</div>
                  <button className="w-8 h-8 clay-grad rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-sm">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LANDLORD COMING SOON ─────────────────── */}
      <section id="landlords" className="dark-surface py-28 px-6 md:px-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10 blur-[120px] pointer-events-none" style={{ background: '#9c7060', transform: 'translate(30%,-30%)' }} />
        <div className="max-w-7xl mx-auto text-center">
          <div className="reveal">
            <span className="inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-1.5 text-xs font-head font-bold text-white/60 uppercase tracking-widest mb-6">
              <span className="w-2 h-2 rounded-full bg-sand animate-pulse-dot" />
              Coming Soon
            </span>
            <h2 className="font-display text-5xl md:text-6xl font-light text-white mt-2 mb-4">For Landlords.<br /><em className="text-sand">A full SaaS portal — coming soon.</em></h2>
            <p className="font-body text-white/60 text-lg max-w-xl mx-auto mb-14">We&apos;re building a dedicated property management portal — verified student applicants, automated rent collection, and a full dashboard. Be first in line when we launch.</p>

            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
              {[
                { icon: 'dashboard',     title: 'Landlord Dashboard', body: 'Manage all your listings, applicants, and payments from one place.' },
                { icon: 'verified_user', title: 'Verified Tenants',   body: 'Every applicant pre-verified with a .edu email before they reach you.' },
                { icon: 'payments',      title: 'Automated Rent',     body: 'Direct ACH deposits. Every tenant, every month, automatically split and routed.' },
              ].map(({ icon, title, body }) => (
                <div key={icon} className="dark-card rounded-2xl p-6 text-left" style={{ borderColor: 'rgba(201,160,144,.15)' }}>
                  <span className="material-symbols-outlined text-sand/70 text-2xl mb-4 block">{icon}</span>
                  <p className="font-head font-bold text-white/80 text-sm mb-2">{title}</p>
                  <p className="font-body text-white/40 text-xs leading-relaxed">{body}</p>
                </div>
              ))}
            </div>

            <a href="#waitlist" className="inline-flex items-center gap-2 border border-white/20 text-white/80 font-head font-bold text-sm px-8 py-3.5 rounded-full hover:bg-white/10 transition-all">
              Join Landlord Waitlist <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── PRICING COMING SOON ───────────────────── */}
      <section id="pricing" className="py-28 px-6 md:px-10 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 reveal">
            <span className="feature-pill mb-4 inline-flex">Pricing</span>
            <h2 className="font-display text-5xl md:text-6xl font-light text-clay-dark mt-4 mb-3">Landlord plans<br /><em>coming soon.</em></h2>
            <p className="font-body text-muted text-lg max-w-xl mx-auto">UTenancy is always <strong className="text-clay-dark">free for students</strong> — forever. Landlord subscription plans are launching soon.</p>
          </div>

          <div className="relative max-w-5xl mx-auto reveal" style={{ transitionDelay: '.1s' }}>
            {/* Blurred pricing cards (decorative) */}
            <div className="grid md:grid-cols-3 gap-6 opacity-25 blur-[3px] pointer-events-none select-none" aria-hidden="true">
              {[
                { name: 'Starter',  price: '$29',  sub: 'Up to 3 properties',  pop: false },
                { name: 'Growth',   price: '$59',  sub: 'Up to 10 properties', pop: true  },
                { name: 'Pro',      price: '$129', sub: 'Unlimited properties', pop: false },
              ].map(({ name, price, sub, pop }) => (
                <div key={name} className={`${pop ? 'bg-clay-dark' : 'bg-white border border-out-var'} rounded-3xl p-8`}>
                  <p className="font-head font-bold text-sm mb-2 uppercase tracking-widest text-muted">{name}</p>
                  <p className={`font-display font-light text-5xl mb-1 ${pop ? 'text-white' : 'text-clay-dark'}`}>{price}<span className="text-lg font-body text-muted">/mo</span></p>
                  <p className="text-xs font-body text-muted mb-8">{sub}</p>
                  <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-4 bg-out-var/40 rounded-full" />)}</div>
                </div>
              ))}
            </div>
            {/* Coming soon overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white border border-out-var rounded-2xl px-10 py-7 shadow-xl text-center">
                <span className="material-symbols-outlined text-clay text-4xl mb-3 block">lock_clock</span>
                <p className="font-head font-bold text-clay-dark text-lg mb-1">Landlord Pricing</p>
                <p className="font-body text-muted text-sm mb-4">Launching soon — join the waitlist to be notified first.</p>
                <a href="#waitlist" className="clay-grad text-white font-head font-bold text-xs px-6 py-2.5 rounded-full shadow-md inline-flex items-center gap-1.5 hover:opacity-90 transition-all">
                  <span className="material-symbols-outlined text-sm">notifications</span>Notify Me
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WAITLIST CTA ──────────────────────────── */}
      <section id="waitlist" className="py-28 px-6 md:px-10 warm-grain dark-surface overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 blur-[160px] pointer-events-none" style={{ background: '#9c7060' }} />
        <div className="max-w-2xl mx-auto text-center relative z-10 reveal">
          <span className="inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-1.5 text-xs font-head font-bold text-white/60 uppercase tracking-widest mb-8">
            <span className="w-2 h-2 rounded-full bg-sand animate-pulse-dot" />Landlords — Coming Soon
          </span>
          <h2 className="font-display text-5xl md:text-6xl font-light text-white mb-6">Be first to<br /><em className="text-sand">list your property.</em></h2>
          <p className="font-body text-white/60 text-lg mb-10">We&apos;re building a full landlord portal — verified student applicants, automated rent collection, and a complete dashboard. Join the waitlist and we&apos;ll notify you the moment it goes live.</p>

          {waitlistStatus === 'success' ? (
            <div className="max-w-md mx-auto py-4 px-6 rounded-2xl border border-white/20 bg-white/5 text-white text-center">
              <p className="font-head font-bold text-sand text-lg mb-1">You&apos;re on the list! 🎉</p>
              <p className="font-body text-white/60 text-sm">We&apos;ll reach out as soon as the landlord portal launches.</p>
            </div>
          ) : (
            <>
              <div className="flex gap-3 max-w-md mx-auto">
                <input
                  className="waitlist-input flex-1"
                  placeholder="your@email.com"
                  type="email"
                  value={waitlistEmail}
                  onChange={(e) => { setWaitlistEmail(e.target.value); setWaitlistStatus('idle') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleWaitlistSubmit() }}
                  disabled={waitlistStatus === 'loading'}
                />
                <button
                  onClick={handleWaitlistSubmit}
                  disabled={waitlistStatus === 'loading'}
                  className="clay-grad text-white px-6 py-3.5 rounded-full font-head font-bold text-sm whitespace-nowrap hover:opacity-90 transition-all shadow-xl shadow-clay/30 disabled:opacity-60"
                >
                  {waitlistStatus === 'loading' ? 'Joining…' : 'Notify Me'}
                </button>
              </div>
              {waitlistStatus === 'duplicate' && (
                <p className="text-sand/80 text-xs font-body mt-3">You&apos;re already on the list — we&apos;ll be in touch soon!</p>
              )}
              {waitlistStatus === 'error' && (
                <p className="text-red-400 text-xs font-body mt-3">Something went wrong. Please try again.</p>
              )}
              {waitlistStatus === 'idle' && (
                <p className="text-white/30 text-xs font-body mt-4">No spam. Unsubscribe anytime.</p>
              )}
            </>
          )}

          {/* Student nudge */}
          <p className="mt-10 text-white/30 text-xs font-body">
            Are you a student?{' '}
            <Link href="/auth" className="text-sand/70 hover:text-sand underline underline-offset-2 transition-colors font-semibold">
              Sign up free — it&apos;s already live for you.
            </Link>
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer className="bg-stone py-16 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
            <div className="max-w-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="UTenancy" className="h-8 w-auto mb-4" style={{ filter: 'brightness(0) invert(1)', opacity: 0.85 }} />
              <p className="font-body text-white/40 text-sm leading-relaxed">Student housing, reimagined. Verified listings, built-in rent tools, and a SaaS layer for landlords.</p>
            </div>
            {[
              { heading: 'Students', links: [
                { label: 'Find Housing',     href: '/#listings' },
                { label: 'Group Formation',  href: '/tenant/household' },
                { label: 'How It Works',     href: '/#how-it-works' },
                { label: 'Verify My .edu',   href: '/auth' },
              ]},
              { heading: 'Landlords', links: [
                { label: 'Coming Soon',      href: '/#landlords' },
                { label: 'Join Waitlist',    href: '/#waitlist' },
                { label: 'Pricing Preview',  href: '/#pricing' },
              ]},
              { heading: 'Company', links: [
                { label: 'About',    href: '/about' },
                { label: 'Blog',     href: '/blog' },
                { label: 'Careers',  href: '/careers' },
                { label: 'Contact',  href: '/contact' },
              ]},
            ].map(({ heading, links }) => (
              <div key={heading}>
                <p className="font-head font-bold text-white/30 text-xs uppercase tracking-widest mb-4">{heading}</p>
                <ul className="space-y-2">
                  {links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="font-body text-white/60 text-sm hover:text-white transition-colors">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-body text-white/30 text-xs">© {new Date().getFullYear()} UTenancy, Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/legal/privacy" className="font-body text-white/30 text-xs hover:text-white/60 transition-colors">Privacy Policy</Link>
              <Link href="/legal/terms" className="font-body text-white/30 text-xs hover:text-white/60 transition-colors">Terms of Service</Link>
              <Link href="/legal/user-agreement" className="font-body text-white/30 text-xs hover:text-white/60 transition-colors">User Agreement</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
