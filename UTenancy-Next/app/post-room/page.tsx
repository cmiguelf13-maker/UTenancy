'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { SCHOOL_OPTIONS } from '@/lib/distance'

const AMENITY_OPTIONS = [
  'Parking', 'In-unit laundry', 'A/C', 'Backyard', 'Hardwood floors',
  'High-speed WiFi', 'Dishwasher', 'Gym', 'Pet-friendly', 'Furnished',
]

type ParsedAddress = { street: string; city: string; state: string; zip: string }

export default function PostRoomPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [parsedAddress, setParsedAddress] = useState<ParsedAddress | null>(null)
  const [unit, setUnit] = useState('')
  const [bedrooms, setBedrooms] = useState(1)
  const [bathrooms, setBathrooms] = useState(1)
  const [rent, setRent] = useState('')
  const [description, setDescription] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])
  const [targetSchools, setTargetSchools] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  // Lease detail fields
  const [availableDate, setAvailableDate] = useState('')
  const [leaseTerm, setLeaseTerm] = useState('12 months')
  const [deposit, setDeposit] = useState('')
  const [utilities, setUtilities] = useState('Tenant pays')
  const [petsAllowed, setPetsAllowed] = useState('Negotiable')

  const [subscriptionTier, setSubscriptionTier] = useState<string>('free')

  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const autocompleteInputRef = useRef<HTMLInputElement>(null)

  // Auth guard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      if (!u) {
        router.push('/')
        return
      }
      setUser(u)
      setLoading(false)
      // Fetch subscription tier for limit enforcement
      supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', u.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.subscription_tier) setSubscriptionTier(profile.subscription_tier)
        })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Google Places autocomplete
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key || !user) return

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
          if (c.types.indexOf('street_number') !== -1)                   streetNum = c.long_name
          else if (c.types.indexOf('route') !== -1)                      route     = c.short_name
          else if (c.types.indexOf('locality') !== -1)                   city      = c.long_name
          else if (c.types.indexOf('administrative_area_level_1') !== -1) state    = c.short_name
          else if (c.types.indexOf('postal_code') !== -1)                zip       = c.long_name
        }
        const street = streetNum ? `${streetNum} ${route}` : route
        setParsedAddress({ street, city, state, zip })
        if (autocompleteInputRef.current) autocompleteInputRef.current.value = street
      })
    }

    const scriptId = 'google-maps-places-api'
    if (document.getElementById(scriptId)) { initAutocomplete(); return }
    const script    = document.createElement('script')
    script.id       = scriptId
    script.src      = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
    script.async    = true
    script.onload   = initAutocomplete
    document.head.appendChild(script)
  }, [user])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setFiles(prev => [...prev, ...selected])
    selected.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  function removeFile(i: number) {
    setFiles(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  function toggleAmenity(a: string) {
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  function toggleSchool(slug: string) {
    setTargetSchools(prev => prev.includes(slug) ? prev.filter(x => x !== slug) : [...prev, slug])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!parsedAddress) { setError('Please select an address from the suggestions.'); return }
    if (!rent || isNaN(Number(rent)) || Number(rent) <= 0) { setError('Please enter a valid monthly rent.'); return }

    setSaving(true)
    setError(null)
    setStatus('Checking your plan…')

    try {
      // Enforce per-plan listing limits before inserting
      const LISTING_LIMITS: Record<string, number> = { starter: 3, growth: 10 }
      const tierLimit = LISTING_LIMITS[subscriptionTier]
      if (tierLimit !== undefined) {
        const { count } = await supabase
          .from('listings')
          .select('id', { count: 'exact', head: true })
          .eq('landlord_id', user.id)
          .in('status', ['active', 'draft'])
        if (count !== null && count >= tierLimit) {
          const tierLabel = subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)
          setError(
            `Your ${tierLabel} plan allows up to ${tierLimit} active listing${tierLimit !== 1 ? 's' : ''}. ` +
            `Please archive or remove a listing, or upgrade your plan to post more.`
          )
          setSaving(false)
          setStatus(null)
          return
        }
      }

      setStatus('Creating your listing…')

      // Insert the open-room listing — RLS allows this since landlord_id = auth.uid()
      const { data: listing, error: insertErr } = await supabase
        .from('listings')
        .insert({
          landlord_id: user.id,
          address: parsedAddress.street,
          unit: unit || null,
          city: parsedAddress.city,
          state: parsedAddress.state,
          zip: parsedAddress.zip,
          bedrooms,
          bathrooms,
          rent: Number(rent),
          type: 'open-room',
          status: files.length > 0 ? 'active' : 'draft',
          description: description || null,
          amenities,
          target_schools: targetSchools,
          images: [],
          available_date: availableDate || null,
          lease_term: leaseTerm,
          deposit: deposit ? Number(deposit) : null,
          utilities,
          pets_allowed: petsAllowed,
        })
        .select()
        .single()

      if (insertErr || !listing) {
        setError('Could not create listing. Please try again.')
        setSaving(false)
        setStatus(null)
        return
      }

      // Upload photos
      const uploadedUrls: string[] = []
      if (files.length > 0) {
        setStatus('Uploading photos…')
        for (let i = 0; i < files.length; i++) {
          const ext  = files[i].name.split('.').pop() ?? 'jpg'
          const path = `${listing.id}/${Date.now()}_${i}.${ext}`
          const { error: upErr } = await supabase.storage
            .from('listing-images')
            .upload(path, files[i], { upsert: false })
          if (!upErr) {
            const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(path)
            if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl)
          }
        }

        // Save photo URLs back to the listing
        await supabase
          .from('listings')
          .update({ images: uploadedUrls })
          .eq('id', listing.id)
      }

      setStatus('Done!')
      router.push(`/listings/${listing.id}`)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setSaving(false)
      setStatus(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-clay border-t-transparent" />
    </div>
  )

  return (
    <main className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-head font-semibold text-muted hover:text-clay transition-colors mb-5">
            <span className="material-symbols-outlined text-base">arrow_back</span> Back
          </Link>
          <h1 className="font-display text-4xl font-light text-clay-dark mb-1">
            Post a <em>Room</em>
          </h1>
          <p className="text-sm font-body text-muted">
            Have a spare room? Post it and connect with verified students looking for a place.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Address */}
          <div className="bg-white rounded-2xl border border-out-var/40 p-5 space-y-4">
            <h2 className="font-head font-bold text-clay-dark text-sm uppercase tracking-wider">Location</h2>

            <div>
              <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">
                Property Address *
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">search</span>
                <input
                  ref={autocompleteInputRef}
                  type="text"
                  className="w-full pl-10 pr-4 py-3 border-[1.5px] border-out-var rounded-xl font-body text-sm text-stone outline-none transition-all focus:border-clay focus:shadow-[0_0_0_3px_rgba(107,76,59,.12)] placeholder:text-[#a89990] bg-white"
                  placeholder="Search your address…"
                  required
                />
              </div>
              {parsedAddress && (
                <div className="flex items-center gap-2 px-3 py-2 bg-surf-lo rounded-xl border border-out-var text-xs font-body mt-2">
                  <span className="material-symbols-outlined text-clay" style={{ fontSize: 15 }}>location_on</span>
                  <span className="font-semibold text-clay-dark">{parsedAddress.street}</span>
                  <span className="text-outline">·</span>
                  <span className="text-muted">{parsedAddress.city}, {parsedAddress.state} {parsedAddress.zip}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Unit / Apt</label>
              <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. Apt 2B"
                className="w-full px-4 py-3 border-[1.5px] border-out-var rounded-xl font-body text-sm text-stone outline-none transition-all focus:border-clay focus:shadow-[0_0_0_3px_rgba(107,76,59,.12)] placeholder:text-[#a89990] bg-white" />
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl border border-out-var/40 p-5 space-y-4">
            <h2 className="font-head font-bold text-clay-dark text-sm uppercase tracking-wider">Room Details</h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="min-w-0">
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Beds *</label>
                <select value={bedrooms} onChange={e => setBedrooms(Number(e.target.value))} required
                  className="w-full px-3 py-3 border-[1.5px] border-out-var rounded-xl font-body text-sm text-stone outline-none transition-all focus:border-clay bg-white">
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Baths *</label>
                <select value={bathrooms} onChange={e => setBathrooms(Number(e.target.value))} required
                  className="w-full px-3 py-3 border-[1.5px] border-out-var rounded-xl font-body text-sm text-stone outline-none transition-all focus:border-clay bg-white">
                  {[1, 1.5, 2, 2.5, 3].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="min-w-0 col-span-2 sm:col-span-1">
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Rent / mo · per person *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-body">$</span>
                  <input type="number" min="1" value={rent} onChange={e => setRent(e.target.value)} placeholder="1200" required
                    className="w-full pl-6 pr-3 py-3 border-[1.5px] border-out-var rounded-xl font-body text-sm text-stone outline-none transition-all focus:border-clay focus:shadow-[0_0_0_3px_rgba(107,76,59,.12)] bg-white" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                placeholder="Describe the room, house vibe, what you're looking for in a roommate…"
                className="w-full px-4 py-3 border-[1.5px] border-out-var rounded-xl font-body text-sm text-stone outline-none resize-none transition-all focus:border-clay focus:shadow-[0_0_0_3px_rgba(107,76,59,.12)] placeholder:text-[#a89990] bg-white" />
            </div>
          </div>

          {/* Lease Details */}
          <div className="bg-white rounded-2xl border border-out-var/40 p-5 space-y-4 overflow-hidden">
            <h2 className="font-head font-bold text-clay-dark text-sm uppercase tracking-wider">Lease Details</h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Available From</label>
                <input
                  type="date"
                  value={availableDate}
                  onChange={(e) => setAvailableDate(e.target.value)}
                  className="w-full max-w-full px-4 py-3 border-[1.5px] border-out-var rounded-xl font-body text-sm text-stone outline-none transition-all focus:border-clay focus:shadow-[0_0_0_3px_rgba(107,76,59,.12)] bg-white"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Security Deposit</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-body">$</span>
                  <input
                    type="number"
                    min="0"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    placeholder="0"
                    className="w-full pl-6 pr-3 py-3 border-[1.5px] border-out-var rounded-xl font-body text-sm text-stone outline-none transition-all focus:border-clay focus:shadow-[0_0_0_3px_rgba(107,76,59,.12)] bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Lease Term</label>
              <select
                value={leaseTerm}
                onChange={(e) => setLeaseTerm(e.target.value)}
                className="w-full px-4 py-3 border-[1.5px] border-out-var rounded-xl font-body text-sm text-stone outline-none transition-all focus:border-clay bg-white"
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
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Utilities</label>
                <select
                  value={utilities}
                  onChange={(e) => setUtilities(e.target.value)}
                  className="w-full px-4 py-3 border-[1.5px] border-out-var rounded-xl font-body text-sm text-stone outline-none transition-all focus:border-clay bg-white"
                >
                  <option>Tenant pays</option>
                  <option>Included in rent</option>
                  <option>Partially included</option>
                </select>
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Pets Allowed</label>
                <select
                  value={petsAllowed}
                  onChange={(e) => setPetsAllowed(e.target.value)}
                  className="w-full px-4 py-3 border-[1.5px] border-out-var rounded-xl font-body text-sm text-stone outline-none transition-all focus:border-clay bg-white"
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
          <div className="bg-white rounded-2xl border border-out-var/40 p-5">
            <h2 className="font-head font-bold text-clay-dark text-sm uppercase tracking-wider mb-3">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map(a => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                  className={`px-3.5 py-2 rounded-full text-xs font-head font-bold border transition-all
                    ${amenities.includes(a)
                      ? 'clay-grad text-white border-transparent shadow-sm'
                      : 'border-out-var text-muted hover:border-clay/50 hover:text-clay-dark'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Promote to Schools */}
          <div className="bg-white rounded-2xl border border-out-var/40 p-5">
            <h2 className="font-head font-bold text-clay-dark text-sm uppercase tracking-wider mb-1">Promote to Schools</h2>
            <p className="text-xs font-body text-muted mb-3">Students at these schools will see walking distance to their campus on your listing.</p>
            <div className="flex flex-wrap gap-2">
              {SCHOOL_OPTIONS.map(school => (
                <button key={school.slug} type="button" onClick={() => toggleSchool(school.slug)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-head font-bold border transition-all
                    ${targetSchools.includes(school.slug)
                      ? 'clay-grad text-white border-transparent shadow-sm'
                      : 'border-out-var text-muted hover:border-clay/50 hover:text-clay-dark'}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>school</span>
                  {school.short}
                </button>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-2xl border border-out-var/40 p-5">
            <h2 className="font-head font-bold text-clay-dark text-sm uppercase tracking-wider mb-3">
              Photos <span className="font-normal normal-case text-muted ml-1 text-xs">(required to publish)</span>
            </h2>
            <label className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-out-var rounded-xl cursor-pointer hover:border-clay/50 hover:bg-surf-lo/50 transition-all">
              <span className="material-symbols-outlined text-outline text-xl">add_a_photo</span>
              <span className="text-sm font-body text-muted">Click to upload photos</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
            </label>
            {previews.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {previews.map((src, i) => (
                  <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-out-var group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeFile(i)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-body text-red-700">
              <span className="material-symbols-outlined text-red-500 text-base">error</span>
              {error}
            </div>
          )}

          {/* Status */}
          {status && saving && (
            <div className="flex items-center gap-2 px-4 py-3 bg-surf-lo border border-out-var/40 rounded-xl text-sm font-body text-clay-dark">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-clay border-t-transparent flex-shrink-0" />
              {status}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={saving}
            className="w-full clay-grad text-white py-4 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/25 disabled:opacity-60 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">publish</span>
            {saving ? 'Posting…' : 'Post My Room'}
          </button>

          <p className="text-xs font-body text-muted text-center pb-6">
            Your listing will be visible to verified students. Listings without photos are saved as drafts.
          </p>
        </form>
      </div>
    </main>
  )
}
