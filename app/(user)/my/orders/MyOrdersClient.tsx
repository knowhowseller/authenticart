'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils/format'
import { toast } from 'sonner'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:   { label: '결제 대기', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  paid:      { label: '결제 완료', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  preparing: { label: '준비 중',   color: 'bg-brand-bg text-brand-grey border-brand-mist' },
  shipped:   { label: '배송 중',   color: 'bg-purple-50 text-purple-600 border-purple-200' },
  delivered: { label: '배송 완료', color: 'bg-green-50 text-green-600 border-green-200' },
  cancelled: { label: '취소됨',    color: 'bg-brand-bg text-brand-grey border-brand-mist' },
  refunded:  { label: '환불됨',    color: 'bg-red-50 text-red-500 border-red-200' },
}

interface Order {
  id: string
  quantity: number
  total_amount: number
  status: string
  escrow_status: string | null
  confirmed_at: string | null
  receipt_url: string | null
  tracking_number: string | null
  created_at: string
  products: { name: string; thumbnail_url: string | null } | null
}

export default function MyOrdersClient({ orders: initialOrders }: { orders: Order[] }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  async function handleConfirm(orderId: string) {
    if (!window.confirm('구매를 확정하시겠습니까? 확정 후에는 반품/환불이 어려울 수 있습니다.')) return
    setConfirming(orderId)
    const res = await fetch(`/api/orders/${orderId}/confirm`, { method: 'POST' })
    setConfirming(null)
    if (res.ok) {
      toast.success('구매가 확정되었습니다')
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, escrow_status: 'confirmed' } : o))
    } else {
      const d = await res.json()
      toast.error(d.error ?? '처리 중 오류가 발생했습니다')
    }
  }

  async function handleCancel(orderId: string) {
    if (!window.confirm('주문을 취소하시겠습니까?')) return
    setCancelling(orderId)
    const res = await fetch('/api/orders/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId }),
    })
    setCancelling(null)
    if (res.ok) {
      toast.success('주문이 취소되었습니다')
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
    } else {
      const d = await res.json()
      toast.error(d.error ?? '취소 처리 중 오류가 발생했습니다')
    }
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
        <div className="text-4xl mb-3">🛍️</div>
        <p className="text-brand-grey mb-3">주문 내역이 없습니다</p>
        <Link href="/shop" className="inline-block text-sm text-brand-deep hover:underline">
          쇼핑하러 가기
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const s = statusConfig[order.status] ?? { label: order.status, color: 'bg-brand-bg text-brand-grey border-brand-mist' }
        return (
          <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
            <div className="flex items-start justify-between gap-3 mb-3">
              <Link href={`/my/orders/${order.id}`} className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity">
                <div className="w-12 h-12 rounded-xl bg-brand-bg overflow-hidden flex-shrink-0">
                  {order.products?.thumbnail_url ? (
                    <img src={order.products.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-ink truncate">
                    {order.products?.name ?? '상품'}
                  </p>
                  <p className="text-xs text-brand-grey mt-0.5">
                    {order.quantity}개 · {new Date(order.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </Link>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${s.color}`}>
                {s.label}
              </span>
            </div>

            <div className="pt-3 border-t border-brand-mist/30 flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-brand-deep">{formatPrice(order.total_amount)}</span>
              <div className="flex gap-3 text-xs items-center">
                {order.tracking_number && (
                  <span className="text-brand-grey">운송장: {order.tracking_number}</span>
                )}
                {order.receipt_url && (
                  <a href={order.receipt_url} target="_blank" rel="noopener noreferrer"
                    className="text-brand-deep hover:underline"
                  >
                    영수증
                  </a>
                )}
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(order.id)}
                    disabled={cancelling === order.id}
                    className="text-red-500 hover:underline disabled:opacity-50"
                  >
                    {cancelling === order.id ? '처리 중...' : '주문 취소'}
                  </button>
                )}
                {['delivered', 'shipped'].includes(order.status) && order.escrow_status !== 'confirmed' && (
                  <button
                    onClick={() => handleConfirm(order.id)}
                    disabled={confirming === order.id}
                    className="text-green-600 font-medium hover:underline disabled:opacity-50"
                  >
                    {confirming === order.id ? '처리 중...' : '구매 확정'}
                  </button>
                )}
                {order.escrow_status === 'confirmed' && (
                  <span className="text-brand-grey">확정 완료</span>
                )}
                <Link href={`/my/orders/${order.id}`} className="text-brand-grey hover:text-brand-ink">
                  상세보기
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
