import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/shop/ProductCard'
import ShopFilterBar from '@/components/shop/ShopFilterBar'
import Hexagon from '@/components/brand/Hexagon'

interface SearchParams {
  category?: string
  sort?: string
  q?: string
}

async function getProductsWithPrices(role: string, params: SearchParams) {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('id, name, category, retail_price, wholesale_price, is_instructor_only, stock_qty, images, description')
    .eq('is_active', true)

  if (params.q) query = query.ilike('name', `%${params.q}%`)
  if (params.category) query = query.eq('category', params.category)

  if (params.sort === 'price_asc') query = query.order('retail_price', { ascending: true })
  else if (params.sort === 'price_desc') query = query.order('retail_price', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data } = await query

  return (data ?? []).map((p: any) => ({
    ...p,
    stock: p.stock_qty,
    price: ['instructor', 'admin'].includes(role) && p.wholesale_price
      ? p.wholesale_price
      : p.retail_price,
    isWholesale: ['instructor', 'admin'].includes(role) && !!p.wholesale_price,
  }))
}

async function getUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'guest'
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role ?? 'user'
}

async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('category')
    .eq('is_active', true)
    .not('category', 'is', null)
  const cats = [...new Set((data ?? []).map((p: any) => p.category).filter(Boolean))]
  return cats as string[]
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const [role, categories] = await Promise.all([
    getUserRole(),
    getCategories(),
  ])
  const productsWithRole = await getProductsWithPrices(role, params)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-white border-b border-brand-mist/30">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-2">
            <Hexagon color="amber" size={14} />
            <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Shop</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">재료 쇼핑</h1>
              <p className="text-brand-grey text-sm mt-1">레진 공예에 필요한 모든 재료</p>
            </div>
            {['instructor', 'admin'].includes(role) && (
              <div className="bg-brand-amber/10 border border-brand-amber/30 rounded-xl px-4 py-2.5">
                <p className="text-sm font-semibold text-brand-ink">강사 도매가 적용 중</p>
                <p className="text-xs text-brand-grey mt-0.5">전 상품 도매가로 구매하세요</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 필터바 */}
      <Suspense fallback={null}>
        <ShopFilterBar categories={categories} />
      </Suspense>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-sm text-brand-grey mb-5">
          총 <span className="font-semibold text-brand-ink">{productsWithRole.length}</span>개의 상품
        </p>

        {productsWithRole.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(productsWithRole as any[]).map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                category={product.category}
                price={product.price}
                isWholesale={product.isWholesale}
                stock={product.stock}
                images={product.images ?? []}
                status=""
                isInstructorOnly={product.is_instructor_only}
                userRole={role}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-brand-grey">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-lg font-medium">조건에 맞는 상품이 없습니다</p>
            <a href="/shop" className="inline-block mt-4 text-sm text-brand-deep hover:underline">
              전체 상품 보기
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
