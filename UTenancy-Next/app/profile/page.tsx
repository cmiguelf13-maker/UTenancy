'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useLanguage, LANGUAGES } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'

/* ── Types ── */
interface ProfileData {
  firstName:   string
  lastName:    string
  gender:      string
  university:  string
  major:       string
  gradYear:    string
  bio:         string
  // Lifestyle preferences (student only)
  sleepTime:   string
  cleanliness: string
  noise:       string
  guests:      string
  smoking:     boolean
  pets:        boolean
  studying:    string
  // Contact info (landlord only)
  email:       string
  phone:       string
  company:     string
}

const UNIVERSITIES = [
  'Loyola Marymount University (LMU)',
  'Other',
]

const GENDER_OPTIONS = ['Man', 'Woman', 'Non-binary', 'Prefer not to say']

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
  const { lang: globalLang, setLang: setGlobalLang, t } = useLanguage()

  /* Tabs */
  type ProfileTab = 'profile' | 'language' | 'referral'
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')

  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  /* Language preference */
  const [preferredLang, setPreferredLang] = useState<Language>(globalLang)
  const [langSaved, setLangSaved] = useState(false)

  /* Referral */
  const [referralCode,   setReferralCode]   = useState<string | null>(null)
  const [referralCount,  setReferralCount]  = useState(0)
  const [pendingRewards, setPendingRewards] = useState(0)
  const [copied, setCopied] = useState(false)

  const [role, setRole] = useState<string>('student')

  const [profile, setProfile] = useState<ProfileData>({
    firstName:   '',
    lastName:    '',
    gender:      '',
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
    email:       '',
    phone:       '',
    company:     '',
  })

  /* ── Load user session and profile data ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      if (!u) { router.push('/auth'); return }
      setUser(u)
      setRole(u.user_metadata?.role ?? 'student')

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
              gender:      profileData.gender ?? '',
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
              email:       profileData.email ?? u.email ?? '',
              phone:       profileData.phone ?? '',
              company:     profileData.company ?? '',
            }))

            /* Language preference */
            const storedLang = (profileData.preferred_language ?? 'en') as Language
            setPreferredLang(storedLang)
            setGlobalLang(storedLang)

            /* Referral code + stats — landlord only */
            if (u.user_metadata?.role === 'landlord') {
              let code: string = profileData.referral_code ?? ''
              if (!code) {
                code = Math.random().toString(36).slice(2, 10).toUpperCase()
                supabase.from('profiles').update({ referral_code: code }).eq('id', u.id)
                setReferralCode(code)
              } else {
                setReferralCode(code)
              }

              supabase
                .from('referrals')
                .select('id, reward_applied')
                .eq('referrer_id', u.id)
                .then(({ data: refs }) => {
                  if (refs) {
                    setReferralCount(refs.length)
                    setPendingRewards(refs.filter((r: { reward_applied: boolean }) => !r.reward_applied).length)
                  }
                })
            }
            } else {
            // Fallback to user_metadata if profiles table fetch fails
            const m = u.user_metadata ?? {}
            setProfile((p) => ({
              ...p,
              firstName:   m.first_name ?? '',
              lastName:    m.last_name ?? '',
              gender:      m.gender ?? '',
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
              email:       u.email ?? '',
              phone:       m.phone ?? '',
              company:     m.company ?? '',
            }))
          }
          setLoading(false)
        })
    })
  }, [])

  /* ── Save ── */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)

    if (!user) {
      setSaving(false)
      return
    }

    try {
      // Upsert profile data (no avatar — removed to prevent cookie bloat)
      const upsertData: Record<string, any> = {
        id: user.id,
        role: role,
        first_name: profile.firstName,
        last_name: profile.lastName,
        gender: profile.gender,
        bio: profile.bio,
        avatar_url: null,
        updated_at: new Date().toISOString(),
      }

      if (role === 'landlord') {
        // Landlord-specific fields — email lives in auth.users, not profiles
        upsertData.phone = profile.phone
        upsertData.company = profile.company
      } else {
        // Student-specific fields
        upsertData.university = profile.university
        upsertData.major = profile.major
        upsertData.grad_year = profile.gradYear
        upsertData.sleep_time = profile.sleepTime
        upsertData.cleanliness = profile.cleanliness
        upsertData.noise = profile.noise
        upsertData.guests = profile.guests
        upsertData.smoking = profile.smoking
        upsertData.pets = profile.pets
        upsertData.studying = profile.studying
      }

      const { error: upsertErr } = await supabase.from('profiles').upsert(upsertData)

      // Sync name to user_metadata so Nav refreshes — no avatar_url to avoid cookie bloat
      await supabase.auth.updateUser({
        data: {
          first_name: profile.firstName,
          last_name:  profile.lastName,
          avatar_url: null,
          role: user.user_metadata?.role ?? 'student',
        },
      })

      setSaving(false)
      if (upsertErr) {
        setSaveError('Could not save profile. Please try again.')
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      setSaving(false)
      setSaveError('Something went wrong. Please try again.')
    }
  }

  function set<K extends keyof ProfileData>(key: K, val: ProfileData[K]) {
    setProfile((p) => ({ ...p, [key]: val }))
  }

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
            <span className="material-symbols-outlined text-base">arrow_back</span> {t('backToHome')}
          </a>
          <h1 className="font-display text-4xl font-light text-clay-dark mb-1">Your <em>{t('tabProfile').toLowerCase()}</em></h1>
          <p className="text-sm font-body text-muted">
            {role === 'landlord'
              ? 'Manage your contact information so tenants can reach you.'
              : 'Help roommates and landlords get to know you.'}
          </p>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-1 bg-surf-hi border border-out-var rounded-full px-1 py-1 mb-6 w-fit">
          {([
            { key: 'profile',  label: t('tabProfile'),  icon: 'person'   },
            { key: 'language', label: t('tabLanguage'), icon: 'language' },
            ...(role === 'landlord' ? [{ key: 'referral', label: t('tabReferral'), icon: 'share' }] : []),
          ] as { key: ProfileTab; label: string; icon: string }[]).map(tab => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-head font-bold transition-all
                ${activeTab === tab.key ? 'clay-grad text-white shadow-sm' : 'text-muted hover:text-clay-dark'}`}>
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── LANGUAGE TAB ── */}
        {activeTab === 'language' && (
          <div className="bg-white rounded-3xl border border-out-var p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 clay-grad rounded-xl flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined fill text-white text-lg">language</span>
              </div>
              <div>
                <h2 className="font-head font-bold text-espresso">{t('languageTitle')}</h2>
                <p className="text-xs font-body text-muted">{t('languageDesc')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-5">
              {LANGUAGES.map(l => (
                <button key={l.code} type="button"
                  onClick={async () => {
                    setPreferredLang(l.code)
                    setGlobalLang(l.code)
                    await supabase.from('profiles').update({ preferred_language: l.code }).eq('id', user?.id ?? '')
                    setLangSaved(true)
                    setTimeout(() => setLangSaved(false), 2000)
                  }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 font-head font-semibold text-sm transition-all
                    ${preferredLang === l.code
                      ? 'border-clay bg-linen text-clay-dark shadow-sm'
                      : 'border-out-var text-muted hover:border-clay/40 hover:text-clay-dark'}`}>
                  <span className="text-xl">{l.flag}</span>
                  {l.label}
                  {preferredLang === l.code && (
                    <span className="material-symbols-outlined fill text-clay text-base">check_circle</span>
                  )}
                </button>
              ))}
            </div>
            {langSaved && (
              <p className="text-xs font-head text-green-600 mt-3 flex items-center gap-1">
                <span className="material-symbols-outlined fill text-sm">check_circle</span> Language updated
              </p>
            )}
          </div>
        )}

        {/* ── REFERRAL TAB (landlord only) ── */}
        {activeTab === 'referral' && role === 'landlord' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-out-var p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 clay-grad rounded-xl flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined fill text-white text-lg">share</span>
                </div>
                <div>
                  <h2 className="font-head font-bold text-espresso">{t('referralTitle')}</h2>
                  <p className="text-xs font-body text-muted">{t('referralDesc')}</p>
                </div>
              </div>

              <p className="text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">{t('referralLink')}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-surf-lo border border-out-var rounded-xl px-4 py-2.5 font-body text-sm text-espresso overflow-hidden overflow-ellipsis whitespace-nowrap">
                  {referralCode
                    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://utenancy.com'}/auth?ref=${referralCode}`
                    : 'Generating…'}
                </div>
                <button type="button"
                  onClick={() => {
                    if (!referralCode) return
                    navigator.clipboard.writeText(
                      `${window.location.origin}/auth?ref=${referralCode}`
                    )
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 clay-grad text-white rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all active:scale-95">
                  <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                  {copied ? t('copied') : t('copyLink')}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-out-var p-6 shadow-sm">
              <h3 className="font-head font-bold text-espresso mb-4">Referral Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surf-lo rounded-2xl p-4 text-center">
                  <p className="font-display text-3xl font-light text-clay-dark italic">{referralCount}</p>
                  <p className="text-xs font-head font-semibold text-espresso mt-1">Total Referrals</p>
                </div>
                <div className="bg-surf-lo rounded-2xl p-4 text-center">
                  <p className="font-display text-3xl font-light text-clay-dark italic">{pendingRewards}</p>
                  <p className="text-xs font-head font-semibold text-espresso mt-1">
                    {pendingRewards === 1 ? t('referralPending') : t('referralPendingPlural')}
                  </p>
                </div>
              </div>
              {referralCount === 0 ? (
                <p className="text-sm font-body text-muted mt-4 text-center">{t('noReferrals')}</p>
              ) : (
                <p className="text-xs font-body text-muted mt-4">{t('referralRewardNote')}</p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className={`space-y-6 ${activeTab !== 'profile' ? 'hidden' : ''}`}>

          {/* ── BASIC INFO ── */}
          <div className="bg-white rounded-3xl border border-out-var p-6 shadow-sm">
            <SectionHeading icon="person" title="Basic Information"
              subtitle={role === 'landlord' ? 'This is how tenants will see you.' : 'This is how you\'ll appear to other students.'} />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">First Name</label>
                  <input value={profile.firstName} onChange={(e) => set('firstName', e.target.value)}
                    className="auth-input no-icon" placeholder={role === 'landlord' ? 'John' : 'Maya'} />
                </div>
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Last Name</label>
                  <input value={profile.lastName} onChange={(e) => set('lastName', e.target.value)}
                    className="auth-input no-icon" placeholder={role === 'landlord' ? 'Smith' : 'Johnson'} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Gender</label>
                <PillSelect options={GENDER_OPTIONS} value={profile.gender} onChange={(v) => set('gender', v)} />
              </div>

              {role !== 'landlord' && (
                <>
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
                </>
              )}

              <div>
                <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Bio</label>
                <textarea value={profile.bio} onChange={(e) => set('bio', e.target.value)} rows={3}
                  placeholder={role === 'landlord'
                    ? 'Tell tenants a little about yourself or your properties…'
                    : 'Tell potential roommates a little about yourself — your interests, your schedule, what you\'re looking for in a home…'}
                  className="w-full bg-white border-[1.5px] border-out-var rounded-xl px-4 py-3 font-body text-sm text-stone outline-none resize-none transition-all focus:border-clay focus:shadow-[0_0_0_3px_rgba(107,76,59,.12)] placeholder:text-[#a89990]" />
                <p className="text-[11px] font-body text-muted mt-1 text-right">{profile.bio.length}/280</p>
              </div>
            </div>
          </div>

          {/* ── LANDLORD: CONTACT INFO ── */}
          {role === 'landlord' && (
            <div className="bg-white rounded-3xl border border-out-var p-6 shadow-sm">
              <SectionHeading icon="contact_phone" title="Contact Information"
                subtitle="How tenants can reach you. This will be visible on your listings." />
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">mail</span>
                    <input type="email" value={profile.email} onChange={(e) => set('email', e.target.value)}
                      className="auth-input" placeholder="john@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Phone Number</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">phone</span>
                    <input type="tel" value={profile.phone} onChange={(e) => set('phone', e.target.value)}
                      className="auth-input" placeholder="(310) 555-0123" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-head font-bold text-clay-dark uppercase tracking-wider mb-2">Company / Property Management</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">business</span>
                    <input value={profile.company} onChange={(e) => set('company', e.target.value)}
                      className="auth-input" placeholder="Westside Properties LLC" />
                  </div>
                </div>
              </div>

              {/* Messenger shortcut */}
              <div className="mt-6 pt-5 border-t border-out-var/40">
                <Link href="/messages"
                  className="flex items-center gap-3 w-full px-4 py-3 bg-surf-lo rounded-xl border border-out-var/40 hover:border-clay/40 hover:bg-linen transition-all">
                  <div className="w-9 h-9 clay-grad rounded-lg flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined fill text-white text-lg">chat</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-head font-bold text-clay-dark">Messages</p>
                    <p className="text-xs font-body text-muted">View and respond to tenant inquiries</p>
                  </div>
                  <span className="material-symbols-outlined text-outline text-lg">arrow_forward</span>
                </Link>
              </div>
            </div>
          )}

          {/* ── STUDENT: LIFESTYLE PREFERENCES ── */}
          {role !== 'landlord' && (
            <div className="bg-white rounded-3xl border border-out-var p-6 shadow-sm">
              <SectionHeading icon="emoji_people" title="Lifestyle Preferences"
                subtitle="Help us match you with compatible roommates. Pick what fits you best." />

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-head font-bold text-clay-dark flex items-center gap-2">
                    <span className="material-symbols-outlined text-terra text-base">bedtime</span> Sleep schedule
                  </p>
                  <PillSelect options={SLEEP_OPTIONS} value={profile.sleepTime} onChange={(v) => set('sleepTime', v)} />
                </div>

                <div>
                  <p className="text-sm font-head font-bold text-clay-dark flex items-center gap-2">
                    <span className="material-symbols-outlined text-terra text-base">cleaning_services</span> Cleanliness
                  </p>
                  <PillSelect options={CLEAN_OPTIONS} value={profile.cleanliness} onChange={(v) => set('cleanliness', v)} />
                </div>

                <div>
                  <p className="text-sm font-head font-bold text-clay-dark flex items-center gap-2">
                    <span className="material-symbols-outlined text-terra text-base">volume_up</span> Noise & social vibe
                  </p>
                  <PillSelect options={NOISE_OPTIONS} value={profile.noise} onChange={(v) => set('noise', v)} />
                </div>

                <div>
                  <p className="text-sm font-head font-bold text-clay-dark flex items-center gap-2">
                    <span className="material-symbols-outlined text-terra text-base">group</span> Having guests over
                  </p>
                  <PillSelect options={GUEST_OPTIONS} value={profile.guests} onChange={(v) => set('guests', v)} />
                </div>

                <div>
                  <p className="text-sm font-head font-bold text-clay-dark flex items-center gap-2">
                    <span className="material-symbols-outlined text-terra text-base">auto_stories</span> Where you study
                  </p>
                  <PillSelect options={STUDY_OPTIONS} value={profile.studying} onChange={(v) => set('studying', v)} />
                </div>

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
          )}

          {/* ── SAVE BUTTON ── */}
          <div className="space-y-2 pb-4">
            {saveError && (
              <p className="text-xs text-red-600 font-body text-right">{saveError}</p>
            )}
            <div className="flex items-center justify-between">
            <p className="text-xs font-body text-muted">{role === 'landlord' ? 'Changes are visible to tenants viewing your listings.' : 'Changes are visible to your matches and roommates.'}</p>
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
          </div>

        </form>
      </div>
    </main>
  )
}