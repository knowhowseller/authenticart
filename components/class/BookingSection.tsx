'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, formatDateTime } from '@/lib/utils/format'
import Button from '@/components/ui/Button'
import Hexagon from '@/components/brand/Hexagon'
import WaitlistButton from './WaitlistButton'
import { Tag, X } from 'lucide-react'

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
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    coupon_id: string; discount: number; description: string | null
  } | null>(null)

  const waitlistMap = new Map(myWaitlists.map(w => [w.scheduleId, w.position]))

  const finalPrice = Math.max(0, price - (appliedCoupon?.discount ?? 0))

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, amount: price }),
    })
    const data = await res.json()
    setCouponLoading(false)
    if (!res.ok) { toast.error(data.error ?? '쿠폰 오류'); return }
    setAppliedCoupon({ coupon_id: data.coupon_id, discount: data.discount, description: data.description })
    toast.success(`쿠폰 적용! ${data.discount.toLocaleString()}원 할인`)
  }

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
          coupon_id: appliedCoupon?.coupon_id ?? null,
          discount_amount: appliedCoupon?.discount ?? 0,
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
        amount: finalPrice,
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

      {!allSoldOut && (
        <>
          {selectedSchedule && (
            <div className="border-t border-brand-mist/30 pt-4 mb-4 space-y-3">
              {/* 쿠폰 입력 */}
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 border border-brand-mist/50 rounded-xl px-3 py-2">
                    <Tag size={13} className="text-brand-grey flex-shrink-0" />
                    <input
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="쿠폰 코드 입력"
                      className="flex-1 text-sm bg-transparent outline-none text-brand-ink placeholder:text-brand-grey"
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-3 py-2 text-xs font-medium bg-brand-deep text-white rounded-xl hover:bg-brand-deep/90 disabled:opacity-40 transition-colors"
                  >
                    {couponLoading ? '확인 중' : '적용'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-brand-amber/5 border border-brand-amber/30 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Tag size={13} className="text-brand-amber" />
                    <div>
                      <p className="text-xs font-medium text-brand-ink">
                        {appliedCoupon.description ?? '쿠폰 적용됨'}
                      </p>
                      <p className="text-xs text-brand-amber">-{appliedCoupon.discount.toLocaleString()}원</p>
                    </div>
                  </div>
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode('') }}>
                    <X size={14} className="text-brand-grey hover:text-red-500 transition-colors" />
                  </button>
                </div>
              )}

              {/* 금액 요약 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-grey">수강료</span>
                  <span className={`font-medium ${appliedCoupon ? 'line-through text-brand-grey' : 'text-brand-ink'}`}>
                    {formatPrice(price)}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-amber">쿠폰 할인</span>
                    <span className="text-brand-amber font-medium">-{formatPrice(appliedCoupon.discount)}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-sm border-t border-brand-mist/30 pt-1.5">
                    <span className="font-semibold text-brand-ink">최종 결제</span>
                    <span className="font-bold text-brand-deep">{formatPrice(finalPrice)}</span>
                  </div>
                )}
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
            {confirmationMode === 'instant'
              ? `바로 결제 ${selectedSchedule ? formatPrice(finalPrice) : ''}`
              : '예약 신청'}
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
