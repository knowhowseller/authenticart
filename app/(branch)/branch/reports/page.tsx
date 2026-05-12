import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'
import Link from 'next/link'

async function getBranchMonthlyReport(userId: string) {
  const supabase = await createClient()
  const { data: branch } = await supabase
    .from('branches')
    .select('id, name, region, commission_rate')
    .eq('manager_id', userId)
    .single()
  if (!branch) return null

  const { data: instructors } = await supabase
    .from('instructor_profiles')
    .select('instructor_id, users!instructor_id(name)')
    .eq('branch_id', branch.id)
    .eq('status', 'approved')
  const instructorIds = (instructors ?? []).map((i: any) => i.instructor_id)

  if (instructorIds.length === 0) return { branch, months: [], instructors: [] }

  const { data: payouts } = await supabase
    .from('payouts')
    .select('period_year, period_month, total_gross, total_payout, booking_count, instructor_id, status')
    .in('instructor_id', instructorIds)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })
    .limit(120)

  const monthMap: Record<string, { year: number; month: number; gmv: number; payout: number; bookings: number; commissionEst: number }> = {}
  for (const p of payouts ?? []) {
    const key = `${p.period_year}-${p.period_month}`
    if (!monthMap[key]) {
      monthMap[key] = { year: p.period_year, month: p.period_month, gmv: 0, payout: 0, bookings: 0, commissionEst: 0 }
    }
    monthMap[key].gmv += p.total_gross
    monthMap[key].payout += p.total_payout
    monthMap[key].bookings += p.booking_count
  }
  const months = Object.values(monthMap).slice(0, 12)

  return { branch, months, instructors: instructors ?? [] }
}

export default async function BranchReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['branch_manager', 'admin'].includes(u?.role ?? '')) redirect('/')

  const report = await getBranchMonthlyReport(user.id)
  if (!report) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <p className="text-brand-grey text-sm">담당 지부가 없습니다</p>
      </div>
    )
  }

  const totalGmv = report.months.reduce((s, m) => s + m.gmv, 0)
  const totalBookings = report.months.reduce((s, m) => s + m.bookings, 0)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Branch</span>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <Link href="/branch" className="text-sm text-brand-grey hover:text-brand-ink">← 대시보드</Link>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-1">매출 리포트</h1>
        <p className="text-brand-grey text-sm mb-8">{report.branch.name} ({report.branch.region})</p>

        {/* 요약 KPI */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: '총 누적 GMV', value: formatPrice(totalGmv), sub: '최근 12개월' },
            { label: '총 예약 건수', value: `${totalBookings}건`, sub: '최근 12개월' },
            { label: '소속 강사', value: `${report.instructors.length}명`, sub: '활성 강사' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
              <p className="text-xs text-brand-grey mb-1">{k.label}</p>
              <p className="text-lg font-bold text-brand-ink">{k.value}</p>
              <p className="text-xs text-brand-grey mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* 월별 매출 테이블 */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-brand-mist/30">
            <h2 className="text-sm font-semibold text-brand-ink">월별 매출 현황</h2>
          </div>
          {report.months.length === 0 ? (
            <p className="text-center py-12 text-brand-grey text-sm">데이터가 없습니다</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-bg">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-brand-grey">기간</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-brand-grey">GMV</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-brand-grey">강사 정산액</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-brand-grey">예약 건수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-mist/20">
                  {report.months.map(m => (
                    <tr key={`${m.year}-${m.month}`} className="hover:bg-brand-bg/50">
                      <td className="px-6 py-3 font-medium text-brand-ink">{m.year}년 {m.month}월</td>
                      <td className="px-4 py-3 text-right font-semibold text-brand-deep">{formatPrice(m.gmv)}</td>
                      <td className="px-4 py-3 text-right text-brand-grey">{formatPrice(m.payout)}</td>
                      <td className="px-4 py-3 text-right text-brand-grey">{m.bookings}건</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 강사별 현황 */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-mist/30">
            <h2 className="text-sm font-semibold text-brand-ink">소속 강사</h2>
          </div>
          {report.instructors.length === 0 ? (
            <p className="text-center py-8 text-brand-grey text-sm">소속 강사가 없습니다</p>
          ) : (
            <div className="divide-y divide-brand-mist/20">
              {report.instructors.map((i: any) => (
                <div key={i.instructor_id} className="flex items-center justify-between px-6 py-3">
                  <p className="text-sm font-medium text-brand-ink">{i.users?.name}</p>
                  <Link href={`/instructors/${i.instructor_id}`}
                    className="text-xs text-brand-deep hover:underline">
                    프로필 보기
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
