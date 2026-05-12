import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '내 클래스 요청 | 오센틱아트' }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open:            { label: '강사 매칭 중', color: 'bg-orange-50 text-orange-500' },
  accepted:        { label: '강사 확정', color: 'bg-blue-50 text-blue-600' },
  recruiting:      { label: '참여자 모집 중', color: 'bg-green-50 text-green-600' },
  payment_pending: { label: '결제 대기', color: 'bg-brand-amber/10 text-brand-amber' },
  confirmed:       { label: '확정', color: 'bg-brand-deep/10 text-brand-deep' },
  cancelled:       { label: '취소', color: 'bg-brand-bg text-brand-grey' },
}

const PARTICIPANT_STATUS: Record<string, string> = {
  joined: '참여 신청',
  payment_requested: '결제 대기',
  paid: '결제 완료',
  cancelled: '취소',
}

export default async function MyClassRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: myRequests }, { data: joined }] = await Promise.all([
    supabase.from('class_open_requests')
      .select('id, title, preferred_region, preferred_date, status, target_capacity, current_count, price_per_person, schedule_date, created_at, instructor:users!instructor_id(name)')
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('class_open_request_participants')
      .select('request_id, status, created_at, class_open_requests!request_id(id, title, preferred_region, status, target_capacity, current_count, price_per_person, schedule_date, instructor:users!instructor_id(name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-brand-ink">내 클래스 요청</h1>
          <Link href="/my/class-requests/new"
            className="px-4 py-2 bg-brand-deep text-white rounded-full text-sm font-medium hover:bg-brand-deep/90 transition-colors">
            새 요청
          </Link>
        </div>

        {/* 내가 등록한 요청 */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider mb-3">내가 요청한 클래스</h2>
          {(myRequests ?? []).length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-brand-mist/30">
              <p className="text-brand-grey text-sm mb-3">아직 등록한 클래스 요청이 없습니다</p>
              <Link href="/my/class-requests/new" className="text-sm text-brand-deep hover:underline">첫 번째 요청 등록하기</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {(myRequests ?? []).map((r: any) => {
                const s = STATUS_LABELS[r.status] ?? STATUS_LABELS.open
                return (
                  <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.color}`}>{s.label}</span>
                          <h3 className="text-sm font-semibold text-brand-ink">{r.title}</h3>
                        </div>
                        <div className="flex gap-3 text-xs text-brand-grey flex-wrap">
                          <span>📍 {r.preferred_region}</span>
                          {r.preferred_date && <span>📅 {r.preferred_date}</span>}
                          {r.instructor?.name && <span>강사: {r.instructor.name}</span>}
                        </div>
                        {r.target_capacity && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-brand-grey mb-1">
                              <span>모집 현황</span>
                              <span className="font-semibold text-brand-ink">{r.current_count}/{r.target_capacity}명</span>
                            </div>
                            <div className="h-1.5 bg-brand-bg rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-deep rounded-full"
                                style={{ width: `${Math.min(100, (r.current_count / r.target_capacity) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      {r.status === 'payment_pending' && (
                        <Link href={`/class-requests/${r.id}/pay`}
                          className="px-3 py-1.5 bg-brand-amber text-brand-ink rounded-lg text-xs font-medium flex-shrink-0">
                          결제하기
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 참여 신청한 요청 */}
        <section>
          <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider mb-3">참여 신청한 클래스</h2>
          {(joined ?? []).length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-brand-mist/30">
              <p className="text-brand-grey text-sm mb-3">참여 신청한 클래스가 없습니다</p>
              <Link href="/class-requests" className="text-sm text-brand-deep hover:underline">클래스 요청 목록 보기</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {(joined ?? []).map((j: any) => {
                const req = j.class_open_requests
                if (!req) return null
                const s = STATUS_LABELS[req.status] ?? STATUS_LABELS.open
                const pStatus = PARTICIPANT_STATUS[j.status] ?? j.status
                return (
                  <div key={j.request_id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.color}`}>{s.label}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-deep/10 text-brand-deep font-semibold">{pStatus}</span>
                          <h3 className="text-sm font-semibold text-brand-ink">{req.title}</h3>
                        </div>
                        <div className="flex gap-3 text-xs text-brand-grey flex-wrap">
                          <span>📍 {req.preferred_region}</span>
                          {req.instructor?.name && <span>강사: {req.instructor.name}</span>}
                          {req.price_per_person && <span>1인 {req.price_per_person.toLocaleString()}원</span>}
                        </div>
                        {req.target_capacity && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-brand-grey mb-1">
                              <span>모집 현황</span>
                              <span className="font-semibold text-brand-ink">{req.current_count}/{req.target_capacity}명</span>
                            </div>
                            <div className="h-1.5 bg-brand-bg rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-deep rounded-full"
                                style={{ width: `${Math.min(100, (req.current_count / req.target_capacity) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      {req.status === 'payment_pending' && j.status === 'payment_requested' && (
                        <Link href={`/class-requests/${req.id}/pay`}
                          className="px-3 py-1.5 bg-brand-amber text-brand-ink rounded-lg text-xs font-medium flex-shrink-0">
                          결제하기
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
