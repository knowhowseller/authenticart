import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'

const statusLabel: Record<string, { label: string; color: string }> = {
  pending:   { label: '결제 전', color: 'bg-yellow-50 text-yellow-600' },
  paid:      { label: '결제 완료', color: 'bg-blue-50 text-blue-600' },
  preparing: { label: '준비 중', color: 'bg-brand-bg text-brand-grey' },
  shipped:   { label: '배송 중', color: 'bg-purple-50 text-purple-600' },
  delivered: { label: '배송 완료', color: 'bg-green-50 text-green-600' },
  cancelled: { label: '취소됨', color: 'bg-brand-bg text-brand-grey' },
  refunded:  { label: '환불됨', color: 'bg-red-50 text-red-500' },
}

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') redirect('/')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, total_amount, shipping_name, shipping_phone,
      shipping_address, tracking_number, created_at,
      users!buyer_id(name, email),
      products!product_id(name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-8">주문 관리</h1>

        {!orders || orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
            <p className="text-brand-grey">주문이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((o: any) => {
              const s = statusLabel[o.status] ?? { label: o.status, color: '' }
              return (
                <div key={o.id} className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-brand-ink text-sm truncate">
                        {o.products?.name ?? '-'}
                      </p>
                      <p className="text-xs text-brand-grey mt-0.5">
                        구매자: {o.users?.name} · {formatPrice(o.total_amount)}
                      </p>
                      <p className="text-xs text-brand-grey mt-0.5">
                        {o.shipping_name} · {o.shipping_phone}
                      </p>
                      {o.tracking_number && (
                        <p className="text-xs text-brand-deep mt-0.5">운송장: {o.tracking_number}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
                        {s.label}
                      </span>
                      <span className="text-xs text-brand-grey hidden sm:block">
                        {new Date(o.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
