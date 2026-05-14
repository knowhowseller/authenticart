'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { formatPrice, formatDateTime } from '@/lib/utils/format'
import Button from '@/components/ui/Button'

interface Request {
  id: string
  status: string
  gross_amount: number
  approval_expires_at: string | null
  created_at: string
  users: { name: string; email: string; phone: string | null } | null
  class_schedules: {
    start_at: string
    end_at: string
    classes: { title: string; price: number } | null
  } | null
}

function CountDown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setRemaining('만료됨'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const isUrgent = new Date(expiresAt).getTime() - Date.now() < 3 * 3600000

  return (
    <span className={`font-mono text-sm font-semibold ${isUrgent ? 'text-red-500' : 'text-brand-deep'}`}>
      {remaining}
    </span>
  )
}

export default function RequestsList({ initialRequests }: { initialRequests: Request[] }) {
  const [requests, setRequests] = useState(initialRequests)
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  async function handleApprove(bookingId: string) {
    setProcessing(bookingId)
    const res = await fetch('/api/bookings/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId }),
    })
    setProcessing(null)
    if (res.ok) {
      toast.success('예약을 수락했습니다. 수강생에게 결제 링크를 발송했습니다.')
      setRequests(prev => prev.filter(r => r.id !== bookingId))
    } else {
      toast.error('처리 중 오류가 발생했습니다')
    }
  }

  function openReject(bookingId: string) {
    setRejectingId(bookingId)
    setRejectReason('')
  }

  async function confirmReject(bookingId: string) {
    if (!rejectReason.trim()) {
      toast.error('거절 사유를 입력해주세요')
      return
    }
    setProcessing(bookingId)
    const res = await fetch('/api/bookings/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId, reason: rejectReason.trim() }),
    })
    setProcessing(null)
    if (res.ok) {
      toast.success('예약 신청을 거절했습니다. 수강생에게 사유가 전달됩니다.')
      setRequests(prev => prev.filter(r => r.id !== bookingId))
      setRejectingId(null)
    } else {
      toast.error('처리 중 오류가 발생했습니다')
    }
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
        <div className="text-4xl mb-3">✅</div>
        <p className="text-brand-grey">대기 중인 예약 신청이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => {
        const isRejecting = rejectingId === req.id
        return (
          <div key={req.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="font-semibold text-brand-ink">
                  {req.class_schedules?.classes?.title ?? '클래스'}
                </p>
                <p className="text-sm text-brand-grey mt-0.5">
                  {req.class_schedules?.start_at && formatDateTime(req.class_schedules.start_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand-deep">{formatPrice(req.gross_amount)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm mb-4">
              <div>
                <p className="text-brand-ink font-medium">{req.users?.name}</p>
                <p className="text-brand-grey text-xs">{req.users?.email}</p>
                {req.users?.phone && (
                  <p className="text-brand-grey text-xs mt-0.5">{req.users.phone}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-brand-grey mb-0.5">응답 남은 시간</p>
                {req.approval_expires_at && <CountDown expiresAt={req.approval_expires_at} />}
              </div>
            </div>

            {isRejecting ? (
              <div className="space-y-2">
                <label className="text-xs font-medium text-brand-grey">거절 사유 <span className="text-red-500">*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={2}
                  placeholder="예: 해당 일정에 다른 클래스가 있어 수락이 어렵습니다"
                  className="w-full px-3 py-2 text-sm border border-brand-mist rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  autoFocus
                />
                <p className="text-xs text-brand-grey">수강생에게 이 사유가 전달됩니다</p>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 !bg-red-500 hover:!bg-red-600 border-red-500"
                    loading={processing === req.id}
                    onClick={() => confirmReject(req.id)}
                  >
                    거절 확인
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setRejectingId(null); setRejectReason('') }}
                  >
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="accent"
                  size="sm"
                  className="flex-1"
                  loading={processing === req.id}
                  onClick={() => handleApprove(req.id)}
                >
                  수락
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openReject(req.id)}
                >
                  거절
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
