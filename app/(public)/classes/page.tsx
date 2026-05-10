import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ClassCard from '@/components/class/ClassCard'
import Hexagon from '@/components/brand/Hexagon'
import type { ClassAttributes, ConfirmationMode } from '@/types/database'

interface SearchParams {
  region?: string
  difficulty?: string
  min_price?: string
  max_price?: string
  craft?: string
  sort?: string
  q?: string
}

const regions = ['서울', '인천', '경기', '부산', '대구', '광주', '대전', '울산', '강릉', '제주']
const difficulties = [
  { value: 'beginner', label: '입문' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '고급' },
]
const sortOptions = [
  { value: 'newest', label: '최신순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
]

async function getClasses(params: SearchParams) {
  const supabase = await createClient()
  let query = supabase
    .from('classes')
    .select(`id, title, region, price, thumbnail_url, confirmation_mode, attributes, users!instructor_id(name)`)
    .eq('status', 'published')

  if (params.region) query = query.eq('region', params.region)
  if (params.q) query = query.ilike('title', `%${params.q}%`)
  if (params.min_price) query = query.gte('price', parseInt(params.min_price))
  if (params.max_price) query = query.lte('price', parseInt(params.max_price))
  if (params.craft) query = query.contains('attributes', { craft_type: params.craft })
  if (params.difficulty) query = query.contains('attributes', { difficulty: params.difficulty })

  if (params.sort === 'price_asc') query = query.order('price', { ascending: true })
  else if (params.sort === 'price_desc') query = query.order('price', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data } = await query.limit(20)
  return data ?? []
}

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const classes = await getClasses(params)

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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filter */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 sticky top-24">
              <h3 className="text-sm font-semibold text-brand-ink mb-4">필터</h3>

              {/* Search */}
              <div className="mb-5">
                <label className="text-xs font-medium text-brand-grey mb-1.5 block">검색</label>
                <form>
                  <input
                    type="text"
                    name="q"
                    defaultValue={params.q}
                    placeholder="클래스명 검색"
                    className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                  />
                </form>
              </div>

              {/* Region */}
              <div className="mb-5">
                <label className="text-xs font-medium text-brand-grey mb-2 block">지역</label>
                <div className="flex flex-col gap-1.5">
                  <a href="/classes" className={`text-sm px-2 py-1 rounded ${!params.region ? 'text-brand-deep font-medium' : 'text-brand-ink hover:text-brand-deep'}`}>
                    전체
                  </a>
                  {regions.map(r => (
                    <a
                      key={r}
                      href={`/classes?region=${r}${params.sort ? `&sort=${params.sort}` : ''}`}
                      className={`text-sm px-2 py-1 rounded ${params.region === r ? 'bg-brand-deep/5 text-brand-deep font-medium' : 'text-brand-ink hover:text-brand-deep'}`}
                    >
                      {r}
                    </a>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-5">
                <label className="text-xs font-medium text-brand-grey mb-2 block">난이도</label>
                <div className="flex flex-col gap-1.5">
                  {difficulties.map(d => (
                    <a
                      key={d.value}
                      href={`/classes?difficulty=${d.value}${params.region ? `&region=${params.region}` : ''}`}
                      className={`text-sm px-2 py-1 rounded flex items-center gap-2 ${params.difficulty === d.value ? 'bg-brand-amber/10 text-brand-amber font-medium' : 'text-brand-ink hover:text-brand-deep'}`}
                    >
                      <Hexagon color="amber" size={12} />
                      {d.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            {/* Sort + count */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-brand-grey">
                총 <span className="font-semibold text-brand-ink">{classes.length}</span>개의 클래스
              </p>
              <div className="flex gap-2">
                {sortOptions.map(s => (
                  <a
                    key={s.value}
                    href={`/classes?sort=${s.value}${params.region ? `&region=${params.region}` : ''}`}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      (params.sort ?? 'newest') === s.value
                        ? 'bg-brand-deep text-white border-brand-deep'
                        : 'border-brand-mist text-brand-ink hover:border-brand-deep'
                    }`}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Grid */}
            {classes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
                  />
                ))}
              </div>
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
      </div>
    </div>
  )
}
