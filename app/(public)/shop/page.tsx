import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/shop/ProductCard'
import Hexagon from '@/components/brand/Hexagon'

interface SearchParams {
  category?: string
  sort?: string
}

async function getProductsWithPrices(role: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, category, retail_price, wholesale_price, is_instructor_only, stock_qty, images')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (data ?? []).map((p: any) => ({
    ...p,
    stock: p.stock_qty,
    price: ['instructor', 'admin'].includes(role) && p.wholesale_price
      ? p.wholesale_price
      : p.retail_price,
    isWholesale: ['instructor', 'admin'].includes(role) && !!p.wholesale_price,
    wholesale_price: undefined,
  }))
}

async function getUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'guest'
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role ?? 'user'
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const role = await getUserRole()
  const products = await getProductsWithPrices(role)

  const categories = [...new Set(products.map((p: any) => p.category).filter(Boolean))]
  const filtered = params.category
    ? products.filter((p: any) => p.category === params.category)
    : products

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

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 카테고리 필터 */}
        <div className="flex gap-2 flex-wrap mb-6">
          <a
            href="/shop"
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
              !params.category ? 'bg-brand-deep text-white border-brand-deep' : 'border-brand-mist text-brand-ink hover:border-brand-deep'
            }`}
          >
            전체
          </a>
          {categories.map((cat) => (
            <a
              key={cat as string}
              href={`/shop?category=${cat}`}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                params.category === cat ? 'bg-brand-deep text-white border-brand-deep' : 'border-brand-mist text-brand-ink hover:border-brand-deep'
              }`}
            >
              {cat as string}
            </a>
          ))}
        </div>

        {/* 상품 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {(filtered as any[]).map((product) => (
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
      </div>
    </div>
  )
}
