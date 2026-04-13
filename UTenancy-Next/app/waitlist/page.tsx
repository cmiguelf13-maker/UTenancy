'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle')

  async function handleSubmit() {
    if (!email.trim() || status === 'loading') return
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), type: 'landlord' }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else if (res.status === 409) {
        setStatus('duplicate')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen warm-grain dark-surface flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-10 blur-[180px] pointer-events-none" style={{ background: '#9c7060' }} />

      <div className="relative z-10 w-full max-w-lg mx-auto text-center">

        {/* Logo */}
        <div className="flex justify-center mb-12">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="UTenancy" className="h-14 w-auto" style={{ filter: 'brightness(0) invert(1)', opacity: 0.85 }} />
          </Link>
        </div>

        {/* Badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-1.5 text-xs font-head font-bold text-white/60 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-sand animate-pulse-dot" />Landlord Portal — Coming Soon
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-display text-5xl md:text-6xl font-light text-white mb-5 leading-tight">
          First in line.<br />
          <em className="text-sand">Join the waitlist.</em>
        </h1>
        <p className="font-body text-white/55 text-lg mb-10 leading-relaxed">
          We&apos;re building a full property management portal for landlords — verified student applicants, automated rent collection, and a complete dashboard. Be first to know when it goes live.
        </p>

        {/* Form */}
        {status === 'success' ? (
          <div className="py-6 px-8 rounded-2xl border border-white/20 bg-white/5">
            <p className="font-head font-bold text-sand text-xl mb-2">You&apos;re on the list! 🎉</p>
            <p className="font-body text-white/55 text-sm">We&apos;ll reach out the moment the landlord portal launches.</p>
            <Link href="/" className="inline-block mt-6 text-xs font-head font-bold text-white/40 hover:text-white/70 transition-colors">
              ← Back to home
            </Link>
          </div>
        ) : (
          <>
            <div className="flex gap-3">
              <input
                className="waitlist-input flex-1"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                disabled={status === 'loading'}
              />
              <button
                onClick={handleSubmit}
                disabled={status === 'loading'}
                className="clay-grad text-white px-6 py-3.5 rounded-full font-head font-bold text-sm whitespace-nowrap hover:opacity-90 transition-all shadow-xl shadow-clay/30 disabled:opacity-60"
              >
                {status === 'loading' ? 'Joining…' : 'Notify Me'}
              </button>
            </div>

            {status === 'duplicate' && (
              <p className="text-sand/80 text-xs font-body mt-3">You&apos;re already on the list — we&apos;ll be in touch soon!</p>
            )}
            {status === 'error' && (
              <p className="text-red-400 text-xs font-body mt-3">Something went wrong. Please try again.</p>
            )}
            {status === 'idle' && (
              <p className="text-white/25 text-xs font-body mt-4">No spam. Unsubscribe anytime.</p>
            )}
          </>
        )}

        {/* What's coming */}
        <div className="mt-14 grid grid-cols-3 gap-4 text-left">
          {[
            { icon: 'dashboard',     label: 'Full Dashboard',      body: 'Manage listings, applicants, and payments from one place.' },
            { icon: 'verified_user', label: 'Verified Tenants',    body: 'Every applicant pre-verified with a .edu email before they reach you.' },
            { icon: 'payments',      label: 'Automated Rent',      body: 'Direct ACH deposits split and routed automatically each month.' },
          ].map(({ icon, label, body }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <span className="material-symbols-outlined text-sand text-xl mb-2 block">{icon}</span>
              <p className="font-head font-bold text-white text-sm mb-1">{label}</p>
              <p className="font-body text-white/40 text-xs leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Student nudge */}
        <p className="mt-10 text-white/30 text-xs font-body">
          Are you a student?{' '}
          <Link href="/auth" className="text-sand/70 hover:text-sand underline underline-offset-2 transition-colors font-semibold">
            Sign up free — it&apos;s already live for you.
          </Link>
        </p>

      </div>
    </main>
  )
}
