'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils/format'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:   { label: '결제 대기', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  paid:      { label: '결제 완료', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  shipped:   { label: '배송 중',   color: 'bg-purple-50 text-purple-600 border-purple-200' },
  delivered: { label: '배송 완료', color: 'bg-green-50 text-green-600 border-green-200' },
  cancelled: { label: '취소됨',    color: 'bg-brand-bg text-brand-grey border-brand-mist' },
  refunded:  { label: '환불됨',    color: 'bg-red-50 text-red-500 border-red-200' },
}

interface ArtworkOrder {
  id: string
  status: string
  total_price: number
  receipt_url: string | null
  tracking_carrier: string | null
  tracking_number: string | null
  escrow_status: string | null
  confirmed_at: string | null
  created_at: string
  artworks: {
    id: string
    title: string
    thumbnail_url: string | null
    users: { name: string } | null
  } | null
}

export default function ArtworkOrdersClient({ orders: initialOrders }: { orders: ArtworkOrder[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [confirming, setConfirming] = useState<string | null>(null)

  async function handleConfirm(orderId: string) {
    if (!window.confirm('구매를 확정하시겠습니까? 확정 후에는 반품/환불이 어려울 수 있습니다.')) return
    setConfirming(orderId)
    const res = await fetch(`/api/artwork-orders/${orderId}/confirm`, { method: 'POST' })
    setConfirming(null)
    if (res.ok) {
      toast.success('구매가 확정되었습니다')
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, escrow_status: 'confirmed' } : o))
    } else {
      const d = await res.json()
      toast.error(d.error ?? '처리 중 오류가 발생했습니다')
    }
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
        <div className="text-4xl mb-3">🎨</div>
        <p className="text-brand-grey mb-3">구매한 작품이 없습니다</p>
        <Link href="/artworks" className="inline-block text-sm text-brand-deep hover:underline">
          작품 마켓 둘러보기
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const s = statusConfig[order.status] ?? { label: order.status, color: 'bg-brand-bg text-brand-grey border-brand-mist' }
        const artwork = order.artworks

        return (
          <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
            <div className="flex items-start gap-4 mb-3">
              <div className="w-16 h-16 rounded-xl bg-brand-bg overflow-hidden flex-shrink-0">
                {artwork?.thumbnail_url ? (
                  <img src={artwork.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🎨</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={artwork ? `/artworks/${artwork.id}` : '#'}
                      className="font-semibold text-brand-ink hover:text-brand-deep transition-colors"
                    >
                      {artwork?.title ?? '작품'}
                    </Link>
                    <p className="text-xs text-brand-grey mt-0.5">
                      작가 {artwork?.users?.name ?? '알 수 없음'} · {new Date(order.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${s.color}`}>
                    {s.label}
                  </span>
                </div>
                {order.tracking_number && (
                  <p className="text-xs text-brand-grey mt-1">
                    운송장: {order.tracking_carrier ? `[${order.tracking_carrier}] ` : ''}{order.tracking_number}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-brand-mist/30 flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-brand-deep">{formatPrice(order.total_price)}</span>
              <div className="flex gap-3 text-xs items-center">
                {order.receipt_url && (
                  <a href={order.receipt_url} target="_blank" rel="noopener noreferrer"
                    className="text-brand-deep hover:underline"
                  >
                    영수증
                  </a>
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
                <Link href={`/my/disputes/new?artwork_order_id=${order.id}`} className="text-red-500 hover:underline">
                  분쟁 신청
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
