'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Listing } from '@/lib/listings'
import { createClient } from '@/lib/supabase'
import { getDistancesToSchools, getDistanceToNearestSchool } from '@/lib/distance'

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

type GroupMember = {
  user_id: string
  profiles: { first_name: string | null; last_name: string | null } | null
}
type ApplicationGroup = {
  id: string
  name: string
  max_size: number
  created_by: string
  application_group_members: GroupMember[]
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

  const STEPS = ['About You', 'Financial', 'Preferences']

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

            {/* ── Step 2: Financial ── */}
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
function GroupModal({
  listing,
  user,
  onClose,
  onGroupJoined,
}: {
  listing: Listing
  user: any
  onClose: () => void
  onGroupJoined: (groupId: string, groupName: string, memberCount: number) => void
}) {
  const [groups, setGroups] = useState<ApplicationGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'create'>('list')
  const [groupName, setGroupName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ id: string; name: string } | null>(null)
  const [alreadyInGroupId, setAlreadyInGroupId] = useState<string | null>(null)

  // All hooks before early returns
  useEffect(() => {
    const supabase = createClient()
    const listingId = String(listing.id)
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('application_groups')
        .select('id, name, max_size, created_by, application_group_members(user_id, profiles(first_name, last_name))')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: true })
      const fetched = (data ?? []) as unknown as ApplicationGroup[]
      setGroups(fetched)
      if (user) {
        const mine = fetched.find((g) => g.application_group_members.some((m) => m.user_id === user.id))
        if (mine) setAlreadyInGroupId(mine.id)
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.id, user])

  const openGroups = groups.filter((g) => g.application_group_members.length < g.max_size)

  async function handleCreateGroup() {
    if (!user) { window.location.href = '/auth'; return }
    setSubmitting(true)
    setError(null)
    const supabase = createClient()
    const name = groupName.trim() || `Group ${String.fromCharCode(65 + groups.length)}`
    const { data: newGroup, error: groupErr } = await supabase
      .from('application_groups')
      .insert({ listing_id: String(listing.id), name, created_by: user.id, max_size: listing.beds })
      .select('id, name')
      .single()
    if (groupErr || !newGroup) {
      setError('Could not create group. Please try again.')
      setSubmitting(false)
      return
    }
    const { error: memberErr } = await supabase
      .from('application_group_members')
      .insert({ group_id: newGroup.id, user_id: user.id })
    setSubmitting(false)
    if (memberErr) {
      setError('Group created but could not add you as a member. Please try again.')
      return
    }
    setSuccess({ id: newGroup.id, name: newGroup.name })
    onGroupJoined(newGroup.id, newGroup.name, 1)
  }

  async function handleJoinGroup(g: ApplicationGroup) {
    if (!user) { window.location.href = '/auth'; return }
    setSubmitting(true)
    setError(null)
    const supabase = createClient()
    const { error: memberErr } = await supabase
      .from('application_group_members')
      .insert({ group_id: g.id, user_id: user.id })
    setSubmitting(false)
    if (memberErr) {
      setError(memberErr.message.includes('unique') ? "You're already in this group." : 'Could not join. Please try again.')
      return
    }
    setSuccess({ id: g.id, name: g.name })
    onGroupJoined(g.id, g.name, g.application_group_members.length + 1)
  }

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ maxWidth: 500 }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-clay transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* ── Already in a group ── */}
        {alreadyInGroupId && !success && (() => {
          const myG = groups.find((g) => g.id === alreadyInGroupId)
          const memberCount = myG?.application_group_members.length ?? 1
          return (
            <div className="text-center py-6">
              <div className="check-circle mx-auto mb-4">
                <span className="material-symbols-outlined text-white text-3xl fill">group</span>
              </div>
              <h3 className="font-display text-2xl font-light text-clay-dark mb-2">You're <em>already in a group!</em></h3>
              <p className="text-sm font-body text-muted mb-1">
                You're in <strong className="text-clay-dark">{myG?.name ?? 'a group'}</strong> — {memberCount} of {myG?.max_size ?? listing.beds} spots filled.
              </p>
              <p className="text-sm font-body text-muted">Share the listing with friends to fill remaining spots — once full, you can apply together.</p>
              <button onClick={onClose} className="mt-5 clay-grad text-white px-6 py-2.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all">Got it</button>
            </div>
          )
        })()}

        {/* ── Success state ── */}
        {success && (
          <div className="text-center py-6">
            <div className="check-circle mx-auto mb-4">
              <span className="material-symbols-outlined text-white text-3xl fill">group</span>
            </div>
            <h3 className="font-display text-2xl font-light text-clay-dark mb-2">You're <em>in!</em></h3>
            <p className="text-sm font-body text-muted">
              You joined <strong className="text-clay-dark">{success.name}</strong>. Share this listing with your friends so they can join your group too.
            </p>
            <button onClick={onClose} className="mt-5 clay-grad text-white px-6 py-2.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all">Done</button>
          </div>
        )}

        {/* ── Loading ── */}
        {!alreadyInGroupId && !success && loading && (
          <div className="text-center py-10">
            <div className="flex justify-center mb-3"><span className="spinner" /></div>
            <p className="text-sm font-body text-muted">Loading groups…</p>
          </div>
        )}

        {/* ── Main: list / create views ── */}
        {!alreadyInGroupId && !success && !loading && (
          <>
            {view === 'list' && (
              <>
                <h3 className="font-display text-2xl font-light text-clay-dark mb-1">Join Group to Apply</h3>
                <p className="text-sm font-body text-muted mb-5">
                  {openGroups.length > 0
                    ? 'Join an existing group or start a new one.'
                    : `No groups yet — be the first to start one for this ${listing.beds}-bed listing.`}
                </p>

                {!user && (
                  <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-body text-amber-800">
                    Sign in to join or create a group. <a href="/auth" className="font-bold underline">Sign in</a>
                  </div>
                )}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200 text-xs font-body text-red-700">{error}</div>
                )}

                {/* Existing open groups */}
                {openGroups.length > 0 && (
                  <div className="space-y-3 mb-5">
                    {openGroups.map((g) => {
                      const memberCount = g.application_group_members.length
                      const spotsLeft = g.max_size - memberCount
                      const initials = g.application_group_members.slice(0, 3).map((m) =>
                        ((m.profiles?.first_name?.[0] ?? '') + (m.profiles?.last_name?.[0] ?? '')).toUpperCase() || '?'
                      )
                      return (
                        <div key={g.id} className="flex items-center justify-between gap-3 p-4 bg-surf rounded-2xl border border-out-var/60 hover:border-clay/30 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex -space-x-1.5 flex-shrink-0">
                              {initials.map((init, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white clay-grad flex items-center justify-center text-[10px] font-head font-bold text-white">
                                  {init}
                                </div>
                              ))}
                              {Array.from({ length: Math.max(0, Math.min(spotsLeft, 3 - initials.length)) }).map((_, i) => (
                                <div key={`e-${i}`} className="w-8 h-8 rounded-full border-2 border-white bg-linen flex items-center justify-center text-[10px] font-head font-bold text-muted">?</div>
                              ))}
                            </div>
                            <div className="min-w-0">
                              <p className="font-head font-bold text-clay-dark text-sm truncate">{g.name}</p>
                              <p className="text-xs font-body text-muted">{memberCount}/{g.max_size} filled · {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleJoinGroup(g)}
                            disabled={submitting || !user}
                            className="flex-shrink-0 clay-grad text-white text-xs font-head font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-1.5"
                          >
                            {submitting ? <span className="spinner" /> : <span className="material-symbols-outlined text-xs">group_add</span>}
                            Join
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Full groups (informational) */}
                {groups.length > openGroups.length && (
                  <p className="text-xs font-body text-muted mb-4">
                    {groups.length - openGroups.length} group{groups.length - openGroups.length !== 1 ? 's are' : ' is'} already full.
                  </p>
                )}

                <button
                  onClick={() => { setView('create'); setError(null) }}
                  disabled={!user}
                  className={`w-full py-3 rounded-xl font-head font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
                    openGroups.length > 0
                      ? 'border-2 border-clay text-clay-dark hover:bg-clay/5'
                      : 'clay-grad text-white hover:opacity-90 shadow-lg shadow-clay/25'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  {openGroups.length > 0 ? 'Create a New Group' : 'Start the First Group'}
                </button>
              </>
            )}

            {view === 'create' && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => { setView('list'); setError(null) }} className="text-muted hover:text-clay transition-colors">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                  </button>
                  <h3 className="font-display text-2xl font-light text-clay-dark">Create a Group</h3>
                </div>
                <p className="text-sm font-body text-muted mb-5">
                  Name your group (optional). Friends can see it and join you from this listing page.
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200 text-xs font-body text-red-700">{error}</div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="form-label">Group Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder={`e.g. "Group ${String.fromCharCode(65 + groups.length)}" (auto-set if blank)`}
                      maxLength={50}
                    />
                  </div>
                  <div className="p-3 bg-linen rounded-xl text-xs font-body text-muted flex items-start gap-2">
                    <span className="material-symbols-outlined text-clay text-sm flex-shrink-0 mt-0.5">info</span>
                    <span>You'll be the founding member. You need <strong>{listing.beds} people total</strong> to unlock the group application.</span>
                  </div>
                  <button
                    onClick={handleCreateGroup}
                    disabled={submitting}
                    className="clay-grad w-full text-white py-3 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting
                      ? <><span className="spinner" /> Creating…</>
                      : <><span className="material-symbols-outlined text-sm">group_add</span> Create Group &amp; Join</>}
                  </button>
                </div>
              </>
            )}
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
  const [myGroup, setMyGroup] = useState<{ id: string; name: string; memberCount: number } | null>(null)
  const [listingGroups, setListingGroups] = useState<ApplicationGroup[]>([])
  const [copyDone, setCopyDone] = useState(false)
  const [actionToast, setActionToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [schoolDistances, setSchoolDistances] = useState<Array<{ slug: string; short: string; name: string; distanceMi: number }>>([])
  const [selectedSchoolIdx, setSelectedSchoolIdx] = useState(0)
  // Legacy single-school fallback (for mock listings that have distanceMi/university pre-set)
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

  // Compute distances to target schools for DB listings
  useEffect(() => {
    const targetSchools = (listing as any).target_schools as string[] | undefined
    if (!listing.title || !listing.location) return

    const [city] = listing.location.split(',').map((s: string) => s.trim())

    if (targetSchools && targetSchools.length > 0) {
      // Multi-school mode: compute distances to all selected schools
      getDistancesToSchools(listing.title, city, targetSchools).then((results) => {
        if (results.length > 0) {
          setSchoolDistances(results)
          setSelectedSchoolIdx(0)
          // Also set legacy distanceInfo for the stats card
          setDistanceInfo({ distanceMi: results[0].distanceMi, university: results[0].short })
        }
      })
    } else if (!distanceInfo && listing.title && listing.location) {
      // Fallback: find nearest university (legacy / mock listings)
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

      // Load application groups for this listing
      if (isDbListing) {
        const { data: groupData } = await supabase
          .from('application_groups')
          .select('id, name, max_size, created_by, application_group_members(user_id, profiles(first_name, last_name))')
          .eq('listing_id', String(listing.id))
          .order('created_at', { ascending: true })
        const fetched = (groupData ?? []) as unknown as ApplicationGroup[]
        setListingGroups(fetched)
        if (u) {
          const mine = fetched.find((g) => g.application_group_members.some((m) => m.user_id === u.id))
          if (mine) {
            setMyGroup({ id: mine.id, name: mine.name, memberCount: mine.application_group_members.length })
          }
        }
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

  function handleGroupJoined(groupId: string, groupName: string, memberCount: number) {
    setMyGroup({ id: groupId, name: groupName, memberCount })
    // Update the local listingGroups state so the left column reflects immediately
    setListingGroups((prev) => {
      const existing = prev.find((g) => g.id === groupId)
      if (existing) {
        return prev.map((g) =>
          g.id === groupId
            ? { ...g, application_group_members: [...g.application_group_members, { user_id: user?.id ?? '', profiles: null }] }
            : g
        )
      }
      // New group just created
      return [...prev, {
        id: groupId,
        name: groupName,
        max_size: listing.beds,
        created_by: user?.id ?? '',
        application_group_members: [{ user_id: user?.id ?? '', profiles: null }],
      }]
    })
    setShowGroup(false)
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

  // Determine which school the map points to
  const activeSchool = schoolDistances.length > 0 ? schoolDistances[selectedSchoolIdx] : null
  const mapDestination = activeSchool
    ? `${activeSchool.name}, Los Angeles, CA`
    : distanceInfo?.university
      ? `${distanceInfo.university}, Los Angeles, CA`
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
                {schoolDistances.length > 0 ? (
                  schoolDistances.map((s) => (
                    <span key={s.slug} className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">school</span>
                      {s.distanceMi} mi from {s.short}
                    </span>
                  ))
                ) : distanceInfo && (
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
                  { icon: 'bed',     label: `${listing.beds} Bedroom${listing.beds !== 1 ? 's' : ''}` },
                  { icon: 'bathtub', label: `${listing.baths ?? 1} Bathroom${(listing.baths ?? 1) !== 1 ? 's' : ''}` },
                ].map(({ icon, label }) => (
                  <div key={icon} className="stat-card">
                    <span className="material-symbols-outlined text-clay text-xl">{icon}</span>
                    <span className="text-xs font-head font-bold text-clay-dark">{label}</span>
                  </div>
                ))}
                {schoolDistances.length > 0
                  ? schoolDistances.map((s) => (
                    <div key={s.slug} className="stat-card">
                      <span className="material-symbols-outlined text-clay text-xl">directions_walk</span>
                      <span className="text-xs font-head font-bold text-clay-dark">{s.distanceMi} mi to {s.short}</span>
                    </div>
                  ))
                  : distanceInfo && (
                    <div className="stat-card">
                      <span className="material-symbols-outlined text-clay text-xl">directions_walk</span>
                      <span className="text-xs font-head font-bold text-clay-dark">{distanceInfo.distanceMi} mi to {distanceInfo.university}</span>
                    </div>
                  )
                }
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

              {/* School selector tabs — shown when listing has target schools */}
              {schoolDistances.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-3">
                  {schoolDistances.map((school, idx) => (
                    <button
                      key={school.slug}
                      type="button"
                      onClick={() => setSelectedSchoolIdx(idx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-head font-semibold border transition-all
                        ${selectedSchoolIdx === idx
                          ? 'clay-grad text-white border-transparent shadow-sm'
                          : 'bg-white border-out-var text-muted hover:border-clay/50 hover:text-clay-dark'}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>school</span>
                      {school.short}
                      <span className={`ml-0.5 ${selectedSchoolIdx === idx ? 'text-white/80' : 'text-clay'}`}>
                        {school.distanceMi} mi
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="rounded-2xl overflow-hidden border border-out-var/40 shadow-sm" style={{ height: 320 }}>
                <iframe
                  key={mapDestination}
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
                {activeSchool
                  ? <p className="text-xs font-body text-muted"><strong className="text-clay-dark font-semibold">{activeSchool.distanceMi} mi</strong> walking distance to {activeSchool.name}</p>
                  : distanceInfo
                    ? <p className="text-xs font-body text-muted"><strong className="text-clay-dark font-semibold">{distanceInfo.distanceMi} mi</strong> walking distance to {distanceInfo.university}</p>
                    : <p className="text-xs font-body text-muted">Walking directions to nearby university</p>
                }
              </div>
            </div>

            <div className="divider mb-8" />

            {/* Group formation — only for group-formation listings */}
            {listing.type !== 'open' && (
              <div className="reveal bg-surf-lo rounded-3xl border border-out-var/40 p-6 mb-8">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="font-head text-xl font-bold text-clay-dark mb-1">Group Formation</h2>
                    <p className="text-sm font-body text-muted">
                      {listingGroups.length > 0
                        ? `${listingGroups.length} group${listingGroups.length !== 1 ? 's' : ''} forming for this ${listing.beds}-bed listing.`
                        : `Looking for ${listing.beds} people to apply together — start or join a group!`}
                    </p>
                  </div>
                  <span className="text-[10px] font-head font-bold px-3 py-1.5 rounded-full whitespace-nowrap badge-open">
                    {listingGroups.length > 0 ? `${listingGroups.length} Active` : 'Open'}
                  </span>
                </div>

                {/* List of groups */}
                {listingGroups.length > 0 ? (
                  <div className="space-y-3 mb-5">
                    {listingGroups.map((g) => {
                      const memberCount = g.application_group_members.length
                      const isFull = memberCount >= g.max_size
                      const isMyGroup = myGroup?.id === g.id
                      const initials = g.application_group_members.slice(0, 4).map((m) =>
                        ((m.profiles?.first_name?.[0] ?? '') + (m.profiles?.last_name?.[0] ?? '')).toUpperCase() || '?'
                      )
                      return (
                        <div key={g.id} className={`p-4 rounded-2xl border transition-all ${isMyGroup ? 'bg-green-50 border-green-200' : 'bg-white border-out-var/60'}`}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex -space-x-1.5 flex-shrink-0">
                                {initials.map((init, i) => (
                                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white clay-grad flex items-center justify-center text-[10px] font-head font-bold text-white">
                                    {init}
                                  </div>
                                ))}
                                {!isFull && Array.from({ length: Math.max(0, Math.min(g.max_size - memberCount, 3 - initials.length)) }).map((_, i) => (
                                  <div key={`e-${i}`} className="w-8 h-8 rounded-full border-2 border-white bg-linen flex items-center justify-center text-[10px] font-head font-bold text-muted">?</div>
                                ))}
                              </div>
                              <div className="min-w-0">
                                <p className="font-head font-bold text-clay-dark text-sm truncate flex items-center gap-1.5">
                                  {g.name}
                                  {isMyGroup && <span className="material-symbols-outlined fill text-green-600 text-sm">check_circle</span>}
                                </p>
                                <p className="text-xs font-body text-muted">
                                  {memberCount}/{g.max_size} {isFull ? '— Full' : `— ${g.max_size - memberCount} spot${g.max_size - memberCount !== 1 ? 's' : ''} left`}
                                </p>
                              </div>
                            </div>
                            {isMyGroup ? (
                              <span className="flex-shrink-0 text-xs font-head font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-xl">Your group</span>
                            ) : isFull ? (
                              <span className="flex-shrink-0 text-xs font-head font-semibold text-muted">Full</span>
                            ) : (
                              <button
                                onClick={() => setShowGroup(true)}
                                className="flex-shrink-0 clay-grad text-white text-xs font-head font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-all flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-xs">group_add</span> Join
                              </button>
                            )}
                          </div>
                          {isMyGroup && !isFull && (
                            <p className="text-xs font-body text-green-700 mt-2 ml-1">
                              Share this listing with {g.max_size - memberCount} more friend{g.max_size - memberCount !== 1 ? 's' : ''} to unlock the group application!
                            </p>
                          )}
                          {isMyGroup && isFull && (
                            <button
                              onClick={() => setShowApply(true)}
                              className="mt-3 w-full clay-grad text-white py-2.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                            >
                              <span className="material-symbols-outlined text-sm">send</span> Apply to Rent Now
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex -space-x-2">
                      {Array.from({ length: Math.min(listing.beds, 3) }).map((_, i) => (
                        <div key={`slot-${i}`} className="w-9 h-9 rounded-full border-2 border-white bg-linen flex items-center justify-center text-xs font-head font-bold text-muted">?</div>
                      ))}
                    </div>
                    <span className="text-xs font-body text-muted">No groups yet — be the first!</span>
                  </div>
                )}

                {/* CTA: start or join */}
                {!myGroup && (
                  <button
                    onClick={() => setShowGroup(true)}
                    className="w-full clay-grad text-white py-3 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-clay/20 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">{listingGroups.some((g) => g.application_group_members.length < g.max_size) ? 'group_add' : 'add_circle'}</span>
                    {listingGroups.some((g) => g.application_group_members.length < g.max_size) ? 'Join or Create a Group' : 'Start a New Group'}
                  </button>
                )}
              </div>
            )}

            {/* Verification pills */}
            <div className="reveal flex flex-wrap gap-3 mb-8">
              <div className="uni-badge">
                <div className="w-8 h-8 clay-grad rounded-full flex items-center justify-center">
                  <span className="text-cream font-head font-black text-xs">U</span>
                </div>
                <span>{activeSchool ? `Verified ${activeSchool.short} Listing` : distanceInfo ? `Verified ${distanceInfo.university} Listing` : 'UTenancy Verified Listing'}</span>
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
                      const isMultiBed = listing.beds > 1
                      const myGroupFull = myGroup ? myGroup.memberCount >= listing.beds : false

                      if (hasApplied) {
                        return (
                          <div className="w-full bg-green-50 border border-green-200 text-green-700 py-3.5 rounded-xl font-head font-semibold text-sm flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm fill">check_circle</span> Application Submitted
                          </div>
                        )
                      }

                      if (!isMultiBed) {
                        // 1-bedroom: direct apply
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
                      if (myGroup && myGroupFull) {
                        return (
                          <button
                            onClick={() => setShowApply(true)}
                            className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/25 flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">send</span> Apply to Rent
                          </button>
                        )
                      }

                      if (myGroup && !myGroupFull) {
                        // In a group, waiting for more members
                        return (
                          <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 py-3.5 rounded-xl font-head font-semibold text-sm flex flex-col items-center justify-center gap-1 px-3">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">hourglass_top</span>
                              <span>{myGroup.name} — {myGroup.memberCount}/{listing.beds} members</span>
                            </div>
                            <span className="text-xs opacity-80">Apply unlocks when your group is full</span>
                          </div>
                        )
                      }

                      // Not in any group — prompt to join or create
                      return (
                        <button
                          onClick={() => setShowGroup(true)}
                          className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/25 flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">group_add</span>
                          {listingGroups.filter((g) => g.application_group_members.length < g.max_size).length > 0
                            ? 'Join or Create Group'
                            : 'Join Group to Apply'}
                        </button>
                      )
                    })()}

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
                  <span>{listing.type === 'open' ? 'Student identity verified by UTenancy' : 'Landlord identity & property verified by UTenancy'}</span>
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
      {showGroup  && <GroupModal listing={listing} user={user} onClose={() => setShowGroup(false)} onGroupJoined={handleGroupJoined} />}

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
