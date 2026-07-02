'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  getCart, removeFromCart, updateQuantity, cartTotal,
  type CartItem,
} from '@/lib/cart'
import { formatPrice } from '@/lib/utils/format'
import Input from '@/components/ui/Input'
import Hexagon from '@/components/brand/Hexagon'

const shippingSchema = z.object({
  recipient: z.string().min(2, '수령인 이름을 입력해주세요'),
  phone: z.string().min(10, '연락처를 입력해주세요'),
  postcode: z.string().min(5, '우편번호를 입력해주세요'),
  address: z.string().min(5, '주소를 입력해주세요'),
  memo: z.string().optional(),
})
type ShippingForm = z.infer<typeof shippingSchema>

function loadTossPayments(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).TossPayments) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v1/payment'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('결제 모듈 로드 실패'))
    document.head.appendChild(script)
  })
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<ShippingForm>({
    resolver: zodResolver(shippingSchema),
  })

  useEffect(() => {
    setItems(getCart())
  }, [])

  function handleRemove(productId: string) {
    setItems(removeFromCart(productId))
  }

  function handleQty(productId: string, qty: number) {
    setItems(updateQuantity(productId, qty))
  }

  async function onCheckout(shipping: ShippingForm) {
    if (items.length === 0) { toast.error('장바구니가 비어있습니다'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/orders/create-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shipping_info: shipping }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '주문 생성 실패')

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
      if (!clientKey) throw new Error('결제 설정 오류')
      await loadTossPayments()
      const tossPayments = (window as any).TossPayments(clientKey)
      const origin = window.location.origin
      const orderIdsParam = encodeURIComponent(data.order_ids.join(','))
      await tossPayments.requestPayment('카드', {
        amount: data.total_amount,
        orderId: data.cart_order_id,
        orderName: data.order_name,
        customerName: shipping.recipient,
        successUrl: `${origin}/api/payments/toss-success?type=cart&orderIds=${orderIdsParam}`,
        failUrl: `${origin}/payment/fail?type=cart`,
      })
      // 결제 성공 시 successUrl로 리다이렉트되므로 이 지점 이후 코드는 실행되지 않는다.
      // 장바구니 비우기는 결제 성공 도착점(/my/orders?success=1)에서 수행한다.
    } catch (err: any) {
      toast.error(err.message ?? '결제 오류')
    } finally {
      setLoading(false)
    }
  }

  const total = cartTotal(items)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">장바구니</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-6">장바구니</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
            <ShoppingCart size={40} className="text-brand-mist mx-auto mb-4" />
            <p className="text-brand-grey mb-4">장바구니가 비어있습니다</p>
            <Link href="/shop"
              className="inline-block bg-brand-deep text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-brand-deep/90"
            >
              쇼핑하러 가기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 상품 목록 */}
            <div className="lg:col-span-2 space-y-3">
              {items.map(item => (
                <div key={item.product_id} className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-brand-mist/20 flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-ink truncate">{item.name}</p>
                    <p className="text-sm font-bold text-brand-deep mt-0.5">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleQty(item.product_id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full border border-brand-mist flex items-center justify-center hover:border-brand-deep"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleQty(item.product_id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full border border-brand-mist flex items-center justify-center hover:border-brand-deep"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => handleRemove(item.product_id)}
                      className="ml-1 text-brand-grey hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 결제 섹션 */}
            <div className="lg:col-span-1">
              <form onSubmit={handleSubmit(onCheckout)} className="space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
                  <h2 className="text-sm font-semibold text-brand-ink mb-4">배송 정보</h2>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="수령인" placeholder="홍길동" required {...register('recipient')} error={errors.recipient?.message} />
                      <Input label="연락처" type="tel" placeholder="010-0000-0000" required {...register('phone')} error={errors.phone?.message} />
                    </div>
                    <Input label="우편번호" placeholder="12345" required {...register('postcode')} error={errors.postcode?.message} />
                    <Input label="주소" placeholder="주소 입력" required {...register('address')} error={errors.address?.message} />
                    <div>
                      <label className="text-sm font-medium text-brand-ink block mb-1.5">배송 메모</label>
                      <input {...register('memo')} placeholder="요청사항 (선택)"
                        className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30">
                  {items.map(item => (
                    <div key={item.product_id} className="flex justify-between text-xs text-brand-grey py-1">
                      <span className="truncate flex-1 mr-2">{item.name} × {item.quantity}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t border-brand-mist/30 mt-2 pt-2 flex justify-between text-sm font-bold">
                    <span>합계</span>
                    <span className="text-brand-deep">{formatPrice(total)}</span>
                  </div>
                  <p className="text-xs text-brand-grey mt-1">배송비 무료</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-amber text-white font-semibold py-3 rounded-full hover:bg-brand-amber/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? '처리 중...' : `${formatPrice(total)} 결제하기`}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
