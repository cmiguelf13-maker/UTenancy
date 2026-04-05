'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LISTINGS, type Listing as MockListing, type ListingType } from '@/lib/listings'
import { createClient } from '@/lib/supabase'

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

/* ─── Listing Card ───────────────────────────── */
function ListingCard({ listing }: { listing: MockListing }) {
  const [saved, setSaved] = useState(false)
  return (
    <article className={`card-lift img-zoom bg-white rounded-3xl overflow-hidden border cursor-pointer relative ${listing.featured ? 'border-clay/30 shadow-lg shadow-clay/10' : 'border-out-var/40'}`}>
      {listing.featured && (
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-center">
          <span className="clay-grad text-white text-[10px] font-head font-bold uppercase tracking-widest px-4 py-1.5 rounded-b-full shadow-md">⭐ Featured Listing</span>
        </div>
      )}
      <Link href={`/listings/${listing.slug}`} className="block">
        <div className="relative h-52 overflow-hidden">
          {listing.img ? (
            <Image src={listing.img} alt={listing.title} fill className="object-cover" sizes="(max-width:640px) 100vw, (max-width:1280px) 50vw, 33vw" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-linen to-surf-lo flex items-center justify-center">
              <span className="material-symbols-outlined text-out-var text-6xl">home</span>
            </div>
          )}
          <span className={`${listing.type === 'open' ? 'badge-open' : 'badge-group'} absolute top-4 left-4 text-[10px] font-head font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg`}>
            {listing.type === 'open' ? 'Open Room' : 'Group Formation'}
          </span>
          <button
            className="absolute top-4 right-4 w-9 h-9 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center text-clay hover:bg-white transition-all shadow-md"
            onClick={(e) => { e.preventDefault(); setSaved((s) => !s) }}
            aria-label="Save to favourites"
          >
            <span className={`material-symbols-outlined text-lg ${saved ? 'fill' : ''}`}>favorite</span>
          </button>
        </div>
        <div className="p-5">
          <h3 className="font-head font-bold text-clay-dark text-base truncate mb-1">{listing.title}</h3>
          <p className="text-xs font-body text-muted flex items-center gap-1 mb-4">
            <span className="material-symbols-outlined text-xs">location_on</span>{listing.location}
          </p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[9px] font-head font-bold uppercase tracking-widest text-muted mb-0.5">{listing.featured ? 'Total Rent' : 'Per Person'}</p>
              <p className="font-head font-black text-clay-dark text-lg">${listing.price.toLocaleString()}<span className="text-xs font-normal text-muted">/mo</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm font-head font-bold text-clay">{listing.beds} bed{listing.beds !== 1 ? 's' : ''} avail.</p>
              <p className="text-[10px] text-muted font-body flex items-center justify-end gap-1">
                <span className="material-symbols-outlined fill text-[11px]">group</span>{listing.interested} interested
              </p>
            </div>
          </div>
          {listing.featured && (
            <div className="mt-4 pt-4 border-t border-out-var/30 flex items-center justify-between">
              <span className="font-head font-bold text-clay text-xs flex items-center gap-1">View Listing <span className="material-symbols-outlined text-sm">arrow_forward</span></span>
              <span className="feature-pill text-[10px] px-2.5 py-1">~{listing.distanceMi} mi to {listing.university}</span>
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}

/* ─── Main page ──────────────────────────────── */
export default function HomePage() {
  useReveal()

  const [listingFilter, setListingFilter] = useState<'all' | ListingType>('all')
  const [pricePeriod, setPricePeriod] = useState<'monthly' | 'annual'>('monthly')
  const [waitlistType, setWaitlistType] = useState<'student' | 'landlord'>('student')
  const [priceMax, setPriceMax] = useState(3000)
  const [dbListings, setDbListings] = useState<MockListing[]>([])

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
          slug: d.id, // UUID — the detail page handles this
          title: d.address,
          location: `${d.city}, ${d.state}`,
          price: d.rent,
          beds: d.bedrooms,
          baths: d.bathrooms,
          type: d.type === 'open-room' ? ('open' as const) : ('group' as const),
          interested: 0,
          img: d.images?.[0] ?? '',
          images: d.images ?? [],
          description: d.description,
          amenities: d.amenities,
        }))
        setDbListings(mapped)
      })
  }, [])

  const allListings = [...dbListings, ...LISTINGS]
  const filtered = listingFilter === 'all' ? allListings : allListings.filter((l) => l.type === listingFilter)

  const PRICES: Record<string, { monthly: number; annual: number }> = {
    starter: { monthly: 29,  annual: 23  },
    growth:  { monthly: 59,  annual: 47  },
    pro:     { monthly: 129, annual: 103 },
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
              <span className="text-xs font-head font-bold text-clay-dark tracking-widest uppercase">Now accepting pilot landlords in LA</span>
            </div>

            {/* Headline */}
            <h1 className="f2 font-display text-6xl md:text-8xl font-light text-clay-dark leading-[.95] mb-6 tracking-tight">
              Your home<br />
              <em className="clay-grad-text font-medium">away from</em><br />
              campus.
            </h1>

            <p className="f3 font-body text-lg text-muted leading-relaxed max-w-xl mx-auto mb-10">
              UTenancy connects verified university students with real off-campus housing and roommates — and gives landlords a SaaS layer to manage it all.
            </p>

            {/* Search bar */}
            <div className="f4 max-w-2xl mx-auto mb-6">
              <div className="bg-white rounded-full shadow-2xl shadow-clay/10 p-2 flex items-center gap-2 border border-out-var/40 focus-within:ring-2 ring-clay/20 transition-all">
                <div className="flex-1 flex items-center pl-4 gap-3">
                  <span className="material-symbols-outlined text-outline text-xl">location_on</span>
                  <input className="w-full bg-transparent border-none focus:ring-0 text-stone font-body font-medium placeholder:text-outline text-sm outline-none" placeholder="Enter university or city…" defaultValue="LMU — Loyola Marymount University, LA" />
                </div>
                <button className="clay-grad text-white px-7 py-3.5 rounded-full font-head font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all">
                  <span className="material-symbols-outlined text-sm">search</span> Search
                </button>
              </div>
            </div>

            {/* Popular tags */}
            <div className="f5 flex flex-wrap justify-center gap-2 text-xs">
              <span className="text-muted font-body">Popular:</span>
              {['Los Angeles', 'Miami', 'Austin', 'Boston', 'New York'].map((city) => (
                <span key={city} className="feature-pill cursor-pointer hover:bg-clay hover:text-white transition-colors">{city}</span>
              ))}
            </div>
          </div>

          {/* Floating cards */}
          <div className="hidden lg:block relative mt-16 h-72">
            <div className="absolute left-0 top-4 w-64 bg-white rounded-2xl shadow-2xl shadow-clay/10 overflow-hidden border border-out-var/30 animate-float-a">
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

            <div className="absolute right-0 top-0 w-64 bg-white rounded-2xl shadow-2xl shadow-clay/10 overflow-hidden border border-out-var/30 animate-float-b">
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

            <div className="absolute left-1/2 -translate-x-1/2 top-8 bg-surf-lo border border-out-var rounded-2xl p-5 text-center shadow-xl w-52 animate-float-slow">
              <p className="stat-num text-4xl text-clay-dark mb-1">2,400+</p>
              <p className="text-xs font-head font-semibold text-muted uppercase tracking-widest">Verified Students</p>
              <div className="flex justify-center gap-1 mt-3">
                <span className="w-2 h-2 rounded-full bg-clay animate-pulse-dot" />
                <span className="text-[10px] font-head font-bold text-clay-dark">Live waitlist</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────── */}
      <div className="bg-clay-dark py-5 overflow-hidden">
        <div className="marquee-track gap-16 items-center">
          {['Verified .edu only', 'Real-time availability', 'Open Room & Group Formation', 'Rent splitting built-in', 'Landlord SaaS dashboard', 'University partnerships', 'Always free for students'].flatMap((t, i) => [
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
            <h2 className="font-display text-5xl md:text-6xl font-light text-clay-dark mt-4 mb-4">Finding a place<br /><em>shouldn't be this hard.</em></h2>
            <p className="font-body text-muted text-lg max-w-xl mx-auto">UTenancy makes it three steps. No Craigslist strangers. No expired listings. No guessing who you'll live with.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-out-var via-clay/30 to-out-var" />
            {[
              { icon: 'verified_user', label: '01', title: 'Verify your .edu', body: 'Sign up with your university email. We verify it instantly — no manual review, no waiting. Students only, always.', bg: 'clay-grad shadow-clay/20' },
              { icon: 'search',        label: '02', title: 'Browse & filter',  body: 'Real listings with real availability. Filter by price per person, distance from campus, move-in date, and listing type.', bg: 'bg-linen' },
              { icon: 'handshake',     label: '03', title: 'Move in & split',  body: "Once you're in, UTenancy handles rent splitting and shared expenses — keeping your whole house on the same page.", bg: 'bg-sec-con' },
            ].map((step, i) => (
              <div key={step.label} className="reveal text-center px-4" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className={`w-14 h-14 ${step.bg} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl`}>
                  <span className="material-symbols-outlined text-clay text-2xl">{step.icon}</span>
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
              <span className="feature-pill mb-3 inline-flex">Live Listings</span>
              <h2 className="font-display text-5xl md:text-6xl font-light text-clay-dark mt-3">Newest student<br /><em>homes near you.</em></h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'open', 'group'] as const).map((f) => (
                <button key={f} onClick={() => setListingFilter(f)} className={`toggle-btn text-xs font-head font-bold px-4 py-2 rounded-full border border-out-var bg-linen transition-all ${listingFilter === f ? 'active' : ''}`}>
                  {f === 'all' ? 'All' : f === 'open' ? 'Open Room' : 'Group Formation'}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-filters */}
          <div className="reveal bg-white rounded-2xl p-5 mb-8 flex flex-wrap gap-5 items-center border border-out-var/40">
            <div className="flex items-center gap-3 flex-1 min-w-48">
              <label className="text-xs font-head font-bold text-muted uppercase tracking-widest whitespace-nowrap">Price max</label>
              <input type="range" min={500} max={3000} value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} />
              <span className="text-xs font-head font-bold text-clay whitespace-nowrap">${priceMax.toLocaleString()}</span>
            </div>
            {[
              { label: 'Distance', options: ['Any', 'Walking', 'Bus / Bike'] },
              { label: 'Beds',     options: ['Any', '1 Bed', '2 Beds', '3+ Beds'] },
            ].map(({ label, options }) => (
              <div key={label} className="flex items-center gap-2">
                <label className="text-xs font-head font-bold text-muted uppercase tracking-widest">{label}</label>
                <select className="text-xs font-head font-bold bg-linen border-none rounded-full px-3 py-2 text-clay-dark outline-none cursor-pointer">
                  {options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <label className="text-xs font-head font-bold text-muted uppercase tracking-widest">Move-in</label>
              <input type="date" className="text-xs font-head font-bold bg-linen border-none rounded-full px-3 py-2 text-clay-dark outline-none" />
            </div>
            <button className="clay-grad text-white text-xs font-head font-bold px-5 py-2 rounded-full shadow-md ml-auto">Apply Filters</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>

          <div className="text-center mt-12">
            <button className="border-2 border-clay text-clay-dark font-head font-bold text-sm px-8 py-3.5 rounded-full hover:bg-clay hover:text-white transition-all">View All Listings</button>
          </div>
        </div>
      </section>

      {/* ── POST-MOVE-IN TOOLS ────────────────────── */}
      <section className="py-28 px-6 md:px-10 bg-cream overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="reveal">
              <span className="feature-pill mb-6 inline-flex">Post-Move-In Tools</span>
              <h2 className="font-display text-5xl md:text-6xl font-light text-clay-dark mt-4 mb-6">Moving in is<br /><em>just the beginning.</em></h2>
              <p className="font-body text-muted leading-relaxed mb-8 text-lg">UTenancy doesn't disappear after the match. Rent splitting, shared expense tracking, and payment reminders keep your whole household synced.</p>
              <ul className="space-y-4">
                {[
                  { icon: 'payments',             title: 'Automatic rent splitting',  body: "Each roommate pays their share directly. No Venmo math, no awkward reminders." },
                  { icon: 'receipt_long',          title: 'Shared expense tracker',    body: "Utilities, groceries, subscriptions — log it once, split it fairly." },
                  { icon: 'notifications_active',  title: 'Payment reminders',        body: "Automated nudges before rent is due — nobody's late, nobody's annoyed." },
                  { icon: 'security',              title: 'Stripe ACH payments',       body: "Bank-to-bank, no fees for students. Landlords get direct deposit." },
                ].map(({ icon, title, body }) => (
                  <li key={icon} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-sec-con rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-clay text-lg">{icon}</span>
                    </div>
                    <div>
                      <p className="font-head font-bold text-clay-dark text-sm">{title}</p>
                      <p className="font-body text-muted text-sm mt-0.5">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock expense card */}
            <div className="reveal" style={{ transitionDelay: '.15s' }}>
              <div className="bg-white rounded-3xl shadow-2xl shadow-clay/10 border border-out-var/40 p-8 max-w-sm mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="font-head font-bold text-clay-dark">October Expenses</p>
                    <p className="text-xs text-muted font-body mt-0.5">The Scholar House · 4 roommates</p>
                  </div>
                  <span className="feature-pill text-[10px]">All Paid ✓</span>
                </div>
                <div className="bg-surf-lo rounded-2xl p-4 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-head font-bold text-clay-dark">Rent</span>
                    <span className="text-sm font-head font-black text-clay-dark">$780 <span className="text-xs font-normal text-muted">/ person</span></span>
                  </div>
                  <div className="flex gap-1.5">{[0,1,2,3].map(i => <div key={i} className="flex-1 h-1.5 rounded-full bg-clay" />)}</div>
                  <p className="text-[10px] text-muted font-body mt-1.5">4 of 4 paid · $3,120 total</p>
                </div>
                <div className="space-y-2 mb-5">
                  {[
                    { icon: 'bolt',                 label: 'Electricity',         amt: '$38', status: '✓ Settled', statusColor: 'text-green-600' },
                    { icon: 'wifi',                 label: 'Internet',            amt: '$25', status: '✓ Settled', statusColor: 'text-green-600' },
                    { icon: 'local_grocery_store',  label: 'Household supplies',  amt: '$18', status: '⏳ 1 pending', statusColor: 'text-amber-500' },
                  ].map(({ icon, label, amt, status, statusColor }) => (
                    <div key={icon} className="flex items-center justify-between py-2.5 border-b border-out-var/40 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-sec-con rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-clay text-sm">{icon}</span>
                        </div>
                        <span className="text-sm font-body text-stone">{label}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-head font-bold text-stone">{amt} <span className="text-xs font-normal text-muted">each</span></p>
                        <p className={`text-[10px] font-body ${statusColor}`}>{status}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-clay-dark rounded-2xl p-4 flex justify-between items-center">
                  <p className="text-white/70 text-xs font-body">Total this month</p>
                  <p className="font-head font-black text-white text-xl">$861 <span className="text-sm font-normal opacity-60">/ person</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LANDLORD (DARK) ───────────────────────── */}
      <section id="landlords" className="dark-surface py-28 px-6 md:px-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10 blur-[120px] pointer-events-none" style={{ background: '#9c7060', transform: 'translate(30%,-30%)' }} />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 reveal">
            <span className="inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-1.5 text-xs font-head font-bold text-white/60 uppercase tracking-widest mb-6">For Landlords</span>
            <h2 className="font-display text-5xl md:text-6xl font-light text-white mt-2 mb-4">Stop managing chaos.<br /><em className="text-sand">Start running a business.</em></h2>
            <p className="font-body text-white/60 text-lg max-w-xl mx-auto">UTenancy gives independent landlords a full SaaS property management layer — built specifically for student housing.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Pain points */}
            <div className="reveal">
              <p className="text-xs font-head font-bold text-white/40 uppercase tracking-widest mb-6">The Old Way</p>
              <div className="space-y-4">
                {['Posting on Craigslist, Facebook, and Zillow separately — flooded with unqualified leads','Chasing down rent from 4 different students via Venmo, Cash App, and checks','No way to verify tenants are actually enrolled students before handing over the keys','Managing 3 properties means 3 spreadsheets and 12 separate tenant relationships'].map((txt) => (
                  <div key={txt} className="dark-card rounded-2xl p-5 flex items-start gap-4 opacity-60">
                    <span className="material-symbols-outlined text-red-400 flex-shrink-0">close</span>
                    <p className="font-body text-white/70 text-sm leading-relaxed">{txt}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* UTenancy way */}
            <div className="reveal" style={{ transitionDelay: '.1s' }}>
              <p className="text-xs font-head font-bold text-sand/80 uppercase tracking-widest mb-6">The UTenancy Way</p>
              <div className="space-y-4">
                {['One dashboard — applicants come pre-verified with .edu credentials','Direct ACH rent deposits. Every tenant, every month, automatically split and routed','Student verification built in — see enrollment status, major, and graduation year','Manage unlimited properties from one login. Vacancy tracking, applicant pipeline, analytics'].map((txt) => (
                  <div key={txt} className="dark-card rounded-2xl p-5 flex items-start gap-4" style={{ borderColor: 'rgba(201,160,144,.2)' }}>
                    <span className="material-symbols-outlined text-sand flex-shrink-0">check</span>
                    <p className="font-body text-white/90 text-sm leading-relaxed">{txt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mock dashboard */}
          <div className="reveal bg-espresso rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 clay-grad rounded-lg flex items-center justify-center">
                  <span className="text-white font-head font-black text-xs">U</span>
                </div>
                <span className="font-head font-bold text-white/90 text-sm">Landlord Dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
                <span className="text-xs text-white/50 font-body">3 properties · All active</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 border-b border-white/10">
              {[{ label: 'Properties', val: '3', color: 'text-white' }, { label: 'Active Listings', val: '2', color: 'text-white' }, { label: 'Applicants', val: '14', color: 'text-sand' }, { label: 'Monthly Revenue', val: '$7,200', color: 'text-white' }].map(({ label, val, color }) => (
                <div key={label} className="p-6 border-r border-white/10 last:border-0">
                  <p className="text-xs text-white/40 font-head font-bold uppercase tracking-widest mb-2">{label}</p>
                  <p className={`stat-num text-3xl ${color}`}>{val}</p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Property', 'Beds Avail.', 'Rent / Person', 'Applicants', 'Status'].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-head font-bold text-white/40 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { addr: '8821 Gulana Ave, Playa Vista',       beds: 2, rent: '$850', apps: '7',  badge: 'Active',    badgeClass: 'bg-green-900/40 text-green-400' },
                    { addr: '5543 W 79th St, Westchester',        beds: 4, rent: '$720', apps: '5',  badge: 'Reviewing', badgeClass: 'bg-amber-900/40 text-amber-400' },
                    { addr: '12200 Millennium Dr, Playa Vista',   beds: 0, rent: '$950', apps: '—',  badge: 'Occupied',  badgeClass: 'bg-white/10 text-white/50' },
                  ].map(({ addr, beds, rent, apps, badge, badgeClass }) => (
                    <tr key={addr} className="border-b border-white/5 last:border-0 hover:bg-white/[.03] transition-colors">
                      <td className="px-6 py-4 text-white/90 font-body">{addr}</td>
                      <td className="px-6 py-4 text-white/70 font-body">{beds}</td>
                      <td className="px-6 py-4 text-white/90 font-head font-bold">{rent}</td>
                      <td className="px-6 py-4 font-head font-bold text-sand">{apps}</td>
                      <td className="px-6 py-4"><span className={`${badgeClass} text-xs font-head font-bold px-3 py-1 rounded-full`}>{badge}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────── */}
      <section id="pricing" className="py-28 px-6 md:px-10 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 reveal">
            <span className="feature-pill mb-4 inline-flex">Pricing</span>
            <h2 className="font-display text-5xl md:text-6xl font-light text-clay-dark mt-4 mb-3">Simple pricing<br /><em>for landlords.</em></h2>
            <p className="font-body text-muted text-lg">Students always use UTenancy for free. Landlords pay a flat monthly subscription.</p>
          </div>
          <div className="flex justify-center gap-2 mb-14 reveal">
            {(['monthly', 'annual'] as const).map((p) => (
              <button key={p} onClick={() => setPricePeriod(p)} className={`toggle-btn text-xs font-head font-bold px-5 py-2 rounded-full border border-out-var ${pricePeriod === p ? 'active' : ''}`}>
                {p === 'monthly' ? 'Monthly' : <>Annual <span className="text-green-600 ml-1">Save 20%</span></>}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { key: 'starter', name: 'Starter',  sub: 'Up to 3 properties', nameColor: 'text-muted',   bg: 'bg-white border border-out-var',      btnClass: 'border-2 border-clay text-clay-dark hover:bg-clay hover:text-white', pop: false,
                features: ['3 active listings','Applicant inbox','Student verification','Basic rent collection'], missing: ['Tenant screening','Analytics dashboard'] },
              { key: 'growth',  name: 'Growth',   sub: 'Up to 10 properties', nameColor: 'text-sand/80', bg: 'bg-clay-dark shadow-2xl shadow-clay/25', btnClass: 'bg-white text-clay-dark hover:bg-cream', pop: true,
                features: ['10 active listings','Applicant inbox + screening','Student verification','Full rent collection','Expense tracking','Analytics dashboard'], missing: [] },
              { key: 'pro',     name: 'Pro',      sub: 'Unlimited properties', nameColor: 'text-muted',  bg: 'bg-white border border-out-var',      btnClass: 'border-2 border-clay text-clay-dark hover:bg-clay hover:text-white', pop: false,
                features: ['Unlimited listings','Priority applicant review','API access','Dedicated account manager','White-label portal'], missing: [] },
            ].map(({ key, name, sub, nameColor, bg, btnClass, pop, features, missing }, i) => (
              <div key={key} className={`reveal card-lift ${bg} rounded-3xl p-8 ${pop ? 'pricing-pop md:-mt-4' : ''}`} style={{ transitionDelay: `${i * 0.1}s` }}>
                <p className={`font-head font-bold text-sm mb-2 uppercase tracking-widest ${nameColor}`}>{name}</p>
                <p className={`font-display font-light text-5xl mb-1 ${pop ? 'text-white' : 'text-clay-dark'}`}>
                  ${PRICES[key][pricePeriod]}<span className={`text-lg font-body ${pop ? 'text-sand/60' : 'text-muted'}`}>/mo</span>
                </p>
                <p className={`text-xs font-body mb-6 ${pop ? 'text-sand/60' : 'text-muted'}`}>{sub}</p>
                <div className="divider mb-6" />
                <ul className="space-y-3 mb-8">
                  {features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm font-body ${pop ? 'text-white/90' : 'text-stone'}`}>
                      <span className={`material-symbols-outlined fill text-base ${pop ? 'text-sand' : 'text-clay'}`}>check</span>{f}
                    </li>
                  ))}
                  {missing.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm font-body text-muted/50">
                      <span className="material-symbols-outlined text-out-var text-base">close</span>{f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full font-head font-bold text-sm py-3 rounded-full transition-all ${btnClass}`}>Start Free Pilot</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WAITLIST CTA ──────────────────────────── */}
      <section id="waitlist" className="py-28 px-6 md:px-10 warm-grain dark-surface overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 blur-[160px] pointer-events-none" style={{ background: '#9c7060' }} />
        <div className="max-w-2xl mx-auto text-center relative z-10 reveal">
          <span className="inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-1.5 text-xs font-head font-bold text-white/60 uppercase tracking-widest mb-8">
            <span className="w-2 h-2 rounded-full bg-sand animate-pulse-dot" />Early Access
          </span>
          <h2 className="font-display text-5xl md:text-6xl font-light text-white mb-6">Be first.<br /><em className="text-sand">Join the waitlist.</em></h2>
          <p className="font-body text-white/60 text-lg mb-10">Whether you're a student looking for your first off-campus place, or a landlord ready to simplify — get early access before we go public.</p>

          {/* Type toggle */}
          <div className="flex justify-center gap-2 mb-8">
            {(['student', 'landlord'] as const).map((t) => (
              <button key={t} onClick={() => setWaitlistType(t)} className={`toggle-btn text-xs font-head font-bold px-5 py-2 rounded-full border border-white/20 text-white ${waitlistType === t ? 'active' : ''}`}>
                {t === 'student' ? '🎓 I\'m a Student' : '🏠 I\'m a Landlord'}
              </button>
            ))}
          </div>

          <div className="flex gap-3 max-w-md mx-auto">
            <input className="waitlist-input flex-1" placeholder={waitlistType === 'student' ? 'your@edu.edu' : 'your@email.com'} type="email" />
            <button className="clay-grad text-white px-6 py-3.5 rounded-full font-head font-bold text-sm whitespace-nowrap hover:opacity-90 transition-all shadow-xl shadow-clay/30">
              Join Waitlist
            </button>
          </div>
          <p className="text-white/30 text-xs font-body mt-4">No spam. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer className="bg-stone py-16 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 clay-grad rounded-lg flex items-center justify-center">
                  <span className="text-white font-head font-black text-sm leading-none">U</span>
                </div>
                <span className="font-head font-black text-xl text-cream tracking-tight">Tenancy</span>
              </div>
              <p className="font-body text-white/40 text-sm leading-relaxed">Student housing, reimagined. Verified listings, built-in rent tools, and a SaaS layer for landlords.</p>
            </div>
            {[
              { heading: 'Students', links: ['Find Housing', 'Group Formation', 'How It Works', 'Verify My .edu'] },
              { heading: 'Landlords', links: ['List a Property', 'Pricing', 'Dashboard Demo', 'Sign Up'] },
              { heading: 'Company',  links: ['About', 'Blog', 'Careers', 'Contact'] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <p className="font-head font-bold text-white/30 text-xs uppercase tracking-widest mb-4">{heading}</p>
                <ul className="space-y-2">
                  {links.map((l) => <li key={l}><a href="#" className="font-body text-white/60 text-sm hover:text-white transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-body text-white/30 text-xs">© {new Date().getFullYear()} UTenancy, Inc. All rights reserved.</p>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((l) => (
                <a key={l} href="#" className="font-body text-white/30 text-xs hover:text-white/60 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
