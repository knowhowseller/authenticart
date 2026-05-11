import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClassBadges from '@/components/brand/ClassBadges'
import BookingSection from '@/components/class/BookingSection'
import ReviewSection from '@/components/class/ReviewSection'
import RefundPolicyBox from '@/components/class/RefundPolicyBox'
import ClassImageGallery from '@/components/class/ClassImageGallery'
import Hexagon from '@/components/brand/Hexagon'
import { formatPrice, formatDateTime } from '@/lib/utils/format'
import { Star } from 'lucide-react'
import type { ClassAttributes } from '@/types/database'

async function getClass(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('classes')
    .select(`*, users!instructor_id(id, name, region), instructor_profiles!instructor_id(bio, profile_image, status)`)
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

async function getReviews(classId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('class_reviews')
    .select('id, rating, content, created_at, student_id, users!student_id(name)')
    .eq('class_id', classId)
    .order('created_at', { ascending: false })
  return data ?? []
}

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('id, name, role').eq('id', user.id).single()
  return data
}

async function getMyBooking(classId: string, userId: string) {
  const supabase = await createClient()
  const { data: schedules } = await supabase
    .from('class_schedules').select('id').eq('class_id', classId)
  if (!schedules || schedules.length === 0) return null
  const scheduleIds = schedules.map(s => s.id)
  const { data } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('student_id', userId)
    .in('schedule_id', scheduleIds)
    .in('status', ['paid', 'completed'])
    .limit(1)
    .maybeSingle()
  return data
}

async function getMyWaitlists(classId: string, userId: string) {
  const supabase = await createClient()
  const { data: schedules } = await supabase
    .from('class_schedules').select('id').eq('class_id', classId)
  if (!schedules || schedules.length === 0) return []
  const scheduleIds = schedules.map(s => s.id)
  const { data: waitlists } = await supabase
    .from('class_waitlists')
    .select('schedule_id')
    .eq('user_id', userId)
    .in('schedule_id', scheduleIds)
    .in('status', ['waiting', 'notified'])
  if (!waitlists || waitlists.length === 0) return []
  const result = await Promise.all(
    waitlists.map(async (w) => {
      const { count } = await supabase
        .from('class_waitlists')
        .select('id', { count: 'exact', head: true })
        .eq('schedule_id', w.schedule_id)
        .eq('status', 'waiting')
      return { scheduleId: w.schedule_id, position: count }
    })
  )
  return result
}

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [cls, schedules, reviews, currentUser] = await Promise.all([
    getClass(id),
    getSchedules(id),
    getReviews(id),
    getCurrentUser(),
  ])

  if (!cls) notFound()

  const isOwner = cls.instructor_id === currentUser?.id
  const isPrivileged = isOwner || ['admin', 'branch_manager'].includes(currentUser?.role ?? '')

  if (cls.status !== 'published' && !isPrivileged) notFound()

  const myBooking = currentUser ? await getMyBooking(id, currentUser.id) : null
  const myWaitlists = currentUser ? await getMyWaitlists(id, currentUser.id) : []
  const hasReviewed = reviews.some((r) => r.student_id === currentUser?.id)

  const attrs = cls.attributes as ClassAttributes
  const instructor = cls.users as any
  const profile = (cls as any).instructor_profiles as any
  const images: string[] = (cls as any).images ?? []
  const thumbnailUrl: string | null = cls.thumbnail_url

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const minSeats = schedules.length > 0
    ? Math.min(...schedules.map((s: any) => (s.max_students ?? 0) - (s.booked_count ?? 0)))
    : null

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* 비공개 미리보기 배너 */}
      {cls.status !== 'published' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center">
          <p className="text-xs text-yellow-700 font-medium">
            {cls.status === 'draft' ? '⚠️ 검수 대기 중인 클래스입니다 (강사/관리자 미리보기)' : '마감된 클래스입니다'}
          </p>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* 이미지 갤러리 */}
            <ClassImageGallery
              images={images}
              thumbnailUrl={thumbnailUrl}
              title={cls.title}
            />

            {/* 제목 + 강사 + 가격 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-medium bg-brand-deep/5 text-brand-deep px-2 py-0.5 rounded-full">
                      {attrs.craft_type === 'resin' ? '레진아트' : attrs.craft_type ?? '공예'}
                    </span>
                    <span className="text-xs text-brand-grey">{cls.region}</span>
                    {minSeats !== null && minSeats <= 3 && minSeats > 0 && (
                      <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        잔여 {minSeats}석
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-brand-ink leading-snug">{cls.title}</h1>
                  {avgRating && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Star size={14} className="text-brand-amber fill-brand-amber" />
                      <span className="text-sm font-bold text-brand-deep">{avgRating}</span>
                      <span className="text-xs text-brand-grey">후기 {reviews.length}개</span>
                    </div>
                  )}
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
                  <p className="text-xs text-brand-grey">{instructor?.region} · 인증 강사</p>
                </div>
              </div>
            </div>

            {/* 클래스 정보 배지 */}
            {Object.keys(attrs ?? {}).length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30">
                <div className="flex items-center gap-2 mb-4">
                  <Hexagon color="amber" size={16} />
                  <h2 className="text-base font-semibold text-brand-ink">클래스 정보</h2>
                </div>
                <ClassBadges attributes={attrs} />
              </div>
            )}

            {/* 상세 설명 */}
            {cls.description && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30">
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

            {/* 환불 정책 */}
            <RefundPolicyBox />

            {/* 리뷰 */}
            <ReviewSection
              classId={cls.id}
              reviews={reviews as any}
              currentUserId={currentUser?.id}
              bookingId={myBooking?.id}
              hasReviewed={hasReviewed}
            />
          </div>

          {/* Right: 예약 섹션 */}
          <div className="lg:col-span-1">
            {cls.status === 'published' ? (
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
                myWaitlists={myWaitlists}
              />
            ) : (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 text-center text-sm text-brand-grey">
                검수 승인 후 예약 가능합니다
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
