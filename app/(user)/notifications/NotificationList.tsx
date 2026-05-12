'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

function typeIcon(type: string) {
  const map: Record<string, string> = {
    booking_approved: '✅',
    booking_rejected: '❌',
    booking_paid: '💳',
    instructor_approved: '🎓',
    instructor_rejected: '😢',
    review_reply: '💬',
    payout: '💰',
    notice: '📢',
  }
  return map[type] ?? '🔔'
}

export default function NotificationList({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const supabase = createClient()

  const unreadCount = notifications.filter(n => !n.is_read).length

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
        <Bell size={32} className="text-brand-mist mx-auto mb-3" />
        <p className="text-brand-grey font-medium">알림이 없습니다</p>
      </div>
    )
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={markAllRead}
            className="text-xs text-brand-grey hover:text-brand-deep transition-colors"
          >
            모두 읽음 처리
          </button>
        </div>
      )}
      <div className="space-y-2">
        {notifications.map(n => {
          const content = (
            <div
              key={n.id}
              className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${n.is_read ? 'border-brand-mist/20 opacity-75' : 'border-brand-deep/20'}`}
              onClick={() => !n.is_read && markRead(n.id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{typeIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${n.is_read ? 'text-brand-grey' : 'text-brand-ink'}`}>
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-brand-deep flex-shrink-0" />
                    )}
                  </div>
                  {n.body && <p className="text-xs text-brand-grey mt-0.5 leading-relaxed">{n.body}</p>}
                  <p className="text-xs text-brand-grey/60 mt-1">
                    {new Date(n.created_at).toLocaleDateString('ko-KR', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )

          return n.link ? (
            <Link key={n.id} href={n.link} className="block cursor-pointer">
              {content}
            </Link>
          ) : (
            <div key={n.id} className="cursor-pointer">{content}</div>
          )
        })}
      </div>
    </div>
  )
}
