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
  const [canReply, setCanReply] = useState(true)

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
      // Get session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth')
        return
      }

      // Get current user profile
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setCurrentUser(userData as Profile)

      // Get participants
      const { data: participantData } = await supabase
        .from('conversation_participants')
        .select('profile:profiles(*)')
        .eq('conversation_id', conversationId)

      const other = (participantData as Array<{ profile: any }> | null)?.find((p) => p.profile.id !== session.user.id)
      if (other) {
        setOtherParticipant(other.profile as Profile)
      }

      // Get messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      setMessages(msgs || [])

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', session.user.id)
        .is('read_at', null)

      // Landlords can only reply — not initiate. If there are no prior student messages, block input.
      if (userData?.role === 'landlord') {
        const hasStudentMessage = msgs?.some((m: any) => m.sender_id !== session.user.id)
        if (!hasStudentMessage) setCanReply(false)
      }

      setLoading(false)
    }

    fetchData()
  }, [conversationId, router, supabase])

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as MessageWithSender])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!messageText.trim() || !currentUser || sending) return

    setSending(true)

    try {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        body: messageText.trim(),
      })

      setMessageText('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-clay border-t-transparent"></div>
      </div>
    )
  }

  // Group messages by sender and time
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

  return (
    <div className="flex flex-col h-screen bg-linen">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-out-var px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/messages')}
            className="p-2 hover:bg-linen rounded-lg transition-colors"
            aria-label="Back to messages"
          >
            <ArrowLeftIcon className="w-5 h-5 text-clay-dark" />
          </button>

          <div className="flex items-center gap-3 flex-grow">
            {otherParticipant?.avatar_url ? (
              <Image
                src={otherParticipant.avatar_url}
                alt={`${otherParticipant.first_name} ${otherParticipant.last_name}`}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <InitialsCircle
                firstName={otherParticipant?.first_name || ''}
                lastName={otherParticipant?.last_name || ''}
              />
            )}

            <div>
              <h2 className="font-head font-semibold text-clay-dark">
                {otherParticipant?.first_name} {otherParticipant?.last_name}
              </h2>
              <p className="text-xs text-muted">
                {otherParticipant?.role === 'landlord' ? 'Landlord' : 'LMU student'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-grow overflow-y-auto p-4">
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
                    {/* Avatar (only for other user's first message in group) */}
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
                          <InitialsCircle firstName={group.sender.first_name ?? ''} lastName={group.sender.last_name ?? ''} />
                        )}
                      </div>
                    )}
                    {!isCurrentUser && groupIdx > 0 && <div className="w-8 h-8 flex-shrink-0"></div>}

                    {/* Messages */}
                    <div className={`flex flex-col gap-1 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                      {/* Sender name (only for other user's first message) */}
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
                            <p className="break-words text-sm">{msg.body}</p>
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

      {/* Message input */}
      {canReply ? (
        <div className="sticky bottom-0 bg-white border-t border-out-var px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-3">
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
                placeholder="Type a message..."
                className="flex-grow px-4 py-2 border border-out-var rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-clay focus:border-transparent resize-none max-h-30"
                rows={1}
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sending}
                className="clay-grad text-white px-6 py-2 rounded-lg font-head font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-shadow"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-linen border-t border-out-var px-4 py-4">
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
