import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import ClassCard from '@/components/class/ClassCard'
import { Star, BookOpen, Users, MapPin } from 'lucide-react'

async function getInstructorData(id: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('instructor_profiles')
    .select('*, users!instructor_id(id, name, email)')
    .eq('instructor_id', id)
    .eq('status', 'approved')
    .single()

  if (!profile) return null

  const { data: classes } = await supabase
    .from('classes')
    .select(`
      id, title, region, price, attributes, confirmation_mode, thumbnail_url,
      class_reviews(rating)
    `)
    .eq('instructor_id', id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  return { profile, classes: classes ?? [] }
}

async function getCurrentUserWishlists(classIds: string[]) {
  if (classIds.length === 0) return new Set<string>()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Set<string>()
  const { data } = await supabase
    .from('wishlists')
    .select('class_id')
    .eq('user_id', user.id)
    .in('class_id', classIds)
  return new Set((data ?? []).map(w => w.class_id))
}

export default async function InstructorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getInstructorData(id)
  if (!result) notFound()

  const { profile, classes } = result
  const user = (profile as any).users
  const profileImage: string | null = (profile as any).profile_image ?? null

  // 리뷰 통계 계산
  const allReviews = classes.flatMap((c: any) => c.class_reviews ?? [])
  const totalReviews = allReviews.length
  const avgRating = totalReviews > 0
    ? allReviews.reduce((s: number, r: any) => s + r.rating, 0) / totalReviews
    : null

  // 찜 목록
  const classIds = classes.map((c: any) => c.id)
  const wishlistedSet = await getCurrentUserWishlists(classIds)

  // 클래스별 리뷰 통계
  const classesWithStats = classes.map((cls: any) => {
    const reviews = cls.class_reviews ?? []
    const count = reviews.length
    const avg = count > 0 ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / count : undefined
    return { ...cls, review_count: count, avg_rating: avg }
  })

  const stats = [
    { icon: BookOpen, label: '클래스', value: `${classes.length}개` },
    { icon: Star, label: '평균 평점', value: avgRating ? avgRating.toFixed(1) : '-' },
    { icon: Users, label: '후기', value: `${totalReviews}개` },
  ]

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* 프로필 카드 */}
        <div className="bg-white rounded-3xl shadow-sm border border-brand-mist/30 overflow-hidden mb-8">
          {/* 배너 */}
          <div className="h-28 bg-gradient-to-r from-brand-deep/10 via-brand-blush/30 to-brand-mist/40" />

          <div className="px-8 pb-8">
            {/* 아바타 */}
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-sm overflow-hidden bg-gradient-to-br from-brand-blush to-brand-mist flex-shrink-0">
                {profileImage ? (
                  <img src={profileImage} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">👩‍🎨</div>
                )}
              </div>
            </div>

            {/* 이름 + 지역 */}
            <div className="mb-1">
              <div className="flex items-center gap-2 mb-1">
                <Hexagon color="amber" size={13} />
                <span className="text-xs text-brand-amber font-semibold uppercase tracking-wider">Certified Instructor</span>
              </div>
              <h1 className="text-2xl font-bold text-brand-ink">{user?.name}</h1>
              {(profile as any).region && (
                <div className="flex items-center gap-1 text-sm text-brand-grey mt-0.5">
                  <MapPin size={13} />
                  {(profile as any).region}
                </div>
              )}
            </div>

            {/* 스탯 */}
            <div className="flex gap-6 my-5 py-5 border-y border-brand-mist/30">
              {stats.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-amber/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-brand-amber" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-brand-ink leading-none">{value}</p>
                    <p className="text-xs text-brand-grey mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 소개 */}
            {(profile as any).bio && (
              <p className="text-sm text-brand-ink/80 leading-relaxed whitespace-pre-line">
                {(profile as any).bio}
              </p>
            )}
          </div>
        </div>

        {/* 개설 클래스 */}
        {classesWithStats.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Hexagon color="deep" size={14} />
              <h2 className="text-lg font-bold text-brand-ink">개설 클래스</h2>
              <span className="text-sm text-brand-grey">({classesWithStats.length})</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {classesWithStats.map((cls: any) => (
                <ClassCard
                  key={cls.id}
                  id={cls.id}
                  title={cls.title}
                  region={cls.region}
                  price={cls.price}
                  thumbnail_url={cls.thumbnail_url ?? null}
                  instructorName={user?.name ?? ''}
                  confirmation_mode={cls.confirmation_mode}
                  attributes={cls.attributes ?? {}}
                  avg_rating={cls.avg_rating}
                  review_count={cls.review_count}
                  wishlisted={wishlistedSet.has(cls.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-brand-mist/30">
            <p className="text-brand-grey text-sm">아직 개설된 클래스가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  )
}
