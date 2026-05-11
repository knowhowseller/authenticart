import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'

async function getEarningsData(userId: string) {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // 이번달 결제 완료 예약 (미정산)
  const { data: thisMonthBookings } = await supabase
    .from('bookings')
    .select(`
      id, gross_amount, instructor_payout, created_at,
      class_schedules!schedule_id(
        start_at,
        classes!class_id(id, title, instructor_id)
      )
    `)
    .eq('status', 'paid')
    .eq('payout_status', 'pending')
    .gte('created_at', monthStart)

  const myBookings = (thisMonthBookings ?? []).filter(
    (b: any) => b.class_schedules?.classes?.instructor_id === userId
  )

  // 클래스별 누적 수입 (전체)
  const { data: allBookings } = await supabase
    .from('bookings')
    .select(`
      gross_amount, instructor_payout,
      class_schedules!schedule_id(
        classes!class_id(id, title, instructor_id)
      )
    `)
    .eq('status', 'paid')

  const allMine = (allBookings ?? []).filter(
    (b: any) => b.class_schedules?.classes?.instructor_id === userId
  )

  const byClass = allMine.reduce((acc: Record<string, { title: string; gross: number; payout: number; count: number }>, b: any) => {
    const cls = b.class_schedules?.classes
    if (!cls) return acc
    if (!acc[cls.id]) acc[cls.id] = { title: cls.title, gross: 0, payout: 0, count: 0 }
    acc[cls.id].gross += b.gross_amount ?? 0
    acc[cls.id].payout += b.instructor_payout ?? 0
    acc[cls.id].count += 1
    return acc
  }, {})

  // 누적 정산 수령액
  const { data: payouts } = await supabase
    .from('payouts')
    .select('total_payout, total_gross, period_year, period_month, status')
    .eq('instructor_id', userId)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })

  const totalReceived = (payouts ?? [])
    .filter((p: any) => p.status === 'paid')
    .reduce((s: number, p: any) => s + (p.total_payout ?? 0), 0)

  const thisMonthGross = myBookings.reduce((s: number, b: any) => s + (b.gross_amount ?? 0), 0)
  const thisMonthPayout = myBookings.reduce((s: number, b: any) => s + (b.instructor_payout ?? 0), 0)

  return {
    thisMonthBookings: myBookings,
    thisMonthGross,
    thisMonthPayout,
    byClass: Object.entries(byClass).sort((a, b) => b[1].payout - a[1].payout),
    totalReceived,
    payouts: payouts ?? [],
  }
}

export default async function StudioEarningsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['instructor', 'admin'].includes(userData?.role ?? '')) redirect('/')

  const data = await getEarningsData(user.id)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="deep" size={16} />
          <span className="text-xs font-medium text-brand-deep uppercase tracking-wider">Studio</span>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <Link href="/studio" className="text-sm text-brand-grey hover:text-brand-ink">← 스튜디오</Link>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-8">수입 현황</h1>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: '이번달 매출(총)', value: formatPrice(data.thisMonthGross), sub: `${data.thisMonthBookings.length}건`, color: 'text-brand-ink' },
            { label: '이번달 정산 예정', value: formatPrice(data.thisMonthPayout), sub: 'PG·플랫폼 수수료 제외', color: 'text-brand-deep' },
            { label: '누적 정산 수령액', value: formatPrice(data.totalReceived), sub: '입금 완료 기준', color: 'text-green-600' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
              <p className="text-xs text-brand-grey mb-1">{c.label}</p>
              <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-brand-grey mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* 이번달 예약 목록 */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-brand-ink mb-3">
            이번달 미정산 예약{' '}
            <span className="text-brand-grey font-normal">({data.thisMonthBookings.length}건)</span>
          </h2>
          {data.thisMonthBookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-brand-mist/30">
              <p className="text-brand-grey text-sm">이번달 예약이 없습니다</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-brand-bg border-b border-brand-mist/30">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-grey">클래스</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-grey">일정</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-brand-grey">결제금액</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-brand-grey">정산예정</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-mist/20">
                  {data.thisMonthBookings.map((b: any) => (
                    <tr key={b.id}>
                      <td className="px-4 py-3 text-brand-ink truncate max-w-[160px]">
                        {b.class_schedules?.classes?.title ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-brand-grey text-xs">
                        {b.class_schedules?.start_at
                          ? new Date(b.class_schedules.start_at).toLocaleDateString('ko-KR')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-brand-ink">{formatPrice(b.gross_amount)}</td>
                      <td className="px-4 py-3 text-right font-medium text-brand-deep">{formatPrice(b.instructor_payout)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-brand-bg border-t border-brand-mist/30">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-xs font-medium text-brand-grey">합계</td>
                    <td className="px-4 py-3 text-right font-medium text-brand-ink">{formatPrice(data.thisMonthGross)}</td>
                    <td className="px-4 py-3 text-right font-bold text-brand-deep">{formatPrice(data.thisMonthPayout)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* 클래스별 누적 수입 */}
        {data.byClass.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-brand-ink mb-3">클래스별 누적 수입</h2>
            <div className="space-y-2">
              {data.byClass.map(([id, c]) => (
                <div key={id} className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-ink truncate">{c.title}</p>
                      <p className="text-xs text-brand-grey mt-0.5">예약 {c.count}건 · 총 매출 {formatPrice(c.gross)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-brand-deep">{formatPrice(c.payout)}</p>
                      <p className="text-xs text-brand-grey">정산액</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 정산 내역 바로가기 */}
        <Link href="/studio/payouts"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 hover:border-brand-deep/30 hover:shadow-md transition-all">
          <div>
            <p className="font-semibold text-brand-ink text-sm">월별 정산 내역 보기</p>
            <p className="text-xs text-brand-grey mt-0.5">확정된 정산 내역 및 입금 현황</p>
          </div>
          <span className="text-brand-grey">→</span>
        </Link>
      </div>
    </div>
  )
}
