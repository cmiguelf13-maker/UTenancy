'use client'

import { useState, useRef } from 'react'
import { createClient, isEduEmail } from '@/lib/supabase'

/* ─── Types ───────────────────────────────────── */
type Role  = 'student' | 'landlord'
type Panel = 'login' | 'signup' | 'otp' | 'forgot' | 'success'
type Tab   = 'login' | 'signup'
type ToastVariant = 'info' | 'success' | 'error'

/* ─── Toast helper ────────────────────────────── */
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

/* ─── Password strength ───────────────────────── */
function passwordStrength(pw: string) {
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

/* ─── OTP Inputs (8-digit) ────────────────────── */
function OtpInputs({ onComplete }: { onComplete: (val: string) => void }) {
  const [vals, setVals] = useState(['', '', '', '', '', '', '', ''])
  const refsArray = useRef<Array<HTMLInputElement | null>>(new Array(8).fill(null))

  const handleChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const next = [...vals]; next[i] = v; setVals(next)
    if (v && i < 7) refsArray.current[i + 1]?.focus()
    if (next.every(Boolean)) onComplete(next.join(''))
  }
  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !vals[i] && i > 0) refsArray.current[i - 1]?.focus()
  }

  return (
    <div className="flex justify-center gap-1.5 mb-6">
      {vals.map((v, i) => (
        <input key={i}
          ref={(el) => { refsArray.current[i] = el }}
          type="text" inputMode="numeric" maxLength={1}
          value={v} onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={`otp-input ${v ? 'filled' : ''}`} />
      ))}
    </div>
  )
}

/* ─── Role Toggle ─────────────────────────────── */
function RoleToggle({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  return (
    <div className="flex items-center justify-center gap-1 p-1 bg-surf-hi rounded-full border border-out-var mb-7">
      {(['student', 'landlord'] as Role[]).map((r) => (
        <button key={r} type="button" onClick={() => onChange(r)}
          className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-head font-semibold transition-all
            ${role === r ? 'clay-grad text-white shadow-md' : 'text-muted hover:text-clay-dark'}`}>
          <span className="material-symbols-outlined text-base">
            {r === 'student' ? 'school' : 'domain'}
          </span>
          {r === 'student' ? 'Student' : 'Landlord'}
        </button>
      ))}
    </div>
  )
}

/* ─── Main auth page ──────────────────────────── */
export default function AuthPage() {
  const supabase = createClient()

  const [role,   setRole]   = useState<Role>('student')
  const [panel,  setPanel]  = useState<Panel>('login')
  const [tab,    setTab]    = useState<Tab>('login')
  const [showPw, setShowPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [password, setPassword]  = useState('')
  const [loading,  setLoading]   = useState(false)
  const [pendingEmail,      setPendingEmail]      = useState('')
  const [pendingName,       setPendingName]        = useState('')
  const [pendingLastName,   setPendingLastName]    = useState('')
  const [pendingUniversity, setPendingUniversity]  = useState('')
  const [pendingCompany,    setPendingCompany]     = useState('')
  const [pendingPhone,      setPendingPhone]       = useState('')
  const [otpTimer, setOtpTimer] = useState(30)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const { toast, show: showToast } = useToast()

  const strength = passwordStrength(password)
  const isLandlord = role === 'landlord'

  function switchTab(t: Tab) { setTab(t); setPanel(t) }

  function handleRoleChange(r: Role) {
    setRole(r)
    setPanel('login')
    setTab('login')
    setPassword('')
  }

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
    const form  = e.target as HTMLFormElement
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
    const pw    = (form.elements.namedItem('password') as HTMLInputElement).value

    if (!isLandlord && !isEduEmail(email)) {
      showToast('Please use a .edu university email address.', 'error')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw })
    setLoading(false)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    // ── Email verification check ──
    // Block sign-in if the user hasn't clicked the confirmation link yet.
    if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut()
      showToast('Please verify your email address before signing in. Check your inbox.', 'error')
      return
    }

    // ── Role mismatch check ──
    const accountRole = data.user?.user_metadata?.role ?? 'student'
    if (accountRole !== role) {
      await supabase.auth.signOut()
      showToast(
        isLandlord
          ? 'This account is registered as a student. Please switch to Student.'
          : 'This account is registered as a landlord. Please switch to Landlord.',
        'error'
      )
      return
    }

    // ── Profile completeness check ──
    // Redirect to /profile if the user has never completed their profile.
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', data.user.id)
      .single()

    const profileIncomplete = !profileRow?.first_name

    showToast('Signed in!', 'success')
    setTimeout(() => {
      if (profileIncomplete) {
        window.location.href = '/profile'
      } else {
        window.location.href = isLandlord ? '/landlord' : '/'
      }
    }, 800)
  }

  /* ── Sign Up (Student) ── */
  async function handleStudentSignUp(e: React.FormEvent) {
    e.preventDefault()
    const form       = e.target as HTMLFormElement
    const firstName  = (form.elements.namedItem('first') as HTMLInputElement).value.trim()
    const lastName   = (form.elements.namedItem('last') as HTMLInputElement).value.trim()
    const email      = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
    const pw         = (form.elements.namedItem('password') as HTMLInputElement).value
    const university = (form.elements.namedItem('university') as HTMLSelectElement).value

    if (!isEduEmail(email)) {
      showToast('Only .edu university email addresses are allowed.', 'error'); return
    }
    if (pw.length < 8) {
      showToast('Password must be at least 8 characters.', 'error'); return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email, password: pw,
      options: {
        data: { first_name: firstName, last_name: lastName, university, role: 'student' },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)

    if (error) { showToast(error.message, 'error'); return }
    setPendingEmail(email)
    setPendingName(firstName)
    setPendingLastName(lastName)
    setPendingUniversity(university)
    startOtpTimer(); setPanel('otp')
  }

  /* ── Sign Up (Landlord) ── */
  async function handleLandlordSignUp(e: React.FormEvent) {
    e.preventDefault()
    const form    = e.target as HTMLFormElement
    const firstName = (form.elements.namedItem('first') as HTMLInputElement).value.trim()
    const lastName  = (form.elements.namedItem('last') as HTMLInputElement).value.trim()
    const email     = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
    const pw        = (form.elements.namedItem('password') as HTMLInputElement).value
    const company   = (form.elements.namedItem('company') as HTMLInputElement).value.trim()
    const phone     = (form.elements.namedItem('phone') as HTMLInputElement).value.trim()

    if (!email.includes('@') || !email.includes('.')) {
      showToast('Enter a valid email address.', 'error'); return
    }
    if (pw.length < 8) {
      showToast('Password must be at least 8 characters.', 'error'); return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email, password: pw,
      options: {
        data: { first_name: firstName, last_name: lastName, company, phone, role: 'landlord' },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)

    if (error) { showToast(error.message, 'error'); return }
    setPendingEmail(email)
    setPendingName(firstName)
    setPendingLastName(lastName)
    setPendingCompany(company)
    setPendingPhone(phone)
    startOtpTimer(); setPanel('otp')
  }

  /* ── OTP verify ── */
  async function handleOtpComplete(entered: string) {
    setLoading(true)
    const { data: verifyData, error } = await supabase.auth.verifyOtp({
      email: pendingEmail, token: entered, type: 'signup',
    })
    setLoading(false)

    if (error) {
      showToast('Incorrect or expired code — try again.', 'error')
      return
    }

    // ── Write initial profile row to DB ──
    // This ensures role is present in the profiles table from the moment
    // the account is created, not just in user_metadata.
    const userId = verifyData.user?.id
    if (userId) {
      const profilePayload: Record<string, unknown> = {
        id:         userId,
        role:       role,
        first_name: pendingName,
        last_name:  pendingLastName,
        updated_at: new Date().toISOString(),
      }
      if (role === 'landlord') {
        profilePayload.email   = pendingEmail
        profilePayload.phone   = pendingPhone
        profilePayload.company = pendingCompany
      } else {
        profilePayload.university = pendingUniversity
      }
      await supabase.from('profiles').upsert(profilePayload)
    }

    showToast('Email verified!', 'success')
    setTimeout(() => setPanel('success'), 500)
  }

  /* ── Resend OTP ── */
  async function handleResendOtp() {
    const { error } = await supabase.auth.resend({ type: 'signup', email: pendingEmail })
    if (error) showToast(error.message, 'error')
    else { startOtpTimer(); showToast('New code sent!', 'info') }
  }

  /* ── Forgot password ── */
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    const form  = e.target as HTMLFormElement
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim()

    if (!isLandlord && !isEduEmail(email)) {
      showToast('Please enter your .edu university email.', 'error'); return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Route the recovery link through the callback to exchange the PKCE code,
      // then forward to the reset-password page.
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })
    setLoading(false)

    if (error) showToast(error.message, 'error')
    else { showToast('Reset link sent! Check your inbox.', 'success'); setTimeout(() => setPanel('login'), 2000) }
  }

  const anim = 'anim-fade-up'

  /* ── Shared tab bar ── */
  const TabBar = () => (
    <div className="bg-surf-hi rounded-xl p-1 flex gap-1 mb-8">
      <button className={`tab-btn flex-1 ${tab === 'login'  ? 'active' : ''}`} onClick={() => switchTab('login')}>Sign In</button>
      <button className={`tab-btn flex-1 ${tab === 'signup' ? 'active' : ''}`} onClick={() => switchTab('signup')}>Create Account</button>
    </div>
  )

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-20 relative overflow-hidden min-h-[calc(100vh-73px)]">
      {/* Blobs */}
      <div className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: isLandlord ? 'radial-gradient(circle,#c8d8fe,#607090)' : 'radial-gradient(circle,#fec8b6,#9c7060)' }} />
      <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] pointer-events-none"
        style={{ background: isLandlord ? '#303d56' : '#6b4c3b' }} />

      <div className="w-full max-w-md relative z-10">

        {/* ══ PANEL: LOGIN ══ */}
        {panel === 'login' && (
          <div className={`auth-card p-8 md:p-10 ${anim}`}>
            <div className="text-center mb-6">
              <div className={`inline-flex items-center gap-2 border border-out-var rounded-full px-4 py-1.5 mb-5 ${isLandlord ? 'bg-slate-50' : 'bg-surf-lo'}`}>
                <span className="w-2 h-2 rounded-full bg-clay animate-pulse-dot" />
                <span className="text-xs font-head font-bold text-clay-dark tracking-widest uppercase">
                  {isLandlord ? 'Landlord Portal' : 'Student Portal'}
                </span>
              </div>
              <h1 className="font-display text-4xl font-light text-clay-dark leading-tight mb-2">
                {isLandlord ? <>Manage your <em>properties</em></> : <>Welcome <em>back</em></>}
              </h1>
              <p className="text-sm font-body text-muted">
                {isLandlord ? 'Sign in to your landlord account' : 'Sign in to your UTenancy account'}
              </p>
            </div>

            <RoleToggle role={role} onChange={handleRoleChange} />
            <TabBar />

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">
                  {isLandlord ? 'Email Address' : '.edu Email Address'}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">mail</span>
                  <input name="email" type="email" className="auth-input"
                    placeholder={isLandlord ? 'you@yourcompany.com' : 'your@university.edu'}
                    autoComplete="email" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">lock</span>
                  <input name="password" type={showPw ? 'text' : 'password'} className="auth-input has-right"
                    placeholder=" " autoComplete="current-password" required />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-clay transition-colors"
                    onClick={() => setShowPw((v) => !v)}>
                    <span className="material-symbols-outlined text-lg">{showPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setPanel('forgot')}
                  className="text-xs font-head font-semibold text-clay hover:text-clay-dark transition-colors">
                  Forgot password?
                </button>
              </div>
              <button type="submit"
                className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[.98] shadow-lg shadow-clay/25">
                {loading ? <span className="spinner" /> : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-xs font-body text-muted mt-6">
              Don&apos;t have an account?{' '}
              <button onClick={() => switchTab('signup')} className="font-head font-bold text-clay hover:text-clay-dark transition-colors">
                Create one free →
              </button>
            </p>
          </div>
        )}

        {/* ══ PANEL: SIGN UP ══ */}
        {panel === 'signup' && (
          <div className={`auth-card p-8 md:p-10 ${anim}`}>
            <div className="text-center mb-6">
              <div className={`inline-flex items-center gap-2 border border-out-var rounded-full px-4 py-1.5 mb-5 ${isLandlord ? 'bg-slate-50' : 'bg-surf-lo'}`}>
                <span className="w-2 h-2 rounded-full bg-clay animate-pulse-dot" />
                <span className="text-xs font-head font-bold text-clay-dark tracking-widest uppercase">
                  {isLandlord ? 'Free to List' : 'Free for Students'}
                </span>
              </div>
              <h1 className="font-display text-4xl font-light text-clay-dark leading-tight mb-2">
                {isLandlord ? <>Join as a <em>landlord</em></> : <>Join <em>UTenancy</em></>}
              </h1>
              <p className="text-sm font-body text-muted">
                {isLandlord ? 'Create your landlord account to list properties' : 'Create your verified student account'}
              </p>
            </div>

            <RoleToggle role={role} onChange={handleRoleChange} />
            <TabBar />

            {/* ── Student signup ── */}
            {!isLandlord && (
              <form onSubmit={handleStudentSignUp} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-3">
                  {[{ name: 'first', label: 'First Name', ac: 'given-name' }, { name: 'last', label: 'Last Name', ac: 'family-name' }].map(({ name, label, ac }) => (
                    <div key={name}>
                      <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">{label}</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">person</span>
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
                    <input name="password" type={showNewPw ? 'text' : 'password'} className="auth-input has-right"
                      placeholder=" " value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-clay transition-colors"
                      onClick={() => setShowNewPw((v) => !v)}>
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
                    <select name="university" className="auth-input cursor-pointer appearance-none" style={{ paddingLeft: 44 }}>
                      <option value="">Select your university…</option>
                      {['Loyola Marymount University (LMU)', 'Other'].map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <p className="text-xs font-body text-muted text-center">
                  By creating an account you agree to our{' '}
                  <a href="#" className="text-clay font-semibold hover:underline">Terms</a> and{' '}
                  <a href="#" className="text-clay font-semibold hover:underline">Privacy Policy</a>.
                </p>
                <button type="submit"
                  className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[.98] shadow-lg shadow-clay/25">
                  {loading ? <span className="spinner" /> : 'Create Student Account'}
                </button>
              </form>
            )}

            {/* ── Landlord signup ── */}
            {isLandlord && (
              <form onSubmit={handleLandlordSignUp} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-3">
                  {[{ name: 'first', label: 'First Name', ac: 'given-name' }, { name: 'last', label: 'Last Name', ac: 'family-name' }].map(({ name, label, ac }) => (
                    <div key={name}>
                      <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">{label}</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">person</span>
                        <input name={name} type="text" className="auth-input" placeholder=" " autoComplete={ac} required />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">mail</span>
                    <input name="email" type="email" className="auth-input" placeholder="you@yourcompany.com" autoComplete="email" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Phone Number</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">phone</span>
                    <input name="phone" type="tel" className="auth-input" placeholder="(310) 555-0000" autoComplete="tel" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">
                    Company / Business Name <span className="text-muted normal-case font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">apartment</span>
                    <input name="company" type="text" className="auth-input" placeholder="Pacific Student Housing LLC" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">lock</span>
                    <input name="password" type={showNewPw ? 'text' : 'password'} className="auth-input has-right"
                      placeholder=" " value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-clay transition-colors"
                      onClick={() => setShowNewPw((v) => !v)}>
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
                <p className="text-xs font-body text-muted text-center">
                  By creating an account you agree to our{' '}
                  <a href="#" className="text-clay font-semibold hover:underline">Terms</a> and{' '}
                  <a href="#" className="text-clay font-semibold hover:underline">Privacy Policy</a>.
                </p>
                <button type="submit"
                  className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[.98] shadow-lg shadow-clay/25">
                  {loading ? <span className="spinner" /> : 'Create Landlord Account'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ══ PANEL: OTP ══ */}
        {panel === 'otp' && (
          <div className={`auth-card p-8 md:p-10 ${anim}`}>
            <button onClick={() => setPanel('signup')} className="flex items-center gap-1 text-xs font-head font-semibold text-muted hover:text-clay mb-6 transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Back
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-surf-lo border border-out-var rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-clay text-3xl">mark_email_unread</span>
              </div>
              <h1 className="font-display text-3xl font-light text-clay-dark mb-2">Check your <em>inbox</em></h1>
              <p className="text-sm font-body text-muted">
                We sent an 8-digit code to <strong className="text-clay-dark">{pendingEmail || 'your email'}</strong>
              </p>
            </div>
            <OtpInputs onComplete={handleOtpComplete} />
            <div className="text-center mb-6">
              {otpTimer > 0
                ? <p className="text-xs font-body text-muted">Resend code in <span className="font-head font-bold text-clay-dark">{otpTimer}s</span></p>
                : <button onClick={handleResendOtp} className="text-xs font-head font-bold text-clay hover:text-clay-dark transition-colors">Resend code →</button>}
            </div>
          </div>
        )}

        {/* ══ PANEL: FORGOT ══ */}
        {panel === 'forgot' && (
          <div className={`auth-card p-8 md:p-10 ${anim}`}>
            <button onClick={() => setPanel('login')} className="flex items-center gap-1 text-xs font-head font-semibold text-muted hover:text-clay mb-6 transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Sign In
            </button>
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-light text-clay-dark mb-2">Reset <em>password</em></h1>
              <p className="text-sm font-body text-muted">
                {isLandlord ? "Enter your email and we'll send a reset link." : "Enter your .edu email and we'll send a reset link."}
              </p>
            </div>
            <form onSubmit={handleForgot} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">
                  {isLandlord ? 'Email Address' : 'University Email'}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">mail</span>
                  <input name="email" type="email" className="auth-input"
                    placeholder={isLandlord ? 'you@yourcompany.com' : 'you@university.edu'} required />
                </div>
              </div>
              <button type="submit"
                className="clay-grad w-full text-white py-3.5 rounded-xl font-head font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                {loading ? <span className="spinner" /> : 'Send Reset Link'}
              </button>
            </form>
          </div>
        )}

        {/* ══ PANEL: SUCCESS ══ */}
        {panel === 'success' && (
          <div className={`auth-card p-8 md:p-10 text-center ${anim}`}>
            <div className="check-circle mx-auto mb-6 anim-check">
              <span className="material-symbols-outlined text-white text-3xl fill">check</span>
            </div>
            <h1 className="font-display text-3xl font-light text-clay-dark mb-2">
              Welcome, <em>{pendingName || (isLandlord ? 'landlord' : 'student')}</em>!
            </h1>
            <p className="text-sm font-body text-muted mb-8">
              {isLandlord
                ? 'Your landlord account is verified. Complete your profile to start listing.'
                : 'Your .edu is verified. Complete your profile to get started.'}
            </p>
            <a href="/profile"
              className="clay-grad block w-full text-white py-3.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/25 text-center">
              Complete Your Profile →
            </a>
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
