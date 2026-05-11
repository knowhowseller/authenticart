'use client'
import { useState } from 'react'
import { toast } from 'sonner'

const NEXT_STATUS: Record<string, { value: string; label: string; danger?: boolean }[]> = {
  paid:      [{ value: 'preparing', label: '준비 시작' }, { value: 'cancelled', label: '취소', danger: true }],
  preparing: [{ value: 'shipped',   label: '발송 처리' }, { value: 'cancelled', label: '취소', danger: true }],
  shipped:   [{ value: 'delivered', label: '배송 완료' }],
}

export default function OrderActions({
  orderId,
  initialStatus,
  initialTracking,
}: {
  orderId: string
  initialStatus: string
  initialTracking: string | null
}) {
  const [status, setStatus] = useState(initialStatus)
  const [tracking, setTracking] = useState(initialTracking ?? '')
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)

  const options = NEXT_STATUS[status] ?? []
  const canRefund = ['paid', 'preparing'].includes(status)

  async function handleStatusChange() {
    if (!selected) return
    if (!window.confirm(`주문 상태를 "${selected}"로 변경하시겠습니까?`)) return
    setLoading(true)
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: selected, tracking_number: selected === 'shipped' ? tracking : undefined }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(json.error ?? '처리 실패'); return }
    toast.success('주문 상태가 변경되었습니다')
    setStatus(selected)
    setSelected('')
  }

  async function handleRefund() {
    if (!window.confirm('전액 환불 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    setLoading(true)
    const res = await fetch(`/api/admin/orders/${orderId}/refund`, { method: 'POST' })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(json.error ?? '환불 실패'); return }
    toast.success('환불 처리가 완료되었습니다')
    setStatus('refunded')
    setSelected('')
  }

  if (options.length === 0 && !canRefund) return null

  return (
    <div className="flex flex-col gap-1.5 mt-2 min-w-0">
      {options.length > 0 && (
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          disabled={loading}
          className="text-xs border border-brand-mist rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-amber bg-white"
        >
          <option value="">상태 변경...</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
      {selected === 'shipped' && (
        <input
          type="text"
          placeholder="운송장 번호 (필수)"
          value={tracking}
          onChange={e => setTracking(e.target.value)}
          className="text-xs border border-brand-mist rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-amber"
        />
      )}
      {selected && (
        <button
          onClick={handleStatusChange}
          disabled={loading || (selected === 'shipped' && !tracking.trim())}
          className="text-xs px-3 py-1.5 bg-brand-deep text-white rounded-lg hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
        >
          {loading ? '처리 중...' : '저장'}
        </button>
      )}
      {canRefund && (
        <button
          onClick={handleRefund}
          disabled={loading}
          className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          환불 처리
        </button>
      )}
    </div>
  )
}
