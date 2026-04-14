'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

/* ─── Constants ────────────────────────────────────────────── */
const AMENITY_OPTIONS = [
  'Parking', 'In-unit laundry', 'A/C', 'Backyard', 'Hardwood floors',
  'High-speed WiFi', 'Dishwasher', 'Gym', 'Pet-friendly', 'Furnished',
]

type ListingStatus = 'active' | 'draft' | 'filled' | 'pending' | 'archived'

const STATUS_CONFIG: Record<ListingStatus, { label: string; dot: string; badge: string }> = {
  active:   { label: 'Active',   dot: 'bg-green-500', badge: 'bg-green-50 text-green-700 border-green-200' },
  draft:    { label: 'Draft',    dot: 'bg-stone-400', badge: 'bg-stone-100 text-stone-500 border-stone-200' },
  filled:   { label: 'Filled',   dot: 'bg-blue-500',  badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  pending:  { label: 'Pending',  dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  archived: { label: 'Archived', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
}

function safeStatus(s: string): ListingStatus {
  return s in STATUS_CONFIG ? (s as ListingStatus) : 'draft'
}

/* ─── Types ─────────────────────────────────────────────────── */
interface MyListing {
  id: string
  address: string
  unit: string | null
  city: string
  state: string
  zip: string | null
  rent: number
  bedrooms: number
  bathrooms: number
  type: string
  status: ListingStatus
  images: string[]
  description: string | null
  amenities: string[]
  available_date: string | null
  lease_term: string | null
  deposit: number | null
  utilities: string | null
  pets_allowed: string | null
  created_at: string
}

/* ─── Field style ───────────────────────────────────────────── */
const INPUT = 'w-full px-4 py-3 border-[1.5px] border-out-var rounded-xl font-body text-sm text-stone outline-none transition-all focus:border-clay focus:shadow-[0_0_0_3px_rgba(107,76,59,.12)] bg-white placeholder:text-[#a89990]'
const SELECT = 'w-full px-4 py-3 border-[1.5px] border-out-var rounded-xl font-body text-sm text-stone outline-none transition-all focus:border-clay bg-white'
const LABEL  = 'block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2'

/* ─── Main Page ─────────────────────────────────────────────── */
export default function MyListingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [listings,    setListings]    = useState<MyListing[]>([])
  const [loading,     setLoading]     = useState(true)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)
  const [togglingId,  setTogglingId]  = useState<string | null>(null)
  const [activeTab,   setActiveTab]   = useState<'active' | 'inactive'>('active')

  /* ── Edit state ── */
  const [editListing, setEditListing] = useState<MyListing | null>(null)
  const [editUnit,         setEditUnit]         = useState('')
  const [editBedrooms,     setEditBedrooms]     = useState(1)
  const [editBathrooms,    setEditBathrooms]    = useState(1)
  const [editRent,         setEditRent]         = useState('')
  const [editDescription,  setEditDescription]  = useState('')
  const [editAmenities,    setEditAmenities]    = useState<string[]>([])
  const [editAvailDate,    setEditAvailDate]    = useState('')
  const [editLeaseTerm,    setEditLeaseTerm]    = useState('12 months')
  const [editDeposit,      setEditDeposit]      = useState('')
  const [editUtilities,    setEditUtilities]    = useState('Tenant pays')
  const [editPets,         setEditPets]         = useState('Negotiable')
  const [editExistingImgs, setEditExistingImgs] = useState<string[]>([])
  const [editNewFiles,     setEditNewFiles]     = useState<File[]>([])
  const [editNewPreviews,  setEditNewPreviews]  = useState<string[]>([])
  const [editSaving,       setEditSaving]       = useState(false)
  const [editStatus,       setEditStatus]       = useState<string | null>(null)
  const [editError,        setEditError]        = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── Auth guard + initial fetch ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      if (!u) {
        router.push('/')
        return
      }
      fetchListings(u.id)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchListings(userId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('listings')
      .select('id, address, unit, city, state, zip, rent, bedrooms, bathrooms, type, status, images, description, amenities, available_date, lease_term, deposit, utilities, pets_allowed, created_at')
      .eq('landlord_id', userId)
      .order('created_at', { ascending: false })
    setListings((data as MyListing[]) ?? [])
    setLoading(false)
  }

  /* ── Open edit modal ── */
  function openEdit(listing: MyListing) {
    setEditListing(listing)
    setEditUnit(listing.unit ?? '')
    setEditBedrooms(listing.bedrooms)
    setEditBathrooms(listing.bathrooms)
    setEditRent(String(listing.rent))
    setEditDescription(listing.description ?? '')
    setEditAmenities(listing.amenities ?? [])
    setEditAvailDate(listing.available_date ?? '')
    setEditLeaseTerm(listing.lease_term ?? '12 months')
    setEditDeposit(listing.deposit != null ? String(listing.deposit) : '')
    setEditUtilities(listing.utilities ?? 'Tenant pays')
    setEditPets(listing.pets_allowed ?? 'Negotiable')
    setEditExistingImgs(listing.images ?? [])
    setEditNewFiles([])
    setEditNewPreviews([])
    setEditError(null)
    setEditStatus(null)
  }

  function closeEdit() {
    setEditListing(null)
    setEditNewFiles([])
    setEditNewPreviews([])
    setEditError(null)
  }

  /* ── New photo select ── */
  function handleNewFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setEditNewFiles(prev => [...prev, ...selected])
    selected.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setEditNewPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  function removeNewFile(i: number) {
    setEditNewFiles(prev => prev.filter((_, idx) => idx !== i))
    setEditNewPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  function removeExistingImg(url: string) {
    setEditExistingImgs(prev => prev.filter(u => u !== url))
  }

  function toggleEditAmenity(a: string) {
    setEditAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  /* ── Save edits ── */
  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editListing) return
    if (!editRent || isNaN(Number(editRent)) || Number(editRent) <= 0) {
      setEditError('Please enter a valid monthly rent.')
      return
    }

    setEditSaving(true)
    setEditError(null)
    setEditStatus('Saving changes…')

    try {
      // Upload any new photos
      const newUrls: string[] = []
      if (editNewFiles.length > 0) {
        setEditStatus('Uploading photos…')
        for (let i = 0; i < editNewFiles.length; i++) {
          const ext  = editNewFiles[i].name.split('.').pop() ?? 'jpg'
          const path = `${editListing.id}/${Date.now()}_${i}.${ext}`
          const { error: upErr } = await supabase.storage
            .from('listing-images')
            .upload(path, editNewFiles[i], { upsert: false })
          if (!upErr) {
            const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(path)
            if (urlData?.publicUrl) newUrls.push(urlData.publicUrl)
          }
        }
      }

      const allImages = [...editExistingImgs, ...newUrls]
      const hasImages = allImages.length > 0
      const currentStatus = editListing.status

      // Promote draft → active if images are now present
      const nextStatus: ListingStatus =
        currentStatus === 'draft' && hasImages ? 'active' : currentStatus

      setEditStatus('Saving…')
      const { error: updateErr } = await supabase
        .from('listings')
        .update({
          unit:           editUnit || null,
          bedrooms:       editBedrooms,
          bathrooms:      editBathrooms,
          rent:           Number(editRent),
          description:    editDescription || null,
          amenities:      editAmenities,
          images:         allImages,
          available_date: editAvailDate || null,
          lease_term:     editLeaseTerm,
          deposit:        editDeposit ? Number(editDeposit) : null,
          utilities:      editUtilities,
          pets_allowed:   editPets,
          status:         nextStatus,
          updated_at:     new Date().toISOString(),
        })
        .eq('id', editListing.id)

      if (updateErr) {
        setEditError('Could not save changes. Please try again.')
        setEditSaving(false)
        setEditStatus(null)
        return
      }

      // Update local state
      setListings(prev => prev.map(l =>
        l.id === editListing.id
          ? {
              ...l,
              unit:           editUnit || null,
              bedrooms:       editBedrooms,
              bathrooms:      editBathrooms,
              rent:           Number(editRent),
              description:    editDescription || null,
              amenities:      editAmenities,
              images:         allImages,
              available_date: editAvailDate || null,
              lease_term:     editLeaseTerm,
              deposit:        editDeposit ? Number(editDeposit) : null,
              utilities:      editUtilities,
              pets_allowed:   editPets,
              status:         nextStatus,
            }
          : l
      ))

      setEditStatus('Saved!')
      setTimeout(closeEdit, 600)
    } catch (err) {
      console.error(err)
      setEditError('Something went wrong. Please try again.')
      setEditSaving(false)
      setEditStatus(null)
    }
  }

  /* ── Other actions ── */
  async function handleDelete(id: string) {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setDeletingId(id)
    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
    setDeletingId(null)
  }

  async function handleMarkRented(id: string) {
    setTogglingId(id)
    const { data: updated } = await supabase
      .from('listings')
      .update({ status: 'filled' })
      .eq('id', id)
      .select()
      .single()
    if (updated) setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'filled' as ListingStatus } : l))
    setTogglingId(null)
  }

  async function handleArchive(id: string) {
    setTogglingId(id)
    const { data: updated } = await supabase
      .from('listings')
      .update({ status: 'archived' })
      .eq('id', id)
      .select()
      .single()
    if (updated) setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'archived' as ListingStatus } : l))
    setTogglingId(null)
  }

  async function handleReactivate(id: string) {
    setTogglingId(id)
    await supabase.from('listings').update({ status: 'active' }).eq('id', id)
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'active' as ListingStatus } : l))
    setTogglingId(null)
  }

  /* ─────────────── RENDER ────────────────────────────────── */
  return (
    <>
      <main className="min-h-screen bg-cream px-6 py-10">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-4xl font-light text-clay-dark mb-1">
                My <em className="text-terra">Listings</em>
              </h1>
              <p className="font-body text-muted text-sm">Rooms and spaces you&apos;ve posted on UTenancy.</p>
            </div>
            <Link
              href="/post-room"
              className="flex items-center gap-1.5 clay-grad text-white px-5 py-2.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-clay/20"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Post a Room
            </Link>
          </div>

          {/* Tabs */}
          {!loading && (
            <div className="flex gap-1 p-1 bg-white border border-out-var rounded-2xl mb-6 shadow-sm">
              {([
                { key: 'active',   label: 'Active',   icon: 'home',        count: listings.filter(l => l.status === 'active' || l.status === 'draft').length },
                { key: 'inactive', label: 'Inactive', icon: 'inventory_2', count: listings.filter(l => l.status === 'filled' || l.status === 'archived').length },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-head font-bold transition-all
                    ${activeTab === tab.key
                      ? 'clay-grad text-white shadow-md shadow-clay/20'
                      : 'text-muted hover:text-clay-dark hover:bg-surf-lo'}`}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  {tab.label}
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full
                    ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-linen text-clay-dark'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 rounded-full border-2 border-clay/30 border-t-clay animate-spin" />
            </div>
          ) : (() => {
            const filtered = listings.filter(l =>
              activeTab === 'active'
                ? (l.status === 'active' || l.status === 'draft')
                : (l.status === 'filled' || l.status === 'archived')
            )

            if (filtered.length === 0) {
              return activeTab === 'active' ? (
                <div className="text-center py-24 border border-out-var rounded-2xl bg-white">
                  <span className="material-symbols-outlined text-out-var text-6xl mb-4 block">home_work</span>
                  <p className="font-head font-bold text-clay-dark text-lg mb-1">No listings yet</p>
                  <p className="font-body text-muted text-sm mb-6">Post your first open room to get started.</p>
                  <Link
                    href="/post-room"
                    className="inline-flex items-center gap-1.5 clay-grad text-white px-5 py-2.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-clay/20"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    Post a Room
                  </Link>
                </div>
              ) : (
                <div className="text-center py-24 border border-out-var rounded-2xl bg-white">
                  <span className="material-symbols-outlined text-out-var text-6xl mb-4 block">inventory_2</span>
                  <p className="font-head font-bold text-clay-dark text-lg mb-1">No inactive listings</p>
                  <p className="font-body text-muted text-sm">Listings you mark as filled or archived will appear here.</p>
                </div>
              )
            }

            return (
            <div className="space-y-4">
              {filtered.map((listing) => {

                const status = safeStatus(listing.status)
                const cfg    = STATUS_CONFIG[status]
                const isClosedOut = status === 'filled' || status === 'archived'
                return (
                  <div key={listing.id} className="bg-white rounded-2xl border border-out-var shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex">
                      {/* Thumbnail */}
                      <div className="w-28 flex-shrink-0">
                        {listing.images?.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={listing.images[0]} alt={listing.address} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-linen to-surf-lo flex items-center justify-center min-h-[96px]">
                            <span className="material-symbols-outlined text-out-var text-4xl">home</span>
                          </div>
                        )}
                      </div>

                      {/* Body */}
                      <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <p className="font-head font-bold text-clay-dark text-sm truncate">
                              {listing.address}{listing.unit ? `, ${listing.unit}` : ''}
                            </p>
                            <p className="font-body text-muted text-xs">
                              {listing.city}{listing.state ? `, ${listing.state}` : ''}
                            </p>
                          </div>
                          <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-head font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-body text-muted mb-3">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-terra">bed</span>
                            {listing.bedrooms} bed
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-terra">bathtub</span>
                            {listing.bathrooms} bath
                          </span>
                          <span className="font-head font-black text-clay-dark text-sm ml-auto">
                            ${listing.rent.toLocaleString()}<span className="font-normal text-muted text-xs">/mo</span>
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <a href={`/listings/${listing.id}`}
                            className="flex items-center justify-center gap-1 text-xs font-head font-semibold text-clay-dark border border-out-var rounded-lg px-3 py-1.5 hover:border-clay/40 hover:bg-surf-lo transition-all">
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                            View
                          </a>
                          {!isClosedOut && (
                            <button
                              onClick={() => openEdit(listing)}
                              className="flex-1 flex items-center justify-center gap-1 text-xs font-head font-semibold text-clay-dark border border-clay/30 bg-linen rounded-lg py-1.5 hover:bg-clay/10 hover:border-clay/50 transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                              Edit
                            </button>
                          )}
                          {!isClosedOut && (
                            <button
                              onClick={() => handleMarkRented(listing.id)}
                              disabled={togglingId === listing.id}
                              className="flex items-center justify-center gap-1 text-xs font-head font-semibold text-blue-600 border border-blue-200 bg-blue-50 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-all disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              {togglingId === listing.id ? '…' : 'Mark Rented'}
                            </button>
                          )}
                          {!isClosedOut && (
                            <button
                              onClick={() => handleArchive(listing.id)}
                              disabled={togglingId === listing.id}
                              className="flex items-center justify-center gap-1 text-xs font-head font-semibold text-amber-600 border border-amber-200 bg-amber-50 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-all disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-sm">archive</span>
                              {togglingId === listing.id ? '…' : 'Archive'}
                            </button>
                          )}
                          {isClosedOut && (
                            <button
                              onClick={() => handleReactivate(listing.id)}
                              disabled={togglingId === listing.id}
                              className="flex items-center justify-center gap-1 text-xs font-head font-semibold text-green-600 border border-green-200 bg-green-50 rounded-lg px-3 py-1.5 hover:bg-green-100 transition-all disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-sm">play_circle</span>
                              {togglingId === listing.id ? '…' : 'Reactivate'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(listing.id)}
                            disabled={deletingId === listing.id}
                            className="flex items-center justify-center gap-1 text-xs font-head font-semibold text-red-500 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            {deletingId === listing.id ? '…' : ''}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
          })()}

        </div>
      </main>

      {/* ══ EDIT MODAL ══════════════════════════════════════════ */}
      {editListing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(30,20,16,.55)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeEdit() }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-out-var w-full max-w-lg relative flex flex-col"
            style={{ boxShadow: '0 40px 80px rgba(81,53,38,.18)', maxHeight: '90vh' }}
          >
            {/* Modal header */}
            <div className="flex-shrink-0 px-8 pt-8 pb-4 border-b border-out-var/30">
              <button
                onClick={closeEdit}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-outline hover:text-clay hover:bg-surf-lo transition-all"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined fill text-clay text-2xl flex-shrink-0">edit</span>
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-light text-clay-dark leading-tight">Edit <em>listing</em></h2>
                  <p className="text-xs font-body text-muted truncate">{editListing.address}</p>
                </div>
              </div>
            </div>

            {/* Scrollable form body */}
            <div className="overflow-y-auto flex-1 px-8 py-6">
              <form id="edit-form" onSubmit={handleEditSave} className="space-y-5">

                {/* Address (read-only) */}
                <div className="bg-surf-lo border border-out-var/60 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-clay text-base flex-shrink-0">location_on</span>
                  <div className="min-w-0">
                    <p className="text-xs font-head font-bold text-muted uppercase tracking-wider mb-0.5">Address</p>
                    <p className="font-body text-sm text-clay-dark truncate">
                      {editListing.address}{editListing.city ? `, ${editListing.city}` : ''}
                      {editListing.state ? `, ${editListing.state}` : ''}
                    </p>
                  </div>
                </div>

                {/* Unit */}
                <div>
                  <label className={LABEL}>Unit / Apt</label>
                  <input type="text" value={editUnit} onChange={e => setEditUnit(e.target.value)}
                    placeholder="e.g. Apt 2B" className={INPUT} />
                </div>

                {/* Beds / Baths / Rent */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={LABEL}>Beds *</label>
                    <select value={editBedrooms} onChange={e => setEditBedrooms(Number(e.target.value))} className={SELECT}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Baths *</label>
                    <select value={editBathrooms} onChange={e => setEditBathrooms(Number(e.target.value))} className={SELECT}>
                      {[1, 1.5, 2, 2.5, 3].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Rent/mo *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-body">$</span>
                      <input type="number" min="1" value={editRent} onChange={e => setEditRent(e.target.value)}
                        placeholder="1200" required className={INPUT + ' pl-6'} />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={LABEL}>Description</label>
                  <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3}
                    placeholder="Describe the room, house vibe, what you're looking for in a roommate…"
                    className={INPUT + ' resize-none'} />
                </div>

                {/* Lease details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Available From</label>
                    <input type="date" value={editAvailDate} onChange={e => setEditAvailDate(e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Deposit</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-body">$</span>
                      <input type="number" min="0" value={editDeposit} onChange={e => setEditDeposit(e.target.value)}
                        placeholder="0" className={INPUT + ' pl-6'} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Lease Term</label>
                  <select value={editLeaseTerm} onChange={e => setEditLeaseTerm(e.target.value)} className={SELECT}>
                    {['Month-to-month','3 months','6 months','9 months','12 months','18 months','24 months'].map(t =>
                      <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Utilities</label>
                    <select value={editUtilities} onChange={e => setEditUtilities(e.target.value)} className={SELECT}>
                      {['Tenant pays','Included in rent','Partially included'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Pets</label>
                    <select value={editPets} onChange={e => setEditPets(e.target.value)} className={SELECT}>
                      {['Negotiable','Yes','No','Cats only','Small pets only'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <label className={LABEL}>Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITY_OPTIONS.map(a => (
                      <button key={a} type="button" onClick={() => toggleEditAmenity(a)}
                        className={`px-3 py-1.5 rounded-full text-xs font-head font-bold border transition-all
                          ${editAmenities.includes(a)
                            ? 'clay-grad text-white border-transparent shadow-sm'
                            : 'border-out-var text-muted hover:border-clay/50 hover:text-clay-dark'}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <label className={LABEL}>Photos</label>

                  {/* Existing photos */}
                  {editExistingImgs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {editExistingImgs.map((url, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-out-var group flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeExistingImg(url)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xl">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New photo previews */}
                  {editNewPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {editNewPreviews.map((src, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-clay/40 group flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeNewFile(i)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xl">close</span>
                          </button>
                          <span className="absolute bottom-1 left-1 bg-clay text-white text-[8px] font-head font-bold px-1 py-0.5 rounded leading-none">NEW</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload trigger */}
                  <label className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-out-var rounded-xl cursor-pointer hover:border-clay/50 hover:bg-surf-lo/50 transition-all">
                    <span className="material-symbols-outlined text-outline text-lg">add_a_photo</span>
                    <span className="text-sm font-body text-muted">Add photos</span>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleNewFileSelect} />
                  </label>
                  {editExistingImgs.length === 0 && editNewFiles.length === 0 && (
                    <p className="text-[10px] font-body text-muted mt-1.5">Adding photos will publish a draft listing.</p>
                  )}
                </div>

                {/* Error */}
                {editError && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-body text-red-700">
                    <span className="material-symbols-outlined text-red-500 text-base">error</span>
                    {editError}
                  </div>
                )}

              </form>
            </div>

            {/* Sticky footer */}
            <div className="flex-shrink-0 px-8 pb-8 pt-4 border-t border-out-var/30 flex gap-3">
              <button type="button" onClick={closeEdit}
                className="flex-1 py-3 rounded-xl border border-out-var font-head font-bold text-sm text-muted hover:bg-surf-lo hover:text-clay-dark transition-all">
                Cancel
              </button>
              <button
                type="submit"
                form="edit-form"
                disabled={editSaving}
                className="flex-1 clay-grad text-white py-3 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/20 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {editSaving ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    {editStatus ?? 'Saving…'}
                  </>
                ) : editStatus === 'Saved!' ? (
                  <>
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Saved!
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">save</span>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
