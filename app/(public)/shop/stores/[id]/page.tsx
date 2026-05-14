import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProductCard from '@/components/shop/ProductCard'
import Hexagon from '@/components/brand/Hexagon'
import { Store, Package, Globe, ChevronLeft } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

async function getUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'guest'
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role ?? 'user'
}

async function getVendor(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('vendors')
    .select('id, business_name, description, logo_url, banner_url, website_url, created_at')
    .eq('id', id)
    .eq('status', 'approved')
    .single()
  return data
}

async function getVendorProducts(vendorId: string, role: string, category?: string) {
  const supabase = await createClient()
  let q = supabase
    .from('products')
    .select('id, name, category, retail_price, wholesale_price, is_instructor_only, stock_qty, images')
    .eq('vendor_id', vendorId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (category) q = (q as any).eq('category', category)

  const { data } = await q
  return (data ?? []).map((p: any) => ({
    ...p,
    stock: p.stock_qty,
    price: ['instructor', 'admin'].includes(role) && p.wholesale_price ? p.wholesale_price : p.retail_price,
    isWholesale: ['instructor', 'admin'].includes(role) && !!p.wholesale_price,
  }))
}

async function getVendorCategories(vendorId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('category')
    .eq('vendor_id', vendorId)
    .eq('is_active', true)
    .not('category', 'is', null)
  const cats = [...new Set((data ?? []).map((d: any) => d.category as string).filter(Boolean))]
  return cats.sort()
}

export default async function VendorStorePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ category?: string }>
}) {
  const { id } = await params
  const { category } = await searchParams

  const [vendor, role] = await Promise.all([getVendor(id), getUserRole()])
  if (!vendor) notFound()

  const [products, categories] = await Promise.all([
    getVendorProducts(id, role, category),
    getVendorCategories(id),
  ])

  const joinedYear = new Date(vendor.created_at).getFullYear()

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* 배너 */}
      <div className="relative h-36 md:h-48 bg-gradient-to-r from-brand-deep/20 via-brand-sage/15 to-brand-mist/25 overflow-hidden">
        {vendor.banner_url && (
          <img src={vendor.banner_url} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-4 left-4">
          <Link href="/shop/stores" className="flex items-center gap-1.5 text-white/80 text-xs hover:text-white transition-colors">
            <ChevronLeft size={14} />
            스토어 목록
          </Link>
        </div>
      </div>

      {/* 스토어 헤더 */}
      <div className="bg-white border-b border-brand-mist/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end gap-4 -mt-8 pb-5">
            {/* 로고 */}
            <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-brand-mist/30 flex items-center justify-center overflow-hidden flex-shrink-0">
              {vendor.logo_url ? (
                <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-contain p-1.5" />
              ) : (
                <Store size={24} className="text-brand-deep/40" />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-8">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-brand-ink">{vendor.business_name}</h1>
                <span className="text-xs bg-brand-sage/10 text-brand-sage border border-brand-sage/20 px-2 py-0.5 rounded-full font-medium">
                  공식 입점
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-brand-grey">
                  <Package size={11} />
                  상품 {products.length}개
                </span>
                <span className="text-xs text-brand-grey">{joinedYear}년 입점</span>
                {vendor.website_url && (
                  <a href={vendor.website_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-brand-deep hover:underline">
                    <Globe size={11} />
                    공식 웹사이트
                  </a>
                )}
              </div>
            </div>
          </div>
          {vendor.description && (
            <p className="text-sm text-brand-grey pb-5 leading-relaxed">{vendor.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 강사 도매가 배지 */}
        {['instructor', 'admin'].includes(role) && products.some((p: any) => p.isWholesale) && (
          <div className="bg-brand-amber/10 border border-brand-amber/30 rounded-xl px-4 py-2.5 mb-5 inline-flex items-center gap-2">
            <span className="text-sm font-semibold text-brand-ink">강사 도매가 적용 중</span>
          </div>
        )}

        {/* 카테고리 필터 */}
        {categories.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {['전체', ...categories].map(c => (
              <Link
                key={c}
                href={c === '전체' ? `/shop/stores/${id}` : `/shop/stores/${id}?category=${encodeURIComponent(c)}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  (c === '전체' && !category) || c === category
                    ? 'bg-brand-deep text-white'
                    : 'bg-white text-brand-grey border border-brand-mist hover:border-brand-deep/30'
                }`}
              >
                {c}
              </Link>
            ))}
          </div>
        )}

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-brand-mist/30">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-brand-grey font-medium">
              {category ? `'${category}' 카테고리 상품이 없습니다` : '등록된 상품이 없습니다'}
            </p>
            {category && (
              <Link href={`/shop/stores/${id}`} className="mt-3 inline-block text-sm text-brand-deep hover:underline">
                전체 상품 보기
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-brand-grey mb-5">
              {category ? `'${category}' ` : ''}상품 <span className="font-semibold text-brand-ink">{products.length}개</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(products as any[]).map((product) => (
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
          </>
        )}
      </div>
    </div>
  )
}
