'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Listing } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

/* ─── Constants ─────────────────────────────────────── */
const AMENITIES_LIST = [
  'In-unit Laundry', 'Shared Laundry', 'Parking', 'Pet Friendly',
  'Furnished', 'Air Conditioning', 'Dishwasher', 'Gym',
  'Pool', 'Rooftop', 'EV Charging', 'Bike Storage',
  'Storage Unit', 'Balcony / Patio', 'Hardwood Floors', 'High Ceilings',
]

/* ─── Types ─────────────────────────────────────────── */
type ListingStatus = 'active' | 'draft' | 'rented' | 'archived'
type FilterTab     = 'all' | ListingStatus

const STATUS_CONFIG: Record<ListingStatus, { label: string; bg: string; dot: string }> = {
  active:   { label: 'Active',   bg: 'bg-green-50 text-green-700 border border-green-200',  dot: 'bg-green-500' },
  draft:    { label: 'Draft',    bg: 'bg-stone-100 text-stone-500 border border-stone-200', dot: 'bg-stone-400' },
  rented:   { label: 'Rented',   bg: 'bg-blue-50 text-blue-700 border border-blue-200',     dot: 'bg-blue-500'  },
  archived: { label: 'Archived', bg: 'bg-amber-50 text-amber-700 border border-amber-200',  dot: 'bg-amber-400' },
}

/* ─── Helpers ───────────────────────────────────────── */
function safeStatus(s: string): ListingStatus {
  return s in STATUS_CONFIG ? (s as ListingStatus) : 'draft'
}

/** Extract the storage path from a public URL */
function storagePathFromUrl(url: string): string {
  const parts = url.split('/listing-images/')
  return parts.length > 1 ? parts[1] : ''
}

/* ─── StatusBadge ───────────────────────────────────── */
function StatusBadge({ status }: { status: ListingStatus }) {
  const c = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-head font-bold ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

/* ─── StatCard ──────────────────────────────────────── */
function StatCard({ icon, value, label, sub }: {
  icon: string; value: string | number; label: string; sub?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-out-var p-5 shadow-sm">
      <div className="mb-3">
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

/* ─── AmenityPills ──────────────────────────────────── */
function AmenityPills({ selected, onChange }: {
  selected: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(item: string) {
    onChange(selected.includes(item)
      ? selected.filter((a) => a !== item)
      : [...selected, item]
    )
  }
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {AMENITIES_LIST.map((item) => (
        <button key={item} type="button" onClick={() => toggle(item)}
          className={`px-3 py-1.5 rounded-full text-xs font-head font-semibold border transition-all
            ${selected.includes(item)
              ? 'clay-grad text-white border-transparent shadow-sm'
              : 'bg-white border-out-var text-muted hover:border-clay/50 hover:text-clay-dark'}`}>
          {item}
        </button>
      ))}
    </div>
  )
}

/* ─── PhotoStrip ─────────────────────────────────────── */
/** Renders a row of photo thumbnails. onRemove can be null (view-only mode). */
function PhotoStrip({ previews, onRemove }: {
  previews: string[]
  onRemove: ((index: number) => void) | null
}) {
  if (previews.length === 0) return null
  return (
    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
      {previews.map((src, i) => (
        <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-out-var group">
          <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
          {onRemove && (
            <button type="button" onClick={() => onRemove(i)}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>close</span>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── ListingCard ───────────────────────────────────── */
function ListingCard({
  listing,
  onDelete,
  onReview,
  onEdit,
  onArchive,
  onMarkRented,
}: {
  listing: Listing
  onDelete:     (id: string) => void
  onReview:     (l: Listing) => void
  onEdit:       (l: Listing) => void
  onArchive:    (id: string) => void
  onMarkRented: (id: string) => void
}) {
  const typeLabel = listing.type === 'open-room' ? 'Open Room' : 'Group Formation'
  const typeBg    = listing.type === 'open-room' ? 'bg-terra/90' : 'bg-clay/90'
  const status = safeStatus(listing.status)
  const isClosedOut = status === 'rented' || status === 'archived'

  const interestCount = Array.isArray(listing.interest_count)
    ? (listing.interest_count[0]?.count ?? 0)
    : (listing.interest_count ?? 0)

  return (
    <div className="bg-white rounded-2xl border border-out-var shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden">
        {listing.images?.length > 0 ? (
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
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="mb-3">
          <p className="font-head font-bold text-clay-dark text-sm leading-tight">
            {listing.address}{listing.unit ? `, ${listing.unit}` : ''}
          </p>
          <p className="text-xs font-body text-muted">
            {listing.city}{listing.state ? `, ${listing.state}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-body text-muted mb-3">
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

        {/* Applicant count */}
        <div className="flex items-center gap-1.5 mb-4 bg-surf-lo rounded-xl px-3 py-2">
          <span className="material-symbols-outlined text-clay text-base">group</span>
          <span className="text-xs font-head font-semibold text-clay-dark">
            {interestCount === 0 ? 'No applicants yet' : `${interestCount} applicant${interestCount !== 1 ? 's' : ''}`}
          </span>
          {interestCount > 0 && (
            <button onClick={() => onReview(listing)}
              className="ml-auto text-xs font-head font-bold text-clay hover:text-clay-dark transition-colors">
              Review →
            </button>
          )}
        </div>

        {/* Primary actions */}
        <div className="flex gap-2">
          {!isClosedOut && (
            <button onClick={() => onEdit(listing)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-head font-semibold text-clay-dark border border-out-var rounded-lg py-2 hover:border-clay/40 hover:bg-surf-lo transition-all">
              <span className="material-symbols-outlined text-sm">edit</span> Edit
            </button>
          )}
          <a href={`/listings/${listing.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-head font-semibold text-clay-dark border border-out-var rounded-lg py-2 hover:border-clay/40 hover:bg-surf-lo transition-all">
            <span className="material-symbols-outlined text-sm">visibility</span> Preview
          </a>
          <button onClick={() => onDelete(listing.id)}
            className="flex items-center justify-center text-xs font-head font-semibold text-red-500 border border-red-100 rounded-lg px-3 py-2 hover:bg-red-50 transition-all">
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>

        {/* Close-out actions — only for active / draft listings */}
        {!isClosedOut && (
          <div className="flex gap-2 mt-2">
            <button onClick={() => onMarkRented(listing.id)}
              className="flex-1 flex items-center justify-center gap-1 text-xs font-head font-semibold text-blue-600 border border-blue-100 rounded-lg py-2 hover:bg-blue-50 transition-all">
              <span className="material-symbols-outlined text-sm">key</span> Mark Rented
            </button>
            <button onClick={() => onArchive(listing.id)}
              className="flex-1 flex items-center justify-center gap-1 text-xs font-head font-semibold text-amber-600 border border-amber-100 rounded-lg py-2 hover:bg-amber-50 transition-all">
              <span className="material-symbols-outlined text-sm">archive</span> Archive
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main portal page ──────────────────────────────── */
export default function LandlordPortal() {
  const router   = useRouter()
  const supabase = createClient()

  /* Auth & listings */
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<Listing[]>([])
  const [filter,  setFilter]  = useState<FilterTab>('all')

  /* Applicant review modal */
  const [reviewListing,     setReviewListing]     = useState<Listing | null>(null)
  const [applicants,         setApplicants]         = useState<Array<{ id: string; first_name: string | null; last_name: string | null; university: string | null; bio: string | null }>>([])
  const [loadingApplicants,  setLoadingApplicants]  = useState(false)

  /* ── CREATE listing state ── */
  const [showAddModal,    setShowAddModal]    = useState(false)
  const [addListingType,  setAddListingType]  = useState<'open-room' | 'group-formation'>('open-room')
  const [addAmenities,    setAddAmenities]    = useState<string[]>([])
  const [addFiles,        setAddFiles]        = useState<File[]>([])
  const [addPreviews,     setAddPreviews]     = useState<string[]>([])
  const [savingAdd,       setSavingAdd]       = useState(false)
  const [addStatus,       setAddStatus]       = useState<string | null>(null)

  /* ── EDIT listing state ── */
  const [editListing,       setEditListing]       = useState<Listing | null>(null)
  const [editListingType,   setEditListingType]   = useState<'open-room' | 'group-formation'>('open-room')
  const [editAmenities,     setEditAmenities]     = useState<string[]>([])
  const [editExistingImgs,  setEditExistingImgs]  = useState<string[]>([])  // kept URLs
  const [editNewFiles,      setEditNewFiles]      = useState<File[]>([])
  const [editNewPreviews,   setEditNewPreviews]   = useState<string[]>([])
  const [savingEdit,        setSavingEdit]        = useState(false)
  const [editStatus,        setEditStatus]        = useState<string | null>(null)

  /* ─ Load user + listings ─ */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      if (!u) { router.push('/auth'); return }
      if (u.user_metadata?.role !== 'landlord') { router.push('/'); return }
      setUser(u)

      supabase
        .from('listings')
        .select('*, interest_count:listing_interests(count)')
        .eq('landlord_id', u.id)
        .order('created_at', { ascending: false })
        .then(({ data: rows }) => {
          if (rows) setListings(rows)
          setLoading(false)
        })
    })
  }, [])

  /* ── File helpers ── */
  function addFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setAddFiles(files)
    setAddPreviews(files.map((f) => URL.createObjectURL(f)))
  }
  function removeAddFile(i: number) {
    setAddFiles((p) => p.filter((_, idx) => idx !== i))
    setAddPreviews((p) => { URL.revokeObjectURL(p[i]); return p.filter((_, idx) => idx !== i) })
  }

  function editNewFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setEditNewFiles(files)
    setEditNewPreviews(files.map((f) => URL.createObjectURL(f)))
  }
  function removeEditNewFile(i: number) {
    setEditNewFiles((p) => p.filter((_, idx) => idx !== i))
    setEditNewPreviews((p) => { URL.revokeObjectURL(p[i]); return p.filter((_, idx) => idx !== i) })
  }
  function removeEditExistingImage(url: string) {
    setEditExistingImgs((p) => p.filter((u) => u !== url))
  }

  /* ── Upload helper ── */
  async function uploadPhotos(listingId: string, files: File[]): Promise<string[]> {
    const urls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${listingId}/${Date.now()}_${i}.${ext}`
      const { error } = await supabase.storage
        .from('listing-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (!error) {
        const { data: urlData } = supabase.storage
          .from('listing-images')
          .getPublicUrl(path)
        urls.push(urlData.publicUrl)
      }
    }
    return urls
  }

  /* ── CREATE listing ── */
  async function handleAddListing(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const form        = e.target as HTMLFormElement
    const address     = (form.elements.namedItem('address')     as HTMLInputElement).value.trim()
    const unit        = (form.elements.namedItem('unit')        as HTMLInputElement).value.trim()
    const city        = (form.elements.namedItem('city')        as HTMLInputElement).value.trim()
    const state       = (form.elements.namedItem('state')       as HTMLInputElement).value.trim()
    const zip         = (form.elements.namedItem('zip')         as HTMLInputElement).value.trim()
    const bedrooms    = parseInt((form.elements.namedItem('bedrooms')  as HTMLInputElement).value)
    const bathrooms   = parseFloat((form.elements.namedItem('bathrooms') as HTMLInputElement).value)
    const rent        = parseInt((form.elements.namedItem('rent')      as HTMLInputElement).value)
    const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value.trim()

    if (!address || !city) return

    const hasRequired = !!(address && city && rent && !isNaN(bedrooms) && !isNaN(bathrooms))
    const isDraft = !hasRequired || addFiles.length === 0

    setSavingAdd(true)
    setAddStatus(isDraft ? 'Saving as draft…' : 'Saving listing…')

    const { data, error } = await supabase
      .from('listings')
      .insert({
        landlord_id:  user.id,
        address:      address || 'Untitled',
        unit:         unit || null,
        city:         city || '',
        state:        state || 'CA',
        zip:          zip || null,
        bedrooms:     isNaN(bedrooms)  ? 1 : bedrooms,
        bathrooms:    isNaN(bathrooms) ? 1 : bathrooms,
        rent:         isNaN(rent)      ? 0 : rent,
        type:         addListingType,
        status:       isDraft ? 'draft' : 'active',
        description:  description || null,
        amenities:    addAmenities,
        images:       [],
      })
      .select()
      .single()

    if (error || !data) {
      setSavingAdd(false)
      setAddStatus(null)
      return
    }

    setListings((prev) => [data, ...prev])

    /* Upload photos */
    if (addFiles.length > 0) {
      setAddStatus(`Uploading ${addFiles.length} photo${addFiles.length > 1 ? 's' : ''}…`)
      const uploadedUrls = await uploadPhotos(data.id, addFiles)

      // If photos were expected but none uploaded, downgrade to draft
      const finalStatus = uploadedUrls.length > 0 && hasRequired ? 'active' : 'draft'
      const { data: updated } = await supabase
        .from('listings')
        .update({ images: uploadedUrls, status: finalStatus })
        .eq('id', data.id)
        .select()
        .single()

      if (updated) setListings((prev) => prev.map((l) => (l.id === data.id ? updated : l)))
      setAddStatus(uploadedUrls.length > 0
        ? finalStatus === 'active' ? 'Listing published!' : 'Saved as draft.'
        : 'Photos failed to upload — saved as draft.')
    } else {
      setAddStatus('Saved as draft — add photos and complete all fields to publish.')
    }

    setTimeout(() => {
      setShowAddModal(false)
      setSavingAdd(false)
      setAddStatus(null)
      setAddFiles([])
      setAddPreviews([])
      setAddAmenities([])
      setAddListingType('open-room')
      form.reset()
    }, 2000)
  }

  /* ── EDIT listing open ── */
  function handleEditOpen(listing: Listing) {
    setEditListing(listing)
    setEditListingType(listing.type)
    setEditAmenities(listing.amenities ?? [])
    setEditExistingImgs(listing.images ?? [])
    setEditNewFiles([])
    setEditNewPreviews([])
    setEditStatus(null)
  }

  /* ── EDIT listing save ── */
  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editListing || !user) return

    const form        = e.target as HTMLFormElement
    const address     = (form.elements.namedItem('address')     as HTMLInputElement).value.trim()
    const unit        = (form.elements.namedItem('unit')        as HTMLInputElement).value.trim()
    const city        = (form.elements.namedItem('city')        as HTMLInputElement).value.trim()
    const state       = (form.elements.namedItem('state')       as HTMLInputElement).value.trim()
    const zip         = (form.elements.namedItem('zip')         as HTMLInputElement).value.trim()
    const bedrooms    = parseInt((form.elements.namedItem('bedrooms')  as HTMLInputElement).value)
    const bathrooms   = parseFloat((form.elements.namedItem('bathrooms') as HTMLInputElement).value)
    const rent        = parseInt((form.elements.namedItem('rent')      as HTMLInputElement).value)
    const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value.trim()

    setSavingEdit(true)
    setEditStatus('Saving…')

    /* Delete any images the user removed from the existing set */
    const removedImages = editListing.images.filter((url) => !editExistingImgs.includes(url))
    if (removedImages.length > 0) {
      const paths = removedImages.map(storagePathFromUrl).filter(Boolean)
      if (paths.length > 0) await supabase.storage.from('listing-images').remove(paths)
    }

    /* Upload new photos */
    let newUploadedUrls: string[] = []
    if (editNewFiles.length > 0) {
      setEditStatus(`Uploading ${editNewFiles.length} photo${editNewFiles.length > 1 ? 's' : ''}…`)
      newUploadedUrls = await uploadPhotos(editListing.id, editNewFiles)
    }

    const allImages = [...editExistingImgs, ...newUploadedUrls]
    const hasRequired = !!(address && city && rent && !isNaN(bedrooms) && !isNaN(bathrooms))
    const newStatus   = hasRequired && allImages.length > 0 ? 'active' : 'draft'

    const { data: updated } = await supabase
      .from('listings')
      .update({
        address:      address || editListing.address,
        unit:         unit || null,
        city:         city || editListing.city,
        state:        state || 'CA',
        zip:          zip || null,
        bedrooms:     isNaN(bedrooms)  ? editListing.bedrooms  : bedrooms,
        bathrooms:    isNaN(bathrooms) ? editListing.bathrooms : bathrooms,
        rent:         isNaN(rent)      ? editListing.rent      : rent,
        type:         editListingType,
        status:       newStatus,
        description:  description || null,
        amenities:    editAmenities,
        images:       allImages,
        updated_at:   new Date().toISOString(),
      })
      .eq('id', editListing.id)
      .select()
      .single()

    setSavingEdit(false)

    if (updated) {
      setListings((prev) => prev.map((l) => (l.id === editListing.id ? updated : l)))
      setEditStatus(newStatus === 'active' ? 'Listing updated and published!' : 'Saved as draft.')
      setTimeout(() => {
        setEditListing(null)
        setEditStatus(null)
        setEditNewFiles([])
        setEditNewPreviews([])
      }, 1800)
    } else {
      setEditStatus('Save failed — please try again.')
    }
  }

  /* ── DELETE listing (+ Storage cleanup) ── */
  async function handleDelete(id: string) {
    if (!confirm('Permanently delete this listing and all its photos? This cannot be undone.')) return

    const listing = listings.find((l) => l.id === id)
    if (listing?.images?.length) {
      const paths = listing.images.map(storagePathFromUrl).filter(Boolean)
      if (paths.length > 0) await supabase.storage.from('listing-images').remove(paths)
    }

    await supabase.from('listings').delete().eq('id', id)
    setListings((prev) => prev.filter((l) => l.id !== id))
  }

  /* ── ARCHIVE listing ── */
  async function handleArchive(id: string) {
    const { data: updated } = await supabase
      .from('listings')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (updated) setListings((prev) => prev.map((l) => (l.id === id ? updated : l)))
  }

  /* ── MARK RENTED ── */
  async function handleMarkRented(id: string) {
    const { data: updated } = await supabase
      .from('listings')
      .update({ status: 'rented', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (updated) setListings((prev) => prev.map((l) => (l.id === id ? updated : l)))
  }

  /* ── REVIEW applicants ── */
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

  /* ─── Loading screen ─── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <span className="spinner" style={{ borderColor: 'rgba(107,76,59,.2)', borderTopColor: '#6b4c3b', width: 32, height: 32 }} />
    </div>
  )

  const firstName = user?.user_metadata?.first_name ?? 'Landlord'
  const company   = user?.user_metadata?.company

  const filteredListings = filter === 'all'
    ? listings
    : listings.filter((l) => l.status === filter)

  const totalApplicants = listings.reduce((s, l) =>
    s + (Array.isArray(l.interest_count) ? (l.interest_count[0]?.count ?? 0) : (l.interest_count ?? 0)), 0)
  const activeCount   = listings.filter((l) => l.status === 'active').length
  const draftCount    = listings.filter((l) => l.status === 'draft').length
  const rentedCount   = listings.filter((l) => l.status === 'rented').length
  const archivedCount = listings.filter((l) => l.status === 'archived').length

  /* ─── Shared form fields (used in both Add and Edit modals) ─── */
  function ListingFormFields({
    defaults,
    listingType,
    setListingType,
    amenities,
    setAmenities,
    existingImagePreviews,
    onRemoveExisting,
    newPreviews,
    onRemoveNew,
    onNewFileSelect,
    saving,
    statusMsg,
  }: {
    defaults?: Listing | null
    listingType: 'open-room' | 'group-formation'
    setListingType: (t: 'open-room' | 'group-formation') => void
    amenities: string[]
    setAmenities: (a: string[]) => void
    existingImagePreviews?: string[]
    onRemoveExisting?: (url: string) => void
    newPreviews: string[]
    onRemoveNew: (i: number) => void
    onNewFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
    saving: boolean
    statusMsg: string | null
  }) {
    return (
      <>
        {/* Address */}
        <div>
          <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Street Address *</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">location_on</span>
            <input type="text" name="address" className="auth-input" placeholder="6570 W 84th Place"
              defaultValue={defaults?.address ?? ''} required />
          </div>
        </div>

        {/* City / Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">City *</label>
            <input type="text" name="city" className="auth-input no-icon" placeholder="Los Angeles"
              defaultValue={defaults?.city ?? ''} required />
          </div>
          <div>
            <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Unit (optional)</label>
            <input type="text" name="unit" className="auth-input no-icon" placeholder="Unit 3B"
              defaultValue={defaults?.unit ?? ''} />
          </div>
        </div>

        {/* State / Zip */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">State</label>
            <input type="text" name="state" maxLength={2} className="auth-input no-icon" placeholder="CA"
              defaultValue={defaults?.state ?? 'CA'} />
          </div>
          <div>
            <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Zip Code</label>
            <input type="text" name="zip" maxLength={10} className="auth-input no-icon" placeholder="90045"
              defaultValue={defaults?.zip ?? ''} />
          </div>
        </div>

        {/* Beds / Baths / Rent */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Beds *</label>
            <input type="number" name="bedrooms" min={1} className="auth-input no-icon" placeholder="3"
              defaultValue={defaults?.bedrooms ?? ''} required />
          </div>
          <div>
            <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Baths *</label>
            <input type="number" name="bathrooms" min={0.5} step={0.5} className="auth-input no-icon" placeholder="2"
              defaultValue={defaults?.bathrooms ?? ''} required />
          </div>
          <div>
            <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Rent / mo *</label>
            <input type="number" name="rent" min={0} className="auth-input no-icon" placeholder="950"
              defaultValue={defaults?.rent ?? ''} required />
          </div>
        </div>

        {/* Type toggle */}
        <div>
          <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Listing Type</label>
          <div className="flex gap-2">
            {(['open-room', 'group-formation'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setListingType(t)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-head font-bold border transition-all
                  ${listingType === t
                    ? 'clay-grad text-white border-transparent shadow-sm'
                    : 'border-out-var text-muted hover:border-clay/50 hover:text-clay-dark'}`}>
                {t === 'open-room' ? 'Open Room' : 'Group Formation'}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Description</label>
          <textarea name="description" rows={3} defaultValue={defaults?.description ?? ''}
            placeholder="Describe the property, neighbourhood, lease terms…"
            className="w-full bg-white border-[1.5px] border-out-var rounded-xl px-4 py-3 font-body text-sm text-stone outline-none resize-none transition-all focus:border-clay focus:shadow-[0_0_0_3px_rgba(107,76,59,.12)] placeholder:text-[#a89990]" />
        </div>

        {/* Amenities */}
        <div>
          <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-1">Amenities</label>
          <AmenityPills selected={amenities} onChange={setAmenities} />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">
            Property Photos
            <span className="font-normal normal-case text-muted ml-1">(1+ photo required to publish)</span>
          </label>

          {/* Existing images (edit mode) */}
          {existingImagePreviews && existingImagePreviews.length > 0 && (
            <div className="mb-2">
              <p className="text-[11px] font-body text-muted mb-1">Current photos — click × to remove</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {existingImagePreviews.map((url, i) => (
                  <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-out-var group">
                    <img src={url} alt={`Existing ${i + 1}`} className="w-full h-full object-cover" />
                    {onRemoveExisting && (
                      <button type="button" onClick={() => onRemoveExisting(url)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>close</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New file upload */}
          <label className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-out-var rounded-xl cursor-pointer hover:border-clay/50 hover:bg-surf-lo/50 transition-all">
            <span className="material-symbols-outlined text-outline text-xl">add_a_photo</span>
            <span className="text-sm font-body text-muted">
              {existingImagePreviews ? 'Add more photos' : 'Click to upload images'}
            </span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={onNewFileSelect} />
          </label>
          <PhotoStrip previews={newPreviews} onRemove={onRemoveNew} />
        </div>

        {/* Status message */}
        {statusMsg && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-surf-lo rounded-xl border border-out-var/40">
            {saving
              ? <span className="spinner" style={{ borderColor: 'rgba(107,76,59,.15)', borderTopColor: '#6b4c3b', width: 16, height: 16, flexShrink: 0 }} />
              : <span className="material-symbols-outlined text-clay text-base">info</span>}
            <span className="text-xs font-body text-clay-dark">{statusMsg}</span>
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={saving}
          className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[.98] shadow-lg shadow-clay/25 mt-2 disabled:opacity-60">
          <span className="material-symbols-outlined text-base">{saving ? 'hourglass_top' : 'save'}</span>
          {saving ? 'Saving…' : 'Save Listing'}
        </button>
      </>
    )
  }

  /* ─── RENDER ─── */
  return (
    <div className="min-h-screen bg-cream">

      {/* ── TOPBAR ── */}
      <header className="sticky top-0 z-50 glass border-b border-out-var/20">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 clay-grad rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white font-head font-black text-sm leading-none">U</span>
            </div>
            <div>
              <span className="font-head font-black text-lg text-clay-dark tracking-tight leading-none">Tenancy</span>
              <span className="block text-[10px] font-head font-bold text-terra uppercase tracking-widest leading-none">Landlord Portal</span>
            </div>
          </div>

          {/* Filter tabs (desktop) */}
          <div className="hidden md:flex items-center gap-1 bg-surf-hi border border-out-var rounded-full px-1 py-1">
            {(['all', 'active', 'draft', 'rented', 'archived'] as FilterTab[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-head font-bold capitalize transition-all
                  ${filter === f ? 'clay-grad text-white shadow-sm' : 'text-muted hover:text-clay-dark'}`}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/messages"
              className="hidden md:flex items-center gap-1.5 text-sm font-head font-semibold text-muted hover:text-clay transition-colors px-3 py-2 rounded-full hover:bg-linen">
              <span className="material-symbols-outlined text-base">chat</span> Messages
            </Link>
            <Link href="/"
              className="hidden md:flex items-center gap-1.5 text-sm font-head font-semibold text-muted hover:text-clay transition-colors px-3 py-2 rounded-full hover:bg-linen">
              <span className="material-symbols-outlined text-base">open_in_new</span> View Site
            </Link>
            <button onClick={() => setShowAddModal(true)}
              className="clay-grad text-white px-4 py-2 rounded-full font-head text-sm font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">add</span> Add Listing
            </button>
            <div className="flex items-center gap-2 bg-white border border-out-var rounded-full pl-1 pr-3 py-1">
              <div className="w-7 h-7 clay-grad rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-head font-black text-xs">{firstName[0]?.toUpperCase() ?? 'L'}</span>
              </div>
              <span className="text-sm font-head font-semibold text-clay-dark hidden md:block">{firstName}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-8">

        {/* Welcome */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-light text-clay-dark leading-tight">
              Good morning, <em>{firstName}</em>.
            </h1>
            {company && <p className="text-sm font-body text-muted mt-1">{company}</p>}
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="hidden md:flex items-center gap-2 text-sm font-head font-semibold text-muted hover:text-clay transition-colors">
            <span className="material-symbols-outlined text-base">add_circle</span> New listing
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <StatCard icon="home_work"    value={listings.length} label="Total"     sub="All statuses"       />
          <StatCard icon="check_circle" value={activeCount}     label="Active"    sub="Visible to students" />
          <StatCard icon="group"        value={totalApplicants} label="Applicants" sub="Awaiting review"    />
          <StatCard icon="key"          value={rentedCount}     label="Rented"    sub="Closed out"         />
          <StatCard icon="archive"      value={archivedCount}   label="Archived"  sub="Hidden from search" />
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-head font-bold text-clay-dark text-lg capitalize">
            {filter === 'all' ? 'All Properties' : `${filter} Listings`}
            <span className="ml-2 text-sm font-normal text-muted">({filteredListings.length})</span>
          </h2>
          {/* Mobile filter */}
          <div className="flex md:hidden gap-1 overflow-x-auto">
            {(['all', 'active', 'draft', 'rented', 'archived'] as FilterTab[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-head font-bold capitalize whitespace-nowrap transition-all
                  ${filter === f ? 'clay-grad text-white' : 'bg-white border border-out-var text-muted'}`}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
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
            {filteredListings.map((l) => (
              <ListingCard key={l.id} listing={l}
                onDelete={handleDelete}
                onReview={handleReview}
                onEdit={handleEditOpen}
                onArchive={handleArchive}
                onMarkRented={handleMarkRented} />
            ))}
          </div>
        )}
      </main>

      {/* ══ REVIEW APPLICANTS MODAL ══ */}
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
                      <span className="text-white font-head font-black text-xs">
                        {(a.first_name?.[0] ?? '') + (a.last_name?.[0] ?? '')}
                      </span>
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
                <span className="font-head font-semibold text-clay-dark">Tip:</span> Students can message you directly — check your inbox to respond.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══ ADD LISTING MODAL ══ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(30,20,16,.55)', backdropFilter: 'blur(6px)' }}>
          <div className="bg-white rounded-3xl shadow-2xl border border-out-var w-full max-w-lg relative anim-scale-in flex flex-col"
            style={{ boxShadow: '0 40px 80px rgba(81,53,38,.18)', maxHeight: '90vh' }}>
            {/* Header */}
            <div className="flex-shrink-0 px-8 pt-8 pb-2">
              <button onClick={() => { setShowAddModal(false); setAddFiles([]); setAddPreviews([]); setAddAmenities([]); setAddListingType('open-room') }}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-outline hover:text-clay hover:bg-surf-lo transition-all">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
              <div className="text-center mb-6">
                <div className="w-14 h-14 clay-grad rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-clay/25">
                  <span className="material-symbols-outlined fill text-white text-2xl">add_home</span>
                </div>
                <h2 className="font-display text-3xl font-light text-clay-dark mb-1">New <em>listing</em></h2>
                <p className="text-sm font-body text-muted">Fill in all details. Photos required to publish.</p>
              </div>
            </div>
            {/* Scrollable form body */}
            <div className="overflow-y-auto flex-1 px-8 pb-8">
              <form onSubmit={handleAddListing} className="space-y-4">
                <ListingFormFields
                  listingType={addListingType}
                  setListingType={setAddListingType}
                  amenities={addAmenities}
                  setAmenities={setAddAmenities}
                  newPreviews={addPreviews}
                  onRemoveNew={removeAddFile}
                  onNewFileSelect={addFileSelect}
                  saving={savingAdd}
                  statusMsg={addStatus}
                />
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT LISTING MODAL ══ */}
      {editListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(30,20,16,.55)', backdropFilter: 'blur(6px)' }}>
          <div className="bg-white rounded-3xl shadow-2xl border border-out-var w-full max-w-lg relative anim-scale-in flex flex-col"
            style={{ boxShadow: '0 40px 80px rgba(81,53,38,.18)', maxHeight: '90vh' }}>
            {/* Header */}
            <div className="flex-shrink-0 px-8 pt-8 pb-2">
              <button onClick={() => { setEditListing(null); setEditNewFiles([]); setEditNewPreviews([]) }}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-outline hover:text-clay hover:bg-surf-lo transition-all">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
              <div className="text-center mb-6">
                <div className="w-14 h-14 clay-grad rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-clay/25">
                  <span className="material-symbols-outlined fill text-white text-2xl">edit_home</span>
                </div>
                <h2 className="font-display text-3xl font-light text-clay-dark mb-1">Edit <em>listing</em></h2>
                <p className="text-xs font-body text-muted truncate px-4">{editListing.address}</p>
              </div>
            </div>
            {/* Scrollable form body */}
            <div className="overflow-y-auto flex-1 px-8 pb-8">
              <form key={editListing.id} onSubmit={handleEditSave} className="space-y-4">
                <ListingFormFields
                  defaults={editListing}
                  listingType={editListingType}
                  setListingType={setEditListingType}
                  amenities={editAmenities}
                  setAmenities={setEditAmenities}
                  existingImagePreviews={editExistingImgs}
                  onRemoveExisting={removeEditExistingImage}
                  newPreviews={editNewPreviews}
                  onRemoveNew={removeEditNewFile}
                  onNewFileSelect={editNewFileSelect}
                  saving={savingEdit}
                  statusMsg={editStatus}
                />
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
