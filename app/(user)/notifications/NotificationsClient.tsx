'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BookOpen, ShoppingBag, Heart, AlertCircle, CheckCircle, Info } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  booking:  <BookOpen size={16} className="text-green-600" />,
  order:    <ShoppingBag size={16} className="text-purple-600" />,
  payment:  <ShoppingBag size={16} className="text-brand-deep" />,
  wishlist: <Heart size={16} className="text-red-500" />,
  alert:    <AlertCircle size={16} className="text-yellow-600" />,
  success:  <CheckCircle size={16} className="text-green-600" />,
}

function getIcon(type: string) {
  return TYPE_ICON[type] ?? <Info size={16} className="text-brand-grey" />
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}일 전`
  return new Date(iso).toLocaleDateString('ko-KR')
}

export default function NotificationsClient({ notifications: initial }: { notifications: Notification[] }) {
  const router = useRouter()
  const [list, setList] = useState(initial)
  const [markingAll, setMarkingAll] = useState(false)

  const unreadCount = list.filter(n => !n.is_read).length

  useEffect(() => {
    const unreadIds = initial.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    fetch('/api/notifications/mark-read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: unreadIds }),
    }).then(() => {
      setList(prev => prev.map(n => ({ ...n, is_read: true })))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function markAll() {
    setMarkingAll(true)
    await fetch('/api/notifications/mark-read', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    setList(prev => prev.map(n => ({ ...n, is_read: true })))
    setMarkingAll(false)
  }

  function handleClick(n: Notification) {
    if (n.link) router.push(n.link)
  }

  if (list.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
        <Bell size={32} className="text-brand-mist mx-auto mb-3" />
        <p className="text-brand-grey text-sm">알림이 없습니다</p>
      </div>
    )
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-brand-grey">읽지 않은 알림 <strong className="text-brand-ink">{unreadCount}개</strong></p>
          <button
            onClick={markAll}
            disabled={markingAll}
            className="text-xs text-brand-deep hover:underline disabled:opacity-50"
          >
            모두 읽음 처리
          </button>
        </div>
      )}
      <div className="space-y-2">
        {list.map(n => (
          <div
            key={n.id}
            onClick={() => handleClick(n)}
            className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
              n.link ? 'cursor-pointer hover:shadow-md hover:border-brand-deep/30' : ''
            } ${!n.is_read ? 'border-brand-deep/30 bg-brand-deep/5' : 'border-brand-mist/30'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                !n.is_read ? 'bg-brand-deep/10' : 'bg-brand-bg'
              }`}>
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${!n.is_read ? 'font-semibold text-brand-ink' : 'font-medium text-brand-ink'}`}>
                    {n.title}
                  </p>
                  <span className="text-xs text-brand-grey flex-shrink-0">{timeAgo(n.created_at)}</span>
                </div>
                {n.body && <p className="text-xs text-brand-grey mt-0.5 line-clamp-2">{n.body}</p>}
              </div>
              {!n.is_read && (
                <div className="w-2 h-2 rounded-full bg-brand-deep flex-shrink-0 mt-2" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
