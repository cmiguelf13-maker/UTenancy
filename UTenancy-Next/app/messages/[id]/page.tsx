'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Message, Profile } from '@/lib/types'
import { useLanguage } from '@/lib/i18n'

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
)

interface MessageWithSender extends Message {
  sender: Profile
}

interface ListingInfo {
  id: string
  type: string
  status: string
  landlord_id: string
  address: string
  city: string
  rent: number
  images: string[]
  bedrooms: number
}

type ApplicationStatus = 'awaiting' | 'approved' | 'denied' | null

const APPROVAL_SIGNATURE = '\u2713 You\u2019ve been approved as a roommate'

const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
}

const InitialsCircle = ({ firstName, lastName }: { firstName: string; lastName: string }) => {
  const initials = getInitials(firstName, lastName)
  return (
    <div className="flex items-center justify-center w-9 h-9 rounded-full clay-grad text-white font-display text-xs font-bold">
      {initials}
    </div>
  )
}

const APPROVAL_MSG =
  '\u2713 You\u2019ve been approved as a roommate for this listing!\n\n' +
  'You\u2019ve both been added to the household on UTenancy \u2014 here\u2019s how to get started:\n\n' +
  '\u2022 Open the menu and go to My Household to see all members\n' +
  '\u2022 In the Expenses tab, add shared bills (rent, utilities, internet) \u2014 splits are calculated automatically\n' +
  '\u2022 Everyone can view balances and mark payments as settled anytime\n\n' +
  'Welcome home \ud83c\udfe0'

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string
  const supabase = createClient()
  const { t } = useLanguage()

  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [otherParticipant, setOtherParticipant] = useState<Profile | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  // Role known immediately from session.user_metadata — no profile fetch wait
  const [sessionUserRole, setSessionUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [canReply, setCanReply] = useState(true)
  const [listing, setListing] = useState<ListingInfo | null>(null)
  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [messageText])

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth')
        return
      }

      // Capture session UID + role immediately (no profile-fetch wait)
      setSessionUserId(session.user.id)
      const metaRole = session.user.user_metadata?.role ?? null
      setSessionUserRole(metaRole)

      // Current user profile
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setCurrentUser(userData as Profile)

      // Other participant
      const { data: participantData } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)

      const otherUserId = (participantData as Array<{ user_id: string }> | null)
        ?.find((p) => p.user_id !== session.user.id)?.user_id

      let otherProfile: Profile | null = null
      if (otherUserId) {
        const { data: op } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single()
        if (op) {
          otherProfile = op as Profile
          setOtherParticipant(otherProfile)
        }
      }

      // Listing linked to this conversation (optional)
      const { data: convRow } = await supabase
        .from('conversations')
        .select('listing_id')
        .eq('id', conversationId)
        .single()

      // Keep a local reference so we can use it in the status check below
      let fetchedListing: ListingInfo | null = null
      if (convRow?.listing_id) {
        const { data: listingRow, error: listingErr } = await supabase
          .from('listings')
          .select('id, type, status, landlord_id, address, city, rent, images, bedrooms')
          .eq('id', convRow.listing_id)
          .single()
        if (listingRow) {
          fetchedListing = listingRow as ListingInfo
          setListing(fetchedListing)
        } else if (listingErr?.code !== 'PGRST116') {
          console.error('Listing fetch error:', listingErr)
        }
      }

      // Messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_profile_fkey(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      setMessages(msgs || [])

      // Mark read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', session.user.id)
        .is('read_at', null)

      // ── Student application status ─────────────────────────────
      // Show whenever the current user is the *inquiring* party, meaning:
      //   (a) a student talking to a landlord (by role), OR
      //   (b) a student talking to the host of an open-room listing
      //       (both users are students; the listing host acts as landlord)
      const resolvedRole = userData?.role ?? metaRole
      const isListingHostInFetch =
        fetchedListing !== null && fetchedListing.landlord_id === session.user.id
      const isInquiringStudent =
        resolvedRole === 'student' &&
        (otherProfile?.role === 'landlord' ||
          (fetchedListing !== null && !isListingHostInFetch))

      if (isInquiringStudent) {
        let status: ApplicationStatus = 'awaiting'

        // 1. Check household membership if there's a linked listing
        if (fetchedListing) {
          const { data: householdRow } = await supabase
            .from('households')
            .select('id')
            .eq('listing_id', fetchedListing.id)
            .maybeSingle()

          if (householdRow) {
            const { data: memberRow } = await supabase
              .from('household_members')
              .select('id')
              .eq('household_id', householdRow.id)
              .eq('user_id', session.user.id)
              .maybeSingle()

            if (memberRow) {
              status = 'approved'
            } else if ((msgs ?? []).some((m: any) => String(m.body ?? '').startsWith(APPROVAL_SIGNATURE))) {
              status = 'approved'
            }
          } else {
            if ((msgs ?? []).some((m: any) => String(m.body ?? '').startsWith(APPROVAL_SIGNATURE))) {
              status = 'approved'
            }
          }
        } else {
          // No listing — derive status purely from messages
          if ((msgs ?? []).some((m: any) => String(m.body ?? '').startsWith(APPROVAL_SIGNATURE))) {
            status = 'approved'
          }
        }

        setApplicationStatus(status)
      }

      // Landlords can only reply — not initiate
      if (userData?.role === 'landlord') {
        const hasStudentMessage = msgs?.some((m: any) => m.sender_id !== session.user.id)
        if (!hasStudentMessage) setCanReply(false)
      }

      setLoading(false)
    }

    fetchData()
  }, [conversationId, router, supabase])

  // Real-time subscription
  useEffect(() => {
    if (!conversationId) return

    const client = createClient()
    const channel = client
      .channel(`conv:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const row = payload.new as any
          if (row.conversation_id !== conversationId) return
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
            // When the approval message arrives, flip student status live
            if (String((fullMsg as any).body ?? '').startsWith(APPROVAL_SIGNATURE)) {
              setApplicationStatus('approved')
            }
          }
        }
      )
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [conversationId])

  // ── Approve tenant ───────────────────────────────────────────
  async function handleApprove() {
    if (!currentUser || approving) return
    setApproving(true)
    setApproveError(null)

    // Household creation only possible when a listing is linked
    if (listing && otherParticipant) {
      const { data: existingHousehold } = await supabase
        .from('households')
        .select('id')
        .eq('listing_id', listing.id)
        .maybeSingle()

      let householdId: string

      if (existingHousehold) {
        householdId = existingHousehold.id
      } else {
        const { data: newHousehold, error: hErr } = await supabase
          .from('households')
          .insert({
            name: 'My Household',
            listing_id: listing.id,
            created_by: currentUser.id,
          })
          .select('id')
          .single()

        if (hErr || !newHousehold) {
          setApproveError('Could not create household. Please try again.')
          setApproving(false)
          return
        }
        householdId = newHousehold.id
      }

      const { error: err1 } = await supabase.from('household_members').upsert(
        { household_id: householdId, user_id: currentUser.id, role: 'admin' },
        { onConflict: 'household_id,user_id' }
      )
      if (err1) {
        setApproveError('Could not add you to household. Please try again.')
        setApproving(false)
        return
      }

      const { error: err2 } = await supabase.from('household_members').upsert(
        { household_id: householdId, user_id: otherParticipant.id, role: 'member' },
        { onConflict: 'household_id,user_id' }
      )
      if (err2) {
        setApproveError('Could not add tenant to household. Please try again.')
        setApproving(false)
        return
      }

      const { count: studentMemberCount } = await supabase
        .from('household_members')
        .select('*', { count: 'exact', head: true })
        .eq('household_id', householdId)
        .eq('role', 'member')

      const allRoomsFilled = (studentMemberCount ?? 0) >= (listing.bedrooms ?? 1)
      if (allRoomsFilled) {
        const { error: rentErr } = await supabase.from('listings').update({ status: 'filled' }).eq('id', listing.id)
        if (rentErr) {
          console.error('Could not mark listing as filled:', rentErr.message)
        } else {
          setListing((prev) => (prev ? { ...prev, status: 'filled' } : null))
        }
      }
    }

    // Send approval message in all cases
    const { data: inserted, error: msgErr } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        body: APPROVAL_MSG,
      })
      .select('*, sender:profiles!messages_sender_profile_fkey(*)')
      .single()

    if (msgErr) {
      setApproveError('Could not send approval message. Please try again.')
      setApproving(false)
      return
    }

    if (inserted) {
      setMessages((prev) => [...prev, inserted as MessageWithSender])
    }

    setApproving(false)
  }

  // ── Send message ─────────────────────────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !currentUser || sending) return
    setSending(true)
    setSendError(null)

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
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
    }
    setMessageText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-clay border-t-transparent"></div>
      </div>
    )
  }

  // Group messages by sender
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

  // ── Top-right button visibility ────────────────────────────────
  const effectiveRole = sessionUserRole ?? currentUser?.role ?? null

  // Current user is the listing host (covers open-room where both users are students)
  const isListingHost =
    listing !== null &&
    (listing.landlord_id === sessionUserId || listing.landlord_id === currentUser?.id)

  // Approve: you are a landlord talking to a student,
  //          OR you are the host of the listing this conversation is about
  const showApproveButton =
    (effectiveRole === 'landlord' && otherParticipant?.role === 'student') ||
    (isListingHost && otherParticipant !== null)

  // Status badge: you are the inquiring student — talking to a landlord by role,
  //               or talking to the host of a listing you did not create
  const showStatusBadge =
    !showApproveButton &&
    applicationStatus !== null &&
    effectiveRole === 'student' &&
    (otherParticipant?.role === 'landlord' || (listing !== null && !isListingHost))

  // Status badge config
  const statusConfig: Record<
    Exclude<ApplicationStatus, null>,
    { label: string; bg: string; text: string; icon: string }
  > = {
    awaiting: {
      label: 'Awaiting Review',
      bg: 'bg-amber-400/20 border border-amber-300/40',
      text: 'text-amber-100',
      icon: 'schedule',
    },
    approved: {
      label: 'Approved',
      bg: 'bg-green-400/20 border border-green-300/40',
      text: 'text-green-100',
      icon: 'check_circle',
    },
    denied: {
      label: 'Denied',
      bg: 'bg-red-400/20 border border-red-300/40',
      text: 'text-red-200',
      icon: 'cancel',
    },
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-70px)] bg-surf-lo">
      {/* ── Header ── */}
      <div className="flex-shrink-0 clay-grad px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/messages')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            aria-label="Back to messages"
          >
            <ArrowLeftIcon className="w-5 h-5 text-white" />
          </button>

          {/* Clickable profile area */}
          {otherParticipant ? (
            <a
              href={`/profile/${otherParticipant.id}`}
              className="flex items-center gap-3 flex-1 min-w-0 rounded-xl px-2 py-1 -mx-2 -my-1 hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer"
              aria-label={`View ${otherParticipant.first_name}'s profile`}
            >
              {otherParticipant.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={otherParticipant.avatar_url}
                  alt={`${otherParticipant.first_name} ${otherParticipant.last_name}`}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white/30 flex-shrink-0"
                />
              ) : (
                <InitialsCircle
                  firstName={otherParticipant.first_name || ''}
                  lastName={otherParticipant.last_name || ''}
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h2 className="font-head font-bold text-white text-sm leading-tight truncate">
                    {otherParticipant.first_name} {otherParticipant.last_name}
                  </h2>
                  <span className="material-symbols-outlined text-white/50 flex-shrink-0" style={{ fontSize: 14 }}>open_in_new</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 flex-shrink-0" />
                  <p className="text-xs text-white/70 font-body truncate">
                    {otherParticipant.role === 'landlord'
                      ? 'Property Owner'
                      : otherParticipant.university
                        ? `${otherParticipant.university} Student`
                        : 'Student'}
                  </p>
                </div>
              </div>
            </a>
          ) : (
            <div className="flex-1 min-w-0" />
          )}

          {/* TOP RIGHT — action buttons */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {/* Approve (landlord / listing host) */}
            {showApproveButton && (
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex items-center gap-1.5 text-xs font-head font-bold bg-white/15 text-white border border-white/30 px-3 py-1.5 rounded-lg hover:bg-white/25 active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base leading-none">how_to_reg</span>
                {approving ? 'Approving…' : 'Approve'}
              </button>
            )}

            {/* Status badge — shown when no approve button */}
            {showStatusBadge && applicationStatus && statusConfig[applicationStatus] && (
              <div
                className={`flex items-center gap-1.5 text-xs font-head font-bold px-3 py-1.5 rounded-lg ${statusConfig[applicationStatus].bg} ${statusConfig[applicationStatus].text}`}
              >
                <span className="material-symbols-outlined text-base leading-none">
                  {statusConfig[applicationStatus].icon}
                </span>
                <span className="hidden sm:inline">{statusConfig[applicationStatus].label}</span>
              </div>
            )}

            {/* View Profile — sits right next to the status badge / approve button */}
            {otherParticipant && (
              <a
                href={`/profile/${otherParticipant.id}`}
                className="flex items-center gap-1.5 text-xs font-head font-bold bg-white/15 text-white border border-white/30 px-3 py-1.5 rounded-lg hover:bg-white/25 active:scale-95 transition-all"
                aria-label="View profile"
              >
                <span className="material-symbols-outlined text-base leading-none">person</span>
                Profile
              </a>
            )}
          </div>{/* end right-side action buttons */}
        </div>

        {/* Approve error */}
        {approveError && (
          <div className="max-w-2xl mx-auto mt-2">
            <p className="text-xs text-red-200 text-center font-body">{approveError}</p>
          </div>
        )}
      </div>

      {/* ── Messages list ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-surf-lo">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Listing preview card */}
          {listing && (
            <div className="flex-shrink-0 mb-3 bg-white rounded-2xl border border-out-var shadow-sm overflow-hidden">
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
                  <span className="text-xs text-clay font-head font-bold inline-block mt-1">{t('viewListing')}</span>
                </div>
              </a>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center py-20">
              <div>
                <p className="text-muted mb-2">{t('noMessagesYet')}</p>
                <p className="text-sm text-muted">Start the conversation below</p>
              </div>
            </div>
          ) : (
            messageGroups.map((group, groupIdx) => {
              const isCurrentUser = group.sender.id === currentUser?.id
              return (
                <div key={groupIdx} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-xs ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    {!isCurrentUser && groupIdx === 0 && (
                      <div className="flex-shrink-0 w-8 h-8">
                        {group.sender.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={group.sender.avatar_url}
                            alt={group.sender.first_name ?? ''}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <InitialsCircle
                            firstName={group.sender.first_name ?? ''}
                            lastName={group.sender.last_name ?? ''}
                          />
                        )}
                      </div>
                    )}
                    {!isCurrentUser && groupIdx > 0 && <div className="w-8 h-8 flex-shrink-0"></div>}

                    <div className={`flex flex-col gap-1 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                      {!isCurrentUser && groupIdx === 0 && (
                        <span className="text-xs text-muted px-3 pt-1">
                          {group.sender.first_name} {group.sender.last_name}
                        </span>
                      )}

                      {group.messages.map((msg) => (
                        <div key={msg.id}>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isCurrentUser
                                ? 'clay-grad text-white rounded-br-none'
                                : 'bg-white text-clay-dark border border-out-var rounded-bl-none'
                            }`}
                          >
                            <p className="break-words text-sm whitespace-pre-line">{msg.body}</p>
                          </div>
                          <span className={`text-xs text-muted mt-1 block ${isCurrentUser ? 'text-right' : ''}`}>
                            {getTimeAgo(msg.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Message input ── */}
      {canReply ? (
        <div className="flex-shrink-0 bg-white border-t border-out-var px-4 py-3.5">
          <div className="max-w-2xl mx-auto">
            {sendError && (
              <p className="text-xs text-red-500 font-body mb-2 text-center">{sendError}</p>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-2.5 items-end">
              <textarea
                ref={textareaRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e as any)
                  }
                }}
                placeholder={t('typeMessage')}
                className="flex-grow px-4 py-2.5 bg-surf-lo border border-out-var rounded-2xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-clay/30 focus:border-clay resize-none placeholder:text-[#b8a49a]"
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
        </div>
      ) : (
        <div className="flex-shrink-0 bg-linen border-t border-out-var px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-sm text-muted text-center">
              You can only reply to existing messages as a landlord.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
