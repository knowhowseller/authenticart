import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Hexagon from '@/components/brand/Hexagon'
import CategoryManager from './CategoryManager'
import AdminProductList from './AdminProductList'

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
          <AdminProductList initialProducts={filtered} />
        )}
      </div>
    </div>
  )
}
