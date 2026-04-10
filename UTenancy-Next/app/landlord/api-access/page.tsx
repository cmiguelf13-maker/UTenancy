'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ApiKey, SubscriptionTier } from '@/lib/types'
import FeatureGate from '@/components/FeatureGate'

/* ─── Page ───────────────────────────────────────────── */
export default function ApiAccessPage() {
  const router = useRouter()

  const [tier, setTier]         = useState<SubscriptionTier>('free')
  const [keys, setKeys]         = useState<ApiKey[]>([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName]   = useState('')
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copied, setCopied]     = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.user_metadata?.role !== 'landlord') {
        router.replace('/auth'); return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single()

      const t = (profile?.subscription_tier ?? 'free') as SubscriptionTier
      setTier(t)

      if (t === 'pro') {
        const res  = await fetch('/api/landlord/api-keys')
        const json = await res.json()
        setKeys(json.keys ?? [])
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleCreate() {
    if (!newKeyName.trim()) { setError('Give your key a name first.'); return }
    setCreating(true)
    setError(null)
    try {
      const res  = await fetch('/api/landlord/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to create key'); return }

      setRevealedKey(json.key)
      setKeys(prev => [json.record, ...prev])
      setNewKeyName('')
      setShowForm(false)
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this API key? Any integrations using it will stop working immediately.')) return
    await fetch(`/api/landlord/api-keys?id=${id}`, { method: 'DELETE' })
    setKeys(prev => prev.filter(k => k.id !== id))
  }

  function copyKey() {
    if (!revealedKey) return
    navigator.clipboard.writeText(revealedKey).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surf-lo">
        <div className="w-8 h-8 border-2 border-clay rounded-full border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surf-lo pb-20">
      {/* Header */}
      <div className="bg-white border-b border-out-var px-6 py-5 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/landlord" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-linen transition-colors">
              <span className="material-symbols-outlined text-espresso">arrow_back</span>
            </Link>
            <div>
              <h1 className="font-head font-bold text-espresso text-lg">API Access</h1>
              <p className="text-xs font-body text-muted">Integrate UTenancy with your own tools</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-head font-bold clay-grad text-white">
            <span className="material-symbols-outlined fill text-sm">workspace_premium</span>
            Pro
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        <FeatureGate
          currentTier={tier}
          requiredTier="pro"
          lockedMessage="API access is available exclusively on the Pro plan."
          onUpgrade={() => router.push('/landlord')}
        >
          {/* Overview card */}
          <div className="bg-white rounded-2xl border border-out-var p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 clay-grad rounded-2xl flex items-center justify-center shadow-md shrink-0">
                <span className="material-symbols-outlined fill text-white text-2xl">api</span>
              </div>
              <div className="flex-1">
                <h2 className="font-head font-bold text-espresso text-base">UTenancy REST API</h2>
                <p className="text-sm font-body text-muted mt-1 leading-relaxed">
                  Use your API keys to read listings, applicants, and revenue data programmatically.
                  Keys are hashed — copy yours now, it won&apos;t be shown again.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-head font-semibold text-clay-dark">
                  {['GET /v1/listings','GET /v1/applicants','GET /v1/revenue','POST /v1/listings'].map(ep => (
                    <code key={ep} className="bg-linen px-2.5 py-1 rounded-lg">{ep}</code>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Revealed key banner */}
          {revealedKey && (
            <div className="bg-espresso rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined fill text-amber-300 text-sm">warning</span>
                <p className="text-sm font-head font-bold">Copy your key now — it won&apos;t be shown again</p>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                <code className="flex-1 text-sm font-mono break-all text-linen">{revealedKey}</code>
                <button onClick={copyKey}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors">
                  <span className="material-symbols-outlined text-white text-lg">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
              <button onClick={() => setRevealedKey(null)}
                className="mt-3 text-xs text-white/60 hover:text-white transition-colors underline underline-offset-2">
                I&apos;ve saved my key, dismiss
              </button>
            </div>
          )}

          {/* Keys list */}
          <div className="bg-white rounded-2xl border border-out-var shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-out-var flex items-center justify-between">
              <h3 className="font-head font-bold text-espresso">API Keys</h3>
              {!showForm && (
                <button onClick={() => { setShowForm(true); setError(null) }}
                  className="clay-grad text-white text-xs font-head font-semibold px-4 py-2 rounded-xl shadow-sm hover:opacity-90 transition-opacity flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">add</span>
                  New Key
                </button>
              )}
            </div>

            {/* Create form */}
            {showForm && (
              <div className="px-6 py-4 bg-linen border-b border-out-var">
                <p className="text-xs font-head font-semibold text-espresso mb-2">Key name</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    placeholder="e.g. Production integration"
                    className="flex-1 px-3 py-2 text-sm border border-out-var rounded-xl focus:outline-none focus:ring-2 focus:ring-clay/30 bg-white font-body"
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  />
                  <button onClick={handleCreate} disabled={creating}
                    className="clay-grad text-white text-sm font-head font-semibold px-4 py-2 rounded-xl disabled:opacity-60">
                    {creating ? 'Generating…' : 'Generate'}
                  </button>
                  <button onClick={() => { setShowForm(false); setError(null) }}
                    className="px-3 py-2 text-sm font-head text-muted hover:text-espresso rounded-xl hover:bg-white transition-colors">
                    Cancel
                  </button>
                </div>
                {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
              </div>
            )}

            {/* Keys table */}
            {keys.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 clay-grad rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
                  <span className="material-symbols-outlined fill text-white text-xl">key</span>
                </div>
                <p className="font-head font-semibold text-espresso">No keys yet</p>
                <p className="text-sm font-body text-muted mt-1">Generate your first API key to start integrating.</p>
              </div>
            ) : (
              <div className="divide-y divide-out-var">
                {keys.map(k => (
                  <div key={k.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-9 h-9 bg-linen rounded-xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined fill text-clay text-lg">key</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-head font-semibold text-espresso text-sm">{k.name}</p>
                      <p className="text-xs font-mono text-muted mt-0.5">{k.key_prefix}••••••••••••••••••••••••</p>
                      <p className="text-xs font-body text-muted mt-0.5">
                        Created {new Date(k.created_at).toLocaleDateString()}
                        {k.last_used_at && ` · Last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-head font-bold px-2.5 py-1 rounded-full ${k.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-stone-100 text-stone-500 border border-stone-200'}`}>
                        {k.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button onClick={() => handleRevoke(k.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted hover:text-red-600 transition-colors">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Docs teaser */}
          <div className="bg-white rounded-2xl border border-out-var p-6 shadow-sm">
            <h3 className="font-head font-bold text-espresso mb-3">Quick start</h3>
            <div className="bg-espresso rounded-xl p-4 font-mono text-sm text-linen overflow-x-auto">
              <p className="text-muted text-xs mb-2"># List your active listings</p>
              <p><span className="text-amber-300">curl</span> https://api.utenancy.com/v1/listings \</p>
              <p>{'  '}-H <span className="text-green-300">&quot;Authorization: Bearer YOUR_KEY&quot;</span></p>
            </div>
            <p className="text-xs font-body text-muted mt-3">
              Full API documentation is available at{' '}
              <a href="https://docs.utenancy.com" target="_blank" rel="noopener noreferrer"
                className="text-clay underline underline-offset-2">docs.utenancy.com</a>
            </p>
          </div>
        </FeatureGate>
      </div>
    </div>
  )
}
