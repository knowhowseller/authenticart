import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice, formatDateTime } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'
import { BookOpen, Calendar, Clock, TrendingUp, Star, Users } from 'lucide-react'

async function getStudioStats(userId: string) {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [monthRevenue, upcomingSchedules, pendingRequests, pendingPayout, reviewStats] = await Promise.all([
    supabase
      .from('bookings')
      .select('instructor_payout, class_schedules!schedule_id(classes!class_id(instructor_id))')
      .eq('status', 'paid')
      .gte('created_at', monthStart)
      .then(({ data }) =>
        (data ?? [])
          .filter((b: any) => b.class_schedules?.classes?.instructor_id === userId)
          .reduce((sum: number, b: any) => sum + (b.instructor_payout ?? 0), 0)
      ),

    supabase
      .from('class_schedules')
      .select('id, start_at, booked_count, max_students, classes!class_id(id, title, instructor_id)')
      .gte('start_at', now.toISOString())
      .order('start_at', { ascending: true })
      .limit(10)
      .then(({ data }) => (data ?? []).filter((s: any) => s.classes?.instructor_id === userId).slice(0, 5)),

    supabase
      .from('bookings')
      .select('id, class_schedules!schedule_id(classes!class_id(instructor_id))')
      .eq('status', 'pending_approval')
      .then(({ data }) =>
        (data ?? []).filter((b: any) => b.class_schedules?.classes?.instructor_id === userId).length
      ),

    supabase
      .from('bookings')
      .select('instructor_payout, class_schedules!schedule_id(classes!class_id(instructor_id))')
      .eq('payout_status', 'pending')
      .eq('status', 'paid')
      .then(({ data }) =>
        (data ?? [])
          .filter((b: any) => b.class_schedules?.classes?.instructor_id === userId)
          .reduce((sum: number, b: any) => sum + (b.instructor_payout ?? 0), 0)
      ),

    supabase
      .from('classes')
      .select('id, class_reviews(rating)')
      .eq('instructor_id', userId)
      .eq('status', 'published')
      .then(({ data }) => {
        const allReviews = (data ?? []).flatMap((c: any) => c.class_reviews ?? [])
        const count = allReviews.length
        const avg = count > 0 ? allReviews.reduce((s: number, r: any) => s + r.rating, 0) / count : null
        return { count, avg }
      }),
  ])

  return { monthRevenue, upcomingSchedules, pendingRequests, pendingPayout, reviewStats }
}

export default async function StudioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('role, name').eq('id', user.id).single()
  if (!['instructor', 'admin'].includes(userData?.role ?? '')) redirect('/')

  const stats = await getStudioStats(user.id)

  const cards = [
    {
      title: '이번달 매출',
      value: formatPrice(stats.monthRevenue),
      icon: TrendingUp, color: 'text-brand-deep', bg: 'bg-brand-deep/5',
      href: '/studio/payouts',
    },
    {
      title: '예정 클래스',
      value: `${(stats.upcomingSchedules as any[]).length}개`,
      icon: Calendar, color: 'text-green-600', bg: 'bg-green-50',
      href: '/studio/schedules',
    },
    {
      title: '신청 대기',
      value: `${stats.pendingRequests}건`,
      icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50',
      href: '/studio/requests',
      urgent: stats.pendingRequests > 0,
    },
    {
      title: '정산 예정액',
      value: formatPrice(stats.pendingPayout),
      icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50',
      href: '/studio/payouts',
    },
  ]

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="deep" size={16} />
          <span className="text-xs font-medium text-brand-deep uppercase tracking-wider">Studio</span>
        </div>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-brand-ink">스튜디오</h1>
            <p className="text-brand-grey text-sm mt-0.5">안녕하세요, {userData?.name}님</p>
          </div>
          {stats.reviewStats.avg && (
            <div className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-2 shadow-sm border border-brand-mist/30">
              <Star size={13} className="text-brand-amber fill-brand-amber" />
              <span className="text-sm font-bold text-brand-ink">{stats.reviewStats.avg.toFixed(1)}</span>
              <span className="text-xs text-brand-grey">후기 {stats.reviewStats.count}개</span>
            </div>
          )}
        </div>

        {/* 대기 알림 */}
        {stats.pendingRequests > 0 && (
          <Link href="/studio/requests"
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-orange-200 bg-orange-50 text-sm font-medium text-orange-600 mb-6 hover:shadow-sm transition-all"
          >
            <Clock size={15} />
            예약 신청 {stats.pendingRequests}건이 승인을 기다리고 있습니다 (24시간 내 응답)
            <span className="ml-auto text-xs opacity-60">바로 처리하기 →</span>
          </Link>
        )}

        {/* 스탯 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`bg-white rounded-2xl p-5 shadow-sm border ${card.urgent ? 'border-orange-300' : 'border-brand-mist/30'} hover:shadow-md transition-all`}
            >
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <card.icon size={18} className={card.color} />
              </div>
              <p className="text-xs text-brand-grey mb-1">{card.title}</p>
              <p className={`text-lg font-bold ${card.urgent ? 'text-orange-500' : 'text-brand-ink'}`}>
                {card.value}
              </p>
            </Link>
          ))}
        </div>

        {/* 예정 일정 */}
        {(stats.upcomingSchedules as any[]).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 mb-6">
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-mist/30">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-brand-grey" />
                <span className="text-sm font-semibold text-brand-ink">다가오는 일정</span>
              </div>
              <Link href="/studio/schedules" className="text-xs text-brand-grey hover:text-brand-deep">전체보기</Link>
            </div>
            <div className="divide-y divide-brand-mist/20">
              {(stats.upcomingSchedules as any[]).map((s: any) => {
                const booked = s.booked_count ?? 0
                const max = s.max_students ?? 0
                const fillRate = max > 0 ? Math.round((booked / max) * 100) : 0
                return (
                  <Link key={s.id} href="/studio/schedules"
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-brand-bg/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-ink truncate">{s.classes?.title}</p>
                      <p className="text-xs text-brand-grey mt-0.5">{formatDateTime(s.start_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-brand-grey">
                        <Users size={11} />
                        {booked}/{max}
                      </div>
                      <div className="w-16 h-1.5 bg-brand-mist/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${fillRate >= 80 ? 'bg-red-400' : fillRate >= 50 ? 'bg-brand-amber' : 'bg-green-400'}`}
                          style={{ width: `${fillRate}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/studio/classes/new', label: '새 클래스 등록', icon: '✏️' },
            { href: '/studio/schedules', label: '회차 관리', icon: '🗓️' },
            { href: '/studio/requests', label: '예약 신청 관리', icon: '📬' },
            { href: '/studio/reviews', label: '수강 후기 관리', icon: '⭐' },
            { href: '/studio/payouts', label: '정산 조회', icon: '💰' },
            { href: '/studio/earnings', label: '수입 현황', icon: '📈' },
            { href: '/studio/class-requests', label: '클래스 요청 관리', icon: '🙋' },
            { href: '/studio/settings', label: '프로필 & 계좌', icon: '⚙️' },
          ].map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-xl p-4 text-center shadow-sm border border-brand-mist/30 hover:border-brand-deep/30 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-1.5">{icon}</div>
              <p className="text-sm font-medium text-brand-ink">{label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
