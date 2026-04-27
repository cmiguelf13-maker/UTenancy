'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function JoinHouseholdPage() {
  const router = useRouter()
  const supabase = createClient()

  const [status, setStatus] = useState<'loading' | 'joining' | 'success' | 'already' | 'invalid' | 'auth'>('loading')
  const [householdName, setHouseholdName] = useState('')

  useEffect(() => {
    async function join() {
      /* ── Auth check ── */
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('auth'); return }

      /* ── Read invite code from URL ── */
      const code = new URLSearchParams(window.location.search).get('code')
      if (!code) { setStatus('invalid'); return }

      /* ── Look up household by invite code ── */
      const { data: hh, error: hhErr } = await supabase
        .from('households')
        .select('id, name')
        .eq('invite_code', code)
        .single()

      if (hhErr || !hh) { setStatus('invalid'); return }

      setHouseholdName(hh.name)
      setStatus('joining')

      /* ── Check if already a member ── */
      const { data: existing } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('household_id', hh.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) { setStatus('already'); return }

      /* ── Add as member ── */
      const { error: joinErr } = await supabase
        .from('household_members')
        .insert({ household_id: hh.id, user_id: user.id, role: 'member' })

      if (joinErr) { setStatus('invalid'); return }

      setStatus('success')
      setTimeout(() => router.replace('/tenant/household'), 1500)
    }

    join()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-out-var shadow-md p-10 max-w-sm w-full text-center">

        {status === 'loading' || status === 'joining' ? (
          <>
            <div className="w-14 h-14 clay-grad rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md">
              <div className="w-6 h-6 border-2 border-white rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="font-head font-bold text-espresso">Joining household…</p>
            <p className="text-sm font-body text-muted mt-1">Just a moment</p>
          </>
        ) : status === 'success' ? (
          <>
            <div className="w-14 h-14 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined fill text-green-600 text-2xl">check_circle</span>
            </div>
            <p className="font-head font-bold text-espresso">You joined <em>{householdName}</em>!</p>
            <p className="text-sm font-body text-muted mt-1">Taking you to your household…</p>
          </>
        ) : status === 'already' ? (
          <>
            <div className="w-14 h-14 bg-linen border border-out-var rounded-2xl flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined fill text-clay text-2xl">house</span>
            </div>
            <p className="font-head font-bold text-espresso">You&apos;re already in <em>{householdName}</em></p>
            <p className="text-sm font-body text-muted mt-2">You&apos;re already a member of this household.</p>
            <Link href="/tenant/household"
              className="mt-5 inline-flex items-center gap-2 clay-grad text-white px-5 py-2.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-md">
              Go to Household
            </Link>
          </>
        ) : status === 'auth' ? (
          <>
            <div className="w-14 h-14 bg-linen border border-out-var rounded-2xl flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined fill text-clay text-2xl">lock</span>
            </div>
            <p className="font-head font-bold text-espresso">Sign in first</p>
            <p className="text-sm font-body text-muted mt-2">You need an account to join a household.</p>
            <Link href={`/auth?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '/tenant/household/join')}`}
              className="mt-5 inline-flex items-center gap-2 clay-grad text-white px-5 py-2.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-md">
              Sign In / Sign Up
            </Link>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined fill text-red-500 text-2xl">link_off</span>
            </div>
            <p className="font-head font-bold text-espresso">Invalid invite link</p>
            <p className="text-sm font-body text-muted mt-2">This link may have expired or is incorrect. Ask your roommate for a new one.</p>
            <Link href="/"
              className="mt-5 inline-flex items-center gap-2 text-clay font-head font-semibold text-sm hover:text-clay-dark transition-colors">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Home
            </Link>
          </>
        )}

      </div>
    </main>
  )
}
