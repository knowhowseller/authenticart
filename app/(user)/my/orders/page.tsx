import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils/format'
import Link from 'next/link'

const statusLabel: Record<string, string> = {
  pending: '결제 대기',
  paid: '결제 완료',
  preparing: '준비 중',
  shipped: '배송 중',
  delivered: '배송 완료',
  cancelled: '취소됨',
  refunded: '환불됨',
}

export default async function MyOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, quantity, total_amount, status, receipt_url,
      tracking_number, shipping_name, shipping_address, created_at,
      products!product_id(name, thumbnail_url)
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-brand-ink mb-1">주문 내역</h1>
        <p className="text-brand-grey text-sm mb-6">재료 구매 내역을 확인하세요</p>

        {!orders || orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
            <div className="text-4xl mb-3">🛍️</div>
            <p className="text-brand-grey mb-3">주문 내역이 없습니다</p>
            <Link href="/shop" className="inline-block text-sm text-brand-deep hover:underline">
              쇼핑하러 가기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
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
                  </div>
                  <span className="text-xs font-medium bg-brand-bg text-brand-grey px-2 py-0.5 rounded-full flex-shrink-0">
                    {statusLabel[order.status] ?? order.status}
                  </span>
                </div>

                <div className="pt-3 border-t border-brand-mist/30 flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-brand-deep">{formatPrice(order.total_amount)}</span>
                  <div className="flex gap-3 text-xs">
                    {order.tracking_number && (
                      <span className="text-brand-grey">운송장: {order.tracking_number}</span>
                    )}
                    {order.receipt_url && (
                      <a href={order.receipt_url} target="_blank" rel="noopener noreferrer"
                        className="text-brand-deep hover:underline">
                        영수증
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
