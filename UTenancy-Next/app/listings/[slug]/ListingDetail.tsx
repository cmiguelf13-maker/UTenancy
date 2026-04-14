'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Listing } from '@/lib/listings'
import { createClient } from '@/lib/supabase'
import { getDistanceToNearestSchool } from '@/lib/distance'

/* ── Types ─────────────────────────────────────────────────────── */
type LandlordProfile = {
  id: string
  first_name: string | null
  last_name: string | null
  company: string | null
  bio: string | null
  phone: string | null
}

type SimilarListing = {
  id: string
  address: string
  city: string
  state: string
  rent: number
  bedrooms: number
  bathrooms: number
  type: string
  img: string
  slug?: string
}

/* ── Shared helper: open or create a 1-on-1 conversation ─────── */
async function openConversation(
  supabase: any,
  listingId: string,
  userId: string,
  otherUserId: string,
): Promise<string | null> {
  // Uses a SECURITY DEFINER RPC to atomically create the conversation +
  // participants, bypassing RLS mid-flight issues.
  const { data: convId, error } = await supabase.rpc('open_conversation', {
    p_listing_id: listingId,
    p_user_a:     userId,
    p_user_b:     otherUserId,
  })

  if (error || !convId) {
    return error?.message ?? 'Could not create conversation'
  }

  window.location.href = `/messages/${convId}`
  return null
}

/* ── Message Landlord button (group-formation listings) ─────── */
function MessageLandlordButton({ listingId, userId }: { listingId: string; userId: string }) {
  const [sending, setSending] = useState(false)
  const [msgErr, setMsgErr] = useState<string | null>(null)

  async function handleClick() {
    setMsgErr(null)
    setSending(true)
    const supabase = createClient()
    try {
      const { data: listing, error: lErr } = await supabase.from('listings').select('landlord_id').eq('id', listingId).single()
      if (lErr || !listing) { setMsgErr('Could not load listing. Please try again.'); setSending(false); return }
      const err = await openConversation(supabase, listingId, userId, listing.landlord_id)
      if (err) setMsgErr('Could not open chat: ' + err)
    } catch (err: any) { setMsgErr(err?.message ?? 'Unexpected error. Please try again.') } finally { setSending(false) }
  }

  return (
    <div>
      <button onClick={handleClick} disabled={sending}
        className="w-full bg-surf text-clay-dark font-head font-semibold text-sm py-3 rounded-xl hover:bg-linen border border-out-var transition-all flex items-center justify-center gap-2 disabled:opacity-60">
        <span className="material-symbols-outlined text-sm">chat_bubble</span>
        {sending ? 'Opening chat…' : 'Message Landlord'}
      </button>
      {msgErr && <p className="text-xs text-red-500 mt-1.5 text-center font-body">{msgErr}</p>}
    </div>
  )
}

/* ── Message Tenant button (open-room listings) ─────────────── */
function MessageTenantButton({ listingId, userId }: { listingId: string; userId: string }) {
  const [sending, setSending] = useState(false)
  const [msgErr, setMsgErr] = useState<string | null>(null)

  async function handleClick() {
    setMsgErr(null)
    setSending(true)
    const supabase = createClient()
    try {
      const { data: listing, error: lErr } = await supabase.from('listings').select('landlord_id').eq('id', listingId).single()
      if (lErr || !listing) { setMsgErr('Could not load listing. Please try again.'); setSending(false); return }
      const err = await openConversation(supabase, listingId, userId, listing.landlord_id)
      if (err) setMsgErr('Could not open chat: ' + err)
    } catch (err: any) { setMsgErr(err?.message ?? 'Unexpected error. Please try again.') } finally { setSending(false) }
  }

  return (
    <div>
      <button onClick={handleClick} disabled={sending}
        className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/25 flex items-center justify-center gap-2 disabled:opacity-60">
        <span className="material-symbols-outlined text-sm">chat_bubble</span>
        {sending ? 'Opening chat…' : 'Message Tenant'}
      </button>
      {msgErr && <p className="text-xs text-red-500 mt-1.5 text-center font-body">{msgErr}</p>}
    </div>
  )
}

/* ── Landlord card ───────────────────────────────────────────── */
function LandlordCard({
  profile,
  listingId,
  currentUser,
  listingType,
}: {
  profile: LandlordProfile
  listingId: string
  currentUser: any
  listingType?: string
}) {
  const [messaging, setMessaging] = useState(false)
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Property Owner'
  const initials = ((profile.first_name?.[0] ?? '') + (profile.last_name?.[0] ?? '')).toUpperCase() || 'LL'

  async function handleMessage() {
    if (!currentUser) { window.location.href = '/auth'; return }
    setMessaging(true)
    const supabase = createClient()
    const err = await openConversation(supabase, listingId, currentUser.id, profile.id)
    if (err) console.error('[LandlordCard] message error:', err)
    setMessaging(false)
  }

  return (
    <div className="reveal mb-8">
      <h2 className="font-head text-xl font-bold text-clay-dark mb-4">
        {listingType === 'open' ? 'About the Tenant' : 'About the Landlord'}
      </h2>
      <div className="bg-surf-lo rounded-2xl border border-out-var p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 clay-grad rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white font-head font-black text-base">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-head font-bold text-clay-dark text-base">{fullName}</p>
            {profile.company && (
              <p className="text-sm font-body text-muted">{profile.company}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="material-symbols-outlined fill text-clay text-sm">verified</span>
              <span className="text-xs font-head font-semibold text-clay">UTenancy Verified</span>
            </div>
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm font-body text-muted leading-relaxed mb-4 italic">"{profile.bio}"</p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs font-body text-muted mb-4">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-clay">schedule</span>
            <span>Responds within 24 hours</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-clay">shield</span>
            <span>Background checked</span>
          </div>
        </div>

        {currentUser && currentUser.user_metadata?.role !== 'landlord' ? (
          <button
            onClick={handleMessage}
            disabled={messaging}
            className="w-full bg-white text-clay-dark font-head font-semibold text-sm py-2.5 rounded-xl hover:bg-linen border border-out-var transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">chat_bubble</span>
            {messaging ? 'Opening chat…' : listingType === 'open' ? 'Message Tenant' : 'Message Landlord'}
          </button>
        ) : !currentUser ? (
          <a
            href="/auth"
            className="block w-full text-center py-2.5 rounded-xl font-head font-semibold text-sm border border-out-var text-muted hover:border-clay/40 hover:text-clay transition-all"
          >
            Sign in to message
          </a>
        ) : null}
      </div>
    </div>
  )
}

/* ── Similar listing card ────────────────────────────────────── */
function SimilarListingCard({ listing }: { listing: SimilarListing }) {
  const href = listing.slug ? `/listings/${listing.slug}` : `/listings/${listing.id}`
  const isOpen = listing.type === 'open-room' || listing.type === 'open'

  return (
    <a href={href} className="group block flex-shrink-0 w-72 lg:w-auto">
      <div className="bg-white rounded-2xl border border-out-var overflow-hidden hover:shadow-lg hover:border-clay/20 transition-all duration-300">
        <div className="relative h-44 overflow-hidden bg-linen">
          {listing.img ? (
            <img
              src={listing.img}
              alt={listing.address}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 clay-grad opacity-10" />
          )}
          <div className="absolute top-3 left-3">
            <span className={`text-[10px] font-head font-bold px-2.5 py-1 rounded-full ${isOpen ? 'badge-open' : 'bg-espresso text-cream'}`}>
              {isOpen ? 'Open Room' : 'Group Formation'}
            </span>
          </div>
        </div>
        <div className="p-4">
          <p className="font-head font-bold text-clay-dark text-sm mb-1 truncate">{listing.address}</p>
          <p className="text-xs font-body text-muted mb-3">{listing.city}, {listing.state}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-head font-bold uppercase tracking-widest text-muted mb-0.5">
                {isOpen ? 'Per Person' : 'Total Rent'}
              </p>
              <p className="font-display text-lg text-clay-dark font-light">
                ${listing.rent.toLocaleString()}
                <span className="text-xs text-muted font-body">/mo</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-body text-muted">
              <span className="material-symbols-outlined text-sm">bed</span>
              <span>{listing.bedrooms}</span>
              <span className="text-out-var">·</span>
              <span className="material-symbols-outlined text-sm">bathtub</span>
              <span>{listing.bathrooms}</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}

/* ── Fallback photo ──────────────────────────────────────────── */
const FALLBACK_PHOTOS = [
  { src: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=960&q=75', alt: 'Property exterior' },
]

/* ── Lightbox ────────────────────────────────────────────────── */
type PhotoItem = { src: string; alt: string }
function Lightbox({ index, onClose, photos }: { index: number; onClose: () => void; photos: PhotoItem[] }) {
  const [current, setCurrent] = useState(index)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCurrent((c) => Math.min(c + 1, photos.length - 1))
      if (e.key === 'ArrowLeft')  setCurrent((c) => Math.max(c - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, photos.length])

  return (
    <div className="lightbox open" onClick={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10" onClick={(e) => e.stopPropagation()}>
        <span className="text-white/60 text-sm font-head">{current + 1} / {photos.length}</span>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-6" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full max-w-3xl" style={{ height: 400 }}>
          <img src={photos[current].src} alt={photos[current].alt} className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
        </div>
      </div>
      <div className="flex gap-3 justify-center px-6 pb-6 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
        {photos.map((p: PhotoItem, i: number) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all relative ${i === current ? 'border-clay' : 'border-transparent opacity-60 hover:opacity-100'}`}>
            <img src={p.src} alt={p.alt} className="absolute inset-0 w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Application Modal (3-step full form) ────────────────────── */
function ApplicationModal({ listing, user, onClose }: { listing: Listing; user: any; onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)

  // Step 1 — About You
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [university, setUniversity] = useState('')
  const [enrollmentStatus, setEnrollmentStatus] = useState('')
  const [major, setMajor] = useState('')
  const [gradYear, setGradYear] = useState('')

  // Step 2 — Financial & References
  const [employmentStatus, setEmploymentStatus] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [hasCosigner, setHasCosigner] = useState(false)
  const [cosignerName, setCosignerName] = useState('')
  const [ref1Name, setRef1Name] = useState('')
  const [ref1Rel, setRef1Rel] = useState('')
  const [ref1Contact, setRef1Contact] = useState('')
  const [ref2Name, setRef2Name] = useState('')
  const [ref2Rel, setRef2Rel] = useState('')
  const [ref2Contact, setRef2Contact] = useState('')

  // Step 3 — Preferences & Submit
  const [moveIn, setMoveIn] = useState('')
  const [leaseTerm, setLeaseTerm] = useState('')
  const [numOccupants, setNumOccupants] = useState('1')
  const [hasPets, setHasPets] = useState(false)
  const [petsDescription, setPetsDescription] = useState('')
  const [message, setMessage] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // All hooks before any early returns
  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    // Pre-fill from profile
    supabase
      .from('profiles')
      .select('first_name, last_name, phone, university, major, grad_year')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return
        const name = [data.first_name, data.last_name].filter(Boolean).join(' ')
        if (name) setFullName(name)
        if (data.phone) setPhone(data.phone)
        if (data.university) setUniversity(data.university)
        if (data.major) setMajor(data.major)
        if (data.grad_year) setGradYear(data.grad_year)
      })
    // Check already applied
    supabase
      .from('rent_applications')
      .select('id')
      .eq('listing_id', String(listing.id))
      .eq('user_id', user.id)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setAlreadyApplied(true)
      })
  }, [user, listing.id])

  async function handleSubmit() {
    if (!user) { window.location.href = '/auth'; return }
    setSubmitting(true)
    setApplyError(null)
    const supabase = createClient()
    const { error: insertErr } = await supabase.from('rent_applications').insert({
      listing_id: String(listing.id),
      user_id: user.id,
      application_type: listing.beds > 1 ? 'group' : 'direct',
      status: 'pending',
      full_name: fullName,
      phone: phone || null,
      date_of_birth: dob || null,
      university: university || null,
      enrollment_status: enrollmentStatus || null,
      major: major || null,
      grad_year: gradYear || null,
      employment_status: employmentStatus || null,
      monthly_income: monthlyIncome ? Number(monthlyIncome) : null,
      has_cosigner: hasCosigner,
      cosigner_name: cosignerName || null,
      ref1_name: ref1Name || null,
      ref1_relationship: ref1Rel || null,
      ref1_contact: ref1Contact || null,
      ref2_name: ref2Name || null,
      ref2_relationship: ref2Rel || null,
      ref2_contact: ref2Contact || null,
      move_in_date: moveIn || null,
      lease_term: leaseTerm || null,
      num_occupants: numOccupants ? Number(numOccupants) : null,
      has_pets: hasPets,
      pets_description: petsDescription || null,
      message: message || null,
      agreed_to_terms: agreedToTerms,
    })
    setSubmitting(false)
    if (insertErr) {
      setApplyError(
        insertErr.message.includes('unique')
          ? "You've already submitted an application for this property."
          : 'Something went wrong. Please try again.'
      )
    } else {
      setSubmitted(true)
    }
  }

  const STEPS = ['About You', 'Financial & Refs', 'Preferences']

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ maxWidth: 540, maxHeight: '92vh', overflowY: 'auto' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-clay transition-colors z-10">
          <span className="material-symbols-outlined">close</span>
        </button>

        {alreadyApplied ? (
          <div className="text-center py-8">
            <div className="check-circle mx-auto mb-4">
              <span className="material-symbols-outlined text-white text-3xl fill">check</span>
            </div>
            <h3 className="font-display text-2xl font-light text-clay-dark mb-2">Already <em>applied!</em></h3>
            <p className="text-sm font-body text-muted">Your application is in. The landlord will review it and reach out within 48 hours.</p>
            <button onClick={onClose} className="mt-5 clay-grad text-white px-6 py-2.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all">Close</button>
          </div>
        ) : submitted ? (
          <div className="text-center py-8">
            <div className="check-circle mx-auto mb-4">
              <span className="material-symbols-outlined text-white text-3xl fill">check</span>
            </div>
            <h3 className="font-display text-2xl font-light text-clay-dark mb-2">Application <em>submitted!</em></h3>
            <p className="text-sm font-body text-muted">The landlord will review your application and get back to you within 48 hours. Good luck!</p>
            <button onClick={onClose} className="mt-5 clay-grad text-white px-6 py-2.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all">Done</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-5 pr-8">
              <h3 className="font-display text-2xl font-light text-clay-dark mb-1">Rental Application</h3>
              <p className="text-sm font-body text-muted">{listing.title} · {listing.beds} bed / {listing.baths ?? 1} bath</p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center mb-6">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center flex-1 min-w-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-head font-black flex-shrink-0 transition-all ${step > i + 1 ? 'clay-grad text-white' : step === i + 1 ? 'bg-clay-dark text-white' : 'bg-linen text-muted'}`}>
                    {step > i + 1 ? <span className="material-symbols-outlined text-xs">check</span> : i + 1}
                  </div>
                  <span className={`text-[10px] font-head font-semibold ml-1 truncate ${step === i + 1 ? 'text-clay-dark' : 'text-muted'}`}>{label}</span>
                  {i < STEPS.length - 1 && <div className={`h-px flex-1 mx-2 ${step > i + 1 ? 'bg-clay/50' : 'bg-out-var'}`} />}
                </div>
              ))}
            </div>

            {!user && (
              <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-body text-amber-800">
                You need to be signed in to apply. <a href="/auth" className="font-bold underline">Sign in</a>
              </div>
            )}
            {applyError && (
              <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200 text-xs font-body text-red-700">{applyError}</div>
            )}

            {/* ── Step 1: About You ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Full Legal Name *</label>
                    <input type="text" className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" />
                  </div>
                  <div>
                    <label className="form-label">Phone Number</label>
                    <input type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-input" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">University / School</label>
                    <input type="text" className="form-input" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="LMU, UCLA…" />
                  </div>
                  <div>
                    <label className="form-label">Enrollment Status</label>
                    <select className="form-input" value={enrollmentStatus} onChange={(e) => setEnrollmentStatus(e.target.value)}>
                      <option value="">Select…</option>
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Graduating soon</option>
                      <option>Graduate / PhD</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Major / Field of Study</label>
                    <input type="text" className="form-input" value={major} onChange={(e) => setMajor(e.target.value)} placeholder="Computer Science" />
                  </div>
                  <div>
                    <label className="form-label">Expected Graduation</label>
                    <input type="text" className="form-input" value={gradYear} onChange={(e) => setGradYear(e.target.value)} placeholder="May 2027" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!fullName.trim()) { setApplyError('Please enter your full legal name.'); return }
                    setApplyError(null)
                    setStep(2)
                  }}
                  className="clay-grad w-full text-white py-3 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  Next <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            )}

            {/* ── Step 2: Financial & References ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Employment Status</label>
                    <select className="form-input" value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)}>
                      <option value="">Select…</option>
                      <option>Student only</option>
                      <option>Part-time employed</option>
                      <option>Full-time employed</option>
                      <option>Freelance / self-employed</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Monthly Income ($)</label>
                    <input type="number" className="form-input" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} placeholder="0" min="0" />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={hasCosigner} onChange={(e) => setHasCosigner(e.target.checked)} className="w-4 h-4 accent-clay" />
                    <span className="text-sm font-body text-clay-dark">I have a co-signer / guarantor</span>
                  </label>
                  {hasCosigner && (
                    <input type="text" className="form-input mt-2" value={cosignerName} onChange={(e) => setCosignerName(e.target.value)} placeholder="Co-signer's full name" />
                  )}
                </div>
                <div className="p-4 bg-surf-lo rounded-2xl border border-out-var/40 space-y-3">
                  <p className="text-xs font-head font-bold text-clay-dark uppercase tracking-wide">Reference 1</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" className="form-input" value={ref1Name} onChange={(e) => setRef1Name(e.target.value)} placeholder="Full name" />
                    <input type="text" className="form-input" value={ref1Rel} onChange={(e) => setRef1Rel(e.target.value)} placeholder="Relationship" />
                  </div>
                  <input type="text" className="form-input" value={ref1Contact} onChange={(e) => setRef1Contact(e.target.value)} placeholder="Phone or email" />
                </div>
                <div className="p-4 bg-surf-lo rounded-2xl border border-out-var/40 space-y-3">
                  <p className="text-xs font-head font-bold text-clay-dark uppercase tracking-wide">Reference 2</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" className="form-input" value={ref2Name} onChange={(e) => setRef2Name(e.target.value)} placeholder="Full name" />
                    <input type="text" className="form-input" value={ref2Rel} onChange={(e) => setRef2Rel(e.target.value)} placeholder="Relationship" />
                  </div>
                  <input type="text" className="form-input" value={ref2Contact} onChange={(e) => setRef2Contact(e.target.value)} placeholder="Phone or email" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setApplyError(null); setStep(1) }} className="border border-out-var text-clay-dark py-3 px-5 rounded-xl font-head font-bold text-sm hover:bg-linen transition-all">Back</button>
                  <button onClick={() => { setApplyError(null); setStep(3) }} className="flex-1 clay-grad text-white py-3 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    Next <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Preferences & Submit ── */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Move-in Date *</label>
                    <input type="date" className="form-input" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Lease Term</label>
                    <select className="form-input" value={leaseTerm} onChange={(e) => setLeaseTerm(e.target.value)}>
                      <option value="">Select…</option>
                      <option>6 months</option>
                      <option>12 months</option>
                      <option>18 months</option>
                      <option>Flexible</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Total Occupants (including you)</label>
                  <select className="form-input" value={numOccupants} onChange={(e) => setNumOccupants(e.target.value)}>
                    <option value="1">1 — just me</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5+</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={hasPets} onChange={(e) => setHasPets(e.target.checked)} className="w-4 h-4 accent-clay" />
                    <span className="text-sm font-body text-clay-dark">I have pets</span>
                  </label>
                  {hasPets && (
                    <input type="text" className="form-input mt-2" value={petsDescription} onChange={(e) => setPetsDescription(e.target.value)} placeholder="Describe your pets (type, size, breed)" />
                  )}
                </div>
                <div>
                  <label className="form-label">Message to Landlord</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell them about yourself — your schedule, lifestyle, why you'd be a great tenant…"
                  />
                </div>
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="w-4 h-4 accent-clay mt-0.5 flex-shrink-0" />
                  <span className="text-xs font-body text-muted leading-relaxed">
                    I confirm that all information in this application is accurate and complete. I understand this is not a lease agreement and the landlord may request additional documentation.
                  </span>
                </label>
                <div className="flex gap-2">
                  <button onClick={() => { setApplyError(null); setStep(2) }} className="border border-out-var text-clay-dark py-3 px-5 rounded-xl font-head font-bold text-sm hover:bg-linen transition-all">Back</button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !user || !moveIn || !agreedToTerms}
                    className="flex-1 clay-grad text-white py-3 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting
                      ? <><span className="spinner" /> Submitting…</>
                      : <><span className="material-symbols-outlined text-sm">send</span> Submit Application</>}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ── Group Modal ─────────────────────────────────────────────── */
function GroupModal({ listing, user, onClose }: { listing: Listing; user: any; onClose: () => void }) {
  const [joined, setJoined] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [alreadyJoined, setAlreadyJoined] = useState(false)
  const [groupError, setGroupError] = useState<string | null>(null)
  const [moveIn, setMoveIn] = useState('')
  const [roomsNeeded, setRoomsNeeded] = useState('1 room')

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase
      .from('rent_applications')
      .select('id')
      .eq('listing_id', String(listing.id))
      .eq('user_id', user.id)
      .eq('application_type', 'group')
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setAlreadyJoined(true)
      })
  }, [user, listing.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) { window.location.href = '/auth'; return }
    setSubmitting(true)
    setGroupError(null)
    const supabase = createClient()
    const { error: insertErr } = await supabase.from('rent_applications').insert({
      listing_id: String(listing.id),
      user_id: user.id,
      application_type: 'group',
      status: 'pending',
    })
    setSubmitting(false)
    if (insertErr) {
      setGroupError('Something went wrong. Please try again.')
    } else {
      setJoined(true)
    }
  }

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-clay transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>

        {alreadyJoined ? (
          <div className="text-center py-6">
            <div className="check-circle mx-auto mb-4">
              <span className="material-symbols-outlined text-white text-3xl fill">group</span>
            </div>
            <h3 className="font-display text-2xl font-light text-clay-dark mb-2">You're <em>already in!</em></h3>
            <p className="text-sm font-body text-muted">You've already joined this group. We'll notify you as more spots fill up.</p>
          </div>
        ) : joined ? (
          <div className="text-center py-6">
            <div className="check-circle mx-auto mb-4">
              <span className="material-symbols-outlined text-white text-3xl fill">group</span>
            </div>
            <h3 className="font-display text-2xl font-light text-clay-dark mb-2">You're <em>in the group!</em></h3>
            <p className="text-sm font-body text-muted">You've joined the group. We'll notify you when all spots are filled.</p>
          </div>
        ) : (
          <>
            <h3 className="font-display text-2xl font-light text-clay-dark mb-1">Join group formation</h3>
            <p className="text-sm font-body text-muted mb-4">1 of {listing.beds} spots filled · {listing.beds - 1} more needed</p>
            <div className="progress-track mb-6">
              <div className="progress-fill" style={{ width: `${Math.round(100 / listing.beds)}%` }} />
            </div>

            {!user && (
              <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-body text-amber-800">
                You need to be signed in to join.{' '}
                <a href="/auth" className="font-bold underline">Sign in</a>
              </div>
            )}
            {groupError && (
              <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200 text-xs font-body text-red-700">{groupError}</div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="form-label">Your Move-in Date</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={moveIn}
                  onChange={(e) => setMoveIn(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Rooms you need</label>
                <select
                  className="form-input"
                  required
                  value={roomsNeeded}
                  onChange={(e) => setRoomsNeeded(e.target.value)}
                >
                  <option>1 room</option>
                  <option>2 rooms</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting || !user}
                className="clay-grad w-full text-white py-3 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><span className="spinner" /> Joining…</>
                  : <><span className="material-symbols-outlined text-sm">group_add</span> Join Group</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Main client component ───────────────────────────────────── */
export default function ListingDetail({
  listing,
  landlordProfile,
  similarListings = [],
}: {
  listing: Listing
  landlordProfile?: LandlordProfile
  similarListings?: SimilarListing[]
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  // Client-side profile — starts with the server prop, then re-fetches from DB
  // to guarantee freshness regardless of server-side caching.
  const [resolvedProfile, setResolvedProfile] = useState<LandlordProfile | undefined>(landlordProfile)
  const [showApply, setShowApply]         = useState(false)
  const [showGroup, setShowGroup]         = useState(false)
  const [user, setUser] = useState<any>(null)
  const [interested, setInterested] = useState(false)
  const [interestCount, setInterestCount] = useState(listing.interested ?? 0)
  const [submitting, setSubmitting] = useState(false)
  const [interestedStudents, setInterestedStudents] = useState<Array<{ id: string; first_name: string; last_name: string; university: string | null }>>([])
  const [showInterestedPanel, setShowInterestedPanel] = useState(false)
  const [messagingStudent, setMessagingStudent] = useState<string | null>(null)
  const [hasApplied, setHasApplied] = useState(false)
  const [copyDone, setCopyDone] = useState(false)
  const [actionToast, setActionToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [distanceInfo, setDistanceInfo] = useState<{ distanceMi: number; university: string } | null>(
    listing.distanceMi && listing.university
      ? { distanceMi: listing.distanceMi, university: listing.university }
      : null
  )

  // Real-time profile sync:
  // 1. Fetch listing fresh from DB (bypasses any server-side cache) to get the current landlord_id.
  // 2. Fetch that owner's profile and update the card.
  // 3. Subscribe to listing row changes — if landlord_id is reassigned, card updates instantly.
  useEffect(() => {
    const listingId = String(listing.id)
    if (!listingId.includes('-')) return // mock listings have numeric IDs — skip

    const supabase = createClient()

    async function fetchProfileForOwner(ownerId: string) {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, company, bio, phone')
        .eq('id', ownerId)
        .single()
      if (data) setResolvedProfile(data as LandlordProfile)
    }

    async function init() {
      // Fresh listing fetch — anon key can read active listings, bypasses server cache
      const { data: fresh } = await supabase
        .from('listings')
        .select('landlord_id')
        .eq('id', listingId)
        .single()
      if (fresh?.landlord_id) await fetchProfileForOwner(fresh.landlord_id)
    }

    init()

    // Subscribe to listing row updates for real-time landlord_id changes
    const channel = supabase
      .channel(`listing-owner-sync-${listingId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'listings', filter: `id=eq.${listingId}` },
        async (payload) => {
          const newOwnerId = (payload.new as any).landlord_id as string | undefined
          if (newOwnerId) await fetchProfileForOwner(newOwnerId)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.id])

  const perPerson = listing.beds > 0 ? Math.round(listing.price / listing.beds) : listing.price

  // Mock listings have numeric IDs (2, 3…); real DB listings have UUID strings.
  // Only DB listings can have interests saved — mock IDs aren't valid FK targets.
  const isDbListing = typeof listing.id === 'string' && (listing.id as string).includes('-')

  const dbImages = (listing as any).images as string[] | undefined
  const hasDbImages = dbImages && dbImages.length > 0 && dbImages[0] !== ''
  const PHOTOS = hasDbImages
    ? dbImages.map((url: string, i: number) => ({ src: url, alt: `Property photo ${i + 1}` }))
    : FALLBACK_PHOTOS

  // Compute distance for DB listings that don't have it pre-computed
  useEffect(() => {
    if (!distanceInfo && listing.title && listing.location) {
      const [city] = listing.location.split(',').map((s: string) => s.trim())
      getDistanceToNearestSchool(listing.title, city).then((info) => {
        if (info) setDistanceInfo(info)
      })
    }
  }, [listing.title, listing.location])

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

  // Real-time interest subscription — keeps count + student list live across all viewers
  useEffect(() => {
    if (!isDbListing) return
    const supabase = createClient()
    const channel = supabase
      .channel(`listing-interests-${listing.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listing_interests', filter: `listing_id=eq.${listing.id}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newId = (payload.new as any).student_id
            setInterestCount((c) => c + 1)
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, university')
              .eq('id', newId)
              .single()
            if (profile) {
              setInterestedStudents((prev) =>
                prev.some((s) => s.id === profile.id) ? prev : [...prev, profile]
              )
            }
          } else if (payload.eventType === 'DELETE') {
            const removedId = (payload.old as any).student_id
            setInterestCount((c) => Math.max(0, c - 1))
            setInterestedStudents((prev) => prev.filter((s) => s.id !== removedId))
          }
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDbListing, listing.id])

  // Load session + interest data on mount
  useEffect(() => {
    async function loadSession() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const u = session?.user ?? null
      setUser(u)

      // Fetch interest rows (no cross-schema FK join — student_id → auth.users, not profiles)
      const { data: interests } = await supabase
        .from('listing_interests')
        .select('student_id')
        .eq('listing_id', String(listing.id))

      if (interests) {
        setInterestCount(interests.length)
        if (u) {
          const alreadyInterested = interests.some((i: any) => i.student_id === u.id)
          setInterested(alreadyInterested)
        }
        // Fetch profiles separately — PostgREST can't join listing_interests→profiles
        // because the FK references auth.users, not public.profiles
        if (interests.length > 0) {
          const studentIds = interests.map((i: any) => i.student_id)
          const { data: profileRows } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, university')
            .in('id', studentIds)
          if (profileRows) setInterestedStudents(profileRows)
        }
      }

      // Check if already applied
      if (u) {
        const { data: apps } = await supabase
          .from('rent_applications')
          .select('id')
          .eq('listing_id', String(listing.id))
          .eq('user_id', u.id)
          .limit(1)
        if (apps && apps.length > 0) setHasApplied(true)
      }

    }
    loadSession()
  }, [])

  async function handleInterest() {
    if (!user) { window.location.href = '/auth'; return }
    if (!isDbListing) {
      setActionToast({ msg: 'Sample listings can\'t be saved — browse real listings to express interest.', ok: false })
      return
    }
    setSubmitting(true)
    const supabase = createClient()
    try {
      if (interested) {
        const { error } = await supabase
          .from('listing_interests')
          .delete()
          .eq('listing_id', String(listing.id))
          .eq('student_id', user.id)
        if (!error) {
          setInterested(false)
          setInterestCount((c) => Math.max(0, c - 1))
          setInterestedStudents((prev) => prev.filter((s) => s.id !== user.id))
        } else {
          console.error('[interest] remove error:', error.message)
        }
      } else {
        const { error } = await supabase
          .from('listing_interests')
          .insert({ listing_id: String(listing.id), student_id: user.id })
        if (error) {
          console.error('[interest] insert error:', error.message)
          setActionToast({ msg: 'Could not save interest: ' + error.message, ok: false })
          return
        }
        setInterested(true)
        setInterestCount((c) => c + 1)
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, university')
          .eq('id', user.id)
          .single()
        if (myProfile) setInterestedStudents((prev) => [...prev, myProfile])

        // For open-room listings: open a message thread with the tenant via RPC
        if (listing.type === 'open') {
          const tenantId = (listing as any).landlord_id as string | undefined
          // Don't open a self-conversation if the current user IS the listing owner
          if (tenantId && tenantId !== user.id) {
            await openConversation(supabase, String(listing.id), user.id, tenantId)
            return
          }
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMessageStudent(studentId: string) {
    if (!user) { window.location.href = '/auth'; return }
    setMessagingStudent(studentId)
    const supabase = createClient()
    try {
      await openConversation(supabase, String(listing.id), user.id, studentId)
    } catch (err) {
      console.error('[interested panel] message student error:', err)
    } finally {
      setMessagingStudent(null)
    }
  }

  function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopyDone(true)
        setTimeout(() => setCopyDone(false), 2500)
      })
    }
  }

  const mapDestination = distanceInfo?.university
    ? `${distanceInfo.university}`
    : 'Loyola Marymount University, Los Angeles, CA'

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-linen/50 border-b border-out-var/60 py-2.5 px-6 md:px-10">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-head font-semibold text-muted">
          <Link href="/listings" className="hover:text-clay transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Browse Listings
          </Link>
          <span className="text-out-var">›</span>
          <span>{listing.location}</span>
          <span className="text-out-var">›</span>
          <span className="text-clay-dark font-bold">{listing.title}</span>
        </div>
      </div>

      {/* Sample listing banner */}
      {!isDbListing && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 md:px-10 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-base flex-shrink-0">info</span>
            <p className="text-xs font-head font-bold text-amber-800">
              Sample listing — this is a demo property used to showcase the platform. Real listings from verified landlords are coming soon.
            </p>
          </div>
        </div>
      )}

      {/* Gallery */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 mt-6 relative">
        {/* Gallery action buttons */}
        <div className="absolute top-4 right-10 md:right-16 z-10 flex items-center gap-2">
          <button
            onClick={handleShare}
            className="bg-white text-clay-dark font-head font-bold text-xs px-4 py-2.5 rounded-full shadow-xl border border-out-var flex items-center gap-2 hover:bg-cream transition-all"
          >
            <span className="material-symbols-outlined text-sm">{copyDone ? 'check' : 'ios_share'}</span>
            {copyDone ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={() => setLightboxIndex(0)}
            className="bg-white text-clay-dark font-head font-bold text-xs px-4 py-2.5 rounded-full shadow-xl border border-out-var flex items-center gap-2 hover:bg-cream transition-all"
          >
            <span className="material-symbols-outlined text-sm">photo_camera</span>
            All Photos ({PHOTOS.length})
          </button>
        </div>

        <div className="photo-gallery">
          <div className="hero-slot img-zoom cursor-pointer overflow-hidden relative" onClick={() => setLightboxIndex(0)}>
            {hasDbImages ? (
              <img src={PHOTOS[0].src} alt={PHOTOS[0].alt} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <Image src={PHOTOS[0].src} alt={PHOTOS[0].alt} fill className="object-cover" />
            )}
          </div>
          {PHOTOS.slice(1, 3).map((p, i) => (
            <div key={i} className="mini-slot img-zoom cursor-pointer overflow-hidden relative" onClick={() => setLightboxIndex(i + 1)}>
              {hasDbImages ? (
                <img src={p.src} alt={p.alt} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <Image src={p.src} alt={p.alt} fill className="object-cover" />
              )}
            </div>
          ))}
        </div>

        {/* Mobile thumbnail strip */}
        <div className="mobile-strip mt-3 gap-2 overflow-x-auto pb-1">
          {PHOTOS.slice(1).map((p, i) => (
            <div key={i} onClick={() => setLightboxIndex(i + 1)}
              className="flex-shrink-0 relative cursor-pointer rounded-xl overflow-hidden" style={{ width: 128, height: 80 }}>
              {hasDbImages ? (
                <img src={p.src} alt={p.alt} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <Image src={p.src} alt={p.alt} fill className="object-cover" />
              )}
              {i === PHOTOS.length - 2 && PHOTOS.length > 3 && (
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

              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="font-display text-4xl md:text-5xl font-light text-clay-dark leading-tight">{listing.title}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted font-body mb-6">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {listing.location}
                </span>
                {distanceInfo && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">school</span>
                    {distanceInfo.distanceMi} mi from {distanceInfo.university}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm fill text-amber-400">star</span>
                  New listing
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {[
                  { icon: 'bed',          label: `${listing.beds} Bedroom${listing.beds !== 1 ? 's' : ''}` },
                  { icon: 'bathtub',      label: `${listing.baths ?? 1} Bathroom${(listing.baths ?? 1) !== 1 ? 's' : ''}` },
                  ...(distanceInfo
                    ? [{ icon: 'directions_walk', label: `${distanceInfo.distanceMi} mi to ${distanceInfo.university}` }]
                    : []),
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
              <p className="font-body text-muted leading-relaxed">
                {listing.description || `A ${listing.beds}-bedroom, ${listing.baths ?? 1}-bath property in ${listing.location}. Contact the landlord for more details.`}
              </p>
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

            {/* Landlord Card — only for DB listings with profile data */}
            {resolvedProfile && (
              <>
                <LandlordCard
                  profile={resolvedProfile}
                  listingId={String(listing.id)}
                  currentUser={user}
                  listingType={listing.type}
                />
                <div className="divider mb-8" />
              </>
            )}

            {/* Location & Map */}
            <div className="mb-8 reveal">
              <h2 className="font-head text-xl font-bold text-clay-dark mb-4">Location</h2>
              <div className="rounded-2xl overflow-hidden border border-out-var/40 shadow-sm" style={{ height: 320 }}>
                <iframe
                  title="Property location"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}&origin=${encodeURIComponent(`${listing.title}, ${listing.location}`)}&destination=${encodeURIComponent(mapDestination)}&mode=walking`}
                />
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="material-symbols-outlined text-clay text-sm">school</span>
                {distanceInfo
                  ? <p className="text-xs font-body text-muted"><strong className="text-clay-dark font-semibold">{distanceInfo.distanceMi} mi</strong> walking distance to {distanceInfo.university}</p>
                  : <p className="text-xs font-body text-muted">Walking directions to nearby university</p>
                }
              </div>
            </div>

            <div className="divider mb-8" />

            {/* Group formation — only for group-formation listings */}
            {listing.type !== 'open' && (
              <div className="reveal bg-surf-lo rounded-3xl border border-out-var/40 p-6 mb-8">
                {(() => {
                  const groupIsFull = interestCount >= listing.beds
                  return (
                    <>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h2 className="font-head text-xl font-bold text-clay-dark mb-1">Group Formation</h2>
                          <p className="text-sm font-body text-muted">
                            {groupIsFull
                              ? 'Group is complete — time to apply!'
                              : `${interestCount} of ${listing.beds} spots filled — join to fill the house together.`}
                          </p>
                        </div>
                        <span className={`text-[10px] font-head font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${groupIsFull ? 'bg-green-100 text-green-700' : 'badge-open'}`}>
                          {groupIsFull ? 'Group Full ✓' : 'Forming Now'}
                        </span>
                      </div>
                      <div className="progress-track mb-2">
                        <div className="progress-fill" style={{ width: `${listing.beds > 0 ? Math.min(100, Math.round(100 * interestCount / listing.beds)) : 0}%` }} />
                      </div>
                      <p className="text-xs text-muted font-body mb-5">{interestCount} of {listing.beds} joined</p>
                      <div className="flex items-center gap-3 mb-6">
                        {interestedStudents.length > 0 ? (
                          <>
                            <div className="flex -space-x-2">
                              {interestedStudents.slice(0, 4).map((s) => (
                                <div key={s.id} className="w-9 h-9 rounded-full border-2 border-white clay-grad flex items-center justify-center text-xs font-head font-bold text-cream">
                                  {(s.first_name?.[0] ?? '') + (s.last_name?.[0] ?? '')}
                                </div>
                              ))}
                              {Array.from({ length: Math.max(0, Math.min(listing.beds, 3) - interestedStudents.slice(0, 4).length) }).map((_, i) => (
                                <div key={`empty-${i}`} className="w-9 h-9 rounded-full border-2 border-white bg-linen flex items-center justify-center text-xs font-head font-bold text-muted">?</div>
                              ))}
                            </div>
                            <span className="text-xs font-body text-muted">
                              {interestedStudents.length === 1
                                ? `${interestedStudents[0].first_name ?? 'Someone'} is looking for ${listing.beds - 1} more roommate${listing.beds - 1 !== 1 ? 's' : ''}`
                                : `${interestedStudents.length} people are forming this group`}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="flex -space-x-2">
                              {Array.from({ length: Math.min(listing.beds, 3) }).map((_, i) => (
                                <div key={`slot-${i}`} className="w-9 h-9 rounded-full border-2 border-white bg-linen flex items-center justify-center text-xs font-head font-bold text-muted">?</div>
                              ))}
                            </div>
                            <span className="text-xs font-body text-muted">Be the first to join this group!</span>
                          </>
                        )}
                      </div>
                      {/* CTA changes based on group state */}
                      {groupIsFull ? (
                        interested ? (
                          <button
                            onClick={() => setShowApply(true)}
                            className="w-full clay-grad text-white py-3 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-clay/20 flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">send</span>
                            Apply to Rent Now
                          </button>
                        ) : (
                          <div className="w-full text-center py-3 rounded-xl font-head font-semibold text-sm bg-linen text-muted border border-out-var/40">
                            This group is now full
                          </div>
                        )
                      ) : (
                        !interested && (
                          <button
                            onClick={() => setShowGroup(true)}
                            className="w-full clay-grad text-white py-3 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-clay/20"
                          >
                            Join This Group
                          </button>
                        )
                      )}
                      {!groupIsFull && interested && (
                        <div className="w-full text-center py-3 rounded-xl font-head font-semibold text-sm bg-green-50 text-green-700 border border-green-200 flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-sm fill">check_circle</span>
                          You're in the group — apply once all {listing.beds} spots are filled
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}

            {/* Verification pills */}
            <div className="reveal flex flex-wrap gap-3 mb-8">
              <div className="uni-badge">
                <div className="w-8 h-8 clay-grad rounded-full flex items-center justify-center">
                  <span className="text-cream font-head font-black text-xs">U</span>
                </div>
                <span>{distanceInfo ? `Verified ${distanceInfo.university} Listing` : 'UTenancy Verified Listing'}</span>
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
                    <p className="text-white/60 text-xs font-head font-bold uppercase tracking-widest mb-1">
                      {listing.type === 'open' ? 'Per Person' : 'Total Rent'}
                    </p>
                    <p className="font-display text-4xl font-light">${listing.price.toLocaleString()}<span className="text-lg font-body text-white/60">/mo</span></p>
                  </div>
                  {listing.type !== 'open' && (
                    <div className="text-right">
                      <p className="text-white/60 text-xs font-body">Per person</p>
                      <p className="font-head font-black text-xl">${perPerson.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse-dot" />
                  <span className="text-white/70 text-xs font-body">{interestCount} student{interestCount !== 1 ? 's' : ''} interested</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="p-6 space-y-3">
                {listing.type === 'open' ? (
                  user && user.user_metadata?.role !== 'landlord' && user.id !== (listing as any).landlord_id ? (
                    <MessageTenantButton listingId={String(listing.id)} userId={user.id} />
                  ) : !user ? (
                    <a href="/auth" className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">chat_bubble</span> Sign in to message tenant
                    </a>
                  ) : null
                ) : (
                  <>
                    {(() => {
                      const groupIsFull = interestCount >= listing.beds
                      const isMultiBed = listing.beds > 1

                      if (hasApplied) {
                        return (
                          <div className="w-full bg-green-50 border border-green-200 text-green-700 py-3.5 rounded-xl font-head font-semibold text-sm flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm fill">check_circle</span> Application Submitted
                          </div>
                        )
                      }

                      if (!isMultiBed) {
                        // 1-bedroom: always allow direct apply
                        return (
                          <button
                            onClick={() => setShowApply(true)}
                            className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/25 flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">send</span> Apply to Rent
                          </button>
                        )
                      }

                      // Multi-bedroom: group-gated apply
                      if (groupIsFull && interested) {
                        return (
                          <button
                            onClick={() => setShowApply(true)}
                            className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/25 flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">send</span> Apply to Rent
                          </button>
                        )
                      }

                      if (groupIsFull && !interested) {
                        return (
                          <div className="w-full bg-linen border border-out-var text-muted py-3.5 rounded-xl font-head font-semibold text-sm flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm">group_off</span> This group is full
                          </div>
                        )
                      }

                      if (interested) {
                        // In group, not yet full
                        return (
                          <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 py-3.5 rounded-xl font-head font-semibold text-sm flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm">hourglass_top</span>
                            Apply unlocks when full ({interestCount}/{listing.beds} spots)
                          </div>
                        )
                      }

                      // Not in group, not full — prompt to join
                      return (
                        <button
                          onClick={() => setShowGroup(true)}
                          className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/25 flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">group_add</span> Join Group to Apply
                        </button>
                      )
                    })()}

                    {/* Secondary: Join Group button (only for 1-bed listings or when already in group) */}
                    {listing.beds === 1 && (
                      <button
                        onClick={() => setShowGroup(true)}
                        className="w-full border-2 border-clay text-clay-dark font-head font-bold text-sm py-3.5 rounded-xl hover:bg-clay hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">group_add</span> Join Group Formation
                      </button>
                    )}

                    {user && user.user_metadata?.role !== 'landlord' ? (
                      <MessageLandlordButton listingId={String(listing.id)} userId={user.id} />
                    ) : !user ? (
                      <a href="/auth" className="w-full bg-surf text-muted font-head font-semibold text-sm py-3 rounded-xl hover:bg-linen transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm">chat_bubble</span> Sign in to message
                      </a>
                    ) : null}
                  </>
                )}
              </div>

              {/* Quick stats */}
              <div className="border-t border-out-var/40 px-6 py-4 space-y-3">
                {[
                  {
                    label: 'Available',
                    val: (listing as any).available_date
                      ? new Date((listing as any).available_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Now',
                  },
                  {
                    label: 'Lease term',
                    val: (listing as any).lease_term ?? '12 months',
                  },
                  {
                    label: 'Deposit',
                    val: (listing as any).deposit
                      ? `$${Number((listing as any).deposit).toLocaleString()}`
                      : `$${perPerson.toLocaleString()}`,
                  },
                  {
                    label: 'Utilities',
                    val: (listing as any).utilities ?? 'Tenant pays',
                  },
                  {
                    label: 'Pets',
                    val: (listing as any).pets_allowed ?? 'Negotiable',
                  },
                  {
                    label: 'Type',
                    val: listing.type === 'open' ? 'Open Room' : 'Group Formation',
                  },
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

              {/* Interest section — only for real DB listings with a saveable UUID */}
              {isDbListing && <div className="m-4 p-4 bg-surf-lo rounded-2xl border border-out-var">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-head font-bold text-clay-dark flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-clay">group</span>
                    {interestCount} student{interestCount !== 1 ? 's' : ''} interested
                  </p>
                  {interestCount > 0 && (
                    <button
                      onClick={() => setShowInterestedPanel(true)}
                      className="text-xs font-head font-bold text-clay hover:text-clay-dark transition-colors underline underline-offset-2"
                    >
                      See who
                    </button>
                  )}
                </div>

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
              </div>}
            </div>

            <p className="text-xs text-muted font-body text-center mt-4 leading-relaxed px-2">
              Never pay a deposit before signing a lease.{' '}
              <a href="#" className="text-clay font-semibold hover:underline">Report this listing</a>
            </p>
          </div>
        </div>

        {/* ─ SIMILAR LISTINGS ─ */}
        {similarListings.length > 0 && (
          <div className="mt-16 pt-10 border-t border-out-var/40 reveal">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-head text-2xl font-bold text-clay-dark">Similar listings nearby</h2>
                <p className="text-sm font-body text-muted mt-1">Other properties students are viewing</p>
              </div>
              <Link href="/#listings" className="text-sm font-head font-bold text-clay hover:text-clay-dark transition-colors flex items-center gap-1">
                View all <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
            <div className="flex lg:grid lg:grid-cols-3 gap-5 overflow-x-auto pb-2">
              {similarListings.map((sl) => (
                <SimilarListingCard key={sl.id} listing={sl} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Overlays */}
      {lightboxIndex !== null && <Lightbox index={lightboxIndex} onClose={() => setLightboxIndex(null)} photos={PHOTOS} />}
      {showApply  && <ApplicationModal listing={listing} user={user} onClose={() => { setShowApply(false) }} />}
      {showGroup  && <GroupModal listing={listing} user={user} onClose={() => setShowGroup(false)} />}

      {/* Action toast */}
      {actionToast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl font-head font-semibold text-sm transition-all ${actionToast.ok ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          <span className="material-symbols-outlined text-base fill">{actionToast.ok ? 'check_circle' : 'error'}</span>
          {actionToast.msg}
        </div>
      )}

      {/* Who's Interested panel */}
      {showInterestedPanel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(30,20,16,.55)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowInterestedPanel(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-out-var w-full max-w-sm p-7 relative"
            style={{ boxShadow: '0 40px 80px rgba(81,53,38,.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowInterestedPanel(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-outline hover:text-clay hover:bg-surf-lo transition-all"
            >
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
                    {/* Own row */}
                    {user && user.id === s.id && (
                      <span className="flex-shrink-0 text-[10px] font-body text-muted italic">You</span>
                    )}
                    {/* Student → message another student to form a group */}
                    {user && user.user_metadata?.role !== 'landlord' && user.id !== s.id && (
                      <button
                        onClick={() => handleMessageStudent(s.id)}
                        disabled={messagingStudent === s.id}
                        className="flex-shrink-0 flex items-center gap-1 text-xs font-head font-bold text-clay hover:text-clay-dark transition-colors disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-sm">chat_bubble</span>
                        {messagingStudent === s.id ? '…' : 'Message'}
                      </button>
                    )}
                    {/* Landlord → view student profile */}
                    {user && user.user_metadata?.role === 'landlord' && user.id !== s.id && (
                      <a
                        href={`/profile/${s.id}`}
                        className="flex-shrink-0 text-xs font-head font-bold text-clay hover:text-clay-dark transition-colors underline underline-offset-2"
                      >
                        View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {user && user.user_metadata?.role !== 'landlord' && (
              <p className="text-[11px] font-body text-muted text-center mt-4">
                Message other interested students to form a group together.
              </p>
            )}
            {user && user.user_metadata?.role === 'landlord' && (
              <p className="text-[11px] font-body text-muted text-center mt-4">
                Click &quot;View&quot; to see a student&apos;s profile.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
