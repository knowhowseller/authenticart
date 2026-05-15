import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/shop/ProductCard'
import ShopFilterBar, { CategoryNode } from '@/components/shop/ShopFilterBar'
import Hexagon from '@/components/brand/Hexagon'
import Link from 'next/link'
import { Store } from 'lucide-react'

interface SearchParams {
  parent?: string
  sub?: string
  sort?: string
  q?: string
}

async function getCategories(): Promise<CategoryNode[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('product_categories')
    .select('id, name, parent_id, sort_order')
    .order('sort_order')

  if (!data) return []

  const parents = (data as any[]).filter(d => !d.parent_id)
  return parents.map(p => ({
    name: p.name as string,
    children: (data as any[])
      .filter(d => d.parent_id === p.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(c => c.name as string),
  }))
}

async function getUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'guest'
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role ?? 'user'
}

async function getProductsWithPrices(
  role: string,
  params: SearchParams,
  categoryFilter: string[] | null,
) {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('id, name, category, retail_price, wholesale_price, is_instructor_only, stock_qty, images, description')
    .eq('is_active', true)

  if (params.q) query = query.ilike('name', `%${params.q}%`)

  if (categoryFilter) {
    if (categoryFilter.length === 1) {
      query = query.eq('category', categoryFilter[0])
    } else {
      query = (query as any).in('category', categoryFilter)
    }
  }

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

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const [role, categories] = await Promise.all([getUserRole(), getCategories()])

  // 카테고리 필터 계산
  let categoryFilter: string[] | null = null
  if (params.sub) {
    categoryFilter = [params.sub]
  } else if (params.parent) {
    const parentNode = categories.find(c => c.name === params.parent)
    if (parentNode) {
      categoryFilter = [params.parent, ...parentNode.children]
    } else {
      categoryFilter = [params.parent]
    }
  }

  const products = await getProductsWithPrices(role, params, categoryFilter)

  const filterLabel = params.sub
    ? `${params.parent} > ${params.sub}`
    : params.parent ?? null

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

      {/* 입점 스토어 배너 */}
      <div className="bg-brand-sage/5 border-b border-brand-sage/20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-brand-sage">
            <Store size={15} />
            <span>입점 스토어에서 더 다양한 브랜드 재료를 만나보세요</span>
          </div>
          <Link
            href="/shop/stores"
            className="text-xs font-medium text-brand-sage hover:text-brand-deep transition-colors flex items-center gap-0.5"
          >
            스토어 보기 →
          </Link>
        </div>
      </div>

      {/* 필터바 */}
      <Suspense fallback={null}>
        <ShopFilterBar categories={categories} />
      </Suspense>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-sm text-brand-grey mb-5">
          총 <span className="font-semibold text-brand-ink">{products.length}</span>개의 상품
          {filterLabel && (
            <span className="ml-2 text-brand-deep font-medium">{filterLabel}</span>
          )}
        </p>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(products as any[]).map(product => (
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
