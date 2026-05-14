'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils/format'

interface BranchPayout {
  id: string
  branch_id: string
  period_year: number
  period_month: number
  total_platform_fee: number
  branch_share: number
  hq_share: number
  booking_count: number
  status: string
  paid_at: string | null
  branches: { name: string; manager_id: string; users?: { name: string; email: string } | null } | null
}

export default function BranchPayoutList({ payouts: initial, mode }: { payouts: BranchPayout[]; mode: 'pending' | 'paid' }) {
  const [list, setList] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)

  async function handlePay(ids: string[]) {
    setLoading(ids.length > 1 ? 'all' : ids[0])
    const res = await fetch('/api/admin/branch-payouts/mark-paid', {
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
      <p className="text-brand-grey text-sm">대기 중인 지부 정산이 없습니다</p>
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
                <p className="font-semibold text-brand-ink">{p.branches?.name ?? '지부'}</p>
                <p className="text-xs text-brand-grey mt-1">
                  {p.period_year}년 {p.period_month}월 · 예약 {p.booking_count}건
                </p>
                <div className="grid grid-cols-3 gap-2 text-center mt-3">
                  {[
                    { label: '총 플랫폼 수수료', value: formatPrice(p.total_platform_fee) },
                    { label: '지부 배분 (30%)', value: formatPrice(p.branch_share), bold: true },
                    { label: '본사 귀속 (70%)', value: formatPrice(p.hq_share) },
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
