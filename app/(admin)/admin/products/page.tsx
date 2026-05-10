import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') redirect('/')

  const { data: products } = await supabase
    .from('products')
    .select('id, name, category, retail_price, wholesale_price, stock_qty, is_active')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Hexagon color="amber" size={16} />
            <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
          </div>
          <Link
            href="/admin/products/new"
            className="px-4 py-2 text-sm font-medium rounded-xl bg-brand-deep text-white hover:bg-brand-deep/90 transition-colors"
          >
            상품 등록
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-8">상품 관리</h1>

        {!products || products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
            <div className="text-4xl mb-3">🛍️</div>
            <p className="text-brand-grey mb-3">등록된 상품이 없습니다</p>
            <Link href="/admin/products/new" className="text-sm text-brand-deep hover:underline">
              첫 상품 등록하기
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((p: any) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-brand-ink text-sm">{p.name}</p>
                    {!p.is_active && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-brand-bg text-brand-grey">비활성</span>
                    )}
                  </div>
                  <p className="text-xs text-brand-grey mt-0.5">
                    {p.category} · 소비자가 {formatPrice(p.retail_price)} · 강사가 {formatPrice(p.wholesale_price)}
                    · 재고 {p.stock_qty}개
                  </p>
                </div>
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="text-xs text-brand-deep hover:underline flex-shrink-0"
                >
                  수정
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
