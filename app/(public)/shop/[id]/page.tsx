import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ShopOrderSection from '@/components/shop/ShopOrderSection'
import ProductImageGallery from '@/components/shop/ProductImageGallery'
import CartButton from '@/components/shop/CartButton'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('name, description, retail_price, images, is_active')
    .eq('id', id)
    .single()
  if (!product || !product.is_active) return { title: '상품' }
  const firstImage = (product.images as string[] | null)?.[0]
  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? `${product.name} — 오센틱아트 공예 재료 쇼핑`,
    alternates: { canonical: `/shop/${id}` },
    openGraph: {
      title: `${product.name} | 오센틱아트`,
      description: product.description?.slice(0, 160) ?? `${product.name} — 오센틱아트 공예 재료 쇼핑`,
      images: firstImage ? [firstImage] : [],
      type: 'website',
    },
  }
}

async function getProductWithPrice(id: string, role: string) {
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('id, name, description, category, retail_price, wholesale_price, is_instructor_only, is_active, stock_qty, images')
    .eq('id', id)
    .single()

  if (!product || !product.is_active) return null
  if (product.is_instructor_only && !['instructor', 'admin'].includes(role)) return null

  const isWholesale = ['instructor', 'admin'].includes(role) && !!product.wholesale_price
  const price = isWholesale ? product.wholesale_price! : product.retail_price

  return { ...product, price, isWholesale, stock: product.stock_qty, wholesale_price: undefined }
}

async function getUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'guest'
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role ?? 'user'
}

export default async function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const role = await getUserRole()
  const product = await getProductWithPrice(id, role)

  if (!product) notFound()

  const isSoldOut = product.stock === 0
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.authenticart.co.kr'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: (product.images as string[] | null)?.[0],
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/shop/${id}`,
      priceCurrency: 'KRW',
      price: product.price,
      availability: isSoldOut
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 이미지 */}
          <div>
            <ProductImageGallery images={product.images ?? []} name={product.name} />
          </div>

          {/* 상세 */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 mb-5">
              {product.category && (
                <div className="flex items-center gap-2 mb-2">
                  <Hexagon color="amber" size={14} />
                  <span className="text-xs text-brand-grey">{product.category}</span>
                </div>
              )}
              <h1 className="text-2xl font-bold text-brand-ink mb-3">{product.name}</h1>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold text-brand-deep">{formatPrice(product.price)}</span>
                {product.isWholesale && (
                  <span className="text-sm font-medium bg-brand-amber text-brand-ink px-3 py-1 rounded-full">
                    강사 도매가
                  </span>
                )}
              </div>
              <p className="text-sm text-brand-grey">
                재고 {(product.stock ?? 0) > 0 ? `${product.stock}개 남음` : '품절'}
              </p>
            </div>

            {product.description && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 mb-5">
                <h2 className="text-sm font-semibold text-brand-ink mb-2">상품 설명</h2>
                <p className="text-sm text-brand-grey leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {!isSoldOut ? (
              <div className="space-y-3">
                <CartButton
                  product={{ product_id: product.id, name: product.name, price: product.price, image: product.images?.[0] }}
                />
                <ShopOrderSection
                  productId={product.id}
                  productName={product.name}
                  price={product.price}
                />
              </div>
            ) : (
              <div className="bg-brand-bg rounded-2xl p-5 text-center border border-brand-mist/30">
                <p className="text-brand-grey font-medium">현재 품절된 상품입니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
