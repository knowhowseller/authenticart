'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils/format'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const shippingSchema = z.object({
  recipient: z.string().min(2, '수령인 이름을 입력해주세요'),
  phone: z.string().min(10, '연락처를 입력해주세요'),
  postcode: z.string().min(5, '우편번호를 입력해주세요'),
  address: z.string().min(5, '주소를 입력해주세요'),
  memo: z.string().optional(),
})
type ShippingForm = z.infer<typeof shippingSchema>

interface ShopOrderSectionProps {
  productId: string
  productName: string
  price: number
}

export default function ShopOrderSection({ productId, productName, price }: ShopOrderSectionProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ShippingForm>({
    resolver: zodResolver(shippingSchema),
  })

  async function onSubmit(shipping: ShippingForm) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('로그인이 필요합니다'); router.push('/login'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, shipping_info: shipping }),
      })
      const orderData = await res.json()
      if (!res.ok) throw new Error(orderData.error ?? '주문 생성 실패')

      await loadTossPayments()
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
      if (!clientKey) throw new Error('결제 설정 오류. 관리자에게 문의해주세요.')
      const tossPayments = (window as any).TossPayments(clientKey)
      await tossPayments.requestPayment('카드', {
        amount: price,
        orderId: orderData.order_id,
        orderName: productName,
        customerName: user.email,
        successUrl: `${window.location.origin}/api/payments/toss-success?type=order`,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
        <h2 className="text-sm font-semibold text-brand-ink mb-4">배송 정보</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="수령인" placeholder="홍길동" required {...register('recipient')} error={errors.recipient?.message} />
            <Input label="연락처" type="tel" placeholder="010-0000-0000" required {...register('phone')} error={errors.phone?.message} />
          </div>
          <Input label="우편번호" placeholder="12345" required {...register('postcode')} error={errors.postcode?.message} />
          <Input label="주소" placeholder="상세 주소 입력" required {...register('address')} error={errors.address?.message} />
          <div>
            <label className="text-sm font-medium text-brand-ink block mb-1.5">배송 메모 (선택)</label>
            <input
              {...register('memo')}
              placeholder="배송 시 요청사항"
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30">
        <div className="flex justify-between text-sm">
          <span className="text-brand-grey">상품 금액</span>
          <span className="font-semibold">{formatPrice(price)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-brand-grey">배송비</span>
          <span className="text-brand-grey">무료</span>
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg" variant="accent">
        {formatPrice(price)} 결제하기
      </Button>
    </form>
  )
}
