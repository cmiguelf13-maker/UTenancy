'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Message, Profile } from '@/lib/types'

/* ── Types ──────────────────────────────────────────────────── */
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
  profile: Profile | null
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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  /* ── Load selected conversation ──────────────────────────── */
  useEffect(() => {
    if (!selectedConvId || !currentUser) return
    setLoadingConv(true)
    setMessages([])
    setOtherParticipant(null)
    setSendError(null)

    const load = async () => {
      /* participants */
      const { data: pData } = await supabase
        .from('conversation_participants')
        .select('user_id, profile:profiles!conversation_participants_user_profile_fkey(*)')
        .eq('conversation_id', selectedConvId)

      const other = (pData as Array<{ user_id: string; profile: any }> | null)?.find(
        (p) => p.user_id !== currentUser.id
      )
      if (other?.profile) setOtherParticipant(other.profile as Profile)

      /* messages */
      const { data: msgs } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_profile_fkey(*)')
        .eq('conversation_id', selectedConvId)
        .order('created_at', { ascending: true })

      setMessages(msgs || [])

      /* mark read */
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', selectedConvId)
        .neq('sender_id', currentUser.id)
        .is('read_at', null)

      /* landlord reply gate */
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
            /* update sidebar preview */
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

  /* ────────────────── RENDER ───────────────────────────────── */
  return (
    <div className="flex h-screen overflow-hidden bg-cream">

      {/* ═══ LEFT SIDEBAR ═══════════════════════════════════════ */}
      <div
        className={`w-80 flex-shrink-0 border-r border-out-var bg-white flex flex-col
          ${selectedConvId ? 'hidden md:flex' : 'flex'}`}
      >
        {/* Sidebar header */}
        <div className="px-5 pt-5 pb-4 border-b border-out-var/60">
          <h1 className="font-display text-2xl font-light text-clay-dark">Messages</h1>
          {!loadingList && (
            <p className="text-[11px] font-body text-muted mt-0.5">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
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
              <p className="font-head font-bold text-clay-dark text-sm mb-1">No messages yet</p>
              <p className="font-body text-muted text-xs">
                {currentUser?.role === 'landlord'
                  ? "Messages from students will appear here."
                  : 'Message a landlord or tenant to get started.'}
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
          </div>
        ) : loadingConv ? (
          /* ── Loading conversation ── */
          <div className="flex-1 flex items-center justify-center bg-cream">
            <div className="w-8 h-8 rounded-full border-2 border-clay/30 border-t-clay animate-spin" />
          </div>
        ) : (
          /* ── Active conversation ── */
          <>
            {/* Conversation header */}
            <div className="flex-shrink-0 bg-white border-b border-out-var px-5 py-3.5 flex items-center gap-3">
              {/* Mobile: back to list */}
              <button
                onClick={() => setSelectedConvId(null)}
                className="md:hidden p-1.5 rounded-lg hover:bg-surf-lo transition-colors -ml-1 mr-0.5"
              >
                <span className="material-symbols-outlined text-lg text-clay-dark">arrow_back</span>
              </button>

              <Avatar profile={otherParticipant} size="md" />

              <div className="flex-1 min-w-0">
                <p className="font-head font-bold text-clay-dark text-sm leading-tight">
                  {otherParticipant?.first_name} {otherParticipant?.last_name}
                </p>
                <p className="text-[11px] text-muted leading-tight">
                  {otherParticipant?.role === 'landlord'
                    ? 'Property Owner'
                    : otherParticipant?.university
                      ? `${otherParticipant.university} Student`
                      : 'Student'}
                </p>
              </div>

              {otherParticipant && otherParticipant.role !== 'landlord' && (
                <a
                  href={`/profile/${otherParticipant.id}`}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-head font-bold text-clay hover:text-clay-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-linen"
                >
                  <span className="material-symbols-outlined text-base">person</span>
                  Profile
                </a>
              )}
            </div>

            {/* Messages scroll area */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
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
                        {/* Other user avatar — pinned to bottom of group */}
                        {!isMe && (
                          <div className="flex-shrink-0 self-end mb-4">
                            <Avatar profile={group.sender} size="sm" />
                          </div>
                        )}

                        <div
                          className={`flex flex-col gap-1 max-w-xs
                            ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          {/* Sender label (first group only, other user) */}
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
                                  {msg.body}
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
                    placeholder="Type a message…"
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
