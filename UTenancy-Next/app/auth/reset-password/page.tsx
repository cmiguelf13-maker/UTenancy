'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

/**
 * /auth/reset-password
 *
 * Reached after Supabase sends the user through /auth/callback (which
 * exchanges the one-time recovery code for a live session), then
 * redirects here via the `next` param.
 *
 * The user already has a recovery session at this point — we just need
 * them to choose a new password and call updateUser().
 */
export default function ResetPasswordPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [checking,  setChecking]  = useState(true)

  /* Verify a recovery session exists before showing the form */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        // No session — the link has expired or was already used
        router.replace('/auth?error=reset_link_expired')
      } else {
        setChecking(false)
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error: updateErr } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateErr) {
      setError(updateErr.message)
      return
    }

    setDone(true)
    // Give the user a moment to read the success message, then redirect
    setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        const role = data.session?.user?.user_metadata?.role ?? 'student'
        router.replace(role === 'landlord' ? '/landlord' : '/')
      })
    }, 2000)
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="spinner" style={{ borderColor: 'rgba(107,76,59,.2)', borderTopColor: '#6b4c3b', width: 32, height: 32 }} />
      </main>
    )
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-20 relative overflow-hidden min-h-[calc(100vh-73px)]">
      {/* Background blobs */}
      <div className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle,#fec8b6,#9c7060)' }} />
      <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] pointer-events-none"
        style={{ background: '#6b4c3b' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="auth-card p-8 md:p-10 anim-fade-up">

          {done ? (
            /* ── Success state ── */
            <div className="text-center">
              <div className="check-circle mx-auto mb-6 anim-check">
                <span className="material-symbols-outlined text-white text-3xl fill">check</span>
              </div>
              <h1 className="font-display text-3xl font-light text-clay-dark mb-2">
                Password <em>updated!</em>
              </h1>
              <p className="text-sm font-body text-muted">Redirecting you now…</p>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-surf-lo border border-out-var rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <span className="material-symbols-outlined text-clay text-3xl">lock_reset</span>
                </div>
                <h1 className="font-display text-3xl font-light text-clay-dark mb-2">
                  Set new <em>password</em>
                </h1>
                <p className="text-sm font-body text-muted">
                  Choose a strong password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">lock</span>
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="auth-input has-right"
                      placeholder=" "
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-clay transition-colors"
                      onClick={() => setShowPw((v) => !v)}>
                      <span className="material-symbols-outlined text-lg">{showPw ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">lock</span>
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="auth-input"
                      placeholder=" "
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm font-body text-red-500 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base fill">error</span>
                    {error}
                  </p>
                )}

                <button type="submit"
                  className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[.98] shadow-lg shadow-clay/25">
                  {loading ? <span className="spinner" /> : 'Update Password'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </main>
  )
}
