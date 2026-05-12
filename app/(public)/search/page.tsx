import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
import type { ClassAttributes } from '@/types/database'

interface SearchParams { q?: string; type?: string }

async function searchAll(q: string) {
  const supabase = await createClient()
  const term = `%${q}%`

  const [{ data: classes }, { data: instructors }, { data: products }] = await Promise.all([
    supabase
      .from('classes')
      .select('id, title, region, price, thumbnail_url, attributes, users!instructor_id(name)')
      .eq('status', 'published')
      .or(`title.ilike.${term},description.ilike.${term},region.ilike.${term}`)
      .limit(12),
    supabase
      .from('instructor_profiles')
      .select('instructor_id, bio, profile_image, users!instructor_id(name, region)')
      .eq('status', 'approved')
      .or(`bio.ilike.${term}`)
      .limit(8),
    supabase
      .from('products')
      .select('id, name, retail_price, thumbnail_url, category')
      .eq('is_active', true)
      .or(`name.ilike.${term},description.ilike.${term},category.ilike.${term}`)
      .limit(12),
  ])

  return {
    classes: classes ?? [],
    instructors: instructors ?? [],
    products: products ?? [],
  }
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { q = '', type = 'all' } = await searchParams
  const results = q.trim() ? await searchAll(q.trim()) : null
  const totalCount = results
    ? results.classes.length + results.instructors.length + results.products.length
    : 0

  const tabs = [
    { key: 'all', label: '전체', count: totalCount },
    { key: 'classes', label: '클래스', count: results?.classes.length ?? 0 },
    { key: 'instructors', label: '강사', count: results?.instructors.length ?? 0 },
    { key: 'products', label: '재료', count: results?.products.length ?? 0 },
  ]

  const showClasses = type === 'all' || type === 'classes'
  const showInstructors = type === 'all' || type === 'instructors'
  const showProducts = type === 'all' || type === 'products'

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-brand-ink mb-6">검색</h1>

        {/* 검색바 */}
        <form method="GET" action="/search" className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-grey" />
              <input
                name="q"
                defaultValue={q}
                placeholder="클래스, 강사, 재료를 검색하세요"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-brand-deep text-white text-sm font-medium rounded-xl hover:bg-brand-deep/90 transition-colors"
            >
              검색
            </button>
          </div>
        </form>

        {!q.trim() ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-brand-grey">검색어를 입력해주세요</p>
          </div>
        ) : results && totalCount === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">😅</div>
            <p className="text-brand-ink font-medium mb-2">"{q}" 검색 결과가 없습니다</p>
            <p className="text-brand-grey text-sm">다른 검색어로 시도해보세요</p>
          </div>
        ) : results ? (
          <>
            {/* 탭 */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {tabs.map(tab => (
                <Link
                  key={tab.key}
                  href={`/search?q=${encodeURIComponent(q)}&type=${tab.key}`}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    type === tab.key
                      ? 'bg-brand-deep text-white'
                      : 'bg-white text-brand-grey border border-brand-mist hover:border-brand-deep/30'
                  }`}
                >
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${type === tab.key ? 'bg-white/20 text-white' : 'bg-brand-bg text-brand-grey'}`}>
                    {tab.count}
                  </span>
                </Link>
              ))}
            </div>

            {/* 클래스 결과 */}
            {showClasses && results.classes.length > 0 && (
              <section className="mb-10">
                <h2 className="text-base font-semibold text-brand-ink mb-4">
                  클래스 <span className="text-brand-grey font-normal text-sm">({results.classes.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.classes.map((cls: any) => {
                    const attrs = cls.attributes as ClassAttributes
                    return (
                      <Link key={cls.id} href={`/classes/${cls.id}`}
                        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-mist/30 hover:shadow-md hover:border-brand-deep/20 transition-all group">
                        <div className="w-full h-36 bg-brand-mist/20 overflow-hidden">
                          {cls.thumbnail_url
                            ? <img src={cls.thumbnail_url} alt={cls.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            : <div className="w-full h-full flex items-center justify-center text-3xl">🎨</div>
                          }
                        </div>
                        <div className="p-4">
                          <p className="text-xs text-brand-grey mb-1">{cls.region} · {(cls.users as any)?.name}</p>
                          <p className="text-sm font-semibold text-brand-ink line-clamp-2 mb-2">{cls.title}</p>
                          <p className="text-sm font-bold text-brand-deep">{formatPrice(cls.price)}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* 강사 결과 */}
            {showInstructors && results.instructors.length > 0 && (
              <section className="mb-10">
                <h2 className="text-base font-semibold text-brand-ink mb-4">
                  강사 <span className="text-brand-grey font-normal text-sm">({results.instructors.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.instructors.map((i: any) => (
                    <Link key={i.instructor_id} href={`/instructors/${i.instructor_id}`}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30 hover:shadow-md transition-all flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blush to-brand-mist overflow-hidden flex-shrink-0">
                        {i.profile_image
                          ? <img src={i.profile_image} alt={i.users?.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center">👩‍🎨</div>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-brand-ink text-sm">{i.users?.name}</p>
                        <p className="text-xs text-brand-grey">{i.users?.region}</p>
                        {i.bio && <p className="text-xs text-brand-grey mt-0.5 line-clamp-1">{i.bio}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 재료 결과 */}
            {showProducts && results.products.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-brand-ink mb-4">
                  재료 <span className="text-brand-grey font-normal text-sm">({results.products.length})</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {results.products.map((p: any) => (
                    <Link key={p.id} href={`/shop/${p.id}`}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-mist/30 hover:shadow-md transition-all group">
                      <div className="w-full h-28 bg-brand-mist/20 overflow-hidden">
                        {p.thumbnail_url
                          ? <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl">🧪</div>
                        }
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-brand-grey mb-0.5">{p.category}</p>
                        <p className="text-sm font-medium text-brand-ink line-clamp-2 mb-1">{p.name}</p>
                        <p className="text-sm font-bold text-brand-deep">{formatPrice(p.retail_price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
