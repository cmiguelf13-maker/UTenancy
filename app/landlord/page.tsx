'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Listing } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

/* ─── Types ─────────────────────────────────────── */
type ListingStatus = 'active' | 'draft'

/* ─── Status badge ───────────────────────────────── */
const STATUS_CONFIG: Record<ListingStatus, { label: string; bg: string; dot: string }> = {
  active:  { label: 'Active',  bg: 'bg-green-50 text-green-700 border border-green-200',  dot: 'bg-green-500' },
  draft:   { label: 'Draft',   bg: 'bg-stone-100 text-stone-500 border border-stone-200', dot: 'bg-stone-400' },
}

function StatusBadge({ status }: { status: ListingStatus }) {
  const c = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-head font-bold ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

/* ─── Stat card ──────────────────────────────────── */
function StatCard({ icon, value, label, sub }: { icon: string; value: string | number; label: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-out-var p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 clay-grad rounded-xl flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined fill text-white text-lg">{icon}</span>
        </div>
      </div>
      <p className="font-display text-3xl font-light text-clay-dark italic">{value}</p>
      <p className="text-sm font-head font-semibold text-espresso mt-0.5">{label}</p>
      {sub && <p className="text-xs font-body text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

/* ─── Listing card ───────────────────────────────── */
function ListingCard({ listing, onDelete, onReview }: { listing: Listing; onDelete: (id: string) => void; onReview: (l: Listing) => void }) {
  const typeLabel = listing.type === 'open-room' ? 'Open Room' : 'Group Formation'
  const typeBg    = listing.type === 'open-room' ? 'bg-terra/90' : 'bg-clay/90'
  const interestCount = Array.isArray(listing.interest_count) ? (listing.interest_count[0]?.count ?? 0) : (listing.interest_count ?? 0)

  return (
    <div className="bg-white rounded-2xl border border-out-var shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        {listing.images && listing.images.length > 0 ? (
          <img src={listing.images[0]} alt={listing.address} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-linen to-surf-lo flex items-center justify-center">
            <span className="material-symbols-outlined text-out-var text-6xl">home</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className={`absolute top-3 left-3 ${typeBg} text-white text-[10px] font-head font-bold px-2.5 py-1 rounded-full`}>
          {typeLabel}
        </span>
        <div className="absolute bottom-3 left-3">
          <StatusBadge status={listing.status as ListingStatus} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3">
          <p className="font-head font-bold text-clay-dark text-sm leading-tight">{listing.address}{listing.unit ? `, ${listing.unit}` : ''}</p>
          <p className="text-xs font-body text-muted">{listing.city}</p>
        </div>

        <div className="flex items-center gap-3 text-xs font-body text-muted mb-3">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-terra">bed</span> {listing.bedrooms} bed
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-terra">bathtub</span> {listing.bathrooms} bath
          </span>
          <span className="flex items-center gap-1 ml-auto font-head font-black text-clay-dark text-sm">
            ${listing.rent.toLocaleString()}<span className="font-normal text-muted text-xs">/mo</span>
          </span>
        </div>

        {/* Applicants */}
        <div className="flex items-center gap-1.5 mb-4 bg-surf-lo rounded-xl px-3 py-2">
          <span className="material-symbols-outlined text-clay text-base">group</span>
          <span className="text-xs font-head font-semibold text-clay-dark">
            {interestCount === 0 ? 'No applicants yet' : `${interestCount} applicant${interestCount !== 1 ? 's' : ''}`}
          </span>
          {interestCount > 0 && (
            <button onClick={() => onReview(listing)} className="ml-auto text-xs font-head font-bold text-clay hover:text-clay-dark transition-colors">
              Review →
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-head font-semibold text-clay-dark border border-out-var rounded-lg py-2 hover:border-clay/40 hover:bg-surf-lo transition-all">
            <span className="material-symbols-outlined text-sm">edit</span> Edit
          </button>
          <a href={`/listings/${listing.id}`} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-head font-semibold text-clay-dark border border-out-var rounded-lg py-2 hover:border-clay/40 hover:bg-surf-lo transition-all">
            <span className="material-symbols-outlined text-sm">visibility</span> Preview
          </a>
          <button onClick={() => onDelete(listing.id)} className="flex items-center justify-center text-xs font-head font-semibold text-red-500 border border-red-100 rounded-lg px-3 py-2 hover:bg-red-50 transition-all">
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main portal page ───────────────────────────── */
export default function LandlordPortal() {
  const router   = useRouter()
  const supabase = createClient()

  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<'all' | ListingStatus>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [listings, setListings] = useState<Listing[]>([])
  const [listingType, setListingType] = useState<'open-room' | 'group-formation'>('open-room')
  const [reviewListing, setReviewListing] = useState<Listing | null>(null)
  const [applicants, setApplicants] = useState<Array<{ id: string; first_name: string; last_name: string; university: string | null; bio: string | null }>>([])
  const [loadingApplicants, setLoadingApplicants] = useState(false)
  const [savingListing, setSavingListing] = useState(false)
  const [photoStatus, setPhotoStatus] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<string[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      if (!u) { router.push('/auth'); return }
      if (u.user_metadata?.role !== 'landlord') { router.push('/'); return }
      setUser(u)

      // Fetch listings for this landlord
      supabase
        .from('listings')
        .select('*, interest_count:listing_interests(count)')
        .eq('landlord_id', u.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setListings(data)
          setLoading(false)
        })
    })
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setSelectedFiles(files)
    // Generate previews
    const previews = files.map((f) => URL.createObjectURL(f))
    setFilePreviews(previews)
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleAddListing(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const form = e.target as HTMLFormElement
    const address = (form.elements.namedItem('address') as HTMLInputElement).value.trim()
    const city = (form.elements.namedItem('city') as HTMLInputElement).value.trim()
    const unit = (form.elements.namedItem('unit') as HTMLInputElement).value.trim()
    const bedrooms = parseInt((form.elements.namedItem('bedrooms') as HTMLInputElement).value)
    const bathrooms = parseFloat((form.elements.namedItem('bathrooms') as HTMLInputElement).value)
    const rent = parseInt((form.elements.namedItem('rent') as HTMLInputElement).value)

    // Determine if listing is complete or should be a draft
    const hasPhotos = selectedFiles.length > 0
    const hasRequiredFields = !!(address && city && rent && !isNaN(bedrooms) && !isNaN(bathrooms))
    const isDraft = !hasPhotos || !hasRequiredFields

    if (!address && !city) return // need at least something to save

    setSavingListing(true)
    setPhotoStatus(isDraft ? 'Saving as draft…' : 'Saving listing…')

    const { data, error } = await supabase
      .from('listings')
      .insert({
        landlord_id: user.id,
        address: address || 'Untitled',
        city: city || '',
        unit: unit || null,
        bedrooms: isNaN(bedrooms) ? 0 : bedrooms,
        bathrooms: isNaN(bathrooms) ? 0 : bathrooms,
        rent: isNaN(rent) ? 0 : rent,
        type: listingType,
        status: isDraft ? 'draft' : 'active',
        images: [],
      })
      .select()
      .single()

    if (!error && data) {
      setListings((prev) => [data, ...prev])

      // Upload landlord photos if any
      if (selectedFiles.length > 0) {
        setPhotoStatus(`Uploading ${selectedFiles.length} photo${selectedFiles.length > 1 ? 's' : ''}…`)
        const uploadedUrls: string[] = []

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          const ext = file.name.split('.').pop() ?? 'jpg'
          const path = `${data.id}/${Date.now()}_${i}.${ext}`

          const { error: uploadErr } = await supabase.storage
            .from('listing-images')
            .upload(path, file, { cacheControl: '3600', upsert: false })

          if (!uploadErr) {
            const { data: urlData } = supabase.storage
              .from('listing-images')
              .getPublicUrl(path)
            uploadedUrls.push(urlData.publicUrl)
          }
        }

        if (uploadedUrls.length > 0) {
          const { data: updated } = await supabase
            .from('listings')
            .update({ images: uploadedUrls })
            .eq('id', data.id)
            .select()
            .single()

          if (updated) {
            setListings((prev) =>
              prev.map((l) => (l.id === data.id ? updated : l)),
            )
          }
          setPhotoStatus(`Uploaded ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''}!`)
        }
      }

      setPhotoStatus(isDraft
        ? 'Saved as draft — add photos and complete all fields to publish.'
        : 'Listing published!')

      // Close modal after a brief delay
      setTimeout(() => {
        setShowAddModal(false)
        setSavingListing(false)
        setPhotoStatus(null)
        setSelectedFiles([])
        setFilePreviews([])
        form.reset()
        setListingType('open-room')
      }, 2000)
    } else {
      setSavingListing(false)
      setPhotoStatus(null)
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('listings').delete().eq('id', id)
    setListings((prev) => prev.filter((l) => l.id !== id))
  }

  async function handleReview(listing: Listing) {
    setReviewListing(listing)
    setApplicants([])
    setLoadingApplicants(true)
    const { data } = await supabase
      .from('listing_interests')
      .select('profile:profiles(id, first_name, last_name, university, bio)')
      .eq('listing_id', listing.id)
    if (data) {
      setApplicants(data.map((r: any) => r.profile).filter(Boolean))
    }
    setLoadingApplicants(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <span className="spinner" style={{ borderColor: 'rgba(107,76,59,.2)', borderTopColor: '#6b4c3b', width: 32, height: 32 }} />
    </div>
  )

  const firstName = user?.user_metadata?.first_name ?? 'Landlord'
  const company   = user?.user_metadata?.company

  const filteredListings = filter === 'all' ? listings : listings.filter((l) => l.status === filter)
  const totalApplicants = listings.reduce((s, l) => s + (Array.isArray(l.interest_count) ? (l.interest_count[0]?.count ?? 0) : (l.interest_count ?? 0)), 0)
  const activeCount = listings.filter((l) => l.status === 'active').length
  const draftCount = listings.filter((l) => l.status === 'draft').length

  return (
    <div className="min-h-screen bg-cream">

      {/* ── LANDLORD TOPBAR ── */}
      <header className="sticky top-0 z-50 glass border-b border-out-var/20">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-3 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 clay-grad rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white font-head font-black text-sm leading-none">U</span>
            </div>
            <div>
              <span className="font-head font-black text-lg text-clay-dark tracking-tight leading-none">Tenancy</span>
              <span className="block text-[10px] font-head font-bold text-terra uppercase tracking-widest leading-none">Landlord Portal</span>
            </div>
          </div>

          {/* Centre actions */}
          <div className="hidden md:flex items-center gap-1 bg-surf-hi border border-out-var rounded-full px-1 py-1">
            {(['all', 'active', 'draft'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-head font-bold capitalize transition-all
                  ${filter === f ? 'clay-grad text-white shadow-sm' : 'text-muted hover:text-clay-dark'}`}>
                {f === 'all' ? 'All Listings' : f}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Messages */}
            <Link href="/messages"
              className="hidden md:flex items-center gap-1.5 text-sm font-head font-semibold text-muted hover:text-clay transition-colors px-3 py-2 rounded-full hover:bg-linen">
              <span className="material-symbols-outlined text-base">chat</span>
              Messages
            </Link>
            {/* View public site */}
            <Link href="/"
              className="hidden md:flex items-center gap-1.5 text-sm font-head font-semibold text-muted hover:text-clay transition-colors px-3 py-2 rounded-full hover:bg-linen">
              <span className="material-symbols-outlined text-base">open_in_new</span>
              View Site
            </Link>
            {/* Add listing button */}
            <button onClick={() => setShowAddModal(true)}
              className="clay-grad text-white px-4 py-2 rounded-full font-head text-sm font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">add</span>
              Add Listing
            </button>
            {/* Avatar */}
            <div className="flex items-center gap-2 bg-white border border-out-var rounded-full pl-1 pr-3 py-1">
              <div className="w-7 h-7 clay-grad rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-head font-black text-xs">
                  {firstName[0]?.toUpperCase() ?? 'L'}
                </span>
              </div>
              <span className="text-sm font-head font-semibold text-clay-dark hidden md:block">{firstName}</span>
            </div>
          </div>

        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-8">

        {/* Welcome row */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-light text-clay-dark leading-tight">
              Good morning, <em>{firstName}</em>.
            </h1>
            {company && <p className="text-sm font-body text-muted mt-1">{company}</p>}
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="hidden md:flex items-center gap-2 text-sm font-head font-semibold text-muted hover:text-clay transition-colors">
            <span className="material-symbols-outlined text-base">add_circle</span>
            New listing
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon="home_work"   value={listings.length} label="Total Properties"  sub="Across all statuses" />
          <StatCard icon="check_circle" value={activeCount}          label="Active Listings"   sub="Visible to students" />
          <StatCard icon="group"        value={totalApplicants}      label="Total Applicants"  sub="Awaiting your review" />
          <StatCard icon="edit_note"     value={draftCount}           label="Drafts"            sub="Incomplete listings" />
        </div>

        {/* Section heading */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-head font-bold text-clay-dark text-lg">
            {filter === 'all' ? 'All Properties' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Listings`}
            <span className="ml-2 text-sm font-normal text-muted">({filteredListings.length})</span>
          </h2>
          {/* Mobile filter */}
          <div className="flex md:hidden gap-1 overflow-x-auto">
            {(['all', 'active', 'draft'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-head font-bold capitalize whitespace-nowrap transition-all
                  ${filter === f ? 'clay-grad text-white' : 'bg-white border border-out-var text-muted'}`}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Listing grid */}
        {filteredListings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-linen rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-clay text-3xl">home_work</span>
            </div>
            <p className="font-head font-bold text-clay-dark mb-1">No listings here yet</p>
            <p className="text-sm font-body text-muted">Add your first property to get started.</p>
            <button onClick={() => setShowAddModal(true)}
              className="mt-5 clay-grad text-white px-6 py-2.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/20">
              + Add Listing
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredListings.map((l) => <ListingCard key={l.id} listing={l} onDelete={handleDelete} onReview={handleReview} />)}
          </div>
        )}

      </main>

      {/* ── APPLICANTS REVIEW MODAL ── */}
      {reviewListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(30,20,16,.55)', backdropFilter: 'blur(6px)' }}
          onClick={() => setReviewListing(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-out-var w-full max-w-md p-8 relative"
            style={{ boxShadow: '0 40px 80px rgba(81,53,38,.18)' }}
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setReviewListing(null)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-outline hover:text-clay hover:bg-surf-lo transition-all">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 clay-grad rounded-xl flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined fill text-white text-xl">group</span>
              </div>
              <div>
                <h2 className="font-head font-bold text-clay-dark">Interested Students</h2>
                <p className="text-xs font-body text-muted truncate max-w-[220px]">{reviewListing.address}</p>
              </div>
            </div>

            {loadingApplicants ? (
              <div className="flex justify-center py-10">
                <span className="spinner" style={{ borderColor: 'rgba(107,76,59,.2)', borderTopColor: '#6b4c3b', width: 28, height: 28 }} />
              </div>
            ) : applicants.length === 0 ? (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-out-var text-4xl">group_off</span>
                <p className="text-sm font-body text-muted mt-2">No students have expressed interest yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {applicants.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-4 bg-surf-lo rounded-2xl border border-out-var/30">
                    <div className="w-11 h-11 rounded-full flex-shrink-0 border border-out-var clay-grad flex items-center justify-center">
                      <span className="text-white font-head font-black text-xs">{(a.first_name?.[0] ?? '') + (a.last_name?.[0] ?? '')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-head font-bold text-clay-dark">{a.first_name} {a.last_name}</p>
                      {a.university && <p className="text-xs font-body text-muted">{a.university}</p>}
                      {a.bio && <p className="text-xs font-body text-muted mt-0.5 truncate">{a.bio}</p>}
                    </div>
                    <a href={`/profile/${a.id}`}
                      className="flex-shrink-0 text-xs font-head font-bold text-clay hover:text-clay-dark transition-colors underline underline-offset-2">
                      Profile
                    </a>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 p-3 bg-linen rounded-xl border border-out-var/40">
              <p className="text-xs font-body text-muted text-center">
                <span className="font-head font-semibold text-clay-dark">Note:</span> Students can message you directly. Check your inbox to respond.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD LISTING MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(30,20,16,.55)', backdropFilter: 'blur(6px)' }}>
          <div className="bg-white rounded-3xl shadow-2xl border border-out-var w-full max-w-lg p-8 relative anim-scale-in"
            style={{ boxShadow: '0 40px 80px rgba(81,53,38,.18)' }}>
            <button onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-outline hover:text-clay hover:bg-surf-lo transition-all">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="text-center mb-7">
              <div className="w-14 h-14 clay-grad rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-clay/25">
                <span className="material-symbols-outlined fill text-white text-2xl">add_home</span>
              </div>
              <h2 className="font-display text-3xl font-light text-clay-dark mb-1">New <em>listing</em></h2>
              <p className="text-sm font-body text-muted">Fill in the details for your property.</p>
            </div>

            <form onSubmit={handleAddListing} className="space-y-4">
              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Street Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">location_on</span>
                  <input type="text" name="address" className="auth-input" placeholder="6570 W 84th Place" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">City</label>
                  <input type="text" name="city" className="auth-input no-icon" placeholder="Los Angeles" />
                </div>
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Unit (optional)</label>
                  <input type="text" name="unit" className="auth-input no-icon" placeholder="Unit 3B" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Beds</label>
                  <input type="number" name="bedrooms" min={1} className="auth-input no-icon" placeholder="3" />
                </div>
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Baths</label>
                  <input type="number" name="bathrooms" min={1} step={0.5} className="auth-input no-icon" placeholder="2" />
                </div>
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Rent / mo</label>
                  <input type="number" name="rent" min={0} className="auth-input no-icon" placeholder="950" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Listing Type</label>
                <div className="flex gap-2">
                  {(['open-room', 'group-formation'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setListingType(t)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-head font-bold border transition-all ${
                        listingType === t
                          ? 'clay-grad text-white border-transparent shadow-sm'
                          : 'border-out-var text-muted hover:border-clay/50 hover:text-clay-dark'
                      }`}>
                      {t === 'open-room' ? 'Open Room' : 'Group Formation'}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Photo Upload ── */}
              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">
                  Property Photos <span className="font-normal normal-case text-muted">(required to publish — without photos, listing saves as draft)</span>
                </label>
                <label className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-out-var rounded-xl cursor-pointer hover:border-clay/50 hover:bg-surf-lo/50 transition-all">
                  <span className="material-symbols-outlined text-outline text-xl">add_a_photo</span>
                  <span className="text-sm font-body text-muted">Click to upload images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
                {filePreviews.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {filePreviews.map((src, i) => (
                      <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-out-var group">
                        <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {photoStatus && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-surf-lo rounded-xl border border-out-var/40">
                  <span className="spinner" style={{ borderColor: 'rgba(107,76,59,.15)', borderTopColor: '#6b4c3b', width: 16, height: 16, flexShrink: 0 }} />
                  <span className="text-xs font-body text-clay-dark">{photoStatus}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingListing}
                className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[.98] shadow-lg shadow-clay/25 mt-2 disabled:opacity-60">
                <span className="material-symbols-outlined text-base">{savingListing ? 'hourglass_top' : 'save'}</span>
                {savingListing ? 'Saving…' : 'Save Listing'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}