import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice, formatDateTime } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'
import {
  Users, BookOpen, ShoppingBag, TrendingUp,
  Clock, AlertCircle, Package, BarChart3,
} from 'lucide-react'

async function getAdminStats() {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const [
    userCount, instructorCount, classCount,
    pendingInstructors, pendingClasses,
    monthGmv, prevMonthGmv,
    monthOrderGmv,
    pendingBookings, recentBookings, recentOrders,
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true })
      .then(r => r.count ?? 0),
    supabase.from('instructor_profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved')
      .then(r => r.count ?? 0),
    supabase.from('classes').select('id', { count: 'exact', head: true }).eq('status', 'published')
      .then(r => r.count ?? 0),
    supabase.from('instructor_profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      .then(r => r.count ?? 0),
    supabase.from('classes').select('id', { count: 'exact', head: true }).eq('status', 'draft')
      .then(r => r.count ?? 0),
    supabase.from('bookings').select('gross_amount').in('status', ['paid', 'completed']).gte('created_at', monthStart)
      .then(({ data }) => (data ?? []).reduce((s: number, b: any) => s + b.gross_amount, 0)),
    supabase.from('bookings').select('gross_amount').in('status', ['paid', 'completed'])
      .gte('created_at', prevMonthStart).lt('created_at', monthStart)
      .then(({ data }) => (data ?? []).reduce((s: number, b: any) => s + b.gross_amount, 0)),
    supabase.from('orders').select('total_amount').in('status', ['paid', 'shipped', 'delivered']).gte('created_at', monthStart)
      .then(({ data }) => (data ?? []).reduce((s: number, o: any) => s + o.total_amount, 0)),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending_approval')
      .then(r => r.count ?? 0),
    supabase.from('bookings')
      .select('id, status, gross_amount, created_at, class_schedules!schedule_id(classes!class_id(title))')
      .order('created_at', { ascending: false }).limit(5)
      .then(r => r.data ?? []),
    supabase.from('orders')
      .select('id, status, total_amount, created_at, users!user_id(name)')
      .order('created_at', { ascending: false }).limit(5)
      .then(r => r.data ?? []),
  ])

  const gmvChange = prevMonthGmv > 0
    ? Math.round(((monthGmv - prevMonthGmv) / prevMonthGmv) * 100)
    : null

  return {
    userCount, instructorCount, classCount,
    pendingInstructors, pendingClasses,
    monthGmv, gmvChange, monthOrderGmv,
    pendingBookings, recentBookings, recentOrders,
  }
}

const bookingStatusColor: Record<string, string> = {
  pending_approval: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  approved: 'bg-blue-50 text-blue-600 border-blue-200',
  paid: 'bg-green-50 text-green-600 border-green-200',
  completed: 'bg-brand-deep/5 text-brand-deep border-brand-deep/20',
  rejected: 'bg-red-50 text-red-500 border-red-200',
  cancelled: 'bg-brand-bg text-brand-grey border-brand-mist',
  refunded: 'bg-purple-50 text-purple-600 border-purple-200',
}

const bookingStatusLabel: Record<string, string> = {
  pending_approval: '승인 대기',
  approved: '결제 대기',
  paid: '결제 완료',
  completed: '완료',
  rejected: '거절',
  cancelled: '취소',
  refunded: '환불',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') redirect('/')

  const stats = await getAdminStats()

  const kpis = [
    {
      title: '전체 회원', value: `${stats.userCount}명`,
      icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', href: '/admin/users',
    },
    {
      title: '승인 강사', value: `${stats.instructorCount}명`,
      icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50', href: '/admin/instructors',
      badge: stats.pendingInstructors > 0 ? `+${stats.pendingInstructors} 대기` : null,
    },
    {
      title: '게시 클래스', value: `${stats.classCount}개`,
      icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-50', href: '/admin/classes',
      badge: stats.pendingClasses > 0 ? `+${stats.pendingClasses} 검수` : null,
    },
    {
      title: '이번달 클래스 GMV', value: formatPrice(stats.monthGmv),
      icon: TrendingUp, color: 'text-brand-deep', bg: 'bg-brand-deep/5', href: '/admin/bookings',
      change: stats.gmvChange,
    },
  ]

  const alerts = [
    stats.pendingInstructors > 0 && {
      href: '/admin/instructors',
      icon: AlertCircle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 border-yellow-200',
      text: `강사 신청 ${stats.pendingInstructors}건 승인 대기 중`,
    },
    stats.pendingClasses > 0 && {
      href: '/admin/classes',
      icon: Clock,
      color: 'text-orange-500',
      bg: 'bg-orange-50 border-orange-200',
      text: `클래스 ${stats.pendingClasses}개 검수 대기 중`,
    },
    stats.pendingBookings > 0 && {
      href: '/admin/bookings',
      icon: AlertCircle,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200',
      text: `예약 ${stats.pendingBookings}건 승인 대기 중`,
    },
  ].filter(Boolean) as any[]

  const menus = [
    { href: '/admin/users', label: '회원 관리', icon: '👥', desc: '회원 목록 조회 및 역할 변경' },
    { href: '/admin/instructors', label: '강사 승인 관리', icon: '👩‍🎨', desc: '신규 강사 신청 검토 및 승인' },
    { href: '/admin/classes', label: '클래스 검수', icon: '📋', desc: 'draft 클래스 검수 및 게시' },
    { href: '/admin/bookings', label: '예약 관리', icon: '📅', desc: '전체 예약 현황 조회' },
    { href: '/admin/orders', label: '주문 관리', icon: '📦', desc: '전체 주문 현황 및 배송' },
    { href: '/admin/payouts', label: '정산 실행', icon: '💰', desc: '월별 정산 처리 및 입금' },
    { href: '/admin/products', label: '상품 관리', icon: '🛍️', desc: '상품 등록 및 재고 관리' },
    { href: '/admin/branches', label: '지부 관리', icon: '🏢', desc: '지부 생성 및 지부장 지정' },
  ]

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-6">관리자 대시보드</h1>

        {/* 알림 배너 */}
        {alerts.length > 0 && (
          <div className="space-y-2 mb-6">
            {alerts.map((a: any, i: number) => (
              <Link key={i} href={a.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:shadow-sm ${a.bg}`}
              >
                <a.icon size={15} className={a.color} />
                <span className={a.color}>{a.text}</span>
                <span className="ml-auto text-xs opacity-60">확인하기 →</span>
              </Link>
            ))}
          </div>
        )}

        {/* KPI 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {kpis.map(k => (
            <Link key={k.title} href={k.href}
              className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 hover:shadow-md transition-all relative overflow-hidden"
            >
              {k.badge && (
                <span className="absolute top-3 right-3 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                  {k.badge}
                </span>
              )}
              <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
                <k.icon size={18} className={k.color} />
              </div>
              <p className="text-xs text-brand-grey mb-1">{k.title}</p>
              <p className="text-lg font-bold text-brand-ink leading-tight">{k.value}</p>
              {k.change !== undefined && k.change !== null && (
                <p className={`text-xs mt-1 font-medium ${k.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {k.change >= 0 ? '▲' : '▼'} {Math.abs(k.change)}% 전월 대비
                </p>
              )}
            </Link>
          ))}
        </div>

        {/* 이번달 주문 GMV */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Package size={14} className="text-brand-grey" />
            <span className="text-xs text-brand-grey font-medium">이번달 샵 주문 GMV</span>
          </div>
          <p className="text-xl font-bold text-brand-ink">{formatPrice(stats.monthOrderGmv)}</p>
        </div>

        {/* 최근 활동 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 최근 예약 */}
          <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30">
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-mist/30">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-brand-grey" />
                <span className="text-sm font-semibold text-brand-ink">최근 예약</span>
              </div>
              <Link href="/admin/bookings" className="text-xs text-brand-grey hover:text-brand-deep">전체보기</Link>
            </div>
            <div className="divide-y divide-brand-mist/20">
              {stats.recentBookings.length === 0 ? (
                <p className="text-xs text-brand-grey text-center py-6">예약 없음</p>
              ) : stats.recentBookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-brand-ink truncate">
                      {(b as any).class_schedules?.classes?.title ?? '-'}
                    </p>
                    <p className="text-xs text-brand-grey">{formatDateTime(b.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border ${bookingStatusColor[b.status] ?? 'bg-brand-bg text-brand-grey border-brand-mist'}`}>
                      {bookingStatusLabel[b.status] ?? b.status}
                    </span>
                    <span className="text-xs font-semibold text-brand-deep">{formatPrice(b.gross_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 최근 주문 */}
          <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30">
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-mist/30">
              <div className="flex items-center gap-2">
                <Package size={14} className="text-brand-grey" />
                <span className="text-sm font-semibold text-brand-ink">최근 주문</span>
              </div>
              <Link href="/admin/orders" className="text-xs text-brand-grey hover:text-brand-deep">전체보기</Link>
            </div>
            <div className="divide-y divide-brand-mist/20">
              {stats.recentOrders.length === 0 ? (
                <p className="text-xs text-brand-grey text-center py-6">주문 없음</p>
              ) : stats.recentOrders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-brand-ink truncate">
                      {o.users?.name ?? '비회원'}
                    </p>
                    <p className="text-xs text-brand-grey">{formatDateTime(o.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-xs text-brand-grey">{o.status}</span>
                    <span className="text-xs font-semibold text-brand-deep">{formatPrice(o.total_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 메뉴 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {menus.map(m => (
            <Link key={m.href} href={m.href}
              className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 hover:shadow-md hover:border-brand-deep/30 transition-all"
            >
              <div className="text-2xl mb-2">{m.icon}</div>
              <h3 className="font-semibold text-brand-ink text-sm">{m.label}</h3>
              <p className="text-xs text-brand-grey mt-0.5">{m.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
