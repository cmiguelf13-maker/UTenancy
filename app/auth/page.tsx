'use client'

import { useState, useRef } from 'react'
import { createClient, isEduEmail } from '@/lib/supabase'

/* ─── Types ──────────────────────────────────── */
type Panel = 'login' | 'signup' | 'otp' | 'forgot' | 'success'
type Tab   = 'login' | 'signup'
type ToastVariant = 'info' | 'success' | 'error'

/* ─── Toast helper ───────────────────────────── */
function useToast() {
  const [toast, setToast] = useState<{ msg: string; variant: ToastVariant } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const show = (msg: string, variant: ToastVariant = 'info') => {
    clearTimeout(timerRef.current)
    setToast({ msg, variant })
    timerRef.current = setTimeout(() => setToast(null), 4000)
  }
  return { toast, show }
}

/* ─── Password strength ──────────────────────── */
function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const levels = [
    { label: '',       color: 'bg-out-var'   },
    { label: 'Weak',   color: 'bg-red-400'   },
    { label: 'Fair',   color: 'bg-amber-400' },
    { label: 'Good',   color: 'bg-blue-400'  },
    { label: 'Strong', color: 'bg-green-500' },
  ]
  return { score, ...levels[score] }
}

/* ─── OTP Inputs ──────────────────────────────── */
function OtpInputs({ onComplete }: { onComplete: (val: string) => void }) {
  const [vals, setVals] = useState(['', '', '', '', '', '', '', ''])
  const r0 = useRef<HTMLInputElement>(null)
  const r1 = useRef<HTMLInputElement>(null)
  const r2 = useRef<HTMLInputElement>(null)
  const r3 = useRef<HTMLInputElement>(null)
  const r4 = useRef<HTMLInputElement>(null)
  const r5 = useRef<HTMLInputElement>(null)
  const r6 = useRef<HTMLInputElement>(null)
  const r7 = useRef<HTMLInputElement>(null)
  const refs = [r0, r1, r2, r3, r4, r5, r6, r7]

  const handleChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const next = [...vals]; next[i] = v; setVals(next)
    if (v && i < 7) refs[i + 1].current?.focus()
    if (next.every(Boolean)) onComplete(next.join(''))
  }
  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !vals[i] && i > 0) refs[i - 1].current?.focus()
  }

  return (
    <div className="flex justify-center gap-3 mb-6">
      {vals.map((v, i) => (
        <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1}
          value={v} onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)}
          className={`otp-input ${v ? 'filled' : ''}`} />
      ))}
    </div>
  )
}

/* ─── Main auth page ─────────────────────────── */
export default function AuthPage() {
  const supabase = createClient()

  const [panel, setPanel]           = useState<Panel>('login')
  const [tab, setTab]               = useState<Tab>('login')
  const [showPw, setShowPw]         = useState(false)
  const [showNewPw, setShowNewPw]   = useState(false)
  const [password, setPassword]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [pendingName, setPendingName]   = useState('')
  const [otpTimer, setOtpTimer]     = useState(30)
  const timerRef                    = useRef<ReturnType<typeof setInterval>>()
  const { toast, show: showToast }  = useToast()

  const strength = passwordStrength(password)

  function switchTab(t: Tab) { setTab(t); setPanel(t) }
  function showPanel(p: Panel) { setPanel(p) }

  function startOtpTimer() {
    clearInterval(timerRef.current)
    setOtpTimer(30)
    timerRef.current = setInterval(() => {
      setOtpTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current); return 0 }
        return t - 1
      })
    }, 1000)
  }

  /* ── Sign In ── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const form     = e.target as HTMLFormElement
    const email    = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
    const pw       = (form.elements.namedItem('password') as HTMLInputElement).value

    if (!isEduEmail(email)) {
      showToast('Please use a .edu university email address.', 'error')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    setLoading(false)

    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Signed in successfully!', 'success')
      setTimeout(() => { window.location.href = '/' }, 1000)
    }
  }

  /* ── Sign Up ── */
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    const form       = e.target as HTMLFormElement
    const firstName  = (form.elements.namedItem('first') as HTMLInputElement).value.trim()
    const lastName   = (form.elements.namedItem('last') as HTMLInputElement).value.trim()
    const email      = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
    const pw         = (form.elements.namedItem('password') as HTMLInputElement).value
    const university = (form.elements.namedItem('university') as HTMLSelectElement).value

    if (!isEduEmail(email)) {
      showToast('Only .edu university email addresses are allowed.', 'error')
      return
    }
    if (pw.length < 8) {
      showToast('Password must be at least 8 characters.', 'error')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password: pw,
      options: {
        data: { first_name: firstName, last_name: lastName, university },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    setPendingEmail(email)
    setPendingName(firstName)
    startOtpTimer()
    showPanel('otp')
  }

  /* ── OTP verify ── */
  async function handleOtpComplete(entered: string) {
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: entered,
      type: 'signup',
    })
    setLoading(false)

    if (error) {
      showToast('Incorrect or expired code — try again.', 'error')
    } else {
      showToast('Email verified!', 'success')
      setTimeout(() => showPanel('success'), 500)
    }
  }

  /* ── Resend OTP ── */
  async function handleResendOtp() {
    const { error } = await supabase.auth.resend({ type: 'signup', email: pendingEmail })
    if (error) {
      showToast(error.message, 'error')
    } else {
      startOtpTimer()
      showToast('New code sent!', 'info')
    }
  }

  /* ── Forgot password ── */
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    const form  = e.target as HTMLFormElement
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim()

    if (!isEduEmail(email)) {
      showToast('Please enter your .edu university email.', 'error')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setLoading(false)

    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Reset link sent! Check your inbox.', 'success')
      setTimeout(() => showPanel('login'), 2000)
    }
  }

  const anim = 'anim-fade-up'

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-20 relative overflow-hidden min-h-[calc(100vh-73px)]">
      {/* Ambient blobs */}
      <div className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] pointer-events-none" style={{ background: 'radial-gradient(circle,#fec8b6,#9c7060)' }} />
      <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] pointer-events-none" style={{ background: '#6b4c3b' }} />

      <div className="w-full max-w-md relative z-10">

        {/* ── PANEL: LOGIN ── */}
        {panel === 'login' && (
          <div className={`auth-card p-8 md:p-10 ${anim}`}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-surf-lo border border-out-var rounded-full px-4 py-1.5 mb-5">
                <span className="w-2 h-2 rounded-full bg-clay animate-pulse-dot" />
                <span className="text-xs font-head font-bold text-clay-dark tracking-widest uppercase">Student Portal</span>
              </div>
              <h1 className="font-display text-4xl font-light text-clay-dark leading-tight mb-2">Welcome <em>back</em></h1>
              <p className="text-sm font-body text-muted">Sign in to your UTenancy account</p>
            </div>

            <div className="bg-surf-hi rounded-xl p-1 flex gap-1 mb-8">
              <button className={`tab-btn flex-1 ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>Sign In</button>
              <button className={`tab-btn flex-1 ${tab === 'signup' ? 'active' : ''}`} onClick={() => switchTab('signup')}>Create Account</button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">mail</span>
                  <input name="email" type="email" className="auth-input" placeholder="your@university.edu" autoComplete="email" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">lock</span>
                  <input name="password" type={showPw ? 'text' : 'password'} className="auth-input has-right" placeholder=" " autoComplete="current-password" required />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-clay transition-colors" onClick={() => setShowPw((v) => !v)}>
                    <span className="material-symbols-outlined text-lg">{showPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => showPanel('forgot')} className="text-xs font-head font-semibold text-clay hover:text-clay-dark transition-colors">Forgot password?</button>
              </div>
              <button type="submit" className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[.98] shadow-lg shadow-clay/25">
                {loading ? <span className="spinner" /> : 'Sign In'}
              </button>
            </form>
            <p className="text-center text-xs font-body text-muted mt-6">
              Don&apos;t have an account?{' '}
              <button onClick={() => switchTab('signup')} className="font-head font-bold text-clay hover:text-clay-dark transition-colors">Create one free →</button>
            </p>
          </div>
        )}

        {/* ── PANEL: SIGN UP ── */}
        {panel === 'signup' && (
          <div className={`auth-card p-8 md:p-10 ${anim}`}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-surf-lo border border-out-var rounded-full px-4 py-1.5 mb-5">
                <span className="w-2 h-2 rounded-full bg-clay animate-pulse-dot" />
                <span className="text-xs font-head font-bold text-clay-dark tracking-widest uppercase">Free for Students</span>
              </div>
              <h1 className="font-display text-4xl font-light text-clay-dark leading-tight mb-2">Join <em>UTenancy</em></h1>
              <p className="text-sm font-body text-muted">Create your verified student account</p>
            </div>

            <div className="bg-surf-hi rounded-xl p-1 flex gap-1 mb-8">
              <button className={`tab-btn flex-1 ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>Sign In</button>
              <button className={`tab-btn flex-1 ${tab === 'signup' ? 'active' : ''}`} onClick={() => switchTab('signup')}>Create Account</button>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                {[{ name: 'first', label: 'First Name', icon: 'person', ac: 'given-name' }, { name: 'last', label: 'Last Name', icon: 'person', ac: 'family-name' }].map(({ name, label, icon, ac }) => (
                  <div key={name}>
                    <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">{label}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">{icon}</span>
                      <input name={name} type="text" className="auth-input" placeholder=" " autoComplete={ac} required />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">University Email (.edu)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">school</span>
                  <input name="email" type="email" className="auth-input" placeholder="you@university.edu" autoComplete="email" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">lock</span>
                  <input name="password" type={showNewPw ? 'text' : 'password'} className="auth-input has-right" placeholder=" " value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-clay transition-colors" onClick={() => setShowNewPw((v) => !v)}>
                    <span className="material-symbols-outlined text-lg">{showNewPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className={`strength-bar ${n <= strength.score ? strength.color : 'bg-out-var'}`} />
                      ))}
                    </div>
                    <p className="text-xs font-head font-semibold" style={{ color: strength.score >= 3 ? '#4caf7d' : strength.score === 2 ? '#f59e0b' : '#d44' }}>{strength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">University</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">location_city</span>
                  <select name="university" className="auth-input no-icon cursor-pointer appearance-none" style={{ paddingLeft: 44 }}>
                    <option value="">Select your university…</option>
                    {['Loyola Marymount University (LMU)', 'UCLA', 'USC', 'Cal State LA', 'Pepperdine University', 'Other'].map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <p className="text-xs font-body text-muted text-center">
                By creating an account you agree to our{' '}
                <a href="#" className="text-clay font-semibold hover:underline">Terms</a> and{' '}
                <a href="#" className="text-clay font-semibold hover:underline">Privacy Policy</a>.
              </p>
              <button type="submit" className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[.98] shadow-lg shadow-clay/25">
                {loading ? <span className="spinner" /> : 'Create Account'}
              </button>
            </form>
          </div>
        )}

        {/* ── PANEL: OTP ── */}
        {panel === 'otp' && (
          <div className={`auth-card p-8 md:p-10 ${anim}`}>
            <button onClick={() => showPanel('signup')} className="flex items-center gap-1 text-xs font-head font-semibold text-muted hover:text-clay mb-6 transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Back
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-surf-lo border border-out-var rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-clay text-3xl">mark_email_unread</span>
              </div>
              <h1 className="font-display text-3xl font-light text-clay-dark mb-2">Check your <em>inbox</em></h1>
              <p className="text-sm font-body text-muted">
                We sent a 6-digit code to <strong className="text-clay-dark">{pendingEmail || 'your .edu email'}</strong>
              </p>
            </div>

            <OtpInputs onComplete={handleOtpComplete} />

            <div className="text-center mb-6">
              {otpTimer > 0
                ? <p className="text-xs font-body text-muted">Resend code in <span className="font-head font-bold text-clay-dark">{otpTimer}s</span></p>
                : <button onClick={handleResendOtp} className="text-xs font-head font-bold text-clay hover:text-clay-dark transition-colors">Resend code →</button>
              }
            </div>
          </div>
        )}

        {/* ── PANEL: FORGOT ── */}
        {panel === 'forgot' && (
          <div className={`auth-card p-8 md:p-10 ${anim}`}>
            <button onClick={() => showPanel('login')} className="flex items-center gap-1 text-xs font-head font-semibold text-muted hover:text-clay mb-6 transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Sign In
            </button>
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-light text-clay-dark mb-2">Reset <em>password</em></h1>
              <p className="text-sm font-body text-muted">Enter your .edu email and we&apos;ll send a reset link.</p>
            </div>
            <form onSubmit={handleForgot} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">University Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">mail</span>
                  <input name="email" type="email" className="auth-input" placeholder="you@university.edu" required />
                </div>
              </div>
              <button type="submit" className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                {loading ? <span className="spinner" /> : 'Send Reset Link'}
              </button>
            </form>
          </div>
        )}

        {/* ── PANEL: SUCCESS ── */}
        {panel === 'success' && (
          <div className={`auth-card p-8 md:p-10 text-center ${anim}`}>
            <div className="check-circle mx-auto mb-6 anim-check">
              <span className="material-symbols-outlined text-white text-3xl fill">check</span>
            </div>
            <h1 className="font-display text-3xl font-light text-clay-dark mb-2">
              Welcome to UTenancy, <em>{pendingName || 'student'}</em>!
            </h1>
            <p className="text-sm font-body text-muted mb-8">Your .edu is verified. You&apos;re officially in.</p>
            <div className="space-y-3">
              <a href="/" className="clay-grad block w-full text-white py-3.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/25 text-center">
                Browse Listings →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast show ${toast.variant}`}>
          <span className="material-symbols-outlined text-base fill">
            {toast.variant === 'success' ? 'check_circle' : toast.variant === 'error' ? 'error' : 'info'}
          </span>
          {toast.msg}
        </div>
      )}
    </main>
  )
}
