import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'
import { Users, BookOpen, TrendingUp, Clock } from 'lucide-react'

async function getBranchStats(userId: string) {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // 내 지부 정보
  const { data: branch } = await supabase
    .from('branches')
    .select('id, name, region, commission_rate')
    .eq('manager_id', userId)
    .single()

  if (!branch) return null

  // 지부 소속 강사 목록
  const { data: instructors } = await supabase
    .from('instructor_profiles')
    .select('instructor_id, status, users!instructor_id(name, email)')
    .eq('branch_id', branch.id)

  const instructorIds = (instructors ?? []).map((i: any) => i.instructor_id)
  const activeCount = (instructors ?? []).filter((i: any) => i.status === 'approved').length

  // 이번달 지부 GMV
  let monthGmv = 0
  if (instructorIds.length > 0) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('gross_amount, class_schedules!schedule_id(classes!class_id(instructor_id))')
      .eq('status', 'paid')
      .gte('created_at', monthStart)

    monthGmv = (bookings ?? [])
      .filter((b: any) => instructorIds.includes(b.class_schedules?.classes?.instructor_id))
      .reduce((s: number, b: any) => s + (b.gross_amount ?? 0), 0)
  }

  // 진행 중 클래스 수
  const { count: activeClasses } = await supabase
    .from('classes')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .in('instructor_id', instructorIds.length > 0 ? instructorIds : ['none'])

  // 신규 강사 신청 대기
  const { count: pendingInstructors } = await supabase
    .from('instructor_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('branch_id', branch.id)

  return {
    branch,
    instructors: instructors ?? [],
    activeCount,
    monthGmv,
    activeClasses: activeClasses ?? 0,
    pendingInstructors: pendingInstructors ?? 0,
  }
}

export default async function BranchPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('role, name').eq('id', user.id).single()
  if (!['branch_manager', 'admin'].includes(userData?.role ?? '')) redirect('/')

  const stats = await getBranchStats(user.id)
  if (!stats) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-brand-grey mb-2">담당 지부가 배정되지 않았습니다.</p>
          <p className="text-xs text-brand-grey">관리자에게 문의해주세요.</p>
        </div>
      </div>
    )
  }

  const kpis = [
    { title: '이번달 GMV', value: formatPrice(stats.monthGmv), icon: TrendingUp, color: 'text-brand-deep', bg: 'bg-brand-deep/5', href: '/branch/instructors' },
    { title: '활성 강사', value: `${stats.activeCount}명`, icon: Users, color: 'text-green-600', bg: 'bg-green-50', href: '/branch/instructors' },
    { title: '진행 중 클래스', value: `${stats.activeClasses}개`, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', href: '/branch/instructors' },
    { title: '강사 신청 대기', value: `${stats.pendingInstructors}건`, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', href: '/branch/instructors', urgent: stats.pendingInstructors > 0 },
  ]

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Branch</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-1">지부 대시보드</h1>
        <p className="text-brand-grey text-sm mb-8">
          {stats.branch.name} ({stats.branch.region}) · 안녕하세요, {userData?.name}님
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {kpis.map(k => (
            <Link key={k.title} href={k.href}
              className={`bg-white rounded-2xl p-5 shadow-sm border ${(k as any).urgent ? 'border-orange-300' : 'border-brand-mist/30'} hover:shadow-md transition-all`}>
              <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
                <k.icon size={18} className={k.color} />
              </div>
              <p className="text-xs text-brand-grey mb-1">{k.title}</p>
              <p className={`text-lg font-bold ${(k as any).urgent ? 'text-orange-500' : 'text-brand-ink'}`}>{k.value}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/branch/instructors"
            className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 hover:shadow-md hover:border-brand-deep/30 transition-all">
            <div className="text-2xl mb-2">👩‍🎨</div>
            <h3 className="font-semibold text-brand-ink text-sm">강사 관리</h3>
            <p className="text-xs text-brand-grey mt-0.5">소속 강사 현황 및 신청 검토</p>
          </Link>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 opacity-50">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-brand-ink text-sm">지부 매출 리포트</h3>
            <p className="text-xs text-brand-grey mt-0.5">준비 중</p>
          </div>
        </div>
      </div>
    </div>
  )
}
