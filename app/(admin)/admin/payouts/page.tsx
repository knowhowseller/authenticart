import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'
import PayoutProcessList from './PayoutProcessList'

export default async function AdminPayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') redirect('/')

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const { data: pending } = await supabase
    .from('payouts')
    .select('*, users!instructor_id(name, email), instructor_profiles!instructor_id(payout_account)')
    .eq('status', 'pending')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })

  const { data: recentPaid } = await supabase
    .from('payouts')
    .select('*, users!instructor_id(name, email), instructor_profiles!instructor_id(payout_account)')
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })
    .limit(30)

  const totalPending = (pending ?? []).reduce((s: number, p: any) => s + p.total_payout, 0)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-8">정산 실행</h1>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-brand-grey mb-1">대기 중 총 정산액</p>
            <p className="text-2xl font-bold text-brand-ink">{formatPrice(totalPending)}</p>
            <p className="text-xs text-brand-grey mt-1">{pending?.length ?? 0}명 강사</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-brand-grey">{currentYear}년 {currentMonth}월</p>
            <p className="text-xs text-brand-grey mt-0.5">매월 5일 일괄 입금</p>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold text-brand-ink">정산 대기</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600">
              {pending?.length ?? 0}건
            </span>
          </div>
          {pending && pending.length > 0 ? (
            <PayoutProcessList payouts={pending} mode="pending" />
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-brand-mist/30">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-brand-grey text-sm">대기 중인 정산이 없습니다</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-brand-ink mb-4">최근 입금 완료</p>
          {recentPaid && recentPaid.length > 0 ? (
            <PayoutProcessList payouts={recentPaid} mode="paid" />
          ) : (
            <p className="text-brand-grey text-sm">없음</p>
          )}
        </div>
      </div>
    </div>
  )
}
