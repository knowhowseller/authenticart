'use client'
import { useState } from 'react'
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

interface Booking {
  id: string
  status: string
  gross_amount: number
  refund_amount: number
  created_at: string
  receipt_url: string | null
  class_schedules: {
    start_at: string
    classes: { title: string; region: string; price: number }
  } | null
}

export default function BookingsList({ bookings }: { bookings: Booking[] }) {
  const [refunding, setRefunding] = useState<string | null>(null)

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

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
        <div className="text-4xl mb-3">📅</div>
        <p className="text-brand-grey">예약 내역이 없습니다</p>
        <a href="/classes" className="inline-block mt-3 text-sm text-brand-deep hover:underline">
          클래스 둘러보기
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => {
        const s = statusLabel[b.status] ?? { label: b.status, color: 'bg-brand-bg text-brand-grey border-brand-mist' }
        const classTitle = b.class_schedules?.classes?.title ?? '클래스'
        const startAt = b.class_schedules?.start_at
        const canRefund = b.status === 'paid' && startAt
          ? (new Date(startAt).getTime() - Date.now()) / 86400000 >= 1
          : false

        return (
          <div key={b.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-brand-ink">{classTitle}</h3>
                {startAt && (
                  <p className="text-sm text-brand-grey mt-0.5">{formatDateTime(startAt)}</p>
                )}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.color}`}>
                {s.label}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-brand-mist/30">
              <span className="text-sm font-bold text-brand-deep">{formatPrice(b.gross_amount)}</span>
              <div className="flex gap-2">
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
                    환불 신청
                  </button>
                )}
                {b.status === 'approved' && (
                  <a href={`/bookings/${b.id}/pay`} className="text-xs font-medium text-brand-amber hover:underline">
                    결제하기
                  </a>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
