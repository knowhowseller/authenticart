import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Hexagon from '@/components/brand/Hexagon'
import { MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: '강사 소개',
  description: '오센틱아트에서 활동 중인 공예·예술 강사를 만나보세요. 레진아트·캔들·플라워·도자기·주얼리·자수·회화·목공예 전문 강사들의 프로필과 클래스를 확인하실 수 있습니다.',
  keywords: '공예 강사, 원데이클래스 강사, 레진아트 강사, 캔들 강사, 플라워 강사, 도자기 강사, 공방 선생님, 취미 강사',
  alternates: { canonical: '/instructors' },
  openGraph: {
    title: '공예·예술 강사 소개 | 오센틱아트',
    description: '오센틱아트 공예·예술 강사 전체 목록',
    type: 'website',
  },
}

async function getCraftCategories() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('craft_categories')
    .select('name')
    .is('parent_id', null)
    .order('sort_order')
  return (data ?? []).map((d: any) => d.name as string)
}

async function getRegions() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('instructor_profiles')
    .select('region')
    .eq('status', 'approved')
    .not('region', 'is', null)
  const regions = [...new Set((data ?? []).map((d: any) => d.region as string).filter(Boolean))]
  return regions.sort()
}

async function getInstructors(category?: string, region?: string) {
  const supabase = await createClient()

  let instructorIds: string[] | null = null
  if (category && category !== '전체') {
    const { data: classData } = await supabase
      .from('classes')
      .select('instructor_id')
      .eq('category', category)
      .eq('status', 'published')
    instructorIds = [...new Set((classData ?? []).map((c: any) => c.instructor_id as string))]
  }

  let q = supabase
    .from('instructor_profiles')
    .select('instructor_id, bio, region, status, profile_image, users!instructor_id(name)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (instructorIds !== null) {
    q = (q as any).in('instructor_id', instructorIds.length > 0 ? instructorIds : ['00000000-0000-0000-0000-000000000000'])
  }
  if (region && region !== '전체') q = (q as any).eq('region', region)

  const { data } = await q
  return data ?? []
}

export default async function InstructorsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; region?: string }>
}) {
  const { category, region } = await searchParams
  const [craftCategories, regions, instructors] = await Promise.all([
    getCraftCategories(),
    getRegions(),
    getInstructors(category, region),
  ])

  const buildHref = (c?: string, r?: string) => {
    const params = new URLSearchParams()
    if (c && c !== '전체') params.set('category', c)
    if (r && r !== '전체') params.set('region', r)
    const s = params.toString()
    return s ? `/instructors?${s}` : '/instructors'
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Instructors</span>
        </div>
        <h1 className="text-3xl font-bold text-brand-ink mb-2">강사 소개</h1>
        <p className="text-brand-grey mb-8">오센틱아트의 공예 전문 강사들을 만나보세요</p>

        {/* 분야 필터 */}
        <div className="mb-4">
          <p className="text-xs font-medium text-brand-grey mb-2">분야</p>
          <div className="flex gap-2 flex-wrap">
            {['전체', ...craftCategories].map(c => (
              <Link
                key={c}
                href={buildHref(c, region)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  (c === '전체' && !category) || c === category
                    ? 'bg-brand-deep text-white'
                    : 'bg-white text-brand-grey border border-brand-mist hover:border-brand-deep/30'
                }`}
              >
                {c}
              </Link>
            ))}
          </div>
        </div>

        {/* 지역 필터 */}
        {regions.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-medium text-brand-grey mb-2">지역</p>
            <div className="flex gap-2 flex-wrap">
              {['전체', ...regions].map(r => (
                <Link
                  key={r}
                  href={buildHref(category, r)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    (r === '전체' && !region) || r === region
                      ? 'bg-brand-amber text-brand-ink'
                      : 'bg-white text-brand-grey border border-brand-mist hover:border-brand-amber/30'
                  }`}
                >
                  {r}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 결과 수 */}
        <p className="text-sm text-brand-grey mb-4">
          강사 <span className="font-semibold text-brand-ink">{instructors.length}명</span>
          {category && category !== '전체' && ` · ${category}`}
          {region && region !== '전체' && ` · ${region}`}
        </p>

        {instructors.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-brand-mist/30">
            <div className="text-4xl mb-3">👩‍🎨</div>
            <p className="text-brand-grey">해당 조건의 강사가 없습니다</p>
            <Link href="/instructors" className="mt-3 inline-block text-sm text-brand-deep hover:underline">
              전체 강사 보기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(instructors as any[]).map((inst: any) => (
              <Link
                key={inst.instructor_id}
                href={`/instructors/${inst.instructor_id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-mist/30 hover:shadow-md hover:border-brand-amber/30 transition-all group"
              >
                <div className="relative h-16 bg-gradient-to-r from-brand-deep/10 via-brand-blush/20 to-brand-mist/30">
                  <div className="absolute -bottom-6 left-4 w-12 h-12 rounded-xl border-2 border-white shadow-sm overflow-hidden bg-gradient-to-br from-brand-blush to-brand-mist">
                    {inst.profile_image ? (
                      <img src={inst.profile_image} alt={inst.users?.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">👩‍🎨</div>
                    )}
                  </div>
                </div>

                <div className="pt-8 pb-4 px-4">
                  <h3 className="font-semibold text-brand-ink text-sm group-hover:text-brand-deep transition-colors">
                    {inst.users?.name}
                  </h3>
                  {inst.region && (
                    <div className="flex items-center gap-0.5 text-xs text-brand-grey mt-0.5">
                      <MapPin size={10} />
                      {inst.region}
                    </div>
                  )}
                  {inst.bio && (
                    <p className="text-xs text-brand-grey mt-2 line-clamp-2 leading-relaxed">{inst.bio}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
