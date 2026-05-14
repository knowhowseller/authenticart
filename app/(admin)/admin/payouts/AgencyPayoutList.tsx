'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils/format'

interface AgencyPayout {
  id: string
  agency_id: string
  period_year: number
  period_month: number
  total_gross: number
  agency_fee: number
  instructor_count: number
  status: string
  paid_at: string | null
  agencies: { agency_name: string; contact_email: string; payout_account: { bank: string; account: string; holder: string } | null } | null
}

export default function AgencyPayoutList({ payouts: initial, mode }: { payouts: AgencyPayout[]; mode: 'pending' | 'paid' }) {
  const [list, setList] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)

  async function handlePay(ids: string[]) {
    setLoading(ids.length > 1 ? 'all' : ids[0])
    const res = await fetch('/api/admin/agency-payouts/mark-paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payout_ids: ids }),
    })
    const json = await res.json()
    setLoading(null)
    if (!res.ok) { toast.error(json.error ?? '처리 실패'); return }
    toast.success(`${ids.length}건 입금 처리 완료`)
    setList(prev => prev.filter(p => !ids.includes(p.id)))
  }

  if (list.length === 0) return (
    <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-brand-mist/30">
      <p className="text-brand-grey text-sm">대기 중인 에이전시 정산이 없습니다</p>
    </div>
  )

  return (
    <div>
      {mode === 'pending' && list.length > 1 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => handlePay(list.map(p => p.id))}
            disabled={loading !== null}
            className="px-4 py-2 text-sm font-medium bg-brand-deep text-white rounded-xl hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
          >
            {loading === 'all' ? '처리중...' : `전체 ${list.length}건 일괄 입금`}
          </button>
        </div>
      )}
      <div className="space-y-3">
        {list.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-brand-ink">{p.agencies?.agency_name ?? '에이전시'}</p>
                <p className="text-xs text-brand-grey">{p.agencies?.contact_email}</p>
                <p className="text-xs text-brand-grey mt-1">
                  {p.period_year}년 {p.period_month}월 · 소속 강사 {p.instructor_count}명
                </p>
                {p.agencies?.payout_account ? (
                  <p className="text-xs text-brand-deep font-medium mt-1">
                    {p.agencies.payout_account.bank} {p.agencies.payout_account.account} ({p.agencies.payout_account.holder})
                  </p>
                ) : (
                  <p className="text-xs text-red-500 font-medium mt-1">⚠️ 계좌 미등록</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-center mt-3">
                  {[
                    { label: '소속 강사 총 매출', value: formatPrice(p.total_gross) },
                    { label: '에이전시 수수료', value: formatPrice(p.agency_fee), bold: true },
                  ].map(item => (
                    <div key={item.label} className="bg-brand-bg rounded-lg p-2">
                      <p className="text-xs text-brand-grey">{item.label}</p>
                      <p className={`text-xs mt-0.5 ${item.bold ? 'font-bold text-brand-deep' : 'text-brand-ink'}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
                {p.paid_at && <p className="text-xs text-brand-grey mt-2">입금일: {new Date(p.paid_at).toLocaleDateString('ko-KR')}</p>}
              </div>
              {mode === 'pending' && (
                <button
                  onClick={() => handlePay([p.id])}
                  disabled={loading !== null}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-amber text-brand-ink hover:bg-brand-amber/90 disabled:opacity-50 flex-shrink-0 transition-colors"
                >
                  {loading === p.id ? '처리중...' : '입금 처리'}
                </button>
              )}
              {mode === 'paid' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 flex-shrink-0">입금 완료</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
