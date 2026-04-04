'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Listing } from '@/lib/listings'

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
                <button className="w-full bg-surf text-muted font-head font-semibold text-sm py-3 rounded-xl hover:bg-linen transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">chat_bubble</span> Message Landlord
                </button>
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
    </>
  )
}
