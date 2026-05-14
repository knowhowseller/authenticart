import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ClassCard from '@/components/class/ClassCard'
import ClassesFilterBar from '@/components/class/ClassesFilterBar'
import GenreTabs from '@/components/class/GenreTabs'
import Hexagon from '@/components/brand/Hexagon'
import Link from 'next/link'
import type { ClassAttributes, ConfirmationMode } from '@/types/database'

const PAGE_SIZE = 40

interface SearchParams {
  region?: string
  difficulty?: string
  min_price?: string
  max_price?: string
  craft?: string
  category?: string
  sort?: string
  q?: string
  limit?: string
}

async function getCategoryIds(supabase: Awaited<ReturnType<typeof createClient>>, categoryCode: string) {
  const { data: parent } = await supabase
    .from('craft_categories')
    .select('id')
    .eq('code', categoryCode)
    .single()
  if (!parent) return null
  const { data: children } = await supabase
    .from('craft_categories')
    .select('id')
    .eq('parent_id', parent.id)
  return [parent.id, ...(children ?? []).map((c: { id: string }) => c.id)]
}

async function getClasses(params: SearchParams) {
  const supabase = await createClient()
  const limit = Math.min(parseInt(params.limit ?? String(PAGE_SIZE)), 200)

  let query = supabase
    .from('classes')
    .select(`id, title, region, price, thumbnail_url, confirmation_mode, attributes, category_id,
      users!instructor_id(name),
      class_reviews(rating)`)
    .eq('status', 'published')

  if (params.region) query = query.eq('region', params.region)
  if (params.q) query = query.ilike('title', `%${params.q}%`)
  if (params.min_price) query = query.gte('price', parseInt(params.min_price))
  if (params.max_price) query = query.lte('price', parseInt(params.max_price))
  if (params.difficulty) query = query.contains('attributes', { difficulty: params.difficulty })

  if (params.category) {
    const ids = await getCategoryIds(supabase, params.category)
    if (ids && ids.length > 0) query = query.in('category_id', ids)
  } else if (params.craft) {
    query = query.contains('attributes', { craft_type: params.craft })
  }

  if (params.sort === 'price_asc') query = query.order('price', { ascending: true })
  else if (params.sort === 'price_desc') query = query.order('price', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data } = await query.limit(params.sort === 'popular' ? 200 : limit)

  let results = (data ?? []).map((cls: any) => {
    const reviews: { rating: number }[] = cls.class_reviews ?? []
    const review_count = reviews.length
    const avg_rating = review_count > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / review_count
      : undefined
    return { ...cls, review_count, avg_rating }
  })

  if (params.sort === 'popular') {
    results = results
      .sort((a: any, b: any) => b.review_count - a.review_count)
      .slice(0, limit)
  }

  return results
}

async function getMyWishlistIds(): Promise<Set<string>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Set()
  const { data } = await supabase.from('wishlists').select('class_id').eq('user_id', user.id)
  return new Set((data ?? []).map((w: any) => w.class_id))
}

async function getRecruitingRequests() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('class_open_requests')
      .select('id, title, preferred_region, schedule_date, target_capacity, current_count, price_per_person')
      .in('status', ['recruiting', 'payment_pending'])
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

async function getGenreCategories() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('craft_categories')
    .select('id, code, name')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('sort_order')
  return data ?? []
}

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [classes, recruitingRequests, wishlistIds, genreCategories] = await Promise.all([
    getClasses(params),
    getRecruitingRequests(),
    getMyWishlistIds(),
    getGenreCategories(),
  ])
  const limit = Math.min(parseInt(params.limit ?? String(PAGE_SIZE)), 200)
  const hasMore = classes.length === limit

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <div className="bg-white border-b border-brand-mist/30">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-2">
            <Hexagon color="amber" size={14} />
            <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Classes</span>
          </div>
          <h1 className="text-3xl font-bold text-brand-ink">클래스 찾기</h1>
          <p className="text-brand-grey text-sm mt-1">나에게 맞는 공예 클래스를 찾아보세요</p>
        </div>
      </div>

      {/* 장르 탭 */}
      <Suspense fallback={null}>
        <GenreTabs categories={genreCategories} />
      </Suspense>

      {/* 필터바 (sticky) */}
      <Suspense fallback={null}>
        <ClassesFilterBar />
      </Suspense>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* 모집 중 그룹 클래스 */}
        {recruitingRequests.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-base font-bold text-brand-ink">모집 중인 그룹 클래스</h2>
                <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-semibold">{recruitingRequests.length}개</span>
              </div>
              <Link href="/class-requests" className="text-xs text-brand-deep hover:underline">전체 보기 →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(recruitingRequests as any[]).map((r) => {
                const pct = r.target_capacity ? Math.min(100, (r.current_count / r.target_capacity) * 100) : 0
                return (
                  <Link
                    key={r.id}
                    href={`/class-requests`}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-green-100 hover:border-green-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">참여자 모집 중</span>
                    </div>
                    <h3 className="text-sm font-semibold text-brand-ink mb-1 group-hover:text-brand-deep transition-colors line-clamp-2">{r.title}</h3>
                    <div className="flex gap-2 text-xs text-brand-grey mb-3 flex-wrap">
                      {r.preferred_region && <span>📍 {r.preferred_region}</span>}
                      {r.schedule_date && <span>📅 {new Date(r.schedule_date).toLocaleDateString('ko-KR')}</span>}
                    </div>
                    {r.target_capacity && (
                      <div>
                        <div className="flex justify-between text-xs text-brand-grey mb-1">
                          <span>모집 현황</span>
                          <span className="font-semibold text-brand-ink">{r.current_count} / {r.target_capacity}명</span>
                        </div>
                        <div className="h-1.5 bg-brand-bg rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                    {r.price_per_person && (
                      <p className="text-xs text-brand-grey mt-2">1인 <span className="font-semibold text-brand-ink">{r.price_per_person.toLocaleString()}원</span></p>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <p className="text-sm text-brand-grey mb-5">
          총 <span className="font-semibold text-brand-ink">{classes.length}</span>개의 클래스
        </p>

        {classes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {(classes as any[]).map((cls) => (
                <ClassCard
                  key={cls.id}
                  id={cls.id}
                  title={cls.title}
                  instructorName={cls.users?.name ?? '강사'}
                  region={cls.region}
                  price={cls.price}
                  thumbnail_url={cls.thumbnail_url}
                  confirmation_mode={cls.confirmation_mode as ConfirmationMode}
                  attributes={cls.attributes as ClassAttributes}
                  avg_rating={cls.avg_rating}
                  review_count={cls.review_count}
                  wishlisted={wishlistIds.has(cls.id)}
                />
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-10">
                {(() => {
                  const sp = new URLSearchParams()
                  if (params.region) sp.set('region', params.region)
                  if (params.q) sp.set('q', params.q)
                  if (params.sort) sp.set('sort', params.sort)
                  if (params.min_price) sp.set('min_price', params.min_price)
                  if (params.max_price) sp.set('max_price', params.max_price)
                  if (params.craft) sp.set('craft', params.craft)
                  if (params.difficulty) sp.set('difficulty', params.difficulty)
                  sp.set('limit', String(limit + PAGE_SIZE))
                  return (
                    <a
                      href={`/classes?${sp.toString()}`}
                      className="inline-block px-8 py-3 bg-white border border-brand-mist rounded-2xl text-sm font-medium text-brand-ink hover:border-brand-deep hover:shadow-sm transition-all"
                    >
                      클래스 더 보기 ({limit}개 표시 중)
                    </a>
                  )
                })()}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-brand-grey">
            <div className="text-5xl mb-4">🎨</div>
            <p className="text-lg font-medium">조건에 맞는 클래스가 없습니다</p>
            <p className="text-sm mt-1">필터를 변경하거나 전체 클래스를 확인해보세요</p>
            <a href="/classes" className="inline-block mt-4 text-sm text-brand-deep hover:underline">
              전체 클래스 보기
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
