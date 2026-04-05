'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

/* ─── Types ─────────────────────────────────────── */
type ListingStatus = 'active' | 'pending' | 'filled' | 'draft'
type ListingType   = 'open-room' | 'group-formation'

interface Listing {
  id: string
  address: string
  unit?: string
  city: string
  bedrooms: number
  bathrooms: number
  rent: number
  type: ListingType
  status: ListingStatus
  applicants: number
  image: string
}

/* ─── Mock data ──────────────────────────────────── */
const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    address: '6570 W 84th Place',
    unit: 'Unit 3B',
    city: 'Los Angeles, CA 90045',
    bedrooms: 3, bathrooms: 2, rent: 850,
    type: 'open-room', status: 'active', applicants: 4,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  },
  {
    id: '2',
    address: '1240 Ocean Park Blvd',
    city: 'Santa Monica, CA 90405',
    bedrooms: 4, bathrooms: 2, rent: 1100,
    type: 'group-formation', status: 'active', applicants: 7,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  },
  {
    id: '3',
    address: '3381 Sawtelle Blvd',
    unit: 'Apt 12',
    city: 'Los Angeles, CA 90066',
    bedrooms: 2, bathrooms: 1, rent: 1200,
    type: 'open-room', status: 'pending', applicants: 2,
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
  },
  {
    id: '4',
    address: '816 Lincoln Blvd',
    city: 'Venice, CA 90291',
    bedrooms: 3, bathrooms: 2, rent: 975,
    type: 'group-formation', status: 'draft', applicants: 0,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  },
]

/* ─── Status badge ───────────────────────────────── */
const STATUS_CONFIG: Record<ListingStatus, { label: string; bg: string; dot: string }> = {
  active:  { label: 'Active',  bg: 'bg-green-50 text-green-700 border border-green-200',  dot: 'bg-green-500' },
  pending: { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border border-amber-200',  dot: 'bg-amber-500' },
  filled:  { label: 'Filled',  bg: 'bg-blue-50 text-blue-700 border border-blue-200',     dot: 'bg-blue-500' },
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
function ListingCard({ listing }: { listing: Listing }) {
  const typeLabel = listing.type === 'open-room' ? 'Open Room' : 'Group Formation'
  const typeBg    = listing.type === 'open-room' ? 'bg-terra/90' : 'bg-clay/90'

  return (
    <div className="bg-white rounded-2xl border border-out-var shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img src={listing.image} alt={listing.address} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className={`absolute top-3 left-3 ${typeBg} text-white text-[10px] font-head font-bold px-2.5 py-1 rounded-full`}>
          {typeLabel}
        </span>
        <StatusBadge status={listing.status} />
        {/* status badge positioned bottom-left */}
        <div className="absolute bottom-3 left-3">
          <StatusBadge status={listing.status} />
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
            {listing.applicants === 0 ? 'No applicants yet' : `${listing.applicants} applicant${listing.applicants !== 1 ? 's' : ''}`}
          </span>
          {listing.applicants > 0 && (
            <button className="ml-auto text-xs font-head font-bold text-clay hover:text-clay-dark transition-colors">
              Review →
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-head font-semibold text-clay-dark border border-out-var rounded-lg py-2 hover:border-clay/40 hover:bg-surf-lo transition-all">
            <span className="material-symbols-outlined text-sm">edit</span> Edit
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-head font-semibold text-clay-dark border border-out-var rounded-lg py-2 hover:border-clay/40 hover:bg-surf-lo transition-all">
            <span className="material-symbols-outlined text-sm">visibility</span> Preview
          </button>
          <button className="flex items-center justify-center text-xs font-head font-semibold text-red-500 border border-red-100 rounded-lg px-3 py-2 hover:bg-red-50 transition-all">
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      if (!u) { router.push('/auth'); return }
      if (u.user_metadata?.role !== 'landlord') { router.push('/'); return }
      setUser(u)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <span className="spinner" style={{ borderColor: 'rgba(107,76,59,.2)', borderTopColor: '#6b4c3b', width: 32, height: 32 }} />
    </div>
  )

  const firstName = user?.user_metadata?.first_name ?? 'Landlord'
  const company   = user?.user_metadata?.company

  const listings = filter === 'all' ? MOCK_LISTINGS : MOCK_LISTINGS.filter((l) => l.status === filter)
  const totalApplicants = MOCK_LISTINGS.reduce((s, l) => s + l.applicants, 0)
  const activeCount = MOCK_LISTINGS.filter((l) => l.status === 'active').length
  const vacancies = MOCK_LISTINGS.filter((l) => l.status !== 'filled').length

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
            {(['all', 'active', 'pending', 'draft', 'filled'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-head font-bold capitalize transition-all
                  ${filter === f ? 'clay-grad text-white shadow-sm' : 'text-muted hover:text-clay-dark'}`}>
                {f === 'all' ? 'All Listings' : f}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
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
          <StatCard icon="home_work"   value={MOCK_LISTINGS.length} label="Total Properties"  sub="Across all statuses" />
          <StatCard icon="check_circle" value={activeCount}          label="Active Listings"   sub="Visible to students" />
          <StatCard icon="group"        value={totalApplicants}      label="Total Applicants"  sub="Awaiting your review" />
          <StatCard icon="door_open"    value={vacancies}            label="Open Vacancies"    sub="Not yet filled" />
        </div>

        {/* Section heading */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-head font-bold text-clay-dark text-lg">
            {filter === 'all' ? 'All Properties' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Listings`}
            <span className="ml-2 text-sm font-normal text-muted">({listings.length})</span>
          </h2>
          {/* Mobile filter */}
          <div className="flex md:hidden gap-1 overflow-x-auto">
            {(['all', 'active', 'pending', 'draft'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-head font-bold capitalize whitespace-nowrap transition-all
                  ${filter === f ? 'clay-grad text-white' : 'bg-white border border-out-var text-muted'}`}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Listing grid */}
        {listings.length === 0 ? (
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
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}

      </main>

      {/* ── ADD LISTING MODAL (placeholder) ── */}
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

            <form className="space-y-4">
              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Street Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">location_on</span>
                  <input type="text" className="auth-input" placeholder="6570 W 84th Place" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">City</label>
                  <input type="text" className="auth-input no-icon" placeholder="Los Angeles" />
                </div>
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Unit (optional)</label>
                  <input type="text" className="auth-input no-icon" placeholder="Unit 3B" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Beds</label>
                  <input type="number" min={1} className="auth-input no-icon" placeholder="3" />
                </div>
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Baths</label>
                  <input type="number" min={1} step={0.5} className="auth-input no-icon" placeholder="2" />
                </div>
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Rent / mo</label>
                  <input type="number" min={0} className="auth-input no-icon" placeholder="950" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Listing Type</label>
                <div className="flex gap-2">
                  {(['open-room', 'group-formation'] as const).map((t) => (
                    <button key={t} type="button"
                      className="flex-1 py-2.5 rounded-xl text-xs font-head font-bold border border-out-var text-muted hover:border-clay/50 hover:text-clay-dark transition-all">
                      {t === 'open-room' ? 'Open Room' : 'Group Formation'}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={() => setShowAddModal(false)}
                className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[.98] shadow-lg shadow-clay/25 mt-2">
                <span className="material-symbols-outlined text-base">save</span>
                Save Listing
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
