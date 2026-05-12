'use client'
import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
import { toast } from 'sonner'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending_approval: { label: '승인 대기', color: 'bg-yellow-50 text-yellow-600' },
  approved:         { label: '결제 대기', color: 'bg-blue-50 text-blue-600' },
  paid:             { label: '결제 완료', color: 'bg-green-50 text-green-600' },
  completed:        { label: '완료', color: 'bg-brand-deep/5 text-brand-deep' },
  cancelled:        { label: '취소됨', color: 'bg-brand-bg text-brand-grey' },
  expired:          { label: '만료됨', color: 'bg-brand-bg text-brand-grey' },
  refunded:         { label: '환불됨', color: 'bg-red-50 text-red-500' },
  rejected:         { label: '거절됨', color: 'bg-red-50 text-red-400' },
}

const ALL_STATUSES = ['all', ...Object.keys(statusConfig)]
const STATUS_LABELS: Record<string, string> = { all: '전체', ...Object.fromEntries(Object.entries(statusConfig).map(([k, v]) => [k, v.label])) }

interface Booking {
  id: string
  status: string
  gross_amount: number
  created_at: string
  payment_id: string | null
  users?: { name: string; email: string } | null
  class_schedules?: {
    start_at: string
    classes?: {
      title: string
      users?: { name: string } | null
    } | null
  } | null
}

async function forceAction(booking_id: string, action: 'cancel' | 'refund', onDone: () => void) {
  const reason = prompt(action === 'cancel' ? '취소 사유를 입력하세요:' : '환불 사유를 입력하세요:')
  if (reason === null) return
  const res = await fetch('/api/admin/bookings/force-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking_id, action, reason }),
  })
  if (!res.ok) {
    const data = await res.json()
    toast.error(data.error ?? '처리 실패')
    return
  }
  toast.success(action === 'cancel' ? '취소 처리되었습니다' : '환불 처리되었습니다')
  onDone()
}

export default function AdminBookingsClient({ bookings: initialBookings }: { bookings: Booking[] }) {
  const [bookings, setBookings] = useState(initialBookings)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bookings.filter(b => {
      if (status !== 'all' && b.status !== status) return false
      if (!q) return true
      return (
        b.class_schedules?.classes?.title?.toLowerCase().includes(q) ||
        b.users?.name?.toLowerCase().includes(q) ||
        b.users?.email?.toLowerCase().includes(q) ||
        b.class_schedules?.classes?.users?.name?.toLowerCase().includes(q) ||
        b.payment_id?.toLowerCase().includes(q)
      )
    })
  }, [bookings, query, status])

  return (
    <div>
      {/* 검색 + 상태 필터 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30 mb-4 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="클래스명, 수강생, 강사, 결제 ID 검색..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-brand-mist focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                status === s
                  ? 'bg-brand-deep text-white'
                  : 'bg-brand-bg text-brand-grey hover:text-brand-ink'
              }`}
            >
              {STATUS_LABELS[s]}
              {s === 'all' && ` (${bookings.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* 결과 수 */}
      <p className="text-xs text-brand-grey mb-3">{filtered.length}건</p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
          <p className="text-brand-grey">검색 결과가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => {
            const s = statusConfig[b.status] ?? { label: b.status, color: '' }
            return (
              <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-brand-ink text-sm truncate">
                      {b.class_schedules?.classes?.title ?? '-'}
                    </p>
                    <p className="text-xs text-brand-grey mt-0.5">
                      수강생: {b.users?.name ?? '-'} ({b.users?.email ?? '-'}) · 강사: {b.class_schedules?.classes?.users?.name ?? '-'}
                    </p>
                    <p className="text-xs text-brand-grey mt-0.5">
                      {b.class_schedules?.start_at
                        ? new Date(b.class_schedules.start_at).toLocaleString('ko-KR')
                        : '-'}
                      {' · '}{formatPrice(b.gross_amount)}
                    </p>
                    {b.payment_id && (
                      <p className="text-xs text-brand-grey/60 mt-0.5 truncate">결제ID: {b.payment_id}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
                      {s.label}
                    </span>
                    <span className="text-xs text-brand-grey">
                      {new Date(b.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    <div className="flex gap-2">
                      {!['cancelled', 'refunded', 'rejected'].includes(b.status) && (
                        <button
                          onClick={() => forceAction(b.id, 'cancel', () =>
                            setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'cancelled' } : x))
                          )}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          강제취소
                        </button>
                      )}
                      {b.status === 'paid' && (
                        <button
                          onClick={() => forceAction(b.id, 'refund', () =>
                            setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'refunded' } : x))
                          )}
                          className="text-xs text-purple-500 hover:text-purple-700 transition-colors"
                        >
                          강제환불
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
