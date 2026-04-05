'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Listing } from '@/lib/listings'
import { createClient } from '@/lib/supabase'

/* ── Message Landlord button — creates or opens a conversation ── */
function MessageLandlordButton({ listingId, userId }: { listingId: string; userId: string }) {
  const [sending, setSending] = useState(false)

  async function handleClick() {
    setSending(true)
    const supabase = createClient()
    try {
      // Find the landlord for this listing
      const { data: listing } = await supabase
        .from('listings')
        .select('landlord_id')
        .eq('id', listingId)
        .single()
      if (!listing) { setSending(false); return }
      const landlordId = listing.landlord_id

      // Look for existing conversation between these two users
      const { data: myConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId)
      const myIds = myConvs?.map((r: any) => r.conversation_id) ?? []

      if (myIds.length > 0) {
        const { data: shared } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', landlordId)
          .in('conversation_id', myIds)
        if (shared && shared.length > 0) {
          window.location.href = `/messages/${shared[0].conversation_id}`
          return
        }
      }

      // Create new conversation
      const { data: conv } = await supabase
        .from('conversations')
        .insert({ listing_id: listingId })
        .select()
        .single()
      if (conv) {
        await supabase.from('conversation_participants').insert([
          { conversation_id: conv.id, user_id: userId },
          { conversation_id: conv.id, user_id: landlordId },
        ])
        window.location.href = `/messages/${conv.id}`
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <button onClick={handleClick} disabled={sending}
      className="w-full bg-surf text-clay-dark font-head font-semibold text-sm py-3 rounded-xl hover:bg-linen border border-out-var transition-all flex items-center justify-center gap-2 disabled:opacity-60">
      <span className="material-symbols-outlined text-sm">chat_bubble</span>
      {sending ? 'Opening chat…' : 'Message Landlord'}
    </button>
  )
}

/* ── Photo data (in production: from DB / storage) ── */
const PHOTOS = [
  { src: 'https://photos.zillowstatic.com/fp/377cdfcf956174a58fb17b62d0b842b1-cc_ft_960.jpg',  alt: 'Front exterior — bright single-family bungalow' },
  { src: 'https://photos.zillowstatic.com/fp/c5118678e63bbef59ed087aeea8a1c9d-cc_ft_576.jpg', alt: 'Bright living room with hardwood floors' },
  { src: 'https://photos.zillowstatic.com/fp/331c3ebd85fcd4c3ba83a1aa13db4a96-cc_ft_576.jpg', alt: 'Updated kitchen with natural light' },
  { src: 'https://photos.zillowstatic.com/fp/24a0e26dbe16b521f6792e6a616bdeb1-cc_ft_576.jpg', alt: 'Primary bedroom' },
  { src: 'https://photos.zillowstatic.com/fp/0b410b02916c6d804d047dc2f00ae5f3-cc_ft_576.jpg', alt: 'Private backyard' },
]

/* ── Lightbox ── */
function Lightbox({ index, onClose }: { index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCurrent((c) => Math.min(c + 1, PHOTOS.length - 1))
      if (e.key === 'ArrowLeft')  setCurrent((c) => Math.max(c - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="lightbox open" onClick={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10" onClick={(e) => e.stopPropagation()}>
        <span className="text-white/60 text-sm font-head">{current + 1} / {PHOTOS.length}</span>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-6" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full max-w-3xl" style={{ height: 400 }}>
          <Image src={PHOTOS[current].src} alt={PHOTOS[current].alt} fill className="object-cover rounded-2xl" />
        </div>
      </div>
      <div className="flex gap-3 justify-center px-6 pb-6 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
        {PHOTOS.map((p, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all relative ${i === current ? 'border-clay' : 'border-transparent opacity-60 hover:opacity-100'}`}>
            <Image src={p.src} alt={p.alt} fill className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Apply Modal ── */
function ApplyModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false)
  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-clay transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
        {submitted ? (
          <div className="text-center py-6">
            <div className="check-circle mx-auto mb-4">
              <span className="material-symbols-outlined text-white text-3xl fill">check</span>
            </div>
            <h3 className="font-display text-2xl font-light text-clay-dark mb-2">Application <em>sent!</em></h3>
            <p className="text-sm font-body text-muted">The landlord will review your profile and reach out within 48 hours.</p>
          </div>
        ) : (
          <>
            <h3 className="font-display text-2xl font-light text-clay-dark mb-1">Apply to rent</h3>
            <p className="text-sm font-body text-muted mb-6">{listing.title} — {listing.beds} bed / {listing.baths} bath</p>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }}>
              <div>
                <label className="form-label">Move-in Date</label>
                <input type="date" className="form-input" required />
              </div>
              <div>
                <label className="form-label">Rooms Needed</label>
                <select className="form-input" required>
                  <option value="">Select…</option>
                  <option>1 room (just me)</option>
                  <option>2 rooms (me + roommate)</option>
                  <option>Full home ({listing.beds} rooms)</option>
                </select>
              </div>
              <div>
                <label className="form-label">Note to Landlord</label>
                <textarea className="form-input" rows={3} placeholder="Tell them a bit about yourself…" />
              </div>
              <button type="submit" className="clay-grad w-full text-white py-3 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all">
                Submit Application
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Group Modal ── */
function GroupModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const [joined, setJoined] = useState(false)
  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-clay transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
        {joined ? (
          <div className="text-center py-6">
            <div className="check-circle mx-auto mb-4">
              <span className="material-symbols-outlined text-white text-3xl fill">group</span>
            </div>
            <h3 className="font-display text-2xl font-light text-clay-dark mb-2">You're <em>in the group!</em></h3>
            <p className="text-sm font-body text-muted">2 of {listing.beds} spots filled. We'll notify you when the group is complete.</p>
          </div>
        ) : (
          <>
            <h3 className="font-display text-2xl font-light text-clay-dark mb-1">Join group formation</h3>
            <p className="text-sm font-body text-muted mb-4">1 of {listing.beds} spots filled · {listing.beds - 1} more needed</p>
            <div className="progress-track mb-6">
              <div className="progress-fill" style={{ width: `${Math.round(100 / listing.beds)}%` }} />
            </div>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setJoined(true) }}>
              <div>
                <label className="form-label">Your Move-in Date</label>
                <input type="date" className="form-input" required />
              </div>
              <div>
                <label className="form-label">Rooms you need</label>
                <select className="form-input" required>
                  <option>1 room</option><option>2 rooms</option>
                </select>
              </div>
              <button type="submit" className="clay-grad w-full text-white py-3 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all">
                Join Group
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Main client component ── */
export default function ListingDetail({ listing }: { listing: Listing }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showApply, setShowApply]         = useState(false)
  const [showGroup, setShowGroup]         = useState(false)
  const [user, setUser] = useState<any>(null)
  const [interested, setInterested] = useState(false)
  const [interestCount, setInterestCount] = useState(listing.interested ?? 0)
  const [submitting, setSubmitting] = useState(false)
  const [interestedStudents, setInterestedStudents] = useState<Array<{ id: string; first_name: string; last_name: string; university: string | null }>>([])
  const [showInterestedPanel, setShowInterestedPanel] = useState(false)

  const perPerson = Math.round(listing.price / listing.beds)

  // Lock body scroll when an overlay is open
  useEffect(() => {
    document.body.style.overflow = (lightboxIndex !== null || showApply || showGroup) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex, showApply, showGroup])

  // Scroll reveal
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) } }),
      { threshold: 0.1 },
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Load session + real interest data on mount
  useEffect(() => {
    async function loadSession() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const u = session?.user ?? null
      setUser(u)

      // Fetch real interest count and interested students
      const { data: interests } = await supabase
        .from('listing_interests')
        .select('student_id, profile:profiles(id, first_name, last_name, university)')
        .eq('listing_id', String(listing.id))

      if (interests) {
        setInterestCount(interests.length)
        const students = interests
          .map((i: any) => i.profile)
          .filter(Boolean)
        setInterestedStudents(students)

        // Check if current user already expressed interest
        if (u) {
          const alreadyInterested = interests.some((i: any) => i.student_id === u.id)
          setInterested(alreadyInterested)
        }
      }
    }
    loadSession()
  }, [])

  async function handleInterest() {
    if (!user) return
    setSubmitting(true)
    const supabase = createClient()
    try {
      if (interested) {
        await supabase
          .from('listing_interests')
          .delete()
          .eq('listing_id', String(listing.id))
          .eq('student_id', user.id)
        setInterested(false)
        setInterestCount(c => c - 1)
        setInterestedStudents(prev => prev.filter(s => s.id !== user.id))
      } else {
        await supabase
          .from('listing_interests')
          .insert({ listing_id: String(listing.id), student_id: user.id })
        setInterested(true)
        setInterestCount(c => c + 1)
        // Fetch own profile to add to the list
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, university')
          .eq('id', user.id)
          .single()
        if (myProfile) setInterestedStudents(prev => [...prev, myProfile])
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-linen/50 border-b border-out-var/20 py-2.5 px-6 md:px-10">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-head font-semibold text-muted">
          <Link href="/#listings" className="hover:text-clay transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Find Housing
          </Link>
          <span className="text-out-var">›</span>
          <span>{listing.location}</span>
          <span className="text-out-var">›</span>
          <span className="text-clay-dark font-bold">{listing.title}</span>
        </div>
      </div>

      {/* Gallery */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 mt-6 relative">
        <button onClick={() => setLightboxIndex(0)}
          className="absolute top-4 right-10 md:right-16 z-10 bg-white text-clay-dark font-head font-bold text-xs px-4 py-2.5 rounded-full shadow-xl border border-out-var/40 flex items-center gap-2 hover:bg-cream transition-all">
          <span className="material-symbols-outlined text-sm">photo_camera</span>
          All Photos ({PHOTOS.length})
        </button>

        <div className="photo-gallery">
          <div className="hero-slot img-zoom cursor-pointer overflow-hidden relative" onClick={() => setLightboxIndex(0)}>
            <Image src={PHOTOS[0].src} alt={PHOTOS[0].alt} fill className="object-cover" />
          </div>
          {PHOTOS.slice(1, 3).map((p, i) => (
            <div key={i} className="mini-slot img-zoom cursor-pointer overflow-hidden relative" onClick={() => setLightboxIndex(i + 1)}>
              <Image src={p.src} alt={p.alt} fill className="object-cover" />
            </div>
          ))}
        </div>

        {/* Mobile thumbnail strip */}
        <div className="mobile-strip mt-3 gap-2 overflow-x-auto pb-1" style={{ display: 'none' }}>
          {PHOTOS.slice(1).map((p, i) => (
            <div key={i} onClick={() => setLightboxIndex(i + 1)}
              className="flex-shrink-0 relative cursor-pointer rounded-xl overflow-hidden" style={{ width: 128, height: 80 }}>
              <Image src={p.src} alt={p.alt} fill className="object-cover" />
              {i === PHOTOS.length - 2 && (
                <div className="absolute inset-0 bg-espresso/70 flex items-center justify-center">
                  <span className="text-white font-head font-bold text-xs">+{PHOTOS.length - 3} more</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Main content grid */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">

          {/* ─ LEFT COLUMN ─ */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-8">
              <span className="badge-open text-xs font-head font-bold px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-dot" />
                Available for Rent
              </span>
              <h1 className="font-display text-4xl md:text-5xl font-light text-clay-dark leading-tight mb-3">{listing.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted font-body mb-6">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span>{listing.location}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">school</span>{listing.distanceMi} mi from {listing.university}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm fill text-amber-400">star</span>4.9 · New listing</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: 'bed',          label: `${listing.beds} Bedrooms` },
                  { icon: 'bathtub',      label: `${listing.baths ?? 1} Bathroom` },
                  { icon: 'straighten',   label: '1,050 sq ft' },
                  { icon: 'directions_walk', label: `${listing.distanceMi} mi to ${listing.university}` },
                ].map(({ icon, label }) => (
                  <div key={icon} className="stat-card">
                    <span className="material-symbols-outlined text-clay text-xl">{icon}</span>
                    <span className="text-xs font-head font-bold text-clay-dark">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="divider mb-8" />

            {/* Description */}
            <div className="mb-8 reveal">
              <h2 className="font-head text-xl font-bold text-clay-dark mb-4">About this home</h2>
              <p className="font-body text-muted leading-relaxed">{listing.description}</p>
            </div>

            <div className="divider mb-8" />

            {/* Amenities */}
            <div className="mb-8 reveal">
              <h2 className="font-head text-xl font-bold text-clay-dark mb-5">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(listing.amenities ?? ['Parking', 'Backyard', 'Hardwood floors', 'In-unit laundry', 'A/C', 'High-speed WiFi']).map((a) => (
                  <div key={a} className="flex items-center gap-3 p-3 bg-surf rounded-xl border border-out-var/30">
                    <span className="material-symbols-outlined fill text-clay text-base">check_circle</span>
                    <span className="text-sm font-body text-stone">{a}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="divider mb-8" />

            {/* Group formation */}
            <div className="reveal bg-surf-lo rounded-3xl border border-out-var/40 p-6 mb-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-head text-xl font-bold text-clay-dark mb-1">Group Formation</h2>
                  <p className="text-sm font-body text-muted">1 of {listing.beds} spots filled — join to fill the house together.</p>
                </div>
                <span className="badge-open text-[10px] font-head font-bold px-3 py-1.5 rounded-full whitespace-nowrap">Forming Now</span>
              </div>
              <div className="progress-track mb-2">
                <div className="progress-fill" style={{ width: `${Math.round(100 / listing.beds)}%` }} />
              </div>
              <p className="text-xs text-muted font-body mb-5">1 of {listing.beds} joined</p>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex -space-x-2">
                  {['J', '?', '?'].map((c, i) => (
                    <div key={i} className={`w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-head font-bold ${i === 0 ? 'bg-clay text-cream' : 'bg-linen text-muted'}`}>{c}</div>
                  ))}
                </div>
                <span className="text-xs font-body text-muted">Jordan M. is looking for {listing.beds - 1} more roommates</span>
              </div>
              <button onClick={() => setShowGroup(true)} className="w-full clay-grad text-white py-3 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-clay/20">
                Join This Group
              </button>
            </div>

            {/* Verification pills */}
            <div className="reveal flex flex-wrap gap-3 mb-8">
              <div className="uni-badge">
                <div className="w-8 h-8 clay-grad rounded-full flex items-center justify-center">
                  <span className="text-cream font-head font-black text-xs">U</span>
                </div>
                <span>Verified {listing.university} Listing</span>
              </div>
              <span className="feature-pill">Student-Verified</span>
              <span className="feature-pill">Landlord Screened</span>
            </div>
          </div>

          {/* ─ RIGHT SIDEBAR ─ */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 sidebar-sticky">
            <div className="bg-white rounded-3xl border border-out-var/40 shadow-2xl shadow-clay/8 overflow-hidden">
              {/* Price header */}
              <div className="clay-grad p-6 text-white">
                <div className="flex items-end justify-between mb-1">
                  <div>
                    <p className="text-white/60 text-xs font-head font-bold uppercase tracking-widest mb-1">Total Rent</p>
                    <p className="font-display text-4xl font-light">${listing.price.toLocaleString()}<span className="text-lg font-body text-white/60">/mo</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-xs font-body">Per person</p>
                    <p className="font-head font-black text-xl">${perPerson.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse-dot" />
                  <span className="text-white/70 text-xs font-body">{listing.interested} students interested</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="p-6 space-y-3">
                <button onClick={() => setShowApply(true)} className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/25 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">send</span> Apply to Rent
                </button>
                <button onClick={() => setShowGroup(true)} className="w-full border-2 border-clay text-clay-dark font-head font-bold text-sm py-3.5 rounded-xl hover:bg-clay hover:text-white transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">group_add</span> Join Group Formation
                </button>
                {user && user.user_metadata?.role !== 'landlord' ? (
                  <MessageLandlordButton listingId={String(listing.id)} userId={user.id} />
                ) : !user ? (
                  <a href="/auth" className="w-full bg-surf text-muted font-head font-semibold text-sm py-3 rounded-xl hover:bg-linen transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">chat_bubble</span> Sign in to message
                  </a>
                ) : null}
              </div>

              {/* Quick stats */}
              <div className="border-t border-out-var/40 px-6 py-4 space-y-3">
                {[
                  { label: 'Available', val: 'Now' },
                  { label: 'Lease term', val: '12 months' },
                  { label: 'Deposit',   val: `$${perPerson.toLocaleString()}` },
                  { label: 'Utilities', val: 'Tenant pays' },
                  { label: 'Pets',      val: 'Negotiable' },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs font-body text-muted">{label}</span>
                    <span className="text-xs font-head font-bold text-clay-dark">{val}</span>
                  </div>
                ))}
              </div>

              {/* Verification badge */}
              <div className="border-t border-out-var/40 px-6 py-4">
                <div className="flex items-center gap-3 text-xs font-body text-muted">
                  <span className="material-symbols-outlined fill text-clay text-base">verified</span>
                  <span>Landlord identity &amp; property verified by UTenancy</span>
                </div>
              </div>

              {/* Interest section */}
              <div className="mt-4 p-4 bg-surf-lo rounded-2xl border border-out-var">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-head font-bold text-clay-dark flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-clay">group</span>
                    {interestCount} student{interestCount !== 1 ? 's' : ''} interested
                  </p>
                  {interestCount > 0 && (
                    <button onClick={() => setShowInterestedPanel(true)}
                      className="text-xs font-head font-bold text-clay hover:text-clay-dark transition-colors underline underline-offset-2">
                      See who
                    </button>
                  )}
                </div>
                {/* Stacked avatars preview */}
                {interestedStudents.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex -space-x-2">
                      {interestedStudents.slice(0, 4).map((s) => (
                        <div key={s.id} className="w-7 h-7 rounded-full border-2 border-white clay-grad flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-head font-black text-[9px]">{(s.first_name?.[0] ?? '') + (s.last_name?.[0] ?? '')}</span>
                        </div>
                      ))}
                    </div>
                    {interestedStudents.length > 4 && (
                      <span className="text-xs font-body text-muted">+{interestedStudents.length - 4} more</span>
                    )}
                  </div>
                )}
                {user && user.user_metadata?.role !== 'landlord' && (
                  <button
                    onClick={handleInterest}
                    disabled={submitting}
                    className={`w-full py-2.5 rounded-xl font-head font-bold text-sm border transition-all flex items-center justify-center gap-2
                      ${interested
                        ? 'bg-surf-hi border-clay/30 text-clay-dark'
                        : 'clay-grad text-white border-transparent shadow-sm hover:opacity-90'}`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {interested ? 'favorite' : 'favorite_border'}
                    </span>
                    {submitting ? 'Saving…' : interested ? "You're interested" : "I'm Interested"}
                  </button>
                )}
                {!user && (
                  <a href="/auth" className="block w-full text-center py-2.5 rounded-xl font-head font-bold text-sm border border-out-var text-muted hover:border-clay/40 hover:text-clay transition-all">
                    Sign in to express interest
                  </a>
                )}
              </div>
            </div>

            <p className="text-xs text-muted font-body text-center mt-4 leading-relaxed px-2">
              Never pay a deposit before signing a lease.{' '}
              <a href="#" className="text-clay font-semibold hover:underline">Report this listing</a>
            </p>
          </div>
        </div>
      </section>

      {/* Overlays */}
      {lightboxIndex !== null && <Lightbox index={lightboxIndex} onClose={() => setLightboxIndex(null)} />}
      {showApply && <ApplyModal listing={listing} onClose={() => setShowApply(false)} />}
      {showGroup && <GroupModal listing={listing} onClose={() => setShowGroup(false)} />}

      {/* Who's Interested modal */}
      {showInterestedPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(30,20,16,.55)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowInterestedPanel(false)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-out-var w-full max-w-sm p-7 relative"
            style={{ boxShadow: '0 40px 80px rgba(81,53,38,.18)' }}
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowInterestedPanel(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-outline hover:text-clay hover:bg-surf-lo transition-all">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 clay-grad rounded-xl flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined fill text-white">group</span>
              </div>
              <div>
                <h3 className="font-head font-bold text-clay-dark">Interested Students</h3>
                <p className="text-xs font-body text-muted">{interestCount} student{interestCount !== 1 ? 's' : ''} want this listing</p>
              </div>
            </div>
            {interestedStudents.length === 0 ? (
              <p className="text-sm font-body text-muted text-center py-6">No students yet.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {interestedStudents.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-surf-lo rounded-2xl border border-out-var/30">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 clay-grad flex items-center justify-center">
                      <span className="text-white font-head font-black text-xs">{(s.first_name?.[0] ?? '') + (s.last_name?.[0] ?? '')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-head font-bold text-clay-dark truncate">{s.first_name} {s.last_name}</p>
                      {s.university && <p className="text-xs font-body text-muted truncate">{s.university}</p>}
                    </div>
                    {/* Students can view other students' profiles and message them */}
                    {user && user.user_metadata?.role !== 'landlord' && user.id !== s.id && (
                      <a href={`/profile/${s.id}`}
                        className="flex-shrink-0 text-xs font-head font-bold text-clay hover:text-clay-dark transition-colors underline underline-offset-2">
                        View
                      </a>
                    )}
                    {/* Landlords can only see names, not initiate */}
                    {user && user.user_metadata?.role === 'landlord' && (
                      <span className="flex-shrink-0 text-[10px] font-body text-muted">Interested</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {user && user.user_metadata?.role !== 'landlord' && (
              <p className="text-[11px] font-body text-muted text-center mt-4">
                Click "View" to see a student's profile and message them.
              </p>
            )}
            {user && user.user_metadata?.role === 'landlord' && (
              <p className="text-[11px] font-body text-muted text-center mt-4">
                Students can message you directly — you'll see it in your inbox.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
