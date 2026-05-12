'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils/format'
import { Download } from 'lucide-react'

interface PayoutItem {
  id: string
  instructor_id: string
  period_year: number
  period_month: number
  total_gross: number
  total_pg_fee: number
  total_platform_fee: number
  total_payout: number
  booking_count: number
  order_count: number
  status: string
  paid_at: string | null
  users: { name: string; email: string } | null
  instructor_profiles: { payout_account: { bank: string; account: string; holder: string } | null } | null
}

export default function PayoutProcessList({
  payouts,
  mode,
}: {
  payouts: PayoutItem[]
  mode: 'pending' | 'paid'
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [list, setList] = useState(payouts)

  function downloadCSV() {
    const header = ['강사명', '이메일', '기간', '총매출', 'PG수수료', '플랫폼수수료', '정산액', '예약건수', '은행', '계좌번호', '예금주', '상태', '입금일']
    const rows = list.map(p => [
      p.users?.name ?? '',
      p.users?.email ?? '',
      `${p.period_year}년 ${p.period_month}월`,
      p.total_gross,
      p.total_pg_fee,
      p.total_platform_fee,
      p.total_payout,
      p.booking_count,
      p.instructor_profiles?.payout_account?.bank ?? '',
      p.instructor_profiles?.payout_account?.account ?? '',
      p.instructor_profiles?.payout_account?.holder ?? '',
      p.status,
      p.paid_at ? new Date(p.paid_at).toLocaleDateString('ko-KR') : '',
    ])
    const csvContent = [header, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `정산내역_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handlePay(payoutId: string) {
    setLoading(payoutId)
    const res = await fetch('/api/admin/payouts/mark-paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payout_id: payoutId }),
    })
    const json = await res.json()
    setLoading(null)

    if (!res.ok) {
      toast.error(json.error ?? '처리 실패')
      return
    }
    toast.success('입금 처리 완료')
    setList(prev => prev.filter(p => p.id !== payoutId))
  }

  async function handlePayAll() {
    const pendingIds = list.map(p => p.id)
    if (pendingIds.length === 0) return

    setLoading('all')
    const res = await fetch('/api/admin/payouts/mark-paid-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payout_ids: pendingIds }),
    })
    const json = await res.json()
    setLoading(null)

    if (!res.ok) {
      toast.error(json.error ?? '처리 실패')
      return
    }
    toast.success(`${pendingIds.length}건 일괄 입금 처리 완료`)
    setList([])
  }

  if (list.length === 0) return null

  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <button
          onClick={downloadCSV}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-brand-mist text-brand-grey hover:text-brand-ink hover:border-brand-deep/30 transition-colors"
        >
          <Download size={14} /> CSV 내보내기
        </button>
        {mode === 'pending' && list.length > 1 && (
          <button
            onClick={handlePayAll}
            disabled={loading !== null}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-brand-deep text-white hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
          >
            {loading === 'all' ? '처리중...' : `전체 ${list.length}건 일괄 입금`}
          </button>
        )}
      </div>
      <div className="space-y-3">
        {list.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-brand-ink">{p.users?.name ?? '이름 없음'}</p>
                  <span className="text-xs text-brand-grey">{p.users?.email}</span>
                </div>
                <p className="text-xs text-brand-grey mb-2">
                  {p.period_year}년 {p.period_month}월 · 예약 {p.booking_count}건 · 주문 {p.order_count}건
                </p>
                {p.instructor_profiles?.payout_account ? (
                  <p className="text-xs text-brand-deep mb-3 font-medium">
                    {p.instructor_profiles.payout_account.bank}{' '}
                    {p.instructor_profiles.payout_account.account}{' '}
                    ({p.instructor_profiles.payout_account.holder})
                  </p>
                ) : (
                  <p className="text-xs text-red-500 mb-3 font-medium">⚠️ 계좌 미등록</p>
                )}
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: '총 매출', value: formatPrice(p.total_gross) },
                    { label: 'PG 수수료', value: `-${formatPrice(p.total_pg_fee)}` },
                    { label: '플랫폼', value: `-${formatPrice(p.total_platform_fee)}` },
                    { label: '정산액', value: formatPrice(p.total_payout), bold: true },
                  ].map(item => (
                    <div key={item.label} className="bg-brand-bg rounded-lg p-2">
                      <p className="text-xs text-brand-grey">{item.label}</p>
                      <p className={`text-xs mt-0.5 ${item.bold ? 'font-bold text-brand-deep' : 'text-brand-ink'}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
                {p.paid_at && (
                  <p className="text-xs text-brand-grey mt-2">
                    입금일: {new Date(p.paid_at).toLocaleDateString('ko-KR')}
                  </p>
                )}
              </div>
              {mode === 'pending' && (
                <button
                  onClick={() => handlePay(p.id)}
                  disabled={loading !== null}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-amber text-brand-ink hover:bg-brand-amber/90 disabled:opacity-50 transition-colors flex-shrink-0"
                >
                  {loading === p.id ? '처리중...' : '입금 처리'}
                </button>
              )}
              {mode === 'paid' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600 flex-shrink-0">
                  입금 완료
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
