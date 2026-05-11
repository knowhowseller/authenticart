import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils/format'
import Link from 'next/link'

const statusLabel: Record<string, { label: string; color: string }> = {
  pending:   { label: '결제 대기',  color: 'bg-yellow-50 text-yellow-600' },
  paid:      { label: '결제 완료',  color: 'bg-blue-50 text-blue-600' },
  preparing: { label: '준비 중',    color: 'bg-brand-bg text-brand-grey' },
  shipped:   { label: '배송 중',    color: 'bg-purple-50 text-purple-600' },
  delivered: { label: '배송 완료',  color: 'bg-green-50 text-green-600' },
  cancelled: { label: '취소됨',     color: 'bg-brand-bg text-brand-grey' },
  refunded:  { label: '환불됨',     color: 'bg-red-50 text-red-500' },
}

const TRACKING_URL = (num: string) =>
  `https://www.smartdelivery.kr/mobile/tracking.do?t_invoice=${encodeURIComponent(num)}`

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, quantity, total_amount, status, receipt_url,
      tracking_number, shipping_name, shipping_phone, shipping_address,
      created_at, updated_at,
      products!product_id(name, thumbnail_url, description)
    `)
    .eq('id', id)
    .eq('buyer_id', user.id)
    .single()

  if (!order) notFound()

  const s = statusLabel[order.status] ?? { label: order.status, color: '' }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/my/orders" className="text-sm text-brand-grey hover:text-brand-ink">← 주문 목록</Link>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-6">주문 상세</h1>

        {/* 상태 카드 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${s.color}`}>{s.label}</span>
            <span className="text-xs text-brand-grey">{new Date(order.created_at).toLocaleDateString('ko-KR')} 주문</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-brand-bg overflow-hidden flex-shrink-0">
              {(order as any).products?.thumbnail_url ? (
                <img src={(order as any).products.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
              )}
            </div>
            <div>
              <p className="font-semibold text-brand-ink">{(order as any).products?.name ?? '상품'}</p>
              <p className="text-sm text-brand-grey mt-0.5">{order.quantity}개</p>
              <p className="text-base font-bold text-brand-deep mt-1">{formatPrice(order.total_amount)}</p>
            </div>
          </div>
        </div>

        {/* 배송 정보 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 mb-4">
          <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider mb-4">배송 정보</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-grey">수령인</span>
              <span className="text-brand-ink font-medium">{order.shipping_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-grey">연락처</span>
              <span className="text-brand-ink">{order.shipping_phone}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-brand-grey flex-shrink-0">배송지</span>
              <span className="text-brand-ink text-right">{order.shipping_address}</span>
            </div>
          </div>
        </div>

        {/* 운송장 */}
        {order.tracking_number && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 mb-4">
            <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider mb-3">배송 추적</h2>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-brand-grey mb-1">운송장 번호</p>
                <p className="text-base font-bold text-brand-ink tracking-wider">{order.tracking_number}</p>
              </div>
              <a
                href={TRACKING_URL(order.tracking_number)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-brand-deep text-white text-sm font-medium rounded-xl hover:bg-brand-deep/90 transition-colors flex-shrink-0"
              >
                배송 조회
              </a>
            </div>
          </div>
        )}

        {/* 결제 정보 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
          <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider mb-4">결제 정보</h2>
          <div className="flex justify-between text-sm">
            <span className="text-brand-grey">결제 금액</span>
            <span className="font-bold text-brand-deep">{formatPrice(order.total_amount)}</span>
          </div>
          {(order as any).receipt_url && (
            <div className="mt-3 pt-3 border-t border-brand-mist/30">
              <a
                href={(order as any).receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-deep hover:underline"
              >
                영수증 보기
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
