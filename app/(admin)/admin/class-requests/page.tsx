import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Hexagon from '@/components/brand/Hexagon'
import { formatPrice } from '@/lib/utils/format'

export const metadata = { title: '클래스 요청 현황 | Admin' }

const statusLabel: Record<string, string> = {
  open:            '모집 중',
  payment_pending: '결제 대기',
  confirmed:       '확정',
  cancelled:       '취소',
}
const statusColor: Record<string, string> = {
  open:            'bg-blue-50 text-blue-600 border-blue-200',
  payment_pending: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  confirmed:       'bg-green-50 text-green-600 border-green-200',
  cancelled:       'bg-gray-100 text-gray-500 border-gray-200',
}

export default async function AdminClassRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin', 'branch_manager'].includes(u?.role ?? '')) redirect('/')

  const { status } = await searchParams
  const activeStatus = status ?? 'all'

  let query = supabase
    .from('class_open_requests')
    .select(`
      id, title, status, target_capacity, current_count,
      price_per_person, preferred_region, schedule_date, created_at,
      requester:users!requester_id(name, email),
      instructor:users!instructor_id(name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (activeStatus !== 'all') {
    query = query.eq('status', activeStatus)
  }

  const { data: requests } = await query

  // 상태별 집계
  const counts: Record<string, number> = { all: (requests ?? []).length }
  for (const r of requests ?? []) {
    counts[r.status] = (counts[r.status] ?? 0) + 1
  }

  const tabs = [
    { key: 'all', label: '전체' },
    { key: 'open', label: '모집 중' },
    { key: 'payment_pending', label: '결제 대기' },
    { key: 'confirmed', label: '확정' },
    { key: 'cancelled', label: '취소' },
  ]

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-6">클래스 요청 현황</h1>

        {/* 탭 */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-brand-mist/30 w-fit flex-wrap">
          {tabs.map(t => (
            <Link
              key={t.key}
              href={`/admin/class-requests?status=${t.key}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeStatus === t.key
                  ? 'bg-brand-deep text-white shadow-sm'
                  : 'text-brand-grey hover:text-brand-ink'
              }`}
            >
              {t.label}
              {(counts[t.key] ?? 0) > 0 && (
                <span className={`ml-1 text-xs ${activeStatus === t.key ? 'text-white/70' : 'text-brand-grey'}`}>
                  {counts[t.key]}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* 목록 */}
        {(requests ?? []).length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
            <div className="text-4xl mb-3">🙋</div>
            <p className="text-brand-grey text-sm">해당 요청이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(requests as any[]).map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-brand-ink truncate">{r.title}</h3>
                    <p className="text-xs text-brand-grey mt-0.5">
                      요청자: {r.requester?.name} ({r.requester?.email})
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${statusColor[r.status] ?? ''}`}>
                    {statusLabel[r.status] ?? r.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-brand-grey">지역</p>
                    <p className="font-medium text-brand-ink">{r.preferred_region}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-grey">인원</p>
                    <p className="font-medium text-brand-ink">{r.current_count}/{r.target_capacity}명</p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-grey">1인 수강료</p>
                    <p className="font-medium text-brand-ink">{r.price_per_person ? formatPrice(r.price_per_person) : '미정'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-grey">강사</p>
                    <p className="font-medium text-brand-ink">{r.instructor?.name ?? '미배정'}</p>
                  </div>
                </div>

                {r.schedule_date && (
                  <p className="text-xs text-brand-grey mt-2">
                    예정 일정: {new Date(r.schedule_date).toLocaleDateString('ko-KR')}
                  </p>
                )}
                <p className="text-xs text-brand-grey mt-1">
                  접수: {new Date(r.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
