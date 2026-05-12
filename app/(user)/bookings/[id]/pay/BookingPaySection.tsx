'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Tag, X, Check } from 'lucide-react'
import Button from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils/format'

interface CouponResult {
  coupon_id: string
  discount: number
  type: string
  value: number
  description: string | null
}

export default function BookingPaySection({
  bookingId,
  amount,
  className,
  userName,
  userEmail,
  userPhone,
}: {
  bookingId: string
  amount: number
  className: string
  userName: string
  userEmail: string
  userPhone: string
}) {
  const [loading, setLoading] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [coupon, setCoupon] = useState<CouponResult | null>(null)

  const finalAmount = coupon ? Math.max(amount - coupon.discount, 0) : amount
  const discount = coupon?.discount ?? 0

  async function applyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, amount }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? '쿠폰 오류'); return }
      setCoupon(data)
      toast.success(`${discount > 0 ? formatPrice(data.discount) : ''}${data.type === 'percent' ? ` (${data.value}%)` : ''} 할인 적용`)
    } finally {
      setCouponLoading(false)
    }
  }

  function removeCoupon() {
    setCoupon(null)
    setCouponCode('')
  }

  async function handlePay() {
    setLoading(true)
    try {
      // 쿠폰이 적용된 경우 booking에 저장
      if (coupon) {
        const applyRes = await fetch('/api/bookings/apply-coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_id: bookingId,
            coupon_id: coupon.coupon_id,
            discount_amount: coupon.discount,
          }),
        })
        if (!applyRes.ok) {
          const d = await applyRes.json()
          toast.error(d.error ?? '쿠폰 적용 오류')
          setLoading(false)
          return
        }
      }

      if (!(window as any).TossPayments) {
        const script = document.createElement('script')
        script.src = 'https://js.tosspayments.com/v1/payment'
        document.head.appendChild(script)
        await new Promise(r => script.onload = r)
      }

      const tp = (window as any).TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)
      await tp.requestPayment('카드', {
        amount: finalAmount,
        orderId: bookingId,
        orderName: className,
        customerName: userName,
        customerEmail: userEmail,
        customerMobilePhone: userPhone.replace(/-/g, ''),
        successUrl: `${window.location.origin}/api/payments/toss-success?type=booking`,
        failUrl: `${window.location.origin}/my/bookings?error=payment_failed`,
      })
    } catch (err: any) {
      if (err.code !== 'USER_CANCEL') toast.error(err.message ?? '결제 실패')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 쿠폰 입력 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
        <h3 className="text-sm font-semibold text-brand-ink mb-3 flex items-center gap-2">
          <Tag size={14} className="text-brand-amber" />
          쿠폰 적용
        </h3>
        {coupon ? (
          <div className="flex items-center justify-between bg-brand-amber/10 border border-brand-amber/30 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium text-brand-ink flex items-center gap-1.5">
                <Check size={14} className="text-green-600" />
                {couponCode.toUpperCase()} 적용됨
              </p>
              <p className="text-xs text-brand-grey mt-0.5">
                {coupon.description ?? (coupon.type === 'percent' ? `${coupon.value}% 할인` : `${formatPrice(coupon.value)} 할인`)}
              </p>
            </div>
            <button onClick={removeCoupon} className="text-brand-grey hover:text-red-500 transition-colors">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && applyCoupon()}
              placeholder="쿠폰 코드 입력"
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-brand-mist focus:outline-none focus:ring-2 focus:ring-brand-amber uppercase"
            />
            <button
              onClick={applyCoupon}
              disabled={couponLoading || !couponCode.trim()}
              className="text-sm font-medium bg-brand-amber/10 text-brand-amber border border-brand-amber/30 px-4 py-2 rounded-xl hover:bg-brand-amber/20 disabled:opacity-40 transition-colors"
            >
              {couponLoading ? '확인 중...' : '적용'}
            </button>
          </div>
        )}
      </div>

      {/* 금액 요약 */}
      {coupon && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 space-y-2">
          <div className="flex justify-between text-sm text-brand-grey">
            <span>클래스 금액</span>
            <span>{formatPrice(amount)}</span>
          </div>
          <div className="flex justify-between text-sm text-green-600">
            <span>쿠폰 할인</span>
            <span>- {formatPrice(discount)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-brand-mist/30">
            <span className="text-brand-ink">최종 결제 금액</span>
            <span className="text-brand-deep">{formatPrice(finalAmount)}</span>
          </div>
        </div>
      )}

      <Button
        onClick={handlePay}
        loading={loading}
        className="w-full"
        size="lg"
        variant="accent"
      >
        {formatPrice(finalAmount)} 결제하기
      </Button>
    </div>
  )
}
