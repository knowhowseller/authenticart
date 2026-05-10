import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'
import { BookOpen, Calendar, Clock, TrendingUp } from 'lucide-react'

async function getStudioStats(userId: string) {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [monthRevenue, upcomingClasses, pendingRequests, pendingPayout] = await Promise.all([
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
      .select('id, start_at, classes!class_id(title, instructor_id)')
      .gte('start_at', now.toISOString())
      .order('start_at', { ascending: true })
      .limit(5)
      .then(({ data }) => (data ?? []).filter((s: any) => s.classes?.instructor_id === userId)),

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
  ])

  return { monthRevenue, upcomingClasses, pendingRequests, pendingPayout }
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
      icon: TrendingUp,
      color: 'text-brand-deep',
      bg: 'bg-brand-deep/5',
      href: '/studio/payouts',
    },
    {
      title: '예정 클래스',
      value: `${(stats.upcomingClasses as any[]).length}개`,
      icon: Calendar,
      color: 'text-green-600',
      bg: 'bg-green-50',
      href: '/studio/schedules',
    },
    {
      title: '신청 대기',
      value: `${stats.pendingRequests}건`,
      icon: Clock,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      href: '/studio/requests',
      urgent: stats.pendingRequests > 0,
    },
    {
      title: '정산 예정액',
      value: formatPrice(stats.pendingPayout),
      icon: BookOpen,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
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
        <h1 className="text-2xl font-bold text-brand-ink mb-1">스튜디오</h1>
        <p className="text-brand-grey text-sm mb-8">안녕하세요, {userData?.name}님</p>

        {/* 스탯 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
              {card.urgent && (
                <p className="text-xs text-orange-500 mt-1 font-medium">24h 응답 필요</p>
              )}
            </Link>
          ))}
        </div>

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/studio/classes/new', label: '새 클래스 등록', icon: '✏️' },
            { href: '/studio/schedules', label: '회차 관리', icon: '🗓️' },
            { href: '/studio/requests', label: '예약 신청 관리', icon: '📬' },
            { href: '/studio/payouts', label: '정산 조회', icon: '💰' },
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
