import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ClassRequestJoinButton from './ClassRequestJoinButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '클래스 모집 요청 | 오센틱아트' }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open:            { label: '강사 매칭 중', color: 'bg-orange-50 text-orange-500' },
  accepted:        { label: '강사 확정', color: 'bg-blue-50 text-blue-600' },
  recruiting:      { label: '참여자 모집 중', color: 'bg-green-50 text-green-600' },
  payment_pending: { label: '결제 대기', color: 'bg-brand-amber/10 text-brand-amber' },
  confirmed:       { label: '확정', color: 'bg-brand-deep/10 text-brand-deep' },
  cancelled:       { label: '취소', color: 'bg-brand-bg text-brand-grey' },
}

export default async function ClassRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: requests } = await supabase
    .from('class_open_requests')
    .select(`
      id, title, preferred_region, preferred_date, status,
      target_capacity, current_count, price_per_person, schedule_date,
      requester_id,
      users!requester_id(name),
      instructor:users!instructor_id(name)
    `)
    .in('status', ['open', 'accepted', 'recruiting', 'payment_pending'])
    .order('created_at', { ascending: false })

  const myJoins = user ? (await supabase
    .from('class_open_request_participants')
    .select('request_id')
    .eq('user_id', user.id)).data ?? [] : []

  const joinedSet = new Set(myJoins.map((j: any) => j.request_id))

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-ink">클래스 모집 요청</h1>
            <p className="text-brand-grey text-sm mt-1">원하는 클래스를 요청하고, 모집 정원이 차면 클래스가 열립니다</p>
          </div>
          {user && (
            <Link href="/my/class-requests/new"
              className="px-4 py-2 bg-brand-deep text-white rounded-full text-sm font-medium hover:bg-brand-deep/90 transition-colors">
              클래스 요청하기
            </Link>
          )}
        </div>

        {(requests ?? []).length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-brand-mist/30">
            <div className="text-4xl mb-3">🎨</div>
            <p className="text-brand-grey mb-4">진행 중인 클래스 요청이 없습니다</p>
            {user && (
              <Link href="/my/class-requests/new" className="text-sm text-brand-deep hover:underline">
                첫 번째로 클래스를 요청해보세요
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {(requests ?? []).map((r: any) => {
              const s = STATUS_LABELS[r.status] ?? STATUS_LABELS.open
              const isJoined = joinedSet.has(r.id)
              const isFull = r.current_count >= r.target_capacity
              return (
                <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.color}`}>{s.label}</span>
                        <h3 className="text-sm font-semibold text-brand-ink">{r.title}</h3>
                      </div>
                      <div className="flex gap-3 text-xs text-brand-grey flex-wrap mt-1">
                        <span>📍 {r.preferred_region}</span>
                        {r.preferred_date && <span>📅 {r.preferred_date}</span>}
                        {r.schedule_date && <span>확정일: {new Date(r.schedule_date).toLocaleDateString('ko-KR')}</span>}
                        {(r.instructor as any)?.name && <span>강사: {(r.instructor as any).name}</span>}
                      </div>
                      {r.target_capacity && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-brand-grey mb-1">
                            <span>모집 현황</span>
                            <span className="font-semibold text-brand-ink">{r.current_count} / {r.target_capacity}명</span>
                          </div>
                          <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-deep rounded-full transition-all"
                              style={{ width: `${Math.min(100, (r.current_count / r.target_capacity) * 100)}%` }}
                            />
                          </div>
                          {r.price_per_person && (
                            <p className="text-xs text-brand-grey mt-1">1인 {r.price_per_person.toLocaleString()}원</p>
                          )}
                        </div>
                      )}
                    </div>
                    {r.status === 'recruiting' && user && r.requester_id !== user.id && (
                      <ClassRequestJoinButton
                        requestId={r.id}
                        isJoined={isJoined}
                        isFull={isFull}
                      />
                    )}
                    {r.status === 'payment_pending' && isJoined && (
                      <Link href={`/class-requests/${r.id}/pay`}
                        className="px-4 py-2 bg-brand-amber text-brand-ink rounded-xl text-xs font-medium hover:bg-brand-amber/90 transition-colors flex-shrink-0">
                        결제하기
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
