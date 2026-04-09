'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { Profile } from '@/lib/types'
const MessageIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
  </svg>
)

interface ConversationWithData {
  id: string
  listing_id: string | null
  created_at: string
  participants: Array<{ profile: Profile }>
  messages: Array<{ id: string; body: string; created_at: string; sender_id: string; read_at: string | null }>
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
    <div className="flex items-center justify-center w-10 h-10 rounded-full clay-grad text-white font-display text-sm font-bold">
      {initials}
    </div>
  )
}

export default function MessagesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [conversations, setConversations] = useState<ConversationWithData[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

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

      setCurrentUser(userData)

      // Get conversations
      const { data } = await supabase
        .from('conversations')
        .select(
          `
          *,
          participants:conversation_participants(
            profile:profiles(*)
          ),
          messages(id, body, created_at, sender_id, read_at)
        `
        )
        .order('created_at', { ascending: false })

      setConversations(data || [])
      setLoading(false)
    }

    fetchData()
  }, [router, supabase])

  const getOtherParticipant = (conversation: ConversationWithData): Profile | null => {
    if (!currentUser) return null
    const other = conversation.participants.find((p) => p.profile.id !== currentUser.id)
    return other?.profile || null
  }

  const getLastMessage = (conversation: ConversationWithData): string => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return 'No messages yet'
    }
    const lastMsg = conversation.messages[conversation.messages.length - 1]
    return lastMsg.body.length > 60 ? lastMsg.body.substring(0, 60) + '...' : lastMsg.body
  }

  const hasUnread = (conversation: ConversationWithData): boolean => {
    if (!currentUser) return false
    return conversation.messages.some((msg) => msg.read_at === null && msg.sender_id !== currentUser.id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-clay border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-clay-dark mb-2">Messages</h1>
          <p className="text-muted text-sm">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Landlord banner */}
        {currentUser?.role === 'landlord' && (
          <div className="mb-6 p-4 rounded-lg border border-outline bg-white">
            <p className="text-sm text-clay-dark">
              <span className="font-head font-semibold">Note:</span> You can reply to student messages, but cannot initiate conversations.
            </p>
          </div>
        )}

        {/* Conversations list or empty state */}
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-clay-grad/10 flex items-center justify-center mb-4">
              <MessageIcon className="w-8 h-8 text-clay" />
            </div>
            <h2 className="font-head text-xl font-semibold text-clay-dark mb-2">No messages yet</h2>
            <p className="text-muted max-w-sm">
              {currentUser?.role === 'landlord'
                ? "You'll see messages from students here when they contact you."
                : 'Start a conversation by messaging a landlord or tenant.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const otherUser = getOtherParticipant(conversation)
              const unread = hasUnread(conversation)
              const lastMsg = getLastMessage(conversation)
              const lastMsgTime = conversation.messages?.[conversation.messages.length - 1]?.created_at
              const timeAgo = lastMsgTime ? getTimeAgo(lastMsgTime) : 'now'

              return (
                <Link key={conversation.id} href={`/messages/${conversation.id}`}>
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-out-var hover:shadow-sm transition-shadow cursor-pointer">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {otherUser?.avatar_url ? (
                        <Image
                          src={otherUser.avatar_url}
                          alt={`${otherUser.first_name} ${otherUser.last_name}`}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <InitialsCircle firstName={otherUser?.first_name || ''} lastName={otherUser?.last_name || ''} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0">
                      <h3 className="font-head font-semibold text-clay-dark">
                        {otherUser?.first_name} {otherUser?.last_name}
                      </h3>
                      <p className="text-sm text-muted truncate">{lastMsg}</p>
                    </div>

                    {/* Timestamp and unread indicator */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      <span className="text-xs text-muted">{timeAgo}</span>
                      {unread && <div className="w-2 h-2 rounded-full bg-clay"></div>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
