import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ClassCard from '@/components/class/ClassCard'
import ClassesFilterBar from '@/components/class/ClassesFilterBar'
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

  const { data } = await query.limit(40)
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

      {/* 필터바 (sticky) */}
      <Suspense fallback={null}>
        <ClassesFilterBar />
      </Suspense>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-sm text-brand-grey mb-5">
          총 <span className="font-semibold text-brand-ink">{classes.length}</span>개의 클래스
        </p>

        {classes.length > 0 ? (
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
  )
}
