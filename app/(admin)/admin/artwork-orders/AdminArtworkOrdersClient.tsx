'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils/format'

const statusConfig: Record<string, { label: string; color: string; next: string | null; nextLabel: string | null }> = {
  pending:   { label: '결제 대기', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', next: null, nextLabel: null },
  paid:      { label: '결제 완료', color: 'bg-blue-50 text-blue-600 border-blue-200',       next: 'shipped',   nextLabel: '발송 처리' },
  shipped:   { label: '배송 중',   color: 'bg-purple-50 text-purple-600 border-purple-200', next: 'delivered', nextLabel: '배송 완료' },
  delivered: { label: '배송 완료', color: 'bg-green-50 text-green-600 border-green-200',    next: null, nextLabel: null },
  cancelled: { label: '취소됨',    color: 'bg-brand-bg text-brand-grey border-brand-mist',  next: null, nextLabel: null },
}

interface ArtworkOrder {
  id: string
  status: string
  total_price: number
  escrow_status: string | null
  tracking_carrier: string | null
  tracking_number: string | null
  auto_confirm_at: string | null
  created_at: string
  artworks: { title: string; thumbnail_url: string | null } | null
  buyer: { name: string; email: string } | null
  seller: { name: string } | null
}

export default function AdminArtworkOrdersClient({ orders: initialOrders }: { orders: ArtworkOrder[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [loading, setLoading] = useState<string | null>(null)
  const [trackingInputs, setTrackingInputs] = useState<Record<string, { carrier: string; number: string }>>({})

  function getTracking(id: string) {
    return trackingInputs[id] ?? { carrier: '', number: '' }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    setLoading(orderId)
    const t = getTracking(orderId)
    const res = await fetch(`/api/admin/artwork-orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        tracking_carrier: t.carrier || undefined,
        tracking_number: t.number || undefined,
      }),
    })
    const json = await res.json()
    setLoading(null)

    if (!res.ok) { toast.error(json.error ?? '처리 실패'); return }
    toast.success(`상태가 '${statusConfig[newStatus]?.label}'으로 변경되었습니다`)
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: newStatus, tracking_carrier: t.carrier || o.tracking_carrier, tracking_number: t.number || o.tracking_number }
        : o
    ))
  }

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
          <div className="text-4xl mb-3">🎨</div>
          <p className="text-brand-grey text-sm">작품 주문이 없습니다</p>
        </div>
      ) : orders.map(order => {
        const s = statusConfig[order.status] ?? { label: order.status, color: 'bg-brand-bg text-brand-grey border-brand-mist', next: null, nextLabel: null }
        const t = getTracking(order.id)

        return (
          <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-brand-bg overflow-hidden flex-shrink-0">
                {order.artworks?.thumbnail_url ? (
                  <img src={order.artworks.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">🎨</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <p className="font-semibold text-brand-ink">{order.artworks?.title ?? '작품'}</p>
                    <p className="text-xs text-brand-grey mt-0.5">
                      구매자: {order.buyer?.name} ({order.buyer?.email})
                    </p>
                    <p className="text-xs text-brand-grey">
                      작가: {order.seller?.name} · {new Date(order.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.color}`}>
                      {s.label}
                    </span>
                    {order.escrow_status === 'confirmed' && (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-green-50 text-green-600 border-green-200">
                        구매확정
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm font-bold text-brand-deep">{formatPrice(order.total_price)}</p>
                {order.tracking_number && (
                  <p className="text-xs text-brand-grey mt-1">
                    운송장: {order.tracking_carrier ? `[${order.tracking_carrier}] ` : ''}{order.tracking_number}
                  </p>
                )}
                {order.auto_confirm_at && order.escrow_status !== 'confirmed' && (
                  <p className="text-xs text-orange-500 mt-1">
                    자동 구매확정: {new Date(order.auto_confirm_at).toLocaleDateString('ko-KR')}
                  </p>
                )}
              </div>
            </div>

            {/* 발송 처리 폼 */}
            {s.next === 'shipped' && (
              <div className="mt-4 pt-4 border-t border-brand-mist/20">
                <div className="flex gap-2">
                  <input
                    placeholder="택배사 (예: kr.cjlogistics)"
                    value={t.carrier}
                    onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: { ...getTracking(order.id), carrier: e.target.value } }))}
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-brand-mist focus:outline-none focus:ring-2 focus:ring-brand-amber"
                  />
                  <input
                    placeholder="운송장 번호"
                    value={t.number}
                    onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: { ...getTracking(order.id), number: e.target.value } }))}
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-brand-mist focus:outline-none focus:ring-2 focus:ring-brand-amber"
                  />
                  <button
                    onClick={() => handleStatusChange(order.id, s.next!)}
                    disabled={loading === order.id}
                    className="px-4 py-2 text-sm font-medium bg-brand-deep text-white rounded-xl hover:bg-brand-deep/90 disabled:opacity-50 whitespace-nowrap transition-colors"
                  >
                    {loading === order.id ? '처리중...' : s.nextLabel}
                  </button>
                </div>
              </div>
            )}

            {/* 배송완료 처리 버튼 */}
            {s.next === 'delivered' && (
              <div className="mt-4 pt-4 border-t border-brand-mist/20 flex justify-end">
                <button
                  onClick={() => handleStatusChange(order.id, 'delivered')}
                  disabled={loading === order.id}
                  className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading === order.id ? '처리중...' : '배송 완료 처리'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
