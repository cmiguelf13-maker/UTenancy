'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Listing } from '@/lib/types'
import { SCHOOL_OPTIONS } from '@/lib/distance'
import type { User } from '@supabase/supabase-js'

/* ─── Constants ─────────────────────────────────────── */
const AMENITIES_LIST = [
  'In-unit Laundry', 'Shared Laundry', 'Parking', 'Pet Friendly',
  'Furnished', 'Air Conditioning', 'Dishwasher', 'Gym',
  'Pool', 'Rooftop', 'EV Charging', 'Bike Storage',
  'Storage Unit', 'Balcony / Patio', 'Hardwood Floors', 'High Ceilings',
]

/* ─── Types ─────────────────────────────────────────── */
type ListingStatus = 'active' | 'draft' | 'filled' | 'pending' | 'archived'
type FilterTab     = 'all' | ListingStatus
type ParsedAddress = { street: string; city: string; state: string; zip: string }

const STATUS_CONFIG: Record<ListingStatus, { label: string; bg: string; dot: string }> = {
  active:   { label: 'Active',   bg: 'bg-green-50 text-green-700 border border-green-200',  dot: 'bg-green-500' },
  draft:    { label: 'Draft',    bg: 'bg-stone-100 text-stone-500 border border-stone-200', dot: 'bg-stone-400' },
  filled:   { label: 'Filled',   bg: 'bg-blue-50 text-blue-700 border border-blue-200',     dot: 'bg-blue-500'  },
  pending:  { label: 'Pending',  bg: 'bg-orange-50 text-orange-700 border border-orange-200', dot: 'bg-orange-500' },
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

/** Auto-generate a property description when the landlord leaves it blank */
function generateDescription({
  bedrooms,
  bathrooms,
  rent,
  type,
  amenities,
  city,
}: {
  bedrooms: number
  bathrooms: number
  rent: number
  type: 'open-room' | 'group-formation'
  amenities: string[]
  city: string
}): string {
  const isGroup   = type === 'group-formation'
  const bedWord   = bedrooms === 1 ? 'one-bedroom' : `${bedrooms}-bedroom`
  const bathWord  = bathrooms === 1 ? '1 bathroom' : `${bathrooms} bathrooms`

  const intro = isGroup
    ? `Group formation opportunity — join a ${bedWord} home in ${city} with like-minded housemates.`
    : `A well-maintained ${bedWord} unit in ${city}, available now.`

  const rentLine  = `Priced at $${rent.toLocaleString()}/month with ${bathWord}.`

  const topAmenities = amenities.slice(0, 4)
  const amenityLine  = topAmenities.length > 0
    ? `The property includes ${topAmenities.map((a) => a.toLowerCase()).join(', ')}.`
    : ''

  const closing = isGroup
    ? 'Reach out to meet your potential housemates and learn more about the space.'
    : 'Contact the landlord to schedule a viewing or for any questions.'

  return [intro, rentLine, amenityLine, closing].filter(Boolean).join(' ')
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
function StatCard({ icon, value, label, sub, href }: {
  icon: string; value: string | number; label: string; sub?: string; href?: string
}) {
  const inner = (
    <>
      <div className="mb-3">
        <div className="w-10 h-10 clay-grad rounded-xl flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined fill text-white text-lg">{icon}</span>
        </div>
      </div>
      <p className="font-display text-3xl font-light text-clay-dark italic">{value}</p>
      <p className="text-sm font-head font-semibold text-espresso mt-0.5">{label}</p>
      {sub && <p className="text-xs font-body text-muted mt-0.5">{sub}</p>}
      {href && (
        <p className="text-xs font-head text-clay mt-2 flex items-center gap-0.5">
          View households <span className="material-symbols-outlined" style={{ fontSize: 12 }}>arrow_forward</span>
        </p>
      )}
    </>
  )
  if (href) {
    return (
      <Link href={href} className="bg-white rounded-2xl border border-out-var p-5 shadow-sm hover:border-clay/40 hover:shadow-md transition-all block">
        {inner}
      </Link>
    )
  }
  return (
    <div className="bg-white rounded-2xl border border-out-var p-5 shadow-sm">
      {inner}
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

/* ─── SchoolPicker ───────────────────────────────────── */
function SchoolPicker({ selected, onChange }: {
  selected: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(slug: string) {
    onChange(selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug]
    )
  }
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {SCHOOL_OPTIONS.map((school) => (
        <button key={school.slug} type="button" onClick={() => toggle(school.slug)}
          className={`px-3 py-1.5 rounded-full text-xs font-head font-semibold border transition-all flex items-center gap-1.5
            ${selected.includes(school.slug)
              ? 'clay-grad text-white border-transparent shadow-sm'
              : 'bg-white border-out-var text-muted hover:border-clay/50 hover:text-clay-dark'}`}>
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>school</span>
          {school.short}
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
  onReview:     (l: Listing, type: 'applicants' | 'interested') => void
  onEdit:       (l: Listing) => void
  onArchive:    (id: string) => void
  onMarkRented: (id: string) => void
}) {
  const typeLabel = listing.type === 'open-room' ? 'Open Room' : 'Group Formation'
  const typeBg    = listing.type === 'open-room' ? 'bg-terra/90' : 'bg-clay/90'
  const status = safeStatus(listing.status)
  const isClosedOut = status === 'filled' || status === 'archived'

  const interestCount = Array.isArray(listing.interest_count)
    ? (listing.interest_count[0]?.count ?? 0)
    : (listing.interest_count ?? 0)

  const appCount = Array.isArray(listing.application_count)
    ? (listing.application_count[0]?.count ?? 0)
    : (listing.application_count ?? 0)

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

        {/* Applicants & Interested buttons */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => onReview(listing, 'applicants')}
            className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 text-xs font-head font-semibold bg-surf-lo rounded-xl px-2 py-2 text-clay-dark hover:bg-linen transition-all border border-out-var/50 hover:border-clay/30">
            <span className="relative inline-flex items-center justify-center">
              <span className="material-symbols-outlined text-lg text-clay leading-none">assignment_turned_in</span>
              {appCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 rounded-full bg-clay text-white text-[9px] font-black flex items-center justify-center px-1 leading-none">{appCount}</span>
              )}
            </span>
            <span className="leading-none">Applicants</span>
          </button>
          <button onClick={() => onReview(listing, 'interested')}
            className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 text-xs font-head font-semibold bg-surf-lo rounded-xl px-2 py-2 text-clay-dark hover:bg-linen transition-all border border-out-var/50 hover:border-clay/30">
            <span className="relative inline-flex items-center justify-center">
              <span className="material-symbols-outlined text-lg text-terra leading-none">favorite</span>
              {interestCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 rounded-full bg-terra text-white text-[9px] font-black flex items-center justify-center px-1 leading-none">{interestCount}</span>
              )}
            </span>
            <span className="leading-none">Interested</span>
          </button>
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

/* ─── ListingFormFields ─────────────────────────────── */
function ListingFormFields({
  defaults,
  amenities,
  setAmenities,
  schools,
  setSchools,
  existingImagePreviews,
  onRemoveExisting,
  newPreviews,
  onRemoveNew,
  onNewFileSelect,
  saving,
  statusMsg,
  onAddressParsed,
}: {
  defaults?: Listing | null
  amenities: string[]
  setAmenities: (a: string[]) => void
  schools: string[]
  setSchools: (s: string[]) => void
  existingImagePreviews?: string[]
  onRemoveExisting?: (url: string) => void
  newPreviews: string[]
  onRemoveNew: (i: number) => void
  onNewFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  saving: boolean
  statusMsg: string | null
  onAddressParsed?: (addr: ParsedAddress) => void
}) {
  const autocompleteInputRef = useRef<HTMLInputElement>(null)

  const [parsedAddress, setParsedAddress] = useState<{
    street: string; city: string; state: string; zip: string
  } | null>(
    defaults?.address
      ? { street: defaults.address, city: defaults.city ?? '', state: defaults.state ?? 'CA', zip: defaults.zip ?? '' }
      : null
  )

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key) return

    function initAutocomplete() {
      const inputEl = autocompleteInputRef.current
      if (!inputEl || !(window as any).google) return
      const ac = new (window as any).google.maps.places.Autocomplete(inputEl, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components'],
      })
      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        const comps: { types: string[]; long_name: string; short_name: string }[] =
          place.address_components ?? []
        let streetNum = '', route = '', city = '', state = '', zip = ''
        for (let i = 0; i < comps.length; i++) {
          const c = comps[i]
          if (c.types.indexOf('street_number') !== -1)               streetNum = c.long_name
          else if (c.types.indexOf('route') !== -1)                  route     = c.short_name
          else if (c.types.indexOf('locality') !== -1)               city      = c.long_name
          else if (c.types.indexOf('administrative_area_level_1') !== -1) state = c.short_name
          else if (c.types.indexOf('postal_code') !== -1)            zip       = c.long_name
        }
        const street = streetNum ? `${streetNum} ${route}` : route
        setParsedAddress({ street, city, state, zip })
        if (onAddressParsed) onAddressParsed({ street, city, state, zip })
        // Show just the street in the visible input
        if (autocompleteInputRef.current) autocompleteInputRef.current.value = street
      })
    }

    const scriptId = 'google-maps-places-api'
    if (document.getElementById(scriptId)) {
      initAutocomplete()
      return
    }
    const script    = document.createElement('script')
    script.id       = scriptId
    script.src      = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
    script.async    = true
    script.onload   = initAutocomplete
    document.head.appendChild(script)
  }, [])

  // Initial display value: show full address string so user can see what's saved
  const displayValue = defaults?.address
    ? [defaults.address, defaults.city, defaults.state].filter(Boolean).join(', ')
    : ''

  return (
    <>
      {/* Address Search */}
      <div>
        <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">
          Property Address *
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
            search
          </span>
          <input
            ref={autocompleteInputRef}
            name="address_visible"
            type="text"
            className="auth-input"
            placeholder="Search address…"
            defaultValue={displayValue}
            required
          />
        </div>
      </div>

      {/* Confirmed address chip — shown after autocomplete selection */}
      {parsedAddress && (
        <div className="flex items-center gap-2 px-3 py-2 bg-surf-lo rounded-xl border border-out-var text-xs font-body">
          <span className="material-symbols-outlined text-clay" style={{ fontSize: 15 }}>location_on</span>
          <span className="font-semibold text-clay-dark">{parsedAddress.street}</span>
          <span className="text-outline">·</span>
          <span className="text-muted">{parsedAddress.city}, {parsedAddress.state} {parsedAddress.zip}</span>
        </div>
      )}

      {/* Unit */}
      <div>
        <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Unit (optional)</label>
        <input type="text" name="unit" className="auth-input no-icon" placeholder="Unit 3B"
          defaultValue={defaults?.unit ?? ''} />
      </div>

      {/* Beds / Baths / Rent */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="min-w-0">
          <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Beds *</label>
          <input type="number" name="bedrooms" min={1} className="auth-input no-icon" placeholder="3"
            defaultValue={defaults?.bedrooms ?? ''} required />
        </div>
        <div className="min-w-0">
          <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Baths *</label>
          <input type="number" name="bathrooms" min={0.5} step={0.5} className="auth-input no-icon" placeholder="2"
            defaultValue={defaults?.bathrooms ?? ''} required />
        </div>
        <div className="min-w-0 col-span-2 sm:col-span-1">
          <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Rent / mo · per person *</label>
          <input type="number" name="rent" min={0} className="auth-input no-icon" placeholder="950"
            defaultValue={defaults?.rent ?? ''} required />
        </div>
      </div>

      {/* Listing type — landlords only post group-formation listings */}
      {/* Open-room listings are posted by students via Post a Room */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surf-lo rounded-xl border border-out-var/40 text-xs font-body text-muted">
        <span className="material-symbols-outlined text-clay" style={{ fontSize: 15 }}>group</span>
        Listing type: <span className="font-head font-bold text-clay-dark">Group Formation</span>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">
          Description
          <span className="font-normal normal-case text-muted ml-1">(optional — we&apos;ll write one if left blank)</span>
        </label>
        <textarea name="description" rows={3} defaultValue={defaults?.description ?? ''}
          placeholder="Describe the property, neighbourhood, lease terms… or leave blank to auto-generate."
          className="w-full bg-white border-[1.5px] border-out-var rounded-xl px-4 py-3 font-body text-sm text-stone outline-none resize-none transition-all focus:border-clay focus:shadow-[0_0_0_3px_rgba(107,76,59,.12)] placeholder:text-[#a89990]" />
      </div>

      {/* Lease Details */}
      <div className="space-y-3 pt-1 pb-1">
        <p className="text-xs font-head font-bold text-clay-dark uppercase tracking-wider">Lease Details</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <label className="block text-xs font-head font-semibold text-muted uppercase tracking-wider mb-2">Available From</label>
            <input
              type="date"
              name="available_date"
              className="auth-input no-icon"
              defaultValue={(defaults as any)?.available_date?.slice(0, 10) ?? ''}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-head font-semibold text-muted uppercase tracking-wider mb-2">Security Deposit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-body pointer-events-none">$</span>
              <input
                type="number"
                name="deposit"
                min="0"
                className="auth-input no-icon"
                style={{ paddingLeft: 24 }}
                placeholder="0"
                defaultValue={(defaults as any)?.deposit ?? ''}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-head font-semibold text-muted uppercase tracking-wider mb-2">Lease Term</label>
          <select
            name="lease_term"
            className="auth-input no-icon"
            defaultValue={(defaults as any)?.lease_term ?? '12 months'}
          >
            <option>Month-to-month</option>
            <option>3 months</option>
            <option>6 months</option>
            <option>9 months</option>
            <option>12 months</option>
            <option>18 months</option>
            <option>24 months</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <label className="block text-xs font-head font-semibold text-muted uppercase tracking-wider mb-2">Utilities</label>
            <select
              name="utilities"
              className="auth-input no-icon"
              defaultValue={(defaults as any)?.utilities ?? 'Tenant pays'}
            >
              <option>Tenant pays</option>
              <option>Included in rent</option>
              <option>Partially included</option>
            </select>
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-head font-semibold text-muted uppercase tracking-wider mb-2">Pets Allowed</label>
            <select
              name="pets_allowed"
              className="auth-input no-icon"
              defaultValue={(defaults as any)?.pets_allowed ?? 'Negotiable'}
            >
              <option>Negotiable</option>
              <option>Yes</option>
              <option>No</option>
              <option>Cats only</option>
              <option>Small pets only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-1">Amenities</label>
        <AmenityPills selected={amenities} onChange={setAmenities} />
      </div>

      {/* Target Schools */}
      <div>
        <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-1">
          Promote to Schools
          <span className="font-normal normal-case text-muted ml-1">(select all that apply)</span>
        </label>
        <p className="text-[11px] font-body text-muted mb-1">Students at these schools will see walking distance to their campus on your listing.</p>
        <SchoolPicker selected={schools} onChange={setSchools} />
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
  type RentApplication = {
    id: string
    user_id: string
    status: string
    created_at: string
    message: string | null
    full_name: string | null
    phone: string | null
    date_of_birth: string | null
    university: string | null
    enrollment_status: string | null
    major: string | null
    grad_year: string | null
    employment_status: string | null
    monthly_income: number | null
    has_cosigner: boolean | null
    cosigner_name: string | null
    move_in_date: string | null
    lease_term: string | null
    num_occupants: number | null
    has_pets: boolean | null
    pets_description: string | null
    rejection_reason: string | null
    profile: { id: string; first_name: string | null; last_name: string | null; university: string | null; bio: string | null } | null
  }
  const [reviewListing,     setReviewListing]     = useState<Listing | null>(null)
  const [applicants,         setApplicants]         = useState<Array<{ id: string; first_name: string | null; last_name: string | null; university: string | null; bio: string | null }>>([])
  const [rentApplications,   setRentApplications]   = useState<RentApplication[]>([])
  const [loadingApplicants,  setLoadingApplicants]  = useState(false)
  const [reviewModalType,    setReviewModalType]    = useState<'applicants' | 'interested'>('applicants')
  const [expandedAppId,      setExpandedAppId]      = useState<string | null>(null)
  const [rejectingAppId,     setRejectingAppId]     = useState<string | null>(null)
  const [rejectionReason,    setRejectionReason]    = useState('')
  const [appActionMsg,       setAppActionMsg]       = useState<string | null>(null)

  /* ── Subscription ── */
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('free')
  const [subscriptionTier,   setSubscriptionTier]   = useState<string>('free')
  const [checkingOut,        setCheckingOut]        = useState(false)
  const [checkoutMsg,        setCheckoutMsg]        = useState<string | null>(null)
  const [showTierPicker,     setShowTierPicker]     = useState(false)
  const [managingBilling,    setManagingBilling]    = useState(false)

  /* ── CREATE listing state ── */
  const [showAddModal,    setShowAddModal]    = useState(false)
  const [addListingType,  setAddListingType]  = useState<'open-room' | 'group-formation'>('group-formation')
  const [addAmenities,    setAddAmenities]    = useState<string[]>([])
  const [addSchools,      setAddSchools]      = useState<string[]>([])
  const [addFiles,        setAddFiles]        = useState<File[]>([])
  const [addPreviews,     setAddPreviews]     = useState<string[]>([])
  const [savingAdd,       setSavingAdd]       = useState(false)
  const [addStatus,       setAddStatus]       = useState<string | null>(null)
  const [addFormAddress,  setAddFormAddress]  = useState<ParsedAddress | null>(null)

  /* ── EDIT listing state ── */
  const [editListing,       setEditListing]       = useState<Listing | null>(null)
  const [editFormAddress,   setEditFormAddress]   = useState<ParsedAddress | null>(null)
  const [editListingType,   setEditListingType]   = useState<'open-room' | 'group-formation'>('group-formation')
  const [editAmenities,     setEditAmenities]     = useState<string[]>([])
  const [editSchools,       setEditSchools]       = useState<string[]>([])
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

      // Fetch subscription status + tier from profile
      supabase
        .from('profiles')
        .select('subscription_status, subscription_tier')
        .eq('id', u.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.subscription_status) setSubscriptionStatus(profile.subscription_status)
          if (profile?.subscription_tier)   setSubscriptionTier(profile.subscription_tier)
        })

      supabase
        .from('listings')
        .select('*, interest_count:listing_interests(count), application_count:rent_applications(count)')
        .eq('landlord_id', u.id)
        .order('created_at', { ascending: false })
        .then(({ data: rows }) => {
          if (rows) setListings(rows)
          setLoading(false)
        })
    })

    // Handle redirect back from Stripe Checkout
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success') {
      const t = params.get('tier') ?? 'Pro'
      const tierLabel = t.charAt(0).toUpperCase() + t.slice(1)
      setCheckoutMsg(`🎉 Welcome to ${tierLabel}! Your subscription is now active.`)
      window.history.replaceState({}, '', '/landlord')
    } else if (params.get('checkout') === 'cancelled') {
      setCheckoutMsg('Checkout cancelled — you can upgrade anytime.')
      window.history.replaceState({}, '', '/landlord')
    } else if (params.get('billing') === 'returned') {
      setCheckoutMsg('Billing portal closed. Changes may take a moment to reflect.')
      window.history.replaceState({}, '', '/landlord')
    }
  }, [])

  /* ── Manage Billing (→ Stripe Customer Portal) ── */
  async function handleManageBilling() {
    setManagingBilling(true)
    try {
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        setCheckoutMsg(json.error ?? 'Could not open billing portal. Please try again.')
        setManagingBilling(false)
      }
    } catch {
      setCheckoutMsg('Network error — please try again.')
      setManagingBilling(false)
    }
  }

  /* ── Upgrade (pick tier → Stripe Checkout) ── */
  async function handleUpgrade(tier: 'starter' | 'growth' | 'pro' = 'pro') {
    setCheckingOut(true)
    setShowTierPicker(false)
    try {
      const res  = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        setCheckoutMsg(json.error ?? 'Something went wrong. Please try again.')
        setCheckingOut(false)
      }
    } catch {
      setCheckoutMsg('Network error — please try again.')
      setCheckingOut(false)
    }
  }

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
    const address     = addFormAddress?.street ?? ''
    const city        = addFormAddress?.city   ?? ''
    const state       = addFormAddress?.state  ?? 'CA'
    const zip         = addFormAddress?.zip    ?? ''
    const unit        = (form.elements.namedItem('unit')        as HTMLInputElement).value.trim()
    const bedrooms    = parseInt((form.elements.namedItem('bedrooms')  as HTMLInputElement).value)
    const bathrooms   = parseFloat((form.elements.namedItem('bathrooms') as HTMLInputElement).value)
    const rent        = parseInt((form.elements.namedItem('rent')      as HTMLInputElement).value)
    const description   = (form.elements.namedItem('description')   as HTMLTextAreaElement).value.trim()
    const availableDate = (form.elements.namedItem('available_date') as HTMLInputElement).value
    const leaseTerm     = (form.elements.namedItem('lease_term')     as HTMLSelectElement).value
    const depositRaw    = (form.elements.namedItem('deposit')        as HTMLInputElement).value
    const utilities     = (form.elements.namedItem('utilities')      as HTMLSelectElement).value
    const petsAllowed   = (form.elements.namedItem('pets_allowed')   as HTMLSelectElement).value

    if (!address) {
      setAddStatus('Please search and select a property address from the dropdown.')
      return
    }

    /* ── Enforce per-plan listing limits ── */
    const LISTING_LIMITS: Record<string, number> = { free: 1, starter: 3, growth: 10 }
    const tierLimit = LISTING_LIMITS[subscriptionTier]
    const activeListings = listings.filter(l => l.status !== 'archived' && l.status !== 'filled')
    if (tierLimit !== undefined && activeListings.length >= tierLimit) {
      setAddStatus(
        `Your ${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} plan allows up to ${tierLimit} active listing${tierLimit !== 1 ? 's' : ''}. ` +
        `Archive or remove a listing, or upgrade your plan to add more.`
      )
      return
    }

    const hasRequired = !!(address && city && rent && !isNaN(bedrooms) && !isNaN(bathrooms))
    const isDraft = !hasRequired || addFiles.length === 0

    /* Auto-generate a description if the landlord left it blank */
    const finalDescription = description || generateDescription({
      bedrooms:  isNaN(bedrooms)  ? 1 : bedrooms,
      bathrooms: isNaN(bathrooms) ? 1 : bathrooms,
      rent:      isNaN(rent)      ? 0 : rent,
      type:      addListingType,
      amenities: addAmenities,
      city:      city || '',
    })

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
        type:           addListingType,
        status:         isDraft ? 'draft' : 'active',
        description:    finalDescription,
        amenities:      addAmenities,
        target_schools: addSchools,
        images:         [],
        available_date: availableDate || null,
        lease_term:     leaseTerm || null,
        deposit:        depositRaw ? parseInt(depositRaw) : null,
        utilities:      utilities || null,
        pets_allowed:   petsAllowed || null,
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
      setTimeout(() => {
        setShowAddModal(false)
        setSavingAdd(false)
        setAddStatus(null)
        setAddFiles([])
        setAddPreviews([])
        setAddAmenities([])
        setAddSchools([])
        setAddListingType('group-formation')
        form.reset()
      }, 2000)
    }

    setTimeout(() => {
      setShowAddModal(false)
      setSavingAdd(false)
      setAddStatus(null)
      setAddFiles([])
      setAddPreviews([])
      setAddAmenities([])
      setAddSchools([])
      setAddListingType('group-formation')
      form.reset()
    }, 2000)
  }

  /* ── EDIT listing open ── */
  function handleEditOpen(listing: Listing) {
    setEditListing(listing)
    setEditListingType(listing.type)
    setEditAmenities(listing.amenities ?? [])
    setEditSchools(listing.target_schools ?? [])
    setEditFormAddress({ street: listing.address ?? '', city: listing.city ?? '', state: listing.state ?? 'CA', zip: listing.zip ?? '' })
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
    const address     = editFormAddress?.street ?? editListing.address ?? ''
    const city        = editFormAddress?.city   ?? editListing.city   ?? ''
    const state       = editFormAddress?.state  ?? editListing.state  ?? 'CA'
    const zip         = editFormAddress?.zip    ?? editListing.zip    ?? ''
    const unit        = (form.elements.namedItem('unit')        as HTMLInputElement).value.trim()
    const bedrooms    = parseInt((form.elements.namedItem('bedrooms')  as HTMLInputElement).value)
    const bathrooms   = parseFloat((form.elements.namedItem('bathrooms') as HTMLInputElement).value)
    const rent        = parseInt((form.elements.namedItem('rent')      as HTMLInputElement).value)
    const description   = (form.elements.namedItem('description')   as HTMLTextAreaElement).value.trim()
    const availableDate = (form.elements.namedItem('available_date') as HTMLInputElement).value
    const leaseTerm     = (form.elements.namedItem('lease_term')     as HTMLSelectElement).value
    const depositRaw    = (form.elements.namedItem('deposit')        as HTMLInputElement).value
    const utilities     = (form.elements.namedItem('utilities')      as HTMLSelectElement).value
    const petsAllowed   = (form.elements.namedItem('pets_allowed')   as HTMLSelectElement).value

    if (!address) {
      setEditStatus('Please search and select a property address from the dropdown.')
      return
    }

    setSavingEdit(true)
    setEditStatus('Saving…')

    /* Delete any images the user removed from the existing set */
    const removedImages = (editListing.images ?? []).filter((url) => !editExistingImgs.includes(url))
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
        type:           editListingType,
        status:         newStatus,
        description:    description || null,
        amenities:      editAmenities,
        target_schools: editSchools,
        images:         allImages,
        available_date: availableDate || null,
        lease_term:     leaseTerm || null,
        deposit:        depositRaw ? parseInt(depositRaw) : null,
        utilities:      utilities || null,
        pets_allowed:   petsAllowed || null,
        updated_at:     new Date().toISOString(),
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
      .update({ status: 'filled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (updated) setListings((prev) => prev.map((l) => (l.id === id ? updated : l)))
  }

  /* ── REVIEW applicants ── */
  async function handleReview(listing: Listing, type: 'applicants' | 'interested') {
    setReviewListing(listing)
    setReviewModalType(type)
    setApplicants([])
    setRentApplications([])
    setLoadingApplicants(true)

    const [{ data: interests }, { data: rawApps }] = await Promise.all([
      supabase
        .from('listing_interests')
        .select('student_id')
        .eq('listing_id', listing.id),
      supabase
        .from('rent_applications')
        .select('id, user_id, status, created_at, message, full_name, phone, date_of_birth, university, enrollment_status, major, grad_year, employment_status, monthly_income, has_cosigner, cosigner_name, move_in_date, lease_term, num_occupants, has_pets, pets_description, rejection_reason')
        .eq('listing_id', listing.id)
        .order('created_at', { ascending: false }),
    ])

    if (interests && interests.length > 0) {
      const studentIds = interests.map((r: any) => r.student_id).filter(Boolean)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, university, bio')
        .in('id', studentIds)
      setApplicants(profileData || [])
    }

    if (rawApps && rawApps.length > 0) {
      // Fetch profiles separately (user_id → auth.users, profiles share the same id)
      const userIds = rawApps.map((a: any) => a.user_id).filter(Boolean)
      const { data: profData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, university, bio')
        .in('id', userIds)
      const profileMap: Record<string, any> = {}
      if (profData) profData.forEach((p: any) => { profileMap[p.id] = p })
      setRentApplications(rawApps.map((a: any) => ({ ...a, profile: profileMap[a.user_id] ?? null })))
    }
    setLoadingApplicants(false)
  }

  /* ── UPDATE application status (approve / shortlist / reject) ── */
  async function handleUpdateAppStatus(appId: string, newStatus: string, reason?: string) {
    setAppActionMsg(null)
    const payload: Record<string, string> = { status: newStatus }
    if (reason) payload.rejection_reason = reason
    const { error } = await supabase.from('rent_applications').update(payload).eq('id', appId)
    if (error) { setAppActionMsg('Could not update status. Please try again.'); return }

    /* ── On approval: auto-create a household linked to the listing ── */
    if (newStatus === 'approved' && reviewListing) {
      const app = rentApplications.find((a) => a.id === appId)
      if (app?.user_id) {
        const householdName = reviewListing.unit
          ? `${reviewListing.address} ${reviewListing.unit}`
          : reviewListing.address
        const { data: hh, error: hhErr } = await supabase
          .from('households')
          .insert({ name: householdName, listing_id: reviewListing.id, created_by: app.user_id })
          .select('id')
          .single()
        if (!hhErr && hh) {
          await supabase.from('household_members').insert({
            household_id: hh.id,
            user_id:      app.user_id,
            role:         'admin',
          })
          /* Mark listing as filled */
          await supabase.from('listings').update({ status: 'filled' }).eq('id', reviewListing.id)
          setListings((prev) => prev.map((l) => l.id === reviewListing.id ? { ...l, status: 'filled' as ListingStatus } : l))
          setAppActionMsg('Tenant approved — household created and listing marked as filled.')
        } else {
          setAppActionMsg('Tenant approved, but household could not be created. Please try again.')
        }
      }
    }

    setRentApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: newStatus, rejection_reason: reason ?? a.rejection_reason } : a))
    setRejectingAppId(null)
    setRejectionReason('')
  }

  /* ── Open a message thread with the applicant ── */
  async function handleMessageApplicant(profileId: string) {
    if (!reviewListing || !user) return
    const err = await (async () => {
      const { data: convId, error } = await supabase.rpc('open_conversation', {
        p_listing_id: reviewListing.id,
        p_user_a:     user.id,
        p_user_b:     profileId,
      })
      if (error || !convId) return error?.message ?? 'Could not open chat'
      window.location.href = `/messages/${convId}`
      return null
    })()
    if (err) setAppActionMsg('Could not open chat: ' + err)
  }

  /* ── Download application as formatted PDF (print-to-PDF) ── */
  function handleDownloadPDF(app: RentApplication, listingAddress: string) {
    const w = window.open('', '_blank', 'width=800,height=900')
    if (!w) return
    const dob = app.date_of_birth ? new Date(app.date_of_birth + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'
    const moveIn = app.move_in_date ? new Date(app.move_in_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'
    const submitted = new Date(app.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const row = (label: string, value: string | null | undefined | number | boolean) => {
      if (value === null || value === undefined || value === '') return ''
      const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
      return `<tr><td style="padding:6px 12px;font-weight:600;color:#6b4c3b;width:38%;border-bottom:1px solid #f0e8e3">${label}</td><td style="padding:6px 12px;color:#2e1e18;border-bottom:1px solid #f0e8e3">${display}</td></tr>`
    }
    const section = (title: string, rows: string) => `
      <div style="margin-bottom:20px">
        <div style="background:#6b4c3b;color:#fff;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:6px 14px;border-radius:6px 6px 0 0">${title}</div>
        <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e8d8d0;border-top:none;border-radius:0 0 6px 6px">${rows}</table>
      </div>`
    w.document.write(`<!DOCTYPE html><html><head><title>Rental Application — ${app.full_name ?? 'Applicant'}</title>
    <style>body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#2e1e18;margin:0;padding:0;background:#faf5f2}
    @media print{body{background:#fff}}</style></head><body>
    <div style="max-width:680px;margin:0 auto;padding:32px 24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div>
          <div style="font-size:22px;font-weight:300;color:#6b4c3b;letter-spacing:-.02em">Rental Application</div>
          <div style="font-size:13px;color:#9c7060;margin-top:2px">${listingAddress}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:#9c7060">Submitted</div>
          <div style="font-size:13px;font-weight:600;color:#2e1e18">${submitted}</div>
        </div>
      </div>
      <hr style="border:none;border-top:2px solid #6b4c3b;margin-bottom:24px">
      ${section('Personal Information', [
        row('Full Legal Name', app.full_name),
        row('Date of Birth', dob),
        row('Phone', app.phone),
        row('University / School', app.university),
        row('Enrollment Status', app.enrollment_status),
        row('Major / Field of Study', app.major),
        row('Expected Graduation', app.grad_year),
      ].join(''))}
      ${section('Financial Information', [
        row('Employment Status', app.employment_status),
        row('Monthly Income', app.monthly_income ? '$' + Number(app.monthly_income).toLocaleString() : null),
        row('Has Co-signer / Guarantor', app.has_cosigner ? 'Yes' : 'No'),
        row('Co-signer Name', app.cosigner_name),
      ].join(''))}
      ${section('Move-in Preferences', [
        row('Desired Move-in Date', moveIn),
        row('Lease Term', app.lease_term),
        row('Total Occupants', app.num_occupants),
        row('Has Pets', app.has_pets ? 'Yes' : 'No'),
        row('Pet Description', app.pets_description),
      ].join(''))}
      ${app.message ? section('Message to Landlord', `<tr><td colspan="2" style="padding:12px;color:#2e1e18;font-style:italic">"${app.message}"</td></tr>`) : ''}
      <div style="margin-top:24px;padding:12px 16px;background:#fff;border:1px solid #e8d8d0;border-radius:8px;font-size:11px;color:#9c7060">
        This document was generated from the UTenancy platform. It is not a lease agreement. The applicant confirmed all information is accurate.
      </div>
    </div>
    <script>setTimeout(function(){window.print()},400)</script>
    </body></html>`)
    w.document.close()
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
  const filledCount   = listings.filter((l) => l.status === 'filled').length
  const archivedCount = listings.filter((l) => l.status === 'archived').length

  /* ─── RENDER ─── */
  return (
    <div className="min-h-screen bg-cream">

      {/* ── TOPBAR ── */}
      <header className="sticky top-0 z-50 glass border-b border-out-var/20">
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="UTenancy" className="h-8 w-auto" />
            </Link>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-head font-bold text-terra uppercase tracking-widest leading-none">Landlord Portal</span>
            </div>
          </div>

          {/* Filter tabs (desktop) */}
          <div className="hidden md:flex items-center gap-1 bg-surf-hi border border-out-var rounded-full px-1 py-1">
            {(['all', 'active', 'draft', 'filled', 'pending', 'archived'] as FilterTab[]).map((f) => (
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
            {/* Starter+ nav links */}
            {['starter','growth','pro'].includes(subscriptionTier) && (
              <Link href="/landlord/households"
                className="hidden md:flex items-center gap-1.5 text-sm font-head font-semibold text-muted hover:text-clay transition-colors px-3 py-2 rounded-full hover:bg-linen">
                <span className="material-symbols-outlined text-base">home_work</span> Households
              </Link>
            )}
            {['starter','growth','pro'].includes(subscriptionTier) && (
              <Link href="/landlord/analytics"
                className="hidden md:flex items-center gap-1.5 text-sm font-head font-semibold text-muted hover:text-clay transition-colors px-3 py-2 rounded-full hover:bg-linen">
                <span className="material-symbols-outlined text-base">analytics</span> Analytics
              </Link>
            )}
            {subscriptionTier === 'pro' && (
              <Link href="/landlord/api-access"
                className="hidden md:flex items-center gap-1.5 text-sm font-head font-semibold text-muted hover:text-clay transition-colors px-3 py-2 rounded-full hover:bg-linen">
                <span className="material-symbols-outlined text-base">api</span> API
              </Link>
            )}
            {/* Tier badge / Manage Billing or Upgrade button */}
            {['starter','growth','pro'].includes(subscriptionTier) ? (
              <button
                onClick={handleManageBilling}
                disabled={managingBilling}
                title="Manage billing"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-head font-bold clay-grad text-white shadow-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-60">
                <span className="material-symbols-outlined fill text-sm">workspace_premium</span>
                {managingBilling ? 'Opening…' : subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}
              </button>
            ) : subscriptionStatus === 'past_due' ? (
              <button
                onClick={handleManageBilling}
                disabled={managingBilling}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-head font-bold bg-red-500 text-white shadow-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-60">
                <span className="material-symbols-outlined text-sm">warning</span>
                {managingBilling ? 'Opening…' : 'Payment Issue'}
              </button>
            ) : (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowTierPicker(p => !p)}
                  disabled={checkingOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-head font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-60">
                  <span className="material-symbols-outlined text-sm">workspace_premium</span>
                  {checkingOut ? 'Redirecting…' : 'Upgrade'}
                </button>
                {showTierPicker && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-out-var shadow-xl z-50 overflow-hidden">
                    {([
                      { tier: 'starter' as const, price: '$29/mo', label: 'Starter', sub: 'Up to 3 properties' },
                      { tier: 'growth'  as const, price: '$59/mo', label: 'Growth',  sub: 'Up to 10 properties' },
                      { tier: 'pro'     as const, price: '$129/mo', label: 'Pro',    sub: 'Unlimited + API access' },
                    ]).map(opt => (
                      <button key={opt.tier} onClick={() => handleUpgrade(opt.tier)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-linen transition-colors text-left border-b border-out-var last:border-0">
                        <div>
                          <p className="text-sm font-head font-bold text-espresso">{opt.label}</p>
                          <p className="text-xs font-body text-muted">{opt.sub}</p>
                        </div>
                        <span className="text-xs font-head font-bold text-clay-dark">{opt.price}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button onClick={() => setShowAddModal(true)}
              className="clay-grad text-white px-3 sm:px-4 py-2 rounded-full font-head text-sm font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">add</span>
              <span className="hidden sm:inline">Add Listing</span>
            </button>
            <Link href="/profile"
              className="flex items-center gap-2 bg-white border border-out-var rounded-full pl-1 pr-3 py-1 hover:border-clay/50 hover:bg-linen transition-all">
              <div className="w-7 h-7 clay-grad rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-head font-black text-xs">{firstName[0]?.toUpperCase() ?? 'L'}</span>
              </div>
              <span className="text-sm font-head font-semibold text-clay-dark hidden md:block">{firstName}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Checkout / billing message banner ── */}
      {checkoutMsg && (
        <div className="max-w-7xl mx-auto px-6 md:px-10 pt-4">
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border
            bg-amber-50 border-amber-200 text-amber-800">
            <span className="text-sm font-body">{checkoutMsg}</span>
            <button onClick={() => setCheckoutMsg(null)}
              className="flex-shrink-0 text-amber-500 hover:text-amber-700 transition-colors">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Past-due warning banner ── */}
      {subscriptionStatus === 'past_due' && (
        <div className="max-w-7xl mx-auto px-6 md:px-10 pt-4">
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border bg-red-50 border-red-200 text-red-800">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-red-500">warning</span>
              <span className="text-sm font-body">Your payment is past due. Update your billing details to keep your listings active.</span>
            </div>
            <button
              onClick={handleManageBilling}
              disabled={managingBilling}
              className="flex-shrink-0 text-xs font-head font-bold text-red-600 hover:text-red-800 underline underline-offset-2 transition-colors disabled:opacity-60">
              {managingBilling ? 'Opening…' : 'Fix now'}
            </button>
          </div>
        </div>
      )}

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
        {(() => {
          const received = listings.filter(l => l.status === 'filled').reduce((s, l) => s + l.rent, 0)
          const due      = listings.filter(l => l.status === 'active' || l.status === 'filled').reduce((s, l) => s + l.rent, 0)
          const revenueVal = `$${received.toLocaleString()} / $${due.toLocaleString()}`
          const canSeeHouseholds = ['starter', 'growth', 'pro'].includes(subscriptionTier)
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard icon="home_work"    value={listings.length} label="Properties"  sub="In your portfolio"   />
              <StatCard icon="check_circle" value={activeCount}     label="Active Listings" sub="Visible to students" />
              <StatCard icon="group"        value={totalApplicants} label="Applicants"  sub="Across all listings" />
              <StatCard icon="payments"     value={revenueVal} label="Monthly Revenue" sub="Received / due"
                href={canSeeHouseholds ? '/landlord/households' : undefined} />
            </div>
          )
        })()}

        {/* Households quick-access — Starter+ */}
        {['starter','growth','pro'].includes(subscriptionTier) && (
          <Link href="/landlord/households"
            className="flex items-center justify-between gap-4 bg-white border border-out-var rounded-2xl px-6 py-4 shadow-sm hover:border-clay/40 hover:shadow-md transition-all mb-6 group">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 clay-grad rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <span className="material-symbols-outlined fill text-white">home_work</span>
              </div>
              <div>
                <p className="font-head font-bold text-espresso">My Households</p>
                <p className="text-xs font-body text-muted">View tenants, rent received, and property details</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-muted group-hover:text-clay transition-colors">arrow_forward</span>
          </Link>
        )}

        {/* Property table */}
        {['starter','growth','pro'].includes(subscriptionTier) && (
          <div className="bg-white rounded-2xl border border-out-var shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-out-var flex items-center justify-between">
              <div>
                <h2 className="font-head font-bold text-espresso">Landlord Dashboard</h2>
                <p className="text-xs font-body text-muted mt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    {listings.length} propert{listings.length !== 1 ? 'ies' : 'y'} · {activeCount} active
                  </span>
                </p>
              </div>
              {['starter','growth','pro'].includes(subscriptionTier) && (
                <Link href="/landlord/analytics"
                  className="flex items-center gap-1.5 text-xs font-head font-semibold text-clay-dark bg-linen hover:bg-clay/10 border border-out-var px-3 py-2 rounded-xl transition-colors">
                  <span className="material-symbols-outlined text-sm">analytics</span>
                  Full Analytics
                </Link>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surf-lo border-b border-out-var">
                    {['Property','Beds Avail.','Rent / Person','Applicants','Status'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-head font-bold text-muted uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-out-var">
                  {listings.slice(0, 8).map(l => {
                    const ic = Array.isArray(l.interest_count)
                      ? (l.interest_count[0]?.count ?? 0)
                      : (l.interest_count ?? 0)
                    const badgeMap: Record<string, string> = {
                      active:   'bg-green-50 text-green-700 border border-green-200',
                      draft:    'bg-stone-100 text-stone-500 border border-stone-200',
                      filled:   'bg-blue-50 text-blue-700 border border-blue-200',
                      pending:  'bg-orange-50 text-orange-700 border border-orange-200',
                      archived: 'bg-amber-50 text-amber-700 border border-amber-200',
                    }
                    const badge   = badgeMap[l.status] ?? badgeMap.draft
                    const bedAvail = l.status === 'active' ? l.bedrooms : (l.status === 'filled' ? 0 : l.bedrooms)
                    return (
                      <tr key={l.id} className="hover:bg-surf-lo transition-colors cursor-pointer"
                          onClick={() => { setFilter('all'); }}>
                        <td className="px-5 py-4">
                          <p className="font-head font-semibold text-espresso">{l.address}{l.unit ? ` #${l.unit}` : ''}</p>
                          <p className="text-xs font-body text-muted">{l.city}, {l.state}</p>
                        </td>
                        <td className="px-5 py-4 font-head font-semibold text-espresso">{bedAvail}</td>
                        <td className="px-5 py-4 font-head font-semibold text-espresso">${l.rent.toLocaleString()}</td>
                        <td className="px-5 py-4 text-muted">{Number(ic)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-head font-bold ${badge}`}>
                            {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {listings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-muted font-body text-sm">
                        No listings yet — click &quot;Add Listing&quot; to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-head font-bold text-clay-dark text-lg capitalize">
            {filter === 'all' ? 'All Properties' : `${filter} Listings`}
            <span className="ml-2 text-sm font-normal text-muted">({filteredListings.length})</span>
          </h2>
          {/* Mobile filter */}
          <div className="flex md:hidden gap-1 overflow-x-auto">
            {(['all', 'active', 'draft', 'filled', 'pending', 'archived'] as FilterTab[]).map((f) => (
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
          <div className="bg-white rounded-3xl shadow-2xl border border-out-var w-full max-w-xl p-8 relative"
            style={{ boxShadow: '0 40px 80px rgba(81,53,38,.18)' }}
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setReviewListing(null)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-outline hover:text-clay hover:bg-surf-lo transition-all">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 clay-grad rounded-xl flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined fill text-white text-xl">
                  {reviewModalType === 'applicants' ? 'assignment_turned_in' : 'favorite'}
                </span>
              </div>
              <div>
                <h2 className="font-head font-bold text-clay-dark">
                  {reviewModalType === 'applicants' ? 'Applications' : 'Interested Students'}
                </h2>
                <p className="text-xs font-body text-muted truncate max-w-[220px]">{reviewListing.address}</p>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 bg-surf-lo rounded-xl p-1 mb-5">
              <button
                onClick={() => setReviewModalType('applicants')}
                className={`flex-1 text-xs font-head font-bold py-1.5 rounded-lg transition-all ${reviewModalType === 'applicants' ? 'bg-white text-clay-dark shadow-sm' : 'text-muted hover:text-clay-dark'}`}>
                Applications {!loadingApplicants && `(${rentApplications.length})`}
              </button>
              <button
                onClick={() => setReviewModalType('interested')}
                className={`flex-1 text-xs font-head font-bold py-1.5 rounded-lg transition-all ${reviewModalType === 'interested' ? 'bg-white text-clay-dark shadow-sm' : 'text-muted hover:text-clay-dark'}`}>
                Interested {!loadingApplicants && `(${applicants.length})`}
              </button>
            </div>

            {loadingApplicants ? (
              <div className="flex justify-center py-10">
                <span className="spinner" style={{ borderColor: 'rgba(107,76,59,.2)', borderTopColor: '#6b4c3b', width: 28, height: 28 }} />
              </div>
            ) : (
              <div className="max-h-[52vh] overflow-y-auto">

                {/* ── Rent Applications ── */}
                {reviewModalType === 'applicants' && (
                  <div>
                    {appActionMsg && (
                      <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs font-body text-red-700">{appActionMsg}</div>
                    )}
                    {rentApplications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <span className="material-symbols-outlined text-out-var text-4xl mb-2">assignment</span>
                        <p className="text-sm font-head font-semibold text-muted">No applications yet</p>
                        <p className="text-xs font-body text-out-var mt-1">Students can apply directly from the listing page.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rentApplications.map((app) => {
                          const p = app.profile
                          const initials = ((p?.first_name?.[0] ?? '') + (p?.last_name?.[0] ?? '')).toUpperCase()
                          const isExpanded = expandedAppId === app.id
                          const isRejecting = rejectingAppId === app.id
                          const displayName = app.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ') || 'Applicant'
                          const submittedDate = new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          const moveInDate = app.move_in_date ? new Date(app.move_in_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null
                          const statusConfig: Record<string, { label: string; cls: string }> = {
                            pending:     { label: 'Pending',     cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
                            shortlisted: { label: 'Shortlisted', cls: 'bg-green-50 text-green-700 border border-green-200' },
                            approved:    { label: 'Approved',    cls: 'bg-blue-50 text-blue-700 border border-blue-200'   },
                            rejected:    { label: 'Rejected',    cls: 'bg-red-50 text-red-500 border border-red-200'      },
                          }
                          const sc = statusConfig[app.status] ?? statusConfig.pending

                          return (
                            <div key={app.id} className="bg-white rounded-2xl border border-out-var/60 overflow-hidden shadow-sm">
                              {/* ── Card header ── */}
                              <div className="flex items-center gap-3 p-4">
                                <div className="w-10 h-10 rounded-full flex-shrink-0 clay-grad flex items-center justify-center shadow-sm">
                                  <span className="text-white font-head font-black text-xs">{initials || '?'}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-head font-bold text-clay-dark leading-tight">{displayName}</p>
                                    <span className={`text-[10px] font-head font-bold px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span>
                                  </div>
                                  <p className="text-xs font-body text-muted mt-0.5">
                                    {app.university || p?.university || ''}{app.university && app.move_in_date ? ' · ' : ''}{moveInDate ? `Move-in ${moveInDate}` : ''}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-muted hover:text-clay hover:bg-linen transition-all">
                                  <span className="material-symbols-outlined text-base">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                                </button>
                              </div>

                              {/* ── Expanded detail ── */}
                              {isExpanded && (
                                <div className="border-t border-out-var/40 px-4 pb-4 pt-3 space-y-4">

                                  {/* About */}
                                  <div>
                                    <p className="text-[10px] font-head font-bold text-clay uppercase tracking-widest mb-2">About</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-body">
                                      {app.phone && <div><span className="text-muted">Phone</span><br /><span className="font-semibold text-clay-dark">{app.phone}</span></div>}
                                      {app.date_of_birth && <div><span className="text-muted">Date of Birth</span><br /><span className="font-semibold text-clay-dark">{new Date(app.date_of_birth + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>}
                                      {app.enrollment_status && <div><span className="text-muted">Enrollment</span><br /><span className="font-semibold text-clay-dark">{app.enrollment_status}</span></div>}
                                      {app.major && <div><span className="text-muted">Major</span><br /><span className="font-semibold text-clay-dark">{app.major}</span></div>}
                                      {app.grad_year && <div><span className="text-muted">Graduation</span><br /><span className="font-semibold text-clay-dark">{app.grad_year}</span></div>}
                                    </div>
                                  </div>

                                  {/* Financial */}
                                  {(app.employment_status || app.monthly_income || app.has_cosigner) && (
                                    <div>
                                      <p className="text-[10px] font-head font-bold text-clay uppercase tracking-widest mb-2">Financial</p>
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-body">
                                        {app.employment_status && <div><span className="text-muted">Employment</span><br /><span className="font-semibold text-clay-dark">{app.employment_status}</span></div>}
                                        {app.monthly_income !== null && app.monthly_income !== undefined && <div><span className="text-muted">Monthly Income</span><br /><span className="font-semibold text-clay-dark">${Number(app.monthly_income).toLocaleString()}</span></div>}
                                        {app.has_cosigner && <div><span className="text-muted">Co-signer</span><br /><span className="font-semibold text-clay-dark">{app.cosigner_name || 'Yes'}</span></div>}
                                      </div>
                                    </div>
                                  )}

                                  {/* Preferences */}
                                  <div>
                                    <p className="text-[10px] font-head font-bold text-clay uppercase tracking-widest mb-2">Preferences</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-body">
                                      {moveInDate && <div><span className="text-muted">Move-in</span><br /><span className="font-semibold text-clay-dark">{moveInDate}</span></div>}
                                      {app.lease_term && <div><span className="text-muted">Lease Term</span><br /><span className="font-semibold text-clay-dark">{app.lease_term}</span></div>}
                                      {app.num_occupants && <div><span className="text-muted">Occupants</span><br /><span className="font-semibold text-clay-dark">{app.num_occupants}</span></div>}
                                      <div><span className="text-muted">Pets</span><br /><span className="font-semibold text-clay-dark">{app.has_pets ? (app.pets_description || 'Yes') : 'No'}</span></div>
                                    </div>
                                  </div>

                                  {/* Message */}
                                  {app.message && (
                                    <div className="bg-linen rounded-xl px-3 py-2.5 text-xs font-body text-clay-dark italic border border-out-var/30">
                                      &ldquo;{app.message}&rdquo;
                                    </div>
                                  )}

                                  {/* Rejection reason (if rejected) */}
                                  {app.status === 'rejected' && app.rejection_reason && (
                                    <div className="bg-red-50 rounded-xl px-3 py-2 text-xs font-body text-red-700 border border-red-100">
                                      <span className="font-semibold">Rejection reason:</span> {app.rejection_reason}
                                    </div>
                                  )}

                                  {/* Rejection input inline */}
                                  {isRejecting && (
                                    <div className="space-y-2">
                                      <textarea
                                        className="w-full text-xs font-body border border-out-var rounded-xl px-3 py-2 resize-none outline-none focus:border-clay/60 transition-colors"
                                        rows={2}
                                        placeholder="Optional: reason for declining (sent to student)…"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                      />
                                      <div className="flex gap-2">
                                        <button onClick={() => { setRejectingAppId(null); setRejectionReason('') }}
                                          className="flex-1 text-xs font-head font-semibold border border-out-var rounded-lg py-1.5 text-muted hover:text-clay-dark hover:border-clay/30 transition-all">
                                          Cancel
                                        </button>
                                        <button onClick={() => handleUpdateAppStatus(app.id, 'rejected', rejectionReason || undefined)}
                                          className="flex-1 text-xs font-head font-bold bg-red-500 text-white rounded-lg py-1.5 hover:bg-red-600 transition-all">
                                          Confirm Reject
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Action buttons */}
                                  {!isRejecting && (
                                    <div className="grid grid-cols-2 gap-2">
                                      {app.status !== 'shortlisted' && app.status !== 'approved' && (
                                        <button onClick={() => handleUpdateAppStatus(app.id, 'shortlisted')}
                                          className="flex items-center justify-center gap-1.5 text-xs font-head font-bold bg-green-50 text-green-700 border border-green-200 rounded-xl py-2 hover:bg-green-100 transition-all">
                                          <span className="material-symbols-outlined text-sm">thumb_up</span> Shortlist
                                        </button>
                                      )}
                                      {app.status === 'shortlisted' && (
                                        <button onClick={() => handleUpdateAppStatus(app.id, 'approved')}
                                          className="flex items-center justify-center gap-1.5 text-xs font-head font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-xl py-2 hover:bg-blue-100 transition-all">
                                          <span className="material-symbols-outlined text-sm">check_circle</span> Approve
                                        </button>
                                      )}
                                      {app.status !== 'rejected' && (
                                        <button onClick={() => { setRejectingAppId(app.id); setRejectionReason('') }}
                                          className="flex items-center justify-center gap-1.5 text-xs font-head font-bold bg-red-50 text-red-500 border border-red-100 rounded-xl py-2 hover:bg-red-100 transition-all">
                                          <span className="material-symbols-outlined text-sm">thumb_down</span> Reject
                                        </button>
                                      )}
                                      {p?.id && (
                                        <button onClick={() => handleMessageApplicant(p.id)}
                                          className="flex items-center justify-center gap-1.5 text-xs font-head font-bold bg-surf-lo text-clay-dark border border-out-var rounded-xl py-2 hover:bg-linen transition-all">
                                          <span className="material-symbols-outlined text-sm">chat_bubble</span> Message
                                        </button>
                                      )}
                                      <button onClick={() => handleDownloadPDF(app, reviewListing?.address ?? '')}
                                        className="flex items-center justify-center gap-1.5 text-xs font-head font-bold bg-surf-lo text-clay-dark border border-out-var rounded-xl py-2 hover:bg-linen transition-all">
                                        <span className="material-symbols-outlined text-sm">download</span> PDF
                                      </button>
                                      {p?.id && (
                                        <a href={`/profile/${p.id}`} target="_blank"
                                          className="flex items-center justify-center gap-1.5 text-xs font-head font-bold bg-surf-lo text-clay-dark border border-out-var rounded-xl py-2 hover:bg-linen transition-all">
                                          <span className="material-symbols-outlined text-sm">person</span> Profile
                                        </a>
                                      )}
                                    </div>
                                  )}

                                  <p className="text-[10px] font-body text-out-var text-right">Applied {submittedDate}</p>
                                </div>
                              )}

                              {/* ── Collapsed summary row ── */}
                              {!isExpanded && (
                                <div className="flex items-center gap-4 px-4 pb-3 text-xs font-body text-muted">
                                  {app.employment_status && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-terra">work</span>{app.employment_status}</span>}
                                  {moveInDate && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-terra">calendar_today</span>{moveInDate}</span>}
                                  {app.monthly_income ? <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-terra">payments</span>${Number(app.monthly_income).toLocaleString()}/mo</span> : null}
                                  <span className="ml-auto text-[10px] text-out-var">{submittedDate}</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Interested Students ── */}
                {reviewModalType === 'interested' && (
                  <div>
                    {applicants.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <span className="material-symbols-outlined text-out-var text-4xl mb-2">favorite</span>
                        <p className="text-sm font-head font-semibold text-muted">No students interested yet</p>
                        <p className="text-xs font-body text-out-var mt-1">Students who save this listing will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
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
                  </div>
                )}

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
              <button onClick={() => { setShowAddModal(false); setSavingAdd(false); setAddStatus(null); setAddFiles([]); setAddPreviews([]); setAddAmenities([]); setAddSchools([]); setAddListingType('group-formation'); setAddFormAddress(null) }}
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
                  amenities={addAmenities}
                  setAmenities={setAddAmenities}
                  schools={addSchools}
                  setSchools={setAddSchools}
                  newPreviews={addPreviews}
                  onRemoveNew={removeAddFile}
                  onNewFileSelect={addFileSelect}
                  saving={savingAdd}
                  statusMsg={addStatus}
                  onAddressParsed={setAddFormAddress}
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
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined fill text-clay text-2xl flex-shrink-0">edit</span>
                <div className="min-w-0">
                  <h2 className="font-display text-3xl font-light text-clay-dark leading-tight">Edit <em>listing</em></h2>
                  <p className="text-xs font-body text-muted truncate">{editListing.address}</p>
                </div>
              </div>
            </div>
            {/* Scrollable form body */}
            <div className="overflow-y-auto flex-1 px-8 pb-8">
              <form key={editListing.id} onSubmit={handleEditSave} className="space-y-4">
                <ListingFormFields
                  defaults={editListing}
                  amenities={editAmenities}
                  setAmenities={setEditAmenities}
                  schools={editSchools}
                  setSchools={setEditSchools}
                  existingImagePreviews={editExistingImgs}
                  onRemoveExisting={removeEditExistingImage}
                  newPreviews={editNewPreviews}
                  onRemoveNew={removeEditNewFile}
                  onNewFileSelect={editNewFileSelect}
                  saving={savingEdit}
                  statusMsg={editStatus}
                  onAddressParsed={setEditFormAddress}
                />
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
