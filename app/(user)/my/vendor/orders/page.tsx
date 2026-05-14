import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'

const statusLabel: Record<string, { label: string; color: string }> = {
  pending:   { label: '결제 전',   color: 'bg-yellow-50 text-yellow-600' },
  paid:      { label: '결제 완료', color: 'bg-blue-50 text-blue-600' },
  preparing: { label: '준비 중',   color: 'bg-brand-bg text-brand-grey' },
  shipped:   { label: '배송 중',   color: 'bg-purple-50 text-purple-600' },
  delivered: { label: '배송 완료', color: 'bg-green-50 text-green-600' },
  cancelled: { label: '취소됨',    color: 'bg-brand-bg text-brand-grey' },
  refunded:  { label: '환불됨',    color: 'bg-red-50 text-red-500' },
}

export const metadata = { title: '주문 관리 | 내 상점' }

export default async function VendorOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, status')
    .eq('user_id', user.id)
    .single()

  if (!vendor || vendor.status !== 'approved') redirect('/my/vendor')

  // 내 벤더 상품 ID 목록
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .eq('vendor_id', vendor.id)

  const productIds = (products ?? []).map((p: any) => p.id)

  const orders = productIds.length > 0
    ? await supabase
        .from('orders')
        .select(`
          id, status, total_amount, quantity,
          shipping_name, shipping_phone, shipping_address,
          tracking_number, created_at,
          products!product_id(id, name, thumbnail_url),
          users!buyer_id(name, email)
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false })
        .limit(200)
        .then(r => r.data ?? [])
    : []

  const pending = orders.filter((o: any) => o.status === 'paid' || o.status === 'preparing')

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="sage" size={16} />
          <Link href="/my/vendor" className="text-xs text-brand-grey hover:text-brand-ink">← 내 상점</Link>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-ink">주문 관리</h1>
            {pending.length > 0 && (
              <p className="text-sm text-orange-600 mt-0.5 font-medium">
                처리 필요: {pending.length}건 (결제 완료 · 준비 중)
              </p>
            )}
          </div>
          <p className="text-sm text-brand-grey">전체 {orders.length}건</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-brand-grey text-sm">아직 주문이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o: any) => {
              const s = statusLabel[o.status] ?? { label: o.status, color: '' }
              return (
                <div key={o.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-brand-bg overflow-hidden flex-shrink-0">
                        {o.products?.thumbnail_url
                          ? <img src={o.products.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-brand-ink text-sm truncate">{o.products?.name}</p>
                        <p className="text-xs text-brand-grey mt-0.5">{o.quantity}개 · {formatPrice(o.total_amount)}</p>
                        <p className="text-xs text-brand-grey">{new Date(o.created_at).toLocaleDateString('ko-KR')}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${s.color}`}>{s.label}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-brand-bg rounded-xl p-3 text-xs">
                    <div>
                      <p className="text-brand-grey mb-0.5">구매자</p>
                      <p className="font-medium text-brand-ink">{o.users?.name ?? '-'}</p>
                      <p className="text-brand-grey">{o.users?.email ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-brand-grey mb-0.5">배송지</p>
                      <p className="font-medium text-brand-ink">{o.shipping_name ?? '-'} · {o.shipping_phone ?? '-'}</p>
                      <p className="text-brand-grey truncate">{o.shipping_address ?? '-'}</p>
                    </div>
                  </div>

                  {o.tracking_number && (
                    <p className="text-xs text-brand-deep font-medium mt-2">운송장: {o.tracking_number}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
