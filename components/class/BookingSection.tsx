'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, formatDateTime } from '@/lib/utils/format'
import Button from '@/components/ui/Button'
import Hexagon from '@/components/brand/Hexagon'
import WaitlistButton from './WaitlistButton'

interface Schedule {
  id: string
  start_at: string
  end_at: string
  available_seats: number
}

interface WaitlistEntry {
  scheduleId: string
  position: number | null
}

interface BookingSectionProps {
  classId: string
  price: number
  confirmationMode: 'instant' | 'request'
  schedules: Schedule[]
  myWaitlists?: WaitlistEntry[]
}

export default function BookingSection({
  classId, price, confirmationMode, schedules, myWaitlists = [],
}: BookingSectionProps) {
  const router = useRouter()
  const supabase = createClient()
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(false)

  const waitlistMap = new Map(myWaitlists.map(w => [w.scheduleId, w.position]))

  async function handleBooking() {
    if (!selectedSchedule) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('로그인이 필요합니다')
      router.push('/login')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: selectedSchedule.id,
          gross_amount: price,
          confirmation_mode: confirmationMode,
        }),
      })
      const bookingData = await res.json()
      if (!res.ok) throw new Error(bookingData.error ?? '예약 생성 실패')

      if (confirmationMode === 'request') {
        toast.success('예약 신청이 완료되었습니다. 강사 확인을 기다려주세요.')
        router.push('/my/bookings')
        return
      }

      await loadTossPayments()
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
      if (!clientKey) throw new Error('결제 설정 오류. 관리자에게 문의해주세요.')
      const tossPayments = (window as any).TossPayments(clientKey)
      await tossPayments.requestPayment('카드', {
        amount: price,
        orderId: bookingData.booking_id,
        orderName: `클래스 예약`,
        customerName: user.email,
        successUrl: `${window.location.origin}/api/payments/toss-success?type=booking`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (err: any) {
      toast.error(err.message ?? '결제 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  function loadTossPayments(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).TossPayments) { resolve(); return }
      const script = document.createElement('script')
      script.src = 'https://js.tosspayments.com/v1/payment'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('결제 모듈 로드 실패. 잠시 후 다시 시도해주세요.'))
      document.head.appendChild(script)
    })
  }

  const allSoldOut = schedules.length > 0 && schedules.every(s => s.available_seats === 0)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 p-5 sticky top-24">
      <div className="flex items-center gap-2 mb-4">
        <Hexagon color="amber" size={16} />
        <h2 className="text-base font-semibold text-brand-ink">회차 선택</h2>
      </div>

      {schedules.length > 0 ? (
        <div className="space-y-2 mb-5">
          {schedules.map((s) => {
            const isSoldOut = s.available_seats === 0
            const isSelected = selectedSchedule?.id === s.id
            const isWaitlisted = waitlistMap.has(s.id)
            const waitPosition = waitlistMap.get(s.id)

            return (
              <div key={s.id}>
                <button
                  disabled={isSoldOut}
                  onClick={() => !isSoldOut && setSelectedSchedule(isSelected ? null : s)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSoldOut
                      ? 'border-brand-mist/30 bg-brand-bg cursor-default'
                      : isSelected
                      ? 'border-brand-amber bg-brand-amber/5'
                      : 'border-brand-mist/50 hover:border-brand-deep/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isSoldOut ? 'text-brand-grey' : 'text-brand-ink'}`}>
                        {formatDateTime(s.start_at)}
                      </p>
                      <p className="text-xs text-brand-grey mt-0.5">
                        {isSoldOut
                          ? isWaitlisted
                            ? `대기 중 (${waitPosition ?? '?'}번째)`
                            : '마감'
                          : `잔여 ${s.available_seats}석`}
                      </p>
                    </div>
                    {isSelected && !isSoldOut && (
                      <span className="text-brand-amber text-xs font-medium">선택됨</span>
                    )}
                    {isSoldOut && isWaitlisted && (
                      <span className="text-xs bg-brand-amber/10 text-brand-amber border border-brand-amber/30 px-2 py-0.5 rounded-full font-medium">
                        대기 중
                      </span>
                    )}
                  </div>
                </button>

                {/* 마감 회차 → 대기 버튼 */}
                {isSoldOut && (
                  <div className="mt-1.5 px-1">
                    <WaitlistButton
                      scheduleId={s.id}
                      initialWaitlisted={isWaitlisted}
                      initialPosition={waitPosition}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-brand-grey text-center py-6">예정된 회차가 없습니다</p>
      )}

      {/* 예약 가능한 회차가 있을 때만 결제 영역 표시 */}
      {!allSoldOut && (
        <>
          {selectedSchedule && (
            <div className="border-t border-brand-mist/30 pt-4 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-brand-grey">수강료</span>
                <span className="font-semibold text-brand-ink">{formatPrice(price)}</span>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            variant={confirmationMode === 'instant' ? 'accent' : 'primary'}
            size="lg"
            disabled={!selectedSchedule}
            loading={loading}
            onClick={handleBooking}
          >
            {confirmationMode === 'instant' ? '바로 결제' : '예약 신청'}
          </Button>

          {confirmationMode === 'request' && (
            <p className="text-xs text-brand-grey text-center mt-2">
              강사가 24시간 내 응답합니다
            </p>
          )}
        </>
      )}
    </div>
  )
}
