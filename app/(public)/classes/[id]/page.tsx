import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClassBadges from '@/components/brand/ClassBadges'
import BookingSection from '@/components/class/BookingSection'
import Hexagon from '@/components/brand/Hexagon'
import { formatPrice, formatDateTime } from '@/lib/utils/format'
import type { ClassAttributes } from '@/types/database'

async function getClass(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('classes')
    .select(`
      *,
      users!instructor_id(id, name, region),
      instructor_profiles!instructor_id(bio, profile_image)
    `)
    .eq('id', id)
    .single()
  return data
}

async function getSchedules(classId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('class_schedules')
    .select('*')
    .eq('class_id', classId)
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
  return data ?? []
}

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [cls, schedules] = await Promise.all([
    getClass(id),
    getSchedules(id),
  ])

  if (!cls || cls.status !== 'published') notFound()

  const attrs = cls.attributes as ClassAttributes
  const instructor = cls.users as any
  const profile = (cls as any).instructor_profiles as any

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Main content */}
          <div className="lg:col-span-2">
            {/* 썸네일 */}
            <div className="aspect-video bg-gradient-to-br from-brand-blush/30 to-brand-mist/30 rounded-2xl overflow-hidden mb-6">
              {cls.thumbnail_url ? (
                <img src={cls.thumbnail_url} alt={cls.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">🎨</div>
              )}
            </div>

            {/* 제목 + 강사 + 가격 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 mb-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium bg-brand-deep/5 text-brand-deep px-2 py-0.5 rounded-full">
                      {attrs.craft_type === 'resin' ? '레진아트' : attrs.craft_type ?? '공예'}
                    </span>
                    <span className="text-xs text-brand-grey">{cls.region}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-brand-ink leading-snug">{cls.title}</h1>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold text-brand-deep">{formatPrice(cls.price)}</p>
                  <p className="text-xs text-brand-grey mt-0.5">
                    {cls.confirmation_mode === 'instant' ? '바로 결제' : '강사 승인 후 결제'}
                  </p>
                </div>
              </div>

              {/* 강사 */}
              <div className="flex items-center gap-3 pt-4 border-t border-brand-mist/30">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blush to-brand-mist overflow-hidden flex-shrink-0">
                  {profile?.profile_image ? (
                    <img src={profile.profile_image} alt={instructor?.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">👩‍🎨</div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-ink">{instructor?.name}</p>
                  <p className="text-xs text-brand-grey">{instructor?.region} 강사</p>
                </div>
              </div>
            </div>

            {/* 공예 배지 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Hexagon color="amber" size={16} />
                <h2 className="text-base font-semibold text-brand-ink">클래스 정보</h2>
              </div>
              <ClassBadges attributes={attrs} />
            </div>

            {/* 상세 설명 */}
            {cls.description && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 mb-6">
                <h2 className="text-base font-semibold text-brand-ink mb-3">클래스 소개</h2>
                <p className="text-sm text-brand-ink leading-relaxed whitespace-pre-wrap">{cls.description}</p>
              </div>
            )}

            {/* 강사 소개 */}
            {profile?.bio && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30">
                <h2 className="text-base font-semibold text-brand-ink mb-3">강사 소개</h2>
                <p className="text-sm text-brand-grey leading-relaxed">{profile.bio}</p>
              </div>
            )}
          </div>

          {/* Right: 예약 섹션 (클라이언트) */}
          <div className="lg:col-span-1">
            <BookingSection
              classId={cls.id}
              price={cls.price}
              confirmationMode={cls.confirmation_mode as 'instant' | 'request'}
              schedules={schedules.map((s: any) => ({
                id: s.id,
                start_at: s.start_at,
                end_at: s.end_at,
                available_seats: (s.max_students ?? 0) - (s.booked_count ?? 0),
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
