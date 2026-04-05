'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

/* ── Types ── */
interface ProfileData {
  firstName:   string
  lastName:    string
  university:  string
  major:       string
  gradYear:    string
  bio:         string
  // Lifestyle preferences
  sleepTime:   string
  cleanliness: string
  noise:       string
  guests:      string
  smoking:     boolean
  pets:        boolean
  studying:    string
}

const UNIVERSITIES = [
  'Loyola Marymount University (LMU)',
  'UCLA',
  'USC',
  'Cal State LA',
  'Pepperdine University',
  'UC Berkeley',
  'Stanford University',
  'NYU',
  'Boston University',
  'University of Miami',
  'Other',
]

const SLEEP_OPTIONS  = ['Before 10pm', '10pm – Midnight', 'Midnight – 2am', 'Night owl (2am+)']
const CLEAN_OPTIONS  = ['Very tidy', 'Reasonably clean', 'Relaxed', 'Messy but fine']
const NOISE_OPTIONS  = ['Very quiet', 'Low-key', 'Moderate', 'Lively & social']
const GUEST_OPTIONS  = ['Rarely', 'Occasionally', 'Often', 'All the time']
const STUDY_OPTIONS  = ['At home mostly', 'Library / campus', 'Mix of both', 'Rarely at home']

/* ── Pill selector ── */
function PillSelect({ options, value, onChange }: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((opt) => (
        <button key={opt} type="button"
          onClick={() => onChange(opt)}
          className={`px-4 py-2 rounded-full text-sm font-head font-semibold border transition-all
            ${value === opt
              ? 'clay-grad text-white border-transparent shadow-sm'
              : 'bg-white border-out-var text-muted hover:border-clay/50 hover:text-clay-dark'}`}>
          {opt}
        </button>
      ))}
    </div>
  )
}

/* ── Toggle pill ── */
function TogglePill({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-head font-semibold border transition-all
        ${value
          ? 'clay-grad text-white border-transparent shadow-sm'
          : 'bg-white border-out-var text-muted hover:border-clay/50 hover:text-clay-dark'}`}>
      <span className="material-symbols-outlined text-base">{value ? 'check_circle' : 'radio_button_unchecked'}</span>
      {label}
    </button>
  )
}

/* ── Section heading ── */
function SectionHeading({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 clay-grad rounded-xl flex items-center justify-center flex-shrink-0 shadow-md mt-0.5">
        <span className="material-symbols-outlined fill text-white text-lg">{icon}</span>
      </div>
      <div>
        <h2 className="font-head font-bold text-clay-dark text-base">{title}</h2>
        {subtitle && <p className="text-xs font-body text-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function ProfilePage() {
  const router   = useRouter()
  const supabase = createClient()

  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<ProfileData>({
    firstName:   '',
    lastName:    '',
    university:  '',
    major:       '',
    gradYear:    '',
    bio:         '',
    sleepTime:   '',
    cleanliness: '',
    noise:       '',
    guests:      '',
    smoking:     false,
    pets:        false,
    studying:    '',
  })

  /* ── Load user session and profile data ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      if (!u) { router.push('/auth'); return }
      setUser(u)

      // Fetch from profiles table
      supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .single()
        .then(({ data: profileData, error }) => {
          if (!error && profileData) {
            setProfile((p) => ({
              ...p,
              firstName:   profileData.first_name ?? '',
              lastName:    profileData.last_name ?? '',
              university:  profileData.university ?? '',
              major:       profileData.major ?? '',
              gradYear:    profileData.grad_year ?? '',
              bio:         profileData.bio ?? '',
              sleepTime:   profileData.sleep_time ?? '',
              cleanliness: profileData.cleanliness ?? '',
              noise:       profileData.noise ?? '',
              guests:      profileData.guests ?? '',
              smoking:     profileData.smoking ?? false,
              pets:        profileData.pets ?? false,
              studying:    profileData.studying ?? '',
            }))
            if (profileData.avatar_url) {
              setAvatarUrl(profileData.avatar_url)
            }
          } else {
            // Fallback to user_metadata if profiles table fetch fails
            const m = u.user_metadata ?? {}
            setProfile((p) => ({
              ...p,
              firstName:   m.first_name ?? '',
              lastName:    m.last_name ?? '',
              university:  m.university ?? '',
              major:       m.major ?? '',
              gradYear:    m.grad_year ?? '',
              bio:         m.bio ?? '',
              sleepTime:   m.sleep_time ?? '',
              cleanliness: m.cleanliness ?? '',
              noise:       m.noise ?? '',
              guests:      m.guests ?? '',
              smoking:     m.smoking ?? false,
              pets:        m.pets ?? false,
              studying:    m.studying ?? '',
            }))
            if (m.avatar_url) setAvatarUrl(m.avatar_url)
          }
          setLoading(false)
        })
    })
  }, [])

  /* ── Avatar selection ── */
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  /* ── Save ── */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (!user) {
      setSaving(false)
      return
    }

    try {
      // 1. Upload avatar if changed
      let finalAvatarUrl = avatarUrl
      const file = fileInputRef.current?.files?.[0]
      if (file) {
        const ext  = file.name.split('.').pop()
        const path = `${user.id}/avatar.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, file, { upsert: true })
        if (!uploadErr) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(path)
          finalAvatarUrl = data.publicUrl
        } else {
          // Storage bucket unavailable — fall back to base64 data URL stored in profiles table
          finalAvatarUrl = avatarPreview ?? avatarUrl
        }
        setAvatarUrl(finalAvatarUrl)
      }

      // 2. Upsert to profiles table
      const { error: upsertErr } = await supabase.from('profiles').upsert({
        id: user.id,
        role: user.user_metadata?.role ?? 'student',
        first_name: profile.firstName,
        last_name: profile.lastName,
        university: profile.university,
        major: profile.major,
        grad_year: profile.gradYear,
        bio: profile.bio,
        avatar_url: finalAvatarUrl,
        sleep_time: profile.sleepTime,
        cleanliness: profile.cleanliness,
        noise: profile.noise,
        guests: profile.guests,
        smoking: profile.smoking,
        pets: profile.pets,
        studying: profile.studying,
        updated_at: new Date().toISOString(),
      })

      // 3. Always sync user_metadata — this triggers onAuthStateChange in the Nav
      //    so the avatar and name update instantly without a page reload.
      await supabase.auth.updateUser({
        data: {
          first_name: profile.firstName,
          last_name:  profile.lastName,
          avatar_url: finalAvatarUrl ?? undefined,
          role: user.user_metadata?.role ?? 'student',
        },
      })

      setSaving(false)
      if (!upsertErr) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        setAvatarPreview(null)
      }
    } catch (err) {
      setSaving(false)
    }
  }

  function set<K extends keyof ProfileData>(key: K, val: ProfileData[K]) {
    setProfile((p) => ({ ...p, [key]: val }))
  }

  const displayAvatar = avatarPreview ?? avatarUrl
  const initials = profile.firstName && profile.lastName
    ? (profile.firstName[0] + profile.lastName[0]).toUpperCase()
    : user?.email?.[0].toUpperCase() ?? '?'

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <span className="spinner" style={{ borderColor: 'rgba(107,76,59,.2)', borderTopColor: '#6b4c3b', width: 32, height: 32 }} />
    </main>
  )

  return (
    <main className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Page header ── */}
        <div className="mb-8">
          <a href="/" className="inline-flex items-center gap-1.5 text-sm font-head font-semibold text-muted hover:text-clay transition-colors mb-5">
            <span className="material-symbols-outlined text-base">arrow_back</span> Back to Home
          </a>
          <h1 className="font-display text-4xl font-light text-clay-dark mb-1">Your <em>profile</em></h1>
          <p className="text-sm font-body text-muted">Help roommates and landlords get to know you.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* ── AVATAR ── */}
          <div className="bg-white rounded-3xl border border-out-var p-6 shadow-sm">
            <SectionHeading icon="add_a_photo" title="Profile Photo" subtitle="A clear photo helps build trust with potential roommates." />
            <div className="flex items-center gap-5">
              {/* Avatar circle */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-out-var shadow-md">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full clay-grad flex items-center justify-center">
                      <span className="text-white font-head font-black text-3xl">{initials}</span>
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 clay-grad rounded-full flex items-center justify-center shadow-md border-2 border-white hover:opacity-90 transition-opacity">
                  <span className="material-symbols-outlined text-white text-sm">edit</span>
                </button>
              </div>
              <div>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-head font-bold text-clay hover:text-clay-dark transition-colors underline underline-offset-2">
                  Upload a photo
                </button>
                <p className="text-xs font-body text-muted mt-1">JPG, PNG or WebP · Max 5 MB</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
          </div>

          {/* ── BASIC INFO ── */}
          <div className="bg-white rounded-3xl border border-out-var p-6 shadow-sm">
            <SectionHeading icon="person" title="Basic Information" subtitle="This is how you'll appear to other students." />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">First Name</label>
                  <input value={profile.firstName} onChange={(e) => set('firstName', e.target.value)}
                    className="auth-input no-icon" placeholder="Maya" />
                </div>
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Last Name</label>
                  <input value={profile.lastName} onChange={(e) => set('lastName', e.target.value)}
                    className="auth-input no-icon" placeholder="Johnson" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">University</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">school</span>
                  <select value={profile.university} onChange={(e) => set('university', e.target.value)}
                    className="auth-input appearance-none cursor-pointer" style={{ paddingLeft: 44 }}>
                    <option value="">Select your university…</option>
                    {UNIVERSITIES.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Major</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">menu_book</span>
                    <input value={profile.major} onChange={(e) => set('major', e.target.value)}
                      className="auth-input" placeholder="Psychology" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Grad Year</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">event</span>
                    <input value={profile.gradYear} onChange={(e) => set('gradYear', e.target.value)}
                      className="auth-input" placeholder="2026" maxLength={4} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Bio</label>
                <textarea value={profile.bio} onChange={(e) => set('bio', e.target.value)} rows={3}
                  placeholder="Tell potential roommates a little about yourself — your interests, your schedule, what you're looking for in a home…"
                  className="w-full bg-white border-[1.5px] border-out-var rounded-xl px-4 py-3 font-body text-sm text-stone outline-none resize-none transition-all focus:border-clay focus:shadow-[0_0_0_3px_rgba(107,76,59,.12)] placeholder:text-[#a89990]" />
                <p className="text-[11px] font-body text-muted mt-1 text-right">{profile.bio.length}/280</p>
              </div>
            </div>
          </div>

          {/* ── LIFESTYLE PREFERENCES ── */}
          <div className="bg-white rounded-3xl border border-out-var p-6 shadow-sm">
            <SectionHeading icon="emoji_people" title="Lifestyle Preferences"
              subtitle="Help us match you with compatible roommates. Pick what fits you best." />

            <div className="space-y-6">
              {/* Sleep schedule */}
              <div>
                <p className="text-sm font-head font-bold text-clay-dark flex items-center gap-2">
                  <span className="material-symbols-outlined text-terra text-base">bedtime</span> Sleep schedule
                </p>
                <PillSelect options={SLEEP_OPTIONS} value={profile.sleepTime} onChange={(v) => set('sleepTime', v)} />
              </div>

              {/* Cleanliness */}
              <div>
                <p className="text-sm font-head font-bold text-clay-dark flex items-center gap-2">
                  <span className="material-symbols-outlined text-terra text-base">cleaning_services</span> Cleanliness
                </p>
                <PillSelect options={CLEAN_OPTIONS} value={profile.cleanliness} onChange={(v) => set('cleanliness', v)} />
              </div>

              {/* Noise level */}
              <div>
                <p className="text-sm font-head font-bold text-clay-dark flex items-center gap-2">
                  <span className="material-symbols-outlined text-terra text-base">volume_up</span> Noise & social vibe
                </p>
                <PillSelect options={NOISE_OPTIONS} value={profile.noise} onChange={(v) => set('noise', v)} />
              </div>

              {/* Guests */}
              <div>
                <p className="text-sm font-head font-bold text-clay-dark flex items-center gap-2">
                  <span className="material-symbols-outlined text-terra text-base">group</span> Having guests over
                </p>
                <PillSelect options={GUEST_OPTIONS} value={profile.guests} onChange={(v) => set('guests', v)} />
              </div>

              {/* Studying */}
              <div>
                <p className="text-sm font-head font-bold text-clay-dark flex items-center gap-2">
                  <span className="material-symbols-outlined text-terra text-base">auto_stories</span> Where you study
                </p>
                <PillSelect options={STUDY_OPTIONS} value={profile.studying} onChange={(v) => set('studying', v)} />
              </div>

              {/* Smoking / Pets toggles */}
              <div>
                <p className="text-sm font-head font-bold text-clay-dark flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-terra text-base">tune</span> Other preferences
                </p>
                <div className="flex flex-wrap gap-2">
                  <TogglePill label="I smoke" value={profile.smoking} onChange={(v) => set('smoking', v)} />
                  <TogglePill label="Pet-friendly" value={profile.pets} onChange={(v) => set('pets', v)} />
                </div>
              </div>
            </div>
          </div>

          {/* ── SAVE BUTTON ── */}
          <div className="flex items-center justify-between pb-4">
            <p className="text-xs font-body text-muted">Changes are visible to your matches and roommates.</p>
            <button type="submit"
              className="clay-grad text-white px-8 py-3 rounded-xl font-head font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all active:scale-[.98] shadow-lg shadow-clay/25">
              {saving ? (
                <span className="spinner" />
              ) : saved ? (
                <><span className="material-symbols-outlined fill text-sm">check_circle</span> Saved!</>
              ) : (
                <><span className="material-symbols-outlined text-sm">save</span> Save Profile</>
              )}
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}