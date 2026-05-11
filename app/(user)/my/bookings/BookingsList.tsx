'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatPrice, formatDateTime } from '@/lib/utils/format'

const statusLabel: Record<string, { label: string; color: string }> = {
  pending_approval: { label: '승인 대기', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  approved:         { label: '결제 대기', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  paid:             { label: '결제 완료', color: 'bg-green-50 text-green-600 border-green-200' },
  rejected:         { label: '거절됨', color: 'bg-red-50 text-red-500 border-red-200' },
  cancelled:        { label: '취소됨', color: 'bg-brand-bg text-brand-grey border-brand-mist' },
  completed:        { label: '완료', color: 'bg-brand-deep/5 text-brand-deep border-brand-deep/20' },
  expired:          { label: '만료됨', color: 'bg-brand-bg text-brand-grey border-brand-mist' },
  refunded:         { label: '환불됨', color: 'bg-purple-50 text-purple-600 border-purple-200' },
}

const TABS = [
  { key: 'all', label: '전체' },
  { key: 'active', label: '진행 중', statuses: ['pending_approval', 'approved'] },
  { key: 'paid', label: '결제 완료', statuses: ['paid', 'completed'] },
  { key: 'cancelled', label: '취소/환불', statuses: ['cancelled', 'rejected', 'expired', 'refunded'] },
]

interface Booking {
  id: string
  status: string
  gross_amount: number
  refund_amount: number
  created_at: string
  receipt_url: string | null
  class_schedules: {
    start_at: string
    classes: { id: string; title: string; region: string; price: number }
  } | null
}

export default function BookingsList({ bookings }: { bookings: Booking[] }) {
  const [activeTab, setActiveTab] = useState('all')
  const [refunding, setRefunding] = useState<string | null>(null)

  const filtered = bookings.filter((b) => {
    const tab = TABS.find(t => t.key === activeTab)
    if (!tab || activeTab === 'all') return true
    return tab.statuses?.includes(b.status)
  })

  const tabCount = (key: string) => {
    const tab = TABS.find(t => t.key === key)
    if (!tab || key === 'all') return bookings.length
    return bookings.filter(b => tab.statuses?.includes(b.status)).length
  }

  async function handleRefund(bookingId: string) {
    if (!window.confirm('환불을 신청하시겠습니까?')) return
    setRefunding(bookingId)
    const res = await fetch('/api/bookings/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId, reason: '사용자 요청' }),
    })
    setRefunding(null)
    if (res.ok) {
      toast.success('환불 신청이 완료되었습니다')
      window.location.reload()
    } else {
      const d = await res.json()
      toast.error(d.error ?? '환불 처리 중 오류가 발생했습니다')
    }
  }

  return (
    <div>
      {/* 탭 */}
      <div className="flex gap-1 mb-5 bg-white rounded-xl p-1 shadow-sm border border-brand-mist/30">
        {TABS.map((tab) => {
          const count = tabCount(tab.key)
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 text-xs font-medium py-2 px-3 rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-brand-deep text-white shadow-sm'
                  : 'text-brand-grey hover:text-brand-ink'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1 ${activeTab === tab.key ? 'text-white/70' : 'text-brand-grey'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-brand-grey">
            {activeTab === 'all' ? '예약 내역이 없습니다' : '해당 예약이 없습니다'}
          </p>
          {activeTab === 'all' && (
            <a href="/classes" className="inline-block mt-3 text-sm text-brand-deep hover:underline">
              클래스 둘러보기
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => {
            const s = statusLabel[b.status] ?? { label: b.status, color: 'bg-brand-bg text-brand-grey border-brand-mist' }
            const classTitle = b.class_schedules?.classes?.title ?? '클래스'
            const startAt = b.class_schedules?.start_at
            const classId = b.class_schedules?.classes?.id
            const canRefund = b.status === 'paid' && startAt
              ? (new Date(startAt).getTime() - Date.now()) / 86400000 >= 1
              : false

            return (
              <div key={b.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-brand-ink truncate">{classTitle}</h3>
                    {startAt && (
                      <p className="text-sm text-brand-grey mt-0.5">{formatDateTime(startAt)}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${s.color}`}>
                    {s.label}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-brand-mist/30">
                  <span className="text-sm font-bold text-brand-deep">{formatPrice(b.gross_amount)}</span>
                  <div className="flex gap-2 items-center">
                    {b.receipt_url && (
                      <a
                        href={b.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-deep hover:underline"
                      >
                        영수증
                      </a>
                    )}
                    {canRefund && (
                      <button
                        onClick={() => handleRefund(b.id)}
                        disabled={refunding === b.id}
                        className="text-xs text-red-500 hover:underline disabled:opacity-50"
                      >
                        {refunding === b.id ? '처리 중...' : '환불 신청'}
                      </button>
                    )}
                    {b.status === 'approved' && (
                      <a href={`/bookings/${b.id}/pay`} className="text-xs font-medium text-brand-amber hover:underline">
                        결제하기
                      </a>
                    )}
                    {b.status === 'completed' && classId && (
                      <Link
                        href={`/classes/${classId}#reviews`}
                        className="text-xs font-medium text-brand-deep hover:underline"
                      >
                        후기 작성
                      </Link>
                    )}
                    {b.status === 'refunded' && b.refund_amount > 0 && (
                      <span className="text-xs text-purple-600">
                        {formatPrice(b.refund_amount)} 환불
                      </span>
                    )}
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
