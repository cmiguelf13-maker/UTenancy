'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Verification = {
  id: string
  landlord_id: string
  document_url: string
  status: string
  reviewer_notes: string | null
  created_at: string
  reviewed_at: string | null
  profile?: {
    first_name: string | null
    last_name: string | null
    company: string | null
    phone: string | null
  } | null
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending')

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('You must be signed in as the admin to view this page.')
          setLoading(false)
          return
        }

        // Fetch all verifications (admin RLS policy allows this)
        const { data, error: fetchErr } = await supabase
          .from('landlord_verifications')
          .select('*')
          .order('created_at', { ascending: false })

        if (fetchErr) {
          setError('Access denied. This page is restricted to the admin account.')
          setLoading(false)
          return
        }

        const rows = data ?? []

        // Only fetch profiles when there are verifications to look up
        const profileMap: Record<string, Verification['profile']> = {}
        if (rows.length > 0) {
          const landlordIds = rows.map((v: Verification) => v.landlord_id)
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, company, phone')
            .in('id', landlordIds)
          if (profiles) {
            profiles.forEach((p: any) => { profileMap[p.id] = p })
          }
        }

        setVerifications(rows.map((v: Verification) => ({ ...v, profile: profileMap[v.landlord_id] ?? null })))
        setLoading(false)
      } catch {
        setError('Something went wrong. Please refresh and try again.')
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleDecision(v: Verification, decision: 'approved' | 'denied') {
    setActing(v.id)
    const supabase = createClient()

    await supabase.from('landlord_verifications').update({
      status:         decision,
      reviewer_notes: notes[v.id] ?? null,
      reviewed_at:    new Date().toISOString(),
    }).eq('id', v.id)

    await supabase.from('profiles').update({
      verification_status: decision === 'approved' ? 'verified' : 'denied',
    }).eq('id', v.landlord_id)

    setVerifications((prev) =>
      prev.map((x) => x.id === v.id ? { ...x, status: decision, reviewer_notes: notes[v.id] ?? null } : x)
    )
    setActing(null)
  }

  const filtered = filter === 'all' ? verifications : verifications.filter((v) => v.status === filter)
  const pendingCount  = verifications.filter((v) => v.status === 'pending').length
  const approvedCount = verifications.filter((v) => v.status === 'approved').length
  const deniedCount   = verifications.filter((v) => v.status === 'denied').length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-sand/30 border-t-sand rounded-full animate-spin mx-auto mb-3" />
        <p className="text-white/60 font-body text-sm">Loading verifications…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-stone px-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center max-w-sm">
        <span className="material-symbols-outlined text-red-400 text-4xl mb-3 block">lock</span>
        <p className="text-white font-head font-bold mb-2">Access Restricted</p>
        <p className="text-white/50 font-body text-sm">{error}</p>
        <a href="/auth" className="mt-5 inline-block px-5 py-2 rounded-full text-xs font-head font-bold bg-sand text-stone">
          Sign In
        </a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone px-6 py-12">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <a href="/admin/waitlist" className="text-white/40 hover:text-white text-xs font-head font-semibold transition-colors">
              ← Waitlist
            </a>
          </div>
          <h1 className="font-display text-4xl font-light text-white mb-2">
            Landlord <em className="text-sand">Verifications</em>
          </h1>
          <p className="font-body text-white/40 text-sm">Review and approve identity documents submitted by landlords.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Pending',  value: pendingCount,  color: 'text-amber-400' },
            { label: 'Approved', value: approvedCount, color: 'text-green-400' },
            { label: 'Denied',   value: deniedCount,   color: 'text-red-400'   },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className={`font-display text-3xl font-light ${color}`}>{value}</p>
              <p className="font-body text-white/40 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['pending', 'approved', 'denied', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-head font-bold border transition-all ${
                filter === f
                  ? 'bg-sand text-stone border-sand'
                  : 'border-white/20 text-white/50 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Verification cards */}
        {filtered.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-white/20 text-5xl mb-4 block">
              {verifications.length === 0 ? 'verified_user' : 'done_all'}
            </span>
            <p className="text-white/60 font-head font-semibold text-base mb-1">
              {verifications.length === 0 ? 'No submissions yet' : `No ${filter} submissions`}
            </p>
            <p className="text-white/30 font-body text-sm max-w-xs mx-auto">
              {verifications.length === 0
                ? 'When landlords sign up and submit their identity documents, they\'ll appear here for your review.'
                : `There are no ${filter} verifications at this time. Switch the filter above to view others.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((v) => {
              const landlordName = [v.profile?.first_name, v.profile?.last_name].filter(Boolean).join(' ') || 'Unknown Landlord'
              const statusColor = v.status === 'approved' ? 'bg-green-500/15 text-green-400 border-green-500/20'
                : v.status === 'denied' ? 'bg-red-500/15 text-red-400 border-red-500/20'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/20'

              return (
                <div key={v.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-head font-bold text-white text-base">{landlordName}</p>
                        <span className={`text-[10px] font-head font-bold px-2.5 py-1 rounded-full border ${statusColor}`}>
                          {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                        </span>
                      </div>
                      {v.profile?.company && (
                        <p className="text-sm font-body text-white/40">{v.profile.company}</p>
                      )}
                      {v.profile?.phone && (
                        <p className="text-xs font-body text-white/30 mt-0.5">{v.profile.phone}</p>
                      )}
                    </div>
                    <p className="text-xs font-body text-white/30 whitespace-nowrap">
                      {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Document preview */}
                  <div className="mb-4">
                    <p className="text-xs font-head font-bold text-white/40 uppercase tracking-wider mb-2">Submitted Document</p>
                    {v.document_url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                      <img
                        src={v.document_url}
                        alt="Verification document"
                        className="max-h-48 rounded-xl border border-white/10 object-contain bg-white/5"
                      />
                    ) : (
                      <a
                        href={v.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-head font-semibold text-clay hover:text-sand transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">description</span>
                        View Document (PDF)
                      </a>
                    )}
                  </div>

                  {/* Notes + actions — only for pending */}
                  {v.status === 'pending' && (
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <div>
                        <label className="block text-xs font-head font-bold text-white/40 uppercase tracking-wider mb-1.5">
                          Notes (optional)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Reason for denial or approval notes…"
                          value={notes[v.id] ?? ''}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [v.id]: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-body text-white placeholder-white/20 focus:outline-none focus:border-sand/40 resize-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleDecision(v, 'approved')}
                          disabled={acting === v.id}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-head font-bold text-sm bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 transition-all disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-sm fill">check_circle</span>
                          {acting === v.id ? 'Saving…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleDecision(v, 'denied')}
                          disabled={acting === v.id}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-head font-bold text-sm bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-sm fill">cancel</span>
                          {acting === v.id ? 'Saving…' : 'Deny'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Show reviewer notes if already decided */}
                  {v.status !== 'pending' && v.reviewer_notes && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-xs font-head font-bold text-white/40 uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-sm font-body text-white/60">{v.reviewer_notes}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
