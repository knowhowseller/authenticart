import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/shop/ProductCard'
import ShopFilterBar, { CraftL1 } from '@/components/shop/ShopFilterBar'
import Hexagon from '@/components/brand/Hexagon'
import Link from 'next/link'
import { Store } from 'lucide-react'

export const metadata: Metadata = {
  title: '재료 쇼핑',
  description: '레진아트·캔들·플라워·도자기·주얼리·자수·회화·목공예 전문 재료를 한 곳에서. 강사 전용 도매가로 구매 가능하며 입점 공방 스토어도 만나보세요.',
  keywords: '공예 재료, 레진아트 재료, 캔들 재료, 플라워 재료, 도자기 재료, 공예 도구, 자수 실, 수채화 물감, 강사 도매, 공예 쇼핑몰',
  alternates: { canonical: '/shop' },
  openGraph: {
    title: '공예 재료 쇼핑 | 오센틱아트',
    description: '공예·예술 전문 재료 & 도구 쇼핑 — 강사 도매가 제공',
    type: 'website',
  },
}

interface SearchParams {
  lv1?: string  // craft_categories level1 code
  lv2?: string  // craft_categories level2 code
  lv3?: string  // craft_categories level3 code
  sort?: string
  q?: string
}

async function getCraftHierarchy(): Promise<CraftL1[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('craft_categories')
    .select('id, code, name, parent_id, sort_order')
    .eq('is_active', true)
    .order('sort_order')

  if (!data) return []
  const all = data as any[]
  const byId = new Map(all.map(d => [d.id, d]))

  const level = (d: any): 1 | 2 | 3 => {
    if (!d.parent_id) return 1
    const p = byId.get(d.parent_id)
    return p?.parent_id ? 3 : 2
  }

  return all
    .filter(d => level(d) === 1)
    .map(l1 => ({
      code: l1.code,
      name: l1.name,
      children: all
        .filter(d => level(d) === 2 && d.parent_id === l1.id)
        .map(l2 => ({
          code: l2.code,
          name: l2.name,
          children: all
            .filter(d => level(d) === 3 && d.parent_id === l2.id)
            .map(l3 => ({ code: l3.code, name: l3.name })),
        })),
    }))
}

// 선택된 craft code에 해당하는 ID + 모든 하위 ID 수집
async function getCraftIds(code: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('craft_categories')
    .select('id, code, parent_id')

  if (!data) return []
  const all = data as any[]
  const target = all.find(d => d.code === code)
  if (!target) return []

  const collect = (id: string): string[] => {
    const children = all.filter(d => d.parent_id === id)
    return [id, ...children.flatMap(c => collect(c.id))]
  }
  return collect(target.id)
}

async function getUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'guest'
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role ?? 'user'
}

async function getProducts(role: string, params: SearchParams, craftIds: string[] | null) {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('id, name, category, retail_price, wholesale_price, is_instructor_only, stock_qty, images, craft_category_id')
    .eq('is_active', true)

  if (params.q) query = query.ilike('name', `%${params.q}%`)
  if (craftIds) query = (query as any).in('craft_category_id', craftIds)

  if (params.sort === 'price_asc') query = query.order('retail_price', { ascending: true })
  else if (params.sort === 'price_desc') query = query.order('retail_price', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data } = await query
  return (data ?? []).map((p: any) => ({
    ...p,
    stock: p.stock_qty,
    price: ['instructor', 'admin'].includes(role) && p.wholesale_price ? p.wholesale_price : p.retail_price,
    isWholesale: ['instructor', 'admin'].includes(role) && !!p.wholesale_price,
  }))
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const [role, categories] = await Promise.all([getUserRole(), getCraftHierarchy()])

  // 선택된 카테고리 코드로 해당 + 하위 ID 수집
  const selectedCode = params.lv3 || params.lv2 || params.lv1 || null
  const craftIds = selectedCode ? await getCraftIds(selectedCode) : null

  const products = await getProducts(role, params, craftIds)

  // 현재 필터 breadcrumb 텍스트
  const lv1Node = categories.find(c => c.code === params.lv1)
  const lv2Node = lv1Node?.children.find(c => c.code === params.lv2)
  const lv3Node = lv2Node?.children.find(c => c.code === params.lv3)
  const breadcrumb = [lv1Node?.name, lv2Node?.name, lv3Node?.name].filter(Boolean).join(' > ')

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
          <Link href="/shop/stores"
            className="text-xs font-medium text-brand-sage hover:text-brand-deep transition-colors">
            스토어 보기 →
          </Link>
        </div>
      </div>

      {/* 3단계 필터바 */}
      <Suspense fallback={null}>
        <ShopFilterBar categories={categories} />
      </Suspense>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {(products.length > 0 || craftIds || params.q) && (
          <p className="text-sm text-brand-grey mb-5">
            총 <span className="font-semibold text-brand-ink">{products.length}</span>개의 상품
            {breadcrumb && <span className="ml-2 text-brand-deep font-medium">{breadcrumb}</span>}
          </p>
        )}

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(products as any[]).map(p => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                category={p.category}
                price={p.price}
                isWholesale={p.isWholesale}
                stock={p.stock}
                images={p.images ?? []}
                status=""
                isInstructorOnly={p.is_instructor_only}
                userRole={role}
              />
            ))}
          </div>
        ) : (craftIds || params.q) ? (
          <div className="text-center py-20 text-brand-grey">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-lg font-medium">
              {craftIds ? '해당 카테고리의 상품이 없습니다' : '조건에 맞는 상품이 없습니다'}
            </p>
            <a href="/shop" className="inline-block mt-4 text-sm text-brand-deep hover:underline">전체 상품 보기</a>
          </div>
        ) : (
          /* 상품 0개 + 필터 없음 = 입점 전 → "없습니다" 대신 오픈 준비 안내(신뢰도 보호) */
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-lg font-semibold text-brand-ink mb-2">재료 쇼핑 오픈 준비 중입니다</p>
            <p className="text-sm text-brand-grey leading-relaxed">
              공예 재료를 강사 도매가로 만나볼 수 있도록 준비하고 있어요.<br />
              재료 판매자(벤더) 입점 신청은 지금 받고 있습니다.
            </p>
            <div className="mt-6 flex gap-3 justify-center flex-wrap">
              <Link
                href="/my/vendor/apply"
                className="inline-block px-5 py-2.5 rounded-xl bg-brand-deep text-white text-sm font-medium hover:bg-brand-deep/90 transition-colors"
              >
                벤더 입점 신청하기
              </Link>
              <Link
                href="/classes"
                className="inline-block px-5 py-2.5 rounded-xl border border-brand-mist text-brand-ink text-sm font-medium hover:border-brand-amber transition-colors"
              >
                클래스 둘러보기
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
