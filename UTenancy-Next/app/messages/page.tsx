'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Message, Profile } from '@/lib/types'
import { useLanguage } from '@/lib/i18n'

/* ── Types ──────────────────────────────────────────────────── */
interface ListingInfo {
  id: string
  type: string
  status: string
  landlord_id: string
  address: string
  city: string
  rent: number
  images: string[]
}

interface ConversationWithData {
  id: string
  listing_id: string | null
  created_at: string
  participants: Array<{ profile: Profile }>
  messages: Array<{
    id: string
    body: string
    created_at: string
    sender_id: string
    read_at: string | null
  }>
}

interface MessageWithSender extends Message {
  sender: Profile
}

interface StudentResult {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  university: string | null
}

/* ── Helpers ─────────────────────────────────────────────────── */
const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getInitials = (first: string, last: string) =>
  `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase()

/* ── Avatar ──────────────────────────────────────────────────── */
function Avatar({
  profile,
  size = 'md',
}: {
  profile: Profile | StudentResult | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const sz =
    size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm'
  if (!profile) return <div className={`${sz} rounded-full bg-linen flex-shrink-0`} />
  if (profile.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatar_url}
        alt={profile.first_name ?? ''}
        className={`${sz} rounded-full object-cover flex-shrink-0`}
      />
    )
  }
  return (
    <div
      className={`${sz} rounded-full clay-grad text-white font-display font-bold flex items-center justify-center flex-shrink-0`}
    >
      {getInitials(profile.first_name ?? '', profile.last_name ?? '')}
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────── */
export default function MessagesPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  /* shared */
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [conversations, setConversations] = useState<ConversationWithData[]>([])
  const [loadingList, setLoadingList] = useState(true)

  /* selected conversation */
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [otherParticipant, setOtherParticipant] = useState<Profile | null>(null)
  const [loadingConv, setLoadingConv] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [canReply, setCanReply] = useState(true)
  const [listing, setListing] = useState<ListingInfo | null>(null)
  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)

  /* new conversation flow */
  const [showNewConv, setShowNewConv] = useState(false)
  const [studentQuery, setStudentQuery] = useState('')
  const [studentResults, setStudentResults] = useState<StudentResult[]>([])
  const [selectedStudents, setSelectedStudents] = useState<StudentResult[]>([])
  const [searchingStudents, setSearchingStudents] = useState(false)
  const [creatingConv, setCreatingConv] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  /* ── Auth + fetch conversation list ──────────────────────── */
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }

      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setCurrentUser(userData)

      const { data } = await supabase
        .from('conversations')
        .select(
          `*, participants:conversation_participants(profile:profiles(*)), messages(id, body, created_at, sender_id, read_at)`
        )
        .order('created_at', { ascending: false })

      setConversations(data || [])
      setLoadingList(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Student search (debounced) ───────────────────────────── */
  useEffect(() => {
    if (!showNewConv) return
    const q = studentQuery.trim()
    if (!q) {
      setStudentResults([])
      return
    }
    setSearchingStudents(true)
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, university')
        .eq('role', 'student')
        .neq('id', currentUser?.id ?? '')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,university.ilike.%${q}%`)
        .limit(15)
      setStudentResults((data as StudentResult[]) || [])
      setSearchingStudents(false)
    }, 280)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentQuery, showNewConv])

  /* Auto-focus search input when modal opens */
  useEffect(() => {
    if (showNewConv) {
      setTimeout(() => searchInputRef.current?.focus(), 80)
    } else {
      setStudentQuery('')
      setStudentResults([])
      setSelectedStudents([])
    }
  }, [showNewConv])

  /* ── Load selected conversation ──────────────────────────── */
  useEffect(() => {
    if (!selectedConvId || !currentUser) return
    setLoadingConv(true)
    setMessages([])
    setOtherParticipant(null)
    setSendError(null)
    setListing(null)
    setApproveError(null)

    const load = async () => {
      const { data: pData } = await supabase
        .from('conversation_participants')
        .select('user_id, profile:profiles!conversation_participants_user_profile_fkey(*)')
        .eq('conversation_id', selectedConvId)

      const other = (pData as Array<{ user_id: string; profile: any }> | null)?.find(
        (p) => p.user_id !== currentUser.id
      )
      if (other?.profile) setOtherParticipant(other.profile as Profile)

      const { data: convRow } = await supabase
        .from('conversations')
        .select('listing_id')
        .eq('id', selectedConvId)
        .single()

      if (convRow?.listing_id) {
        const { data: listingRow, error: listingErr } = await supabase
          .from('listings')
          .select('id, type, status, landlord_id, address, city, rent, images')
          .eq('id', convRow.listing_id)
          .single()
        if (listingRow) setListing(listingRow as ListingInfo)
        else if (listingErr?.code !== 'PGRST116')
          console.error('Listing fetch error:', listingErr)
      }

      const { data: msgs } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_profile_fkey(*)')
        .eq('conversation_id', selectedConvId)
        .order('created_at', { ascending: true })

      setMessages(msgs || [])

      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', selectedConvId)
        .neq('sender_id', currentUser.id)
        .is('read_at', null)

      if (currentUser.role === 'landlord') {
        const hasStudentMsg = msgs?.some((m: any) => m.sender_id !== currentUser.id)
        setCanReply(!!hasStudentMsg)
      } else {
        setCanReply(true)
      }

      setLoadingConv(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConvId, currentUser?.id])

  /* ── Real-time subscription ───────────────────────────────── */
  useEffect(() => {
    if (!selectedConvId) return
    const client = createClient()
    const channel = client
      .channel(`conv:${selectedConvId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const row = payload.new as any
          if (row.conversation_id !== selectedConvId) return
          const { data: fullMsg } = await client
            .from('messages')
            .select('*, sender:profiles!messages_sender_profile_fkey(*)')
            .eq('id', row.id)
            .single()
          if (fullMsg) {
            setMessages((prev) =>
              prev.some((m) => m.id === row.id) ? prev : [...prev, fullMsg as MessageWithSender]
            )
            setCanReply(true)
            setConversations((prev) =>
              prev.map((c) =>
                c.id === selectedConvId
                  ? {
                      ...c,
                      messages: [
                        ...c.messages,
                        {
                          id: row.id,
                          body: row.body,
                          created_at: row.created_at,
                          sender_id: row.sender_id,
                          read_at: row.read_at,
                        },
                      ],
                    }
                  : c
              )
            )
          }
        }
      )
      .subscribe()
    return () => {
      client.removeChannel(channel)
    }
  }, [selectedConvId])

  /* ── Scroll to bottom ─────────────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* ── Auto-resize textarea ─────────────────────────────────── */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [messageText])

  /* ── Sidebar helpers ──────────────────────────────────────── */
  function getOtherParticipant(conv: ConversationWithData): Profile | null {
    if (!currentUser) return null
    const other = conv.participants.find((p) => p.profile.id !== currentUser.id)
    return other?.profile || null
  }

  function getLastMessage(conv: ConversationWithData): string {
    if (!conv.messages || conv.messages.length === 0) return 'No messages yet'
    const sorted = conv.messages
      .slice()
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const last = sorted[sorted.length - 1]
    return last.body.length > 52 ? last.body.substring(0, 52) + '…' : last.body
  }

  function hasUnread(conv: ConversationWithData): boolean {
    if (!currentUser) return false
    return conv.messages.some((m) => m.read_at === null && m.sender_id !== currentUser.id)
  }

  function getLastTime(conv: ConversationWithData): string {
    if (!conv.messages || conv.messages.length === 0) return getTimeAgo(conv.created_at)
    const sorted = conv.messages
      .slice()
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    return getTimeAgo(sorted[sorted.length - 1].created_at)
  }

  /* ── Toggle student selection ─────────────────────────────── */
  function toggleStudent(s: StudentResult) {
    setSelectedStudents((prev) => {
      const exists = prev.some((p) => p.id === s.id)
      return exists ? prev.filter((p) => p.id !== s.id) : [...prev, s]
    })
  }

  /* ── Create new conversation ──────────────────────────────── */
  async function handleCreateConversation() {
    if (!currentUser || selectedStudents.length === 0 || creatingConv) return
    setCreatingConv(true)

    // For 1-on-1: check for existing conversation first
    if (selectedStudents.length === 1) {
      const otherId = selectedStudents[0].id
      const { data: myConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUser.id)

      const myIds = (myConvs ?? []).map((r: any) => r.conversation_id as string)

      if (myIds.length > 0) {
        const { data: shared } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', otherId)
          .in('conversation_id', myIds)

        if (shared && shared.length > 0) {
          const existingId = shared[0].conversation_id
          setShowNewConv(false)
          setCreatingConv(false)
          // On mobile navigate; on desktop select in sidebar
          if (window.innerWidth < 768) {
            router.push(`/messages/${existingId}`)
          } else {
            setSelectedConvId(existingId)
          }
          return
        }
      }
    }

    // Generate ID client-side to avoid the RLS SELECT-after-insert chicken-and-egg:
    // the SELECT policy checks is_conversation_participant(), but we haven't added
    // ourselves yet — so selecting right after insert always returns null.
    const convId = crypto.randomUUID()
    const convCreatedAt = new Date().toISOString()

    const { error: convErr } = await supabase
      .from('conversations')
      .insert({ id: convId })

    if (convErr) {
      setCreatingConv(false)
      return
    }

    // Insert current user first so the conversation is immediately visible via RLS
    const { error: partErr } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: convId, user_id: currentUser.id },
        ...selectedStudents.map((s) => ({ conversation_id: convId, user_id: s.id })),
      ])

    if (partErr) {
      setCreatingConv(false)
      return
    }

    // Add the new conversation to the sidebar list immediately
    const newConv: ConversationWithData = {
      id: convId,
      listing_id: null,
      created_at: convCreatedAt,
      participants: [
        { profile: currentUser as Profile },
        ...selectedStudents.map((s) => ({
          profile: {
            id: s.id,
            first_name: s.first_name,
            last_name: s.last_name,
            avatar_url: s.avatar_url,
            university: s.university,
            role: 'student',
          } as unknown as Profile,
        })),
      ],
      messages: [],
    }
    setConversations((prev) => [newConv, ...prev])

    setShowNewConv(false)
    setCreatingConv(false)

    if (window.innerWidth < 768) {
      router.push(`/messages/${convId}`)
    } else {
      setSelectedConvId(convId)
    }
  }

  /* ── Approve tenant ────────────────────────────────────────── */
  async function handleApprove() {
    if (!listing || !otherParticipant || !currentUser || !selectedConvId || approving) return
    setApproving(true)
    setApproveError(null)

    let householdId: string
    let inviteCode: string

    const { data: existingHousehold } = await supabase
      .from('households')
      .select('id, invite_code')
      .eq('listing_id', listing.id)
      .maybeSingle()

    if (existingHousehold) {
      householdId = existingHousehold.id
      inviteCode = existingHousehold.invite_code
    } else {
      const { data: newHousehold, error: hErr } = await supabase
        .from('households')
        .insert({ name: 'My Household', listing_id: listing.id, created_by: currentUser.id })
        .select('id, invite_code')
        .single()
      if (hErr || !newHousehold) {
        setApproveError('Could not create household. Please try again.')
        setApproving(false)
        return
      }
      householdId = newHousehold.id
      inviteCode = newHousehold.invite_code
    }

    await supabase.from('household_members').upsert(
      { household_id: householdId, user_id: currentUser.id, role: 'admin' },
      { onConflict: 'household_id,user_id', ignoreDuplicates: true }
    )

    const { error: rentErr } = await supabase.from('listings').update({ status: 'filled' }).eq('id', listing.id)
    if (rentErr) {
      setApproveError('Could not mark listing as filled. Please try again.')
      setApproving(false)
      return
    }

    const inviteLink = `${window.location.origin}/tenant/household/join?code=${inviteCode}`
    const inviteMsg =
      '\u2713 You\u2019ve been approved as a roommate for this listing!\n\n' +
      'Click the link below to join the household on UTenancy \u2014 you\u2019ll be able to track shared expenses, view balances, and settle payments with your new roommates:\n\n' +
      inviteLink + '\n\n' +
      'Welcome home \ud83c\udfe0'

    const { data: inserted, error: msgErr } = await supabase
      .from('messages')
      .insert({ conversation_id: selectedConvId, sender_id: currentUser.id, body: inviteMsg })
      .select('*, sender:profiles!messages_sender_profile_fkey(*)')
      .single()

    if (msgErr) {
      setApproveError('Could not send approval message. Please try again.')
      setApproving(false)
      return
    }

    if (inserted) {
      setMessages((prev) => [...prev, inserted as MessageWithSender])
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: (inserted as any).id,
                    body: (inserted as any).body,
                    created_at: (inserted as any).created_at,
                    sender_id: currentUser.id,
                    read_at: null,
                  },
                ],
              }
            : c
        )
      )
    }

    setListing((prev) => (prev ? { ...prev, status: 'filled' } : null))
    setApproving(false)
  }

  /* ── Send message ─────────────────────────────────────────── */
  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!messageText.trim() || !currentUser || !selectedConvId || sending) return
    setSending(true)
    setSendError(null)

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConvId,
        sender_id: currentUser.id,
        body: messageText.trim(),
      })
      .select('*, sender:profiles!messages_sender_profile_fkey(*)')
      .single()

    setSending(false)
    if (error) {
      setSendError('Could not send: ' + error.message)
      return
    }
    if (inserted) {
      setMessages((prev) => [...prev, inserted as MessageWithSender])
      const body = (inserted as any).body as string
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: (inserted as any).id,
                    body,
                    created_at: (inserted as any).created_at,
                    sender_id: currentUser.id,
                    read_at: null,
                  },
                ],
              }
            : c
        )
      )
    }
    setMessageText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  /* ── Message groups ───────────────────────────────────────── */
  const messageGroups: Array<{ sender: Profile; messages: MessageWithSender[] }> = []
  let currentGroup: { sender: Profile; messages: MessageWithSender[] } | null = null
  messages.forEach((msg) => {
    if (!currentGroup || currentGroup.sender.id !== msg.sender.id) {
      currentGroup = { sender: msg.sender, messages: [msg] }
      messageGroups.push(currentGroup)
    } else {
      currentGroup.messages.push(msg)
    }
  })

  // Filtered results — exclude already-selected students
  const selectedIds = new Set(selectedStudents.map((s) => s.id))
  const filteredResults = studentResults.filter((s) => !selectedIds.has(s.id))

  /* ────────────────── RENDER ───────────────────────────────── */
  return (
    <div className="flex h-[calc(100dvh-70px)] overflow-hidden bg-cream">

      {/* ═══ NEW CONVERSATION MODAL ══════════════════════════════ */}
      {showNewConv && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone/40 backdrop-blur-sm px-0 sm:px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNewConv(false) }}
        >
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[80dvh] overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-out-var/60 flex-shrink-0">
              <div>
                <h2 className="font-head font-bold text-clay-dark text-base">{t('newConversation')}</h2>
                <p className="text-xs font-body text-muted mt-0.5">{t('searchStudents')}</p>
              </div>
              <button
                onClick={() => setShowNewConv(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-linen transition-colors"
              >
                <span className="material-symbols-outlined text-muted text-lg">close</span>
              </button>
            </div>

            {/* Search input */}
            <div className="px-4 pt-4 pb-3 flex-shrink-0">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-lg pointer-events-none">
                  search
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Search by name or university…"
                  className="w-full pl-10 pr-4 py-2.5 bg-surf-lo border border-out-var rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-clay/30 focus:border-clay placeholder:text-[#b8a49a]"
                />
                {searchingStudents && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 rounded-full border-2 border-clay/30 border-t-clay animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Selected chips */}
            {selectedStudents.length > 0 && (
              <div className="px-4 pb-3 flex flex-wrap gap-2 flex-shrink-0">
                {selectedStudents.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-1.5 bg-linen border border-out-var rounded-full pl-1.5 pr-2.5 py-1"
                  >
                    <Avatar profile={s} size="sm" />
                    <span className="text-xs font-head font-semibold text-clay-dark">
                      {s.first_name} {s.last_name}
                    </span>
                    <button
                      onClick={() => toggleStudent(s)}
                      className="ml-0.5 text-muted hover:text-clay transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm leading-none">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Results list */}
            <div className="flex-1 overflow-y-auto">
              {!studentQuery.trim() ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <span className="material-symbols-outlined text-out-var text-4xl mb-3">person_search</span>
                  <p className="font-body text-muted text-sm">Type a name or university to find students</p>
                </div>
              ) : filteredResults.length === 0 && !searchingStudents ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <span className="material-symbols-outlined text-out-var text-4xl mb-3">search_off</span>
                  <p className="font-body text-muted text-sm">{t('noStudentsFound')}</p>
                </div>
              ) : (
                <div className="px-2 py-1">
                  {filteredResults.map((s) => {
                    const isSelected = selectedIds.has(s.id)
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleStudent(s)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all mb-0.5 text-left
                          ${isSelected ? 'bg-linen' : 'hover:bg-surf-lo'}`}
                      >
                        <Avatar profile={s} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="font-head font-semibold text-clay-dark text-sm leading-tight truncate">
                            {s.first_name} {s.last_name}
                          </p>
                          {s.university && (
                            <p className="text-xs font-body text-muted truncate mt-0.5">{s.university}</p>
                          )}
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                            ${isSelected
                              ? 'clay-grad border-transparent'
                              : 'border-out-var bg-white'}`}
                        >
                          {isSelected && (
                            <span className="material-symbols-outlined text-white text-xs leading-none">check</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Start conversation button */}
            <div className="px-4 py-4 border-t border-out-var/60 flex-shrink-0">
              <button
                onClick={handleCreateConversation}
                disabled={selectedStudents.length === 0 || creatingConv}
                className="w-full clay-grad text-white py-3 rounded-xl font-head font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md shadow-clay/20 disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-base">send</span>
                {creatingConv
                  ? 'Starting…'
                  : selectedStudents.length === 0
                    ? 'Select a student to start'
                    : selectedStudents.length === 1
                      ? `Message ${selectedStudents[0].first_name}`
                      : `Start conversation with ${selectedStudents.length} students`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ LEFT SIDEBAR ═══════════════════════════════════════ */}
      <div
        className={`w-80 flex-shrink-0 border-r border-out-var bg-white flex flex-col
          ${selectedConvId ? 'hidden md:flex' : 'flex'}`}
      >
        {/* Sidebar header */}
        <div className="px-5 pt-5 pb-4 border-b border-out-var/60 flex items-start justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-light text-clay-dark">{t('messagesPageTitle')}</h1>
            {!loadingList && (
              <p className="text-[11px] font-body text-muted mt-0.5">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Compose button — students only */}
          {currentUser?.role === 'student' && (
            <button
              onClick={() => setShowNewConv(true)}
              title="New conversation"
              aria-label="New conversation"
              className="flex-shrink-0 w-9 h-9 rounded-full clay-grad text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-md shadow-clay/20 mt-0.5"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
          )}
        </div>

        {/* Landlord note */}
        {currentUser?.role === 'landlord' && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-linen border border-out-var/60">
            <p className="text-[11px] font-body text-muted leading-relaxed">
              You can reply to students but cannot start conversations.
            </p>
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 rounded-full border-2 border-clay/30 border-t-clay animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="material-symbols-outlined text-out-var text-4xl mb-3 block">
                chat_bubble
              </span>
              <p className="font-head font-bold text-clay-dark text-sm mb-1">{t('noMessagesYet')}</p>
              <p className="font-body text-muted text-xs">
                {currentUser?.role === 'landlord'
                  ? t('startConversation')
                  : 'Tap the compose button above to start a conversation.'}
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv)
              const unread = hasUnread(conv)
              const isSelected = selectedConvId === conv.id

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all
                    border-b border-out-var/30 border-l-[3px]
                    ${isSelected
                      ? 'bg-linen border-l-clay'
                      : 'hover:bg-surf-lo border-l-transparent'}`}
                >
                  <Avatar profile={other} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                      <p
                        className={`text-sm truncate leading-tight
                          ${unread
                            ? 'font-head font-bold text-clay-dark'
                            : 'font-head font-semibold text-clay-dark'}`}
                      >
                        {other?.first_name} {other?.last_name}
                      </p>
                      <span className="text-[10px] font-body text-muted flex-shrink-0">
                        {getLastTime(conv)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p
                        className={`text-xs truncate flex-1 leading-snug
                          ${unread ? 'font-semibold text-clay-dark' : 'text-muted'}`}
                      >
                        {getLastMessage(conv)}
                      </p>
                      {unread && (
                        <div className="w-2 h-2 rounded-full bg-clay flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ═══ RIGHT PANEL ════════════════════════════════════════ */}
      <div
        className={`flex-1 flex flex-col overflow-hidden
          ${!selectedConvId ? 'hidden md:flex' : 'flex'}`}
      >
        {/* ── No conversation selected ── */}
        {!selectedConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-cream">
            <div className="w-16 h-16 rounded-2xl clay-grad flex items-center justify-center mb-4 shadow-lg shadow-clay/20">
              <span className="material-symbols-outlined text-white text-3xl">chat_bubble</span>
            </div>
            <h2 className="font-display text-2xl font-light text-clay-dark mb-2">
              Your <em>messages</em>
            </h2>
            <p className="font-body text-muted text-sm max-w-xs">
              Select a conversation on the left to read and reply.
            </p>
            {currentUser?.role === 'student' && (
              <button
                onClick={() => setShowNewConv(true)}
                className="mt-5 clay-grad text-white px-5 py-2.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-clay/20 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                {t('newConversation')}
              </button>
            )}
          </div>
        ) : loadingConv ? (
          <div className="flex-1 flex items-center justify-center bg-cream">
            <div className="w-8 h-8 rounded-full border-2 border-clay/30 border-t-clay animate-spin" />
          </div>
        ) : (
          <>
            {/* Conversation header */}
            <div className="flex-shrink-0 clay-grad px-5 py-3.5 flex items-center gap-3">
              <button
                onClick={() => setSelectedConvId(null)}
                className="md:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors -ml-1 mr-0.5"
              >
                <span className="material-symbols-outlined text-lg text-white">arrow_back</span>
              </button>

              <Avatar profile={otherParticipant} size="md" />

              <div className="flex-1 min-w-0">
                <p className="font-head font-bold text-white text-sm leading-tight">
                  {otherParticipant?.first_name} {otherParticipant?.last_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 flex-shrink-0" />
                  <p className="text-[11px] text-white/70 leading-tight">
                    {otherParticipant?.role === 'landlord'
                      ? 'Property Owner'
                      : otherParticipant?.university
                        ? `${otherParticipant.university} Student`
                        : 'Student'}
                  </p>
                </div>
              </div>

              {/* Approve button */}
              {listing && listing.landlord_id === currentUser?.id && listing.type === 'open-room' && listing.status !== 'filled' && (
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-head font-bold bg-white/15 text-white border border-white/30 px-3 py-1.5 rounded-lg hover:bg-white/25 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base leading-none">how_to_reg</span>
                  {approving ? 'Approving…' : 'Approve'}
                </button>
              )}

              {/* Approved badge */}
              {listing && listing.landlord_id === currentUser?.id && listing.status === 'filled' && (
                <div className="flex-shrink-0 flex items-center gap-1 text-xs font-head font-bold text-green-300 px-1">
                  <span className="material-symbols-outlined text-base leading-none">verified</span>
                  Approved
                </div>
              )}

              {/* Profile link */}
              {otherParticipant && otherParticipant.role !== 'landlord' &&
                !(listing && listing.landlord_id === currentUser?.id && listing.type === 'open-room') && (
                <a
                  href={`/profile/${otherParticipant.id}`}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-head font-bold text-white/80 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
                >
                  <span className="material-symbols-outlined text-base">person</span>
                  Profile
                </a>
              )}

              {approveError && (
                <p className="text-xs text-red-200 font-body">{approveError}</p>
              )}
            </div>

            {/* Messages scroll area */}
            <div className="flex-1 overflow-y-auto px-6 py-5 bg-surf-lo">
              {listing && (
                <div className="flex-shrink-0 mb-5 bg-white rounded-2xl border border-out-var shadow-sm overflow-hidden">
                  <a href={`/listings/${listing.id}`} className="flex items-center gap-3 p-3 hover:bg-linen/50 transition-colors">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-linen">
                      {listing.images && listing.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.images[0]}
                          alt={listing.address}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-linen">
                          <span className="material-symbols-outlined text-out-var text-2xl">home</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-head font-bold text-clay-dark text-sm truncate">{listing.address}</p>
                      <p className="text-xs text-muted font-body">{listing.city}</p>
                      <p className="font-head font-bold text-clay-dark text-sm mt-1">${listing.rent}/mo</p>
                      <span className="text-xs text-clay font-head font-bold inline-block mt-1">{t('viewListing')} →</span>
                    </div>
                  </a>
                </div>
              )}
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-out-var text-4xl mb-3 block">
                      chat_bubble_outline
                    </span>
                    <p className="text-muted text-sm mb-1 font-head font-semibold">No messages yet</p>
                    <p className="text-xs text-muted font-body">Start the conversation below</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl mx-auto">
                  {messageGroups.map((group, groupIdx) => {
                    const isMe = group.sender.id === currentUser?.id
                    return (
                      <div
                        key={groupIdx}
                        className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <div className="flex-shrink-0 self-end mb-4">
                            <Avatar profile={group.sender} size="sm" />
                          </div>
                        )}

                        <div
                          className={`flex flex-col gap-1 max-w-xs
                            ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          {!isMe && groupIdx === 0 && (
                            <span className="text-[10px] text-muted px-1 mb-0.5">
                              {group.sender.first_name} {group.sender.last_name}
                            </span>
                          )}

                          {group.messages.map((msg, msgIdx) => {
                            const isFirst = msgIdx === 0
                            const isLast = msgIdx === group.messages.length - 1
                            return (
                              <div key={msg.id} className={`w-full ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                <div
                                  className={`px-4 py-2.5 text-sm break-words leading-relaxed
                                    ${isMe
                                      ? `clay-grad text-white shadow-sm shadow-clay/20
                                        ${isFirst && group.messages.length > 1 ? 'rounded-2xl rounded-br-md' : ''}
                                        ${!isFirst && !isLast ? 'rounded-2xl rounded-r-md' : ''}
                                        ${isLast && group.messages.length > 1 ? 'rounded-2xl rounded-tr-md' : ''}
                                        ${group.messages.length === 1 ? 'rounded-2xl rounded-br-md' : ''}`
                                      : `bg-white text-clay-dark border border-out-var shadow-sm
                                        ${isFirst && group.messages.length > 1 ? 'rounded-2xl rounded-bl-md' : ''}
                                        ${!isFirst && !isLast ? 'rounded-2xl rounded-l-md' : ''}
                                        ${isLast && group.messages.length > 1 ? 'rounded-2xl rounded-tl-md' : ''}
                                        ${group.messages.length === 1 ? 'rounded-2xl rounded-bl-md' : ''}`
                                    }`}
                                >
                                  <span className="whitespace-pre-line">{msg.body}</span>
                                </div>
                                {isLast && (
                                  <span
                                    className={`text-[10px] text-muted mt-1 px-1
                                      ${isMe ? 'text-right' : ''}`}
                                  >
                                    {getTimeAgo(msg.created_at)}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message input */}
            {canReply ? (
              <div className="flex-shrink-0 bg-white border-t border-out-var px-5 py-3.5">
                {sendError && (
                  <p className="text-xs text-red-500 mb-2 text-center font-body">{sendError}</p>
                )}
                <form
                  onSubmit={handleSend}
                  className="flex gap-2.5 items-end max-w-2xl mx-auto"
                >
                  <textarea
                    ref={textareaRef}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend(e as any)
                      }
                    }}
                    placeholder={t('typeMessage')}
                    className="flex-1 px-4 py-2.5 border border-out-var rounded-2xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-clay/30 focus:border-clay resize-none bg-cream placeholder:text-[#b8a49a]"
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || sending}
                    className="clay-grad text-white w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:opacity-90 transition-all shadow-md shadow-clay/25"
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-shrink-0 bg-linen border-t border-out-var px-5 py-3.5">
                <p className="text-sm text-muted text-center font-body">
                  You can only reply to existing messages as a landlord.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
