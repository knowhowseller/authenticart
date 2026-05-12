'use client'
import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
import OrderActions from './OrderActions'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:   { label: '결제 전',   color: 'bg-yellow-50 text-yellow-600' },
  paid:      { label: '결제 완료', color: 'bg-blue-50 text-blue-600' },
  preparing: { label: '준비 중',   color: 'bg-brand-bg text-brand-grey' },
  shipped:   { label: '배송 중',   color: 'bg-purple-50 text-purple-600' },
  delivered: { label: '배송 완료', color: 'bg-green-50 text-green-600' },
  cancelled: { label: '취소됨',    color: 'bg-brand-bg text-brand-grey' },
  refunded:  { label: '환불됨',    color: 'bg-red-50 text-red-500' },
}

const ALL_STATUSES = ['all', ...Object.keys(statusConfig)]
const STATUS_LABELS: Record<string, string> = {
  all: '전체', ...Object.fromEntries(Object.entries(statusConfig).map(([k, v]) => [k, v.label]))
}

interface Order {
  id: string
  status: string
  total_amount: number
  quantity: number
  shipping_name: string | null
  shipping_phone: string | null
  shipping_address: string | null
  tracking_number: string | null
  created_at: string
  users?: { name: string; email: string } | null
  products?: { name: string } | null
}

export default function AdminOrdersClient({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter(o => {
      if (status !== 'all' && o.status !== status) return false
      if (!q) return true
      return (
        o.products?.name?.toLowerCase().includes(q) ||
        o.users?.name?.toLowerCase().includes(q) ||
        o.users?.email?.toLowerCase().includes(q) ||
        o.shipping_name?.toLowerCase().includes(q) ||
        o.tracking_number?.toLowerCase().includes(q)
      )
    })
  }, [orders, query, status])

  return (
    <div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30 mb-4 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="상품명, 구매자, 이메일, 운송장 번호 검색..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-brand-mist focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                status === s ? 'bg-brand-deep text-white' : 'bg-brand-bg text-brand-grey hover:text-brand-ink'
              }`}
            >
              {STATUS_LABELS[s]}
              {s === 'all' && ` (${orders.length})`}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-brand-grey mb-3">{filtered.length}건</p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
          <p className="text-brand-grey">검색 결과가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => {
            const s = statusConfig[o.status] ?? { label: o.status, color: '' }
            return (
              <div key={o.id} className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
                        {s.label}
                      </span>
                      <span className="text-xs text-brand-grey">
                        {new Date(o.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <p className="font-medium text-brand-ink text-sm">
                      {o.products?.name ?? '-'} {o.quantity > 1 && `× ${o.quantity}`}
                    </p>
                    <p className="text-xs text-brand-grey mt-0.5">
                      구매자: {o.users?.name ?? '-'} ({o.users?.email ?? '-'})
                    </p>
                    <p className="text-xs text-brand-grey mt-0.5">
                      배송: {o.shipping_name} · {o.shipping_phone}
                    </p>
                    {o.shipping_address && (
                      <p className="text-xs text-brand-grey mt-0.5 truncate">{o.shipping_address}</p>
                    )}
                    {o.tracking_number && (
                      <p className="text-xs text-brand-deep mt-0.5 font-medium">운송장: {o.tracking_number}</p>
                    )}
                    <p className="text-sm font-bold text-brand-deep mt-1">{formatPrice(o.total_amount)}</p>
                  </div>
                  <div className="flex-shrink-0 w-36">
                    <OrderActions orderId={o.id} initialStatus={o.status} initialTracking={o.tracking_number} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
