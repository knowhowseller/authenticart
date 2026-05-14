import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils/format'

export const metadata = { title: '분쟁 내역 | 오센틱아트' }

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

export default async function DisputeListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: disputes } = await supabase
    .from('disputes')
    .select('id, category, title, status, created_at, resolved_at, resolution')
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-ink">분쟁 내역</h1>
            <p className="text-sm text-brand-grey mt-0.5">접수하신 분쟁 건을 확인하세요</p>
          </div>
          <Link
            href="/my/disputes/new"
            className="text-sm px-4 py-2 rounded-xl bg-brand-deep text-white hover:bg-brand-deep/90 transition-colors"
          >
            + 신규 신청
          </Link>
        </div>

        {(!disputes || disputes.length === 0) ? (
          <div className="text-center py-16 text-brand-grey">
            <p className="text-3xl mb-3">📋</p>
            <p>접수된 분쟁이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map(d => (
              <div key={d.id} className="bg-white rounded-2xl border border-brand-mist/30 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-brand-grey">{categoryLabel[d.category]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[d.status]}`}>
                        {statusLabel[d.status]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-brand-ink">{d.title}</p>
                    <p className="text-xs text-brand-grey mt-1">{formatDateTime(d.created_at)}</p>
                    {d.resolution && (
                      <div className="mt-2 bg-green-50 rounded-lg px-3 py-2 text-xs text-green-700">
                        처리 결과: {d.resolution}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
