import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'
import CategoryManager from './CategoryManager'

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') redirect('/')

  const { cat } = await searchParams

  const [{ data: products }, { data: catRows }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, category, retail_price, wholesale_price, stock_qty, is_active, thumbnail_url')
      .order('created_at', { ascending: false }),
    supabase.from('product_categories').select('name').order('id'),
  ])

  const categories: string[] = (catRows ?? []).map((r: any) => r.name)
  const filtered = cat ? (products ?? []).filter((p: any) => p.category === cat) : (products ?? [])

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
        <h1 className="text-2xl font-bold text-brand-ink mb-6">상품 관리</h1>

        {/* 카테고리 관리 */}
        <div className="mb-6">
          <CategoryManager initial={categories} />
        </div>

        {/* 카테고리 탭 필터 */}
        <div className="flex gap-2 flex-wrap mb-4">
          <Link
            href="/admin/products"
            className={`text-xs px-4 py-1.5 rounded-full border transition-colors ${
              !cat ? 'bg-brand-deep text-white border-brand-deep' : 'border-brand-mist text-brand-grey hover:border-brand-deep'
            }`}
          >
            전체 ({(products ?? []).length})
          </Link>
          {categories.map(c => {
            const count = (products ?? []).filter((p: any) => p.category === c).length
            return (
              <Link
                key={c}
                href={`/admin/products?cat=${encodeURIComponent(c)}`}
                className={`text-xs px-4 py-1.5 rounded-full border transition-colors ${
                  cat === c ? 'bg-brand-deep text-white border-brand-deep' : 'border-brand-mist text-brand-grey hover:border-brand-deep'
                }`}
              >
                {c} ({count})
              </Link>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
            <div className="text-4xl mb-3">🛍️</div>
            <p className="text-brand-grey mb-3">
              {cat ? `"${cat}" 카테고리에 상품이 없습니다` : '등록된 상품이 없습니다'}
            </p>
            <Link href="/admin/products/new" className="text-sm text-brand-deep hover:underline">
              상품 등록하기
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p: any) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30 flex items-center gap-4">
                {/* 썸네일 */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-brand-bg flex-shrink-0">
                  {p.thumbnail_url ? (
                    <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🛍️</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-brand-ink text-sm">{p.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-bg text-brand-grey border border-brand-mist/40">
                      {p.category}
                    </span>
                    {!p.is_active && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-500">비활성</span>
                    )}
                  </div>
                  <p className="text-xs text-brand-grey mt-0.5">
                    소비자가 {formatPrice(p.retail_price)} · 강사가 {formatPrice(p.wholesale_price)} · 재고 {p.stock_qty}개
                  </p>
                </div>

                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="text-xs font-medium text-brand-deep hover:underline flex-shrink-0 px-3 py-1.5 rounded-lg border border-brand-deep/20 hover:bg-brand-deep/5 transition-colors"
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
