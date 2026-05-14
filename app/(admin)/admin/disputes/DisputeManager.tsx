'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils/format'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Dispute {
  id: string
  category: string
  title: string
  description: string
  status: string
  resolution: string | null
  created_at: string
  resolved_at: string | null
  order_id: string | null
  artwork_order_id: string | null
  booking_id: string | null
  reporter: { name: string; email: string } | null
}

const statusLabel: Record<string, string> = {
  open:         '접수됨',
  under_review: '검토 중',
  resolved:     '처리완료',
  rejected:     '기각됨',
  escalated:    '에스컬레이션',
}
const statusColor: Record<string, string> = {
  open:         'bg-yellow-50 text-yellow-600 border-yellow-200',
  under_review: 'bg-blue-50 text-blue-600 border-blue-200',
  resolved:     'bg-green-50 text-green-600 border-green-200',
  rejected:     'bg-red-50 text-red-500 border-red-200',
  escalated:    'bg-purple-50 text-purple-600 border-purple-200',
}
const categoryLabel: Record<string, string> = {
  non_delivery:   '미배송/배송지연',
  item_mismatch:  '상품불일치',
  defective:      '불량/파손',
  refund_dispute: '환불분쟁',
  other:          '기타',
}

export default function DisputeManager({
  initialDisputes,
  adminId,
}: {
  initialDisputes: Dispute[]
  adminId: string
}) {
  const supabase = createClient()
  const [disputes, setDisputes] = useState(initialDisputes)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [resolutions, setResolutions] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function updateStatus(id: string, status: string) {
    const resolution = resolutions[id]?.trim()
    if ((status === 'resolved' || status === 'rejected') && !resolution) {
      toast.error('처리 내용을 입력해주세요'); return
    }
    setLoading(true)
    const { error } = await supabase.from('disputes').update({
      status,
      resolution: resolution ?? null,
      resolved_by: adminId,
      resolved_at: ['resolved', 'rejected'].includes(status) ? new Date().toISOString() : null,
    }).eq('id', id)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setDisputes(prev => prev.map(d =>
      d.id === id ? { ...d, status, resolution: resolution ?? d.resolution } : d
    ))
    toast.success('처리 상태가 변경되었습니다')
  }

  const openCount = disputes.filter(d => d.status === 'open').length

  return (
    <div className="space-y-3">
      {openCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          ⚠️ 미처리 분쟁 <strong>{openCount}건</strong>이 있습니다
        </div>
      )}
      {disputes.length === 0 && (
        <div className="text-center py-16 text-brand-grey"><p>분쟁 접수 내역이 없습니다</p></div>
      )}
      {disputes.map(d => (
        <div key={d.id} className="bg-white rounded-2xl border border-brand-mist/30 shadow-sm overflow-hidden">
          <div
            className="flex items-center gap-4 px-5 py-4 cursor-pointer"
            onClick={() => setExpanded(expanded === d.id ? null : d.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-xs text-brand-grey">{categoryLabel[d.category]}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[d.status]}`}>
                  {statusLabel[d.status]}
                </span>
              </div>
              <p className="text-sm font-semibold text-brand-ink truncate">{d.title}</p>
              <p className="text-xs text-brand-grey">
                {d.reporter?.name} · {d.reporter?.email} · {formatDateTime(d.created_at)}
              </p>
            </div>
            {expanded === d.id
              ? <ChevronUp size={16} className="text-brand-grey flex-shrink-0" />
              : <ChevronDown size={16} className="text-brand-grey flex-shrink-0" />
            }
          </div>

          {expanded === d.id && (
            <div className="border-t border-brand-mist/20 px-5 py-4 bg-brand-bg/40 space-y-4">
              <p className="text-sm text-brand-grey whitespace-pre-wrap">{d.description}</p>

              {(d.order_id || d.artwork_order_id || d.booking_id) && (
                <div className="text-xs text-brand-grey space-y-0.5">
                  {d.order_id && <p>주문 ID: <code>{d.order_id}</code></p>}
                  {d.artwork_order_id && <p>작품주문 ID: <code>{d.artwork_order_id}</code></p>}
                  {d.booking_id && <p>예약 ID: <code>{d.booking_id}</code></p>}
                </div>
              )}

              {d.resolution && (
                <div className="bg-green-50 rounded-lg px-3 py-2 text-sm text-green-700">
                  처리 결과: {d.resolution}
                </div>
              )}

              {!['resolved', 'rejected'].includes(d.status) && (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="처리 내용 입력 (resolved/rejected 선택 시 필수)"
                    value={resolutions[d.id] ?? ''}
                    onChange={e => setResolutions(p => ({ ...p, [d.id]: e.target.value }))}
                    className="w-full text-sm px-3 py-2 border border-brand-mist rounded-xl focus:outline-none resize-none"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {d.status === 'open' && (
                      <button
                        onClick={() => updateStatus(d.id, 'under_review')}
                        disabled={loading}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        검토 시작
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(d.id, 'resolved')}
                      disabled={loading}
                      className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      처리 완료
                    </button>
                    <button
                      onClick={() => updateStatus(d.id, 'rejected')}
                      disabled={loading}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      기각
                    </button>
                    <button
                      onClick={() => updateStatus(d.id, 'escalated')}
                      disabled={loading}
                      className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      에스컬레이션
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
