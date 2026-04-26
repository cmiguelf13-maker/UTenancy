'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  bio: string | null
  university: string | null
  major: string | null
  grad_year: string | null
  gender: string | null
  role: string
  sleep_time: string | null
  cleanliness: string | null
  noise: string | null
  guests: string | null
  studying: string | null
  smoking: boolean
  pets: boolean
  // landlord contact fields
  phone: string | null
  website: string | null
}

const LIFESTYLE_CATEGORIES = [
  { key: 'sleep_time', label: 'Sleep Schedule' },
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'noise', label: 'Noise Level' },
  { key: 'guests', label: 'Guests' },
  { key: 'studying', label: 'Studying' },
  { key: 'smoking', label: 'Smoking' },
  { key: 'pets', label: 'Pets' },
]

function getFullName(profile: Profile): string {
  return `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'User'
}

function getInitials(profile: Profile): string {
  const first = profile.first_name?.[0] ?? ''
  const last = profile.last_name?.[0] ?? ''
  return (first + last).toUpperCase() || '?'
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setCurrentUser(session?.user ?? null)

        const { data: targetProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single()

        if (error || !targetProfile) {
          setNotFound(true)
          setLoading(false)
          return
        }

        setProfile(targetProfile)
      } catch (err) {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  async function handleSendMessage() {
    if (!currentUser) {
      router.push('/auth')
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()

      const { data: existing } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUser.id)

      const myConvIds = existing?.map((r: any) => r.conversation_id) ?? []

      if (myConvIds.length > 0) {
        const { data: shared } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', id)
          .in('conversation_id', myConvIds)

        if (shared && shared.length > 0) {
          router.push(`/messages/${shared[0].conversation_id}`)
          return
        }
      }

      const { data: conv } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single()

      await supabase.from('conversation_participants').insert([
        { conversation_id: conv.id, user_id: currentUser.id },
        { conversation_id: conv.id, user_id: id },
      ])

      router.push(`/messages/${conv.id}`)
    } catch (err) {
      console.error('Error creating conversation:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted font-body">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-display text-3xl text-clay-dark mb-2">Profile not found</h1>
          <p className="text-muted font-body mb-6">This profile doesn&apos;t exist or isn&apos;t available.</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-clay hover:text-clay-dark font-head font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Go back
          </button>
        </div>
      </div>
    )
  }

  const isLandlord = profile.role === 'landlord'
  const isOwnProfile = currentUser?.id === id
  const viewerRole = currentUser?.user_metadata?.role ?? null

  // Students can message other students (not themselves, not landlords)
  const canMessage =
    currentUser && viewerRole !== 'landlord' && !isOwnProfile && !isLandlord

  return (
    <div className="min-h-screen bg-cream">
      {/* Back button */}
      <div className="bg-white border-b border-out-var/20">
        <div className="max-w-xl mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-clay hover:text-clay-dark font-head font-bold text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-10">
        {/* Hero section */}
        <div className="relative mb-8">
          <div className="clay-grad rounded-t-3xl h-32" />

          <div className="absolute left-1/2 top-32 -translate-x-1/2 -translate-y-1/2 z-10">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={getFullName(profile)}
                className="w-28 h-28 rounded-full border-4 border-cream object-cover shadow-lg"
              />
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-cream clay-grad flex items-center justify-center shadow-lg">
                <span className="font-display text-4xl text-white font-light">
                  {getInitials(profile)}
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-b-3xl px-6 pt-16 pb-6 border border-out-var border-t-0 shadow-md">
            <h1 className="font-display text-2xl text-clay-dark font-light text-center mb-1">
              {getFullName(profile)}
            </h1>

            {/* Landlord subtitle */}
            {isLandlord && (
              <p className="text-sm text-muted text-center font-body mb-3">
                Property Owner
              </p>
            )}

            {/* Student subtitle */}
            {!isLandlord && (
              <p className="text-sm text-muted text-center font-body mb-2">
                {[profile.major, profile.university].filter(Boolean).join(' • ')}
              </p>
            )}

            {!isLandlord && profile.gender && (
              <p className="text-xs text-muted text-center font-body mb-4">{profile.gender}</p>
            )}

            {!isLandlord && profile.grad_year && (
              <div className="flex justify-center mb-4">
                <span className="badge-open text-xs font-head font-bold px-3 py-1.5 rounded-full">
                  Class of {profile.grad_year}
                </span>
              </div>
            )}

            {profile.bio && (
              <p className="text-sm font-body text-clay-dark text-center leading-relaxed mb-2">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Landlord contact info */}
        {isLandlord && (profile.phone || profile.website) && (
          <div className="bg-white rounded-3xl border border-out-var p-6 mb-8 shadow-md">
            <h2 className="font-head text-lg font-bold text-clay-dark mb-4">Contact</h2>
            <div className="flex flex-col gap-3">
              {profile.phone && (
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-clay text-lg">call</span>
                  <a href={`tel:${profile.phone}`} className="text-sm font-body text-clay hover:text-clay-dark transition-colors">
                    {profile.phone}
                  </a>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-clay text-lg">language</span>
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-body text-clay hover:text-clay-dark transition-colors truncate"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Student lifestyle preferences */}
        {!isLandlord &&
          LIFESTYLE_CATEGORIES.some((cat) => {
            const key = cat.key as keyof Profile
            const v = profile[key]
            return typeof v === 'boolean' ? true : !!v
          }) && (
            <div className="bg-white rounded-3xl border border-out-var p-6 mb-8 shadow-md">
              <h2 className="font-head text-lg font-bold text-clay-dark mb-4">Lifestyle Preferences</h2>
              <div className="flex flex-wrap gap-2">
                {LIFESTYLE_CATEGORIES.map((cat) => {
                  const key = cat.key as keyof Profile
                  const raw = profile[key]

                  let value: string | null = null
                  if (typeof raw === 'boolean') {
                    value = raw ? 'Yes' : 'No'
                  } else if (raw) {
                    value = String(raw)
                  }

                  if (!value) return null

                  return (
                    <div
                      key={cat.key}
                      className="px-3.5 py-2 bg-linen rounded-full border border-out-var flex items-center gap-2"
                    >
                      <span className="text-xs font-head font-bold text-clay-dark">{cat.label}:</span>
                      <span className="text-xs font-body text-muted">{value}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        {/* Action buttons */}
        {canMessage && (
          <button
            onClick={handleSendMessage}
            disabled={submitting}
            className="w-full clay-grad text-white py-3.5 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-clay/25 disabled:opacity-70"
          >
            <span className="material-symbols-outlined text-base">mail</span>
            {submitting ? 'Opening conversation...' : 'Send Message'}
          </button>
        )}

        {!currentUser && (
          <a
            href="/auth"
            className="block w-full text-center py-3.5 rounded-xl font-head font-bold text-sm border border-out-var text-clay-dark hover:bg-surf transition-all"
          >
            Sign in to message
          </a>
        )}

        {isOwnProfile && (
          <div className="bg-linen rounded-3xl border border-out-var p-6 text-center shadow-sm">
            <p className="text-sm font-body text-muted">This is your profile</p>
          </div>
        )}
      </div>
    </div>
  )
}
