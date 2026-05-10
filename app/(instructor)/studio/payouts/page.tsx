import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'

export default async function StudioPayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: payouts } = await supabase
    .from('payouts')
    .select('*')
    .eq('instructor_id', user.id)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-600',
    paid:    'bg-green-50 text-green-600',
    hold:    'bg-red-50 text-red-500',
  }
  const statusLabel: Record<string, string> = {
    pending: '정산 예정',
    paid: '입금 완료',
    hold: '보류',
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <h1 className="text-2xl font-bold text-brand-ink">정산 내역</h1>
        </div>
        <p className="text-brand-grey text-sm mb-6">매월 1일 전월 정산이 집계되며, 익월 5일 입금됩니다.</p>

        {!payouts || payouts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
            <div className="text-4xl mb-3">💰</div>
            <p className="text-brand-grey">정산 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payouts.map((p: any) => (
              <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-brand-ink">
                    {p.period_year}년 {p.period_month}월
                  </h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[p.status] ?? ''}`}>
                    {statusLabel[p.status] ?? p.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
                  {[
                    { label: '총 매출', value: formatPrice(p.total_gross) },
                    { label: 'PG 수수료', value: `-${formatPrice(p.total_pg_fee)}` },
                    { label: '플랫폼 수수료', value: `-${formatPrice(p.total_platform_fee)}` },
                    { label: '정산액', value: formatPrice(p.total_payout), bold: true },
                  ].map(item => (
                    <div key={item.label} className="bg-brand-bg rounded-lg p-2.5">
                      <p className="text-xs text-brand-grey">{item.label}</p>
                      <p className={`text-sm mt-0.5 ${item.bold ? 'font-bold text-brand-deep' : 'text-brand-ink'}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-brand-grey pt-3 border-t border-brand-mist/30">
                  <span>예약 {p.booking_count}건 · 주문 {p.order_count}건</span>
                  {p.paid_at && <span>입금일: {new Date(p.paid_at).toLocaleDateString('ko-KR')}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
