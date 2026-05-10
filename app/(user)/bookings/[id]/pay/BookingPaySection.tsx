'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'

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

  async function handlePay() {
    setLoading(true)
    try {
      if (!(window as any).TossPayments) {
        const script = document.createElement('script')
        script.src = 'https://js.tosspayments.com/v1/payment'
        document.head.appendChild(script)
        await new Promise(r => script.onload = r)
      }

      const tp = (window as any).TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)
      await tp.requestPayment('카드', {
        amount,
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
    <Button
      onClick={handlePay}
      loading={loading}
      className="w-full"
      size="lg"
      variant="accent"
    >
      토스페이먼츠로 결제하기
    </Button>
  )
}
