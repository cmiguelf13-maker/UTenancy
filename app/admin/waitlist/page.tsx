'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Entry = {
  id: string
  email: string
  type: 'student' | 'landlord'
  created_at: string
}

export default function WaitlistAdminPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'student' | 'landlord'>('all')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not signed in.'); setLoading(false); return }

      const res = await fetch('/api/admin/waitlist', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) { setError('Access denied.'); setLoading(false); return }

      const { entries } = await res.json()
      setEntries(entries ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter)
  const students  = entries.filter(e => e.type === 'student').length
  const landlords = entries.filter(e => e.type === 'landlord').length

  function copyEmails() {
    const emails = filtered.map(e => e.email).join('\n')
    navigator.clipboard.writeText(emails).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone">
      <p className="text-white/40 font-body">Loading…</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-stone">
      <p className="text-red-400 font-body">{error}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone px-6 py-12">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-4xl font-light text-white mb-2">
            Waitlist <em className="text-sand">Signups</em>
          </h1>
          <p className="font-body text-white/40 text-sm">{entries.length} total sign-ups</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total', value: entries.length, color: 'text-white' },
            { label: 'Students', value: students, color: 'text-sand' },
            { label: 'Landlords', value: landlords, color: 'text-clay' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className={`font-display text-3xl font-light ${color}`}>{value}</p>
              <p className="font-body text-white/40 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div className="flex gap-2">
            {(['all', 'student', 'landlord'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-head font-bold border transition-all ${
                  filter === f
                    ? 'bg-sand text-stone border-sand'
                    : 'border-white/20 text-white/50 hover:text-white'
                }`}
              >
                {f === 'all' ? 'All' : f === 'student' ? '🎓 Students' : '🏠 Landlords'}
              </button>
            ))}
          </div>
          <button
            onClick={copyEmails}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-head font-bold border border-white/20 text-white/60 hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Copied!' : `Copy ${filtered.length} emails`}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <p className="text-white/30 font-body text-sm text-center py-12">No entries yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-3 text-white/40 text-xs font-head font-bold uppercase tracking-widest">#</th>
                  <th className="text-left px-6 py-3 text-white/40 text-xs font-head font-bold uppercase tracking-widest">Email</th>
                  <th className="text-left px-6 py-3 text-white/40 text-xs font-head font-bold uppercase tracking-widest">Type</th>
                  <th className="text-left px-6 py-3 text-white/40 text-xs font-head font-bold uppercase tracking-widest">Signed Up</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, i) => (
                  <tr key={entry.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white/25 text-sm font-body">{i + 1}</td>
                    <td className="px-6 py-4 text-white font-body text-sm">{entry.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-head font-bold px-3 py-1 rounded-full ${
                        entry.type === 'student'
                          ? 'bg-sand/15 text-sand'
                          : 'bg-clay/15 text-clay'
                      }`}>
                        {entry.type === 'student' ? '🎓 Student' : '🏠 Landlord'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/40 text-sm font-body">
                      {new Date(entry.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
