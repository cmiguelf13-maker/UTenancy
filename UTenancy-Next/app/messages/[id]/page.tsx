'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { Message, Profile } from '@/lib/types'

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
}

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

  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [otherParticipant, setOtherParticipant] = useState<Profile | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [canReply, setCanReply] = useState(true)
  const [listing, setListing] = useState<ListingInfo | null>(null)
  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [messageText])

  // Load conversation data
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth')
        return
      }

      // Current user profile
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setCurrentUser(userData as Profile)

      // Participants
      const { data: participantData } = await supabase
        .from('conversation_participants')
        .select('user_id, profile:profiles!conversation_participants_user_profile_fkey(*)')
        .eq('conversation_id', conversationId)

      const other = (participantData as Array<{ user_id: string; profile: any }> | null)
        ?.find((p) => p.user_id !== session.user.id)
      if (other?.profile) {
        setOtherParticipant(other.profile as Profile)
      }

      // Listing linked to this conversation
      const { data: convRow } = await supabase
        .from('conversations')
        .select('listing_id')
        .eq('id', conversationId)
        .single()

      if (convRow?.listing_id) {
        const { data: listingRow } = await supabase
          .from('listings')
          .select('id, type, status, landlord_id')
          .eq('id', convRow.listing_id)
          .single()
        if (listingRow) setListing(listingRow as ListingInfo)
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
    if (!listing || !otherParticipant || !currentUser || approving) return
    setApproving(true)
    setApproveError(null)

    // 1. Find or create household for this listing
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

    // 2. Add self as admin member
    await supabase.from('household_members').upsert(
      { household_id: householdId, user_id: currentUser.id, role: 'admin' },
      { onConflict: 'household_id,user_id' }
    )

    // 3. Add approved student as member
    await supabase.from('household_members').upsert(
      { household_id: householdId, user_id: otherParticipant.id, role: 'member' },
      { onConflict: 'household_id,user_id' }
    )

    // 4. Mark listing as rented
    await supabase.from('listings').update({ status: 'rented' }).eq('id', listing.id)

    // 5. Send approval message in conversation
    const { data: inserted } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        body: APPROVAL_MSG,
      })
      .select('*, sender:profiles!messages_sender_profile_fkey(*)')
      .single()

    if (inserted) {
      setMessages((prev) => [...prev, inserted as MessageWithSender])
    }

    // 6. Reflect rented status locally
    setListing((prev) => (prev ? { ...prev, status: 'rented' } : null))
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

  const showApproveButton =
    listing !== null &&
    listing.landlord_id === currentUser?.id &&
    listing.type === 'open' &&
    listing.status !== 'rented'

  const showApprovedBadge =
    listing !== null &&
    listing.landlord_id === currentUser?.id &&
    listing.status === 'rented'

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

          <div className="flex items-center gap-3 flex-1 min-w-0">
            {otherParticipant?.avatar_url ? (
              <Image
                src={otherParticipant.avatar_url}
                alt={`${otherParticipant.first_name} ${otherParticipant.last_name}`}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover border-2 border-white/30 flex-shrink-0"
              />
            ) : (
              <InitialsCircle
                firstName={otherParticipant?.first_name || ''}
                lastName={otherParticipant?.last_name || ''}
              />
            )}

            <div className="flex-1 min-w-0">
              <h2 className="font-head font-bold text-white text-sm leading-tight truncate">
                {otherParticipant?.first_name} {otherParticipant?.last_name}
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 flex-shrink-0" />
                <p className="text-xs text-white/70 font-body truncate">
                  {otherParticipant?.role === 'landlord'
                    ? 'Property Owner'
                    : otherParticipant?.university
                      ? `${otherParticipant.university} Student`
                      : 'Student'}
                </p>
              </div>
            </div>
          </div>

          {/* Approve button — shown to listing poster for open listings not yet rented */}
          {showApproveButton && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-head font-bold bg-white/15 text-white border border-white/30 px-3 py-1.5 rounded-lg hover:bg-white/25 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base leading-none">how_to_reg</span>
              {approving ? 'Approving…' : 'Approve'}
            </button>
          )}

          {/* Approved badge — listing already rented */}
          {showApprovedBadge && (
            <div className="flex-shrink-0 flex items-center gap-1 text-xs font-head font-bold text-green-300 px-1">
              <span className="material-symbols-outlined text-base leading-none">verified</span>
              Approved
            </div>
          )}

          {/* View profile — other user is a student */}
          {otherParticipant && otherParticipant.role !== 'landlord' && !showApproveButton && !showApprovedBadge && (
            <a
              href={`/profile/${otherParticipant.id}`}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-head font-bold text-white/80 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
              aria-label="View profile"
            >
              <span className="material-symbols-outlined text-base">person</span>
              Profile
            </a>
          )}
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
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center py-20">
              <div>
                <p className="text-muted mb-2">No messages yet</p>
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
                          <Image
                            src={group.sender.avatar_url}
                            alt={group.sender.first_name ?? ''}
                            width={32}
                            height={32}
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
                placeholder="Type a message…"
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
