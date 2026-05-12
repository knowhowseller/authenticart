'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Hexagon from '@/components/brand/Hexagon'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open:            { label: '강사 매칭 중', color: 'bg-orange-50 text-orange-500' },
  accepted:        { label: '강사 확정', color: 'bg-blue-50 text-blue-600' },
  recruiting:      { label: '참여자 모집 중', color: 'bg-green-50 text-green-600' },
  payment_pending: { label: '결제 대기', color: 'bg-brand-amber/10 text-brand-amber' },
  confirmed:       { label: '확정', color: 'bg-brand-deep/10 text-brand-deep' },
  cancelled:       { label: '취소', color: 'bg-brand-bg text-brand-grey' },
}

interface ClassRequest {
  id: string
  title: string
  preferred_region: string
  preferred_date: string | null
  message: string | null
  status: string
  target_capacity: number | null
  current_count: number
  price_per_person: number | null
  schedule_date: string | null
  created_at: string
  requester: { name: string } | null
}

interface AcceptForm {
  target_capacity: string
  price_per_person: string
  schedule_date: string
}

export default function StudioClassRequestsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [requests, setRequests] = useState<ClassRequest[]>([])
  const [myRequests, setMyRequests] = useState<ClassRequest[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [forms, setForms] = useState<Record<string, AcceptForm>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [tab, setTab] = useState<'open' | 'mine'>('open')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: openReqs }, { data: mineReqs }] = await Promise.all([
        supabase.from('class_open_requests')
          .select('id, title, preferred_region, preferred_date, message, status, target_capacity, current_count, price_per_person, schedule_date, created_at, requester:users!requester_id(name)')
          .eq('status', 'open')
          .order('created_at', { ascending: false }),
        supabase.from('class_open_requests')
          .select('id, title, preferred_region, preferred_date, message, status, target_capacity, current_count, price_per_person, schedule_date, created_at, requester:users!requester_id(name)')
          .eq('instructor_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      setRequests((openReqs ?? []) as any)
      setMyRequests((mineReqs ?? []) as any)
    }
    load()
  }, [])

  function getForm(id: string): AcceptForm {
    return forms[id] ?? { target_capacity: '', price_per_person: '', schedule_date: '' }
  }
  function setForm(id: string, patch: Partial<AcceptForm>) {
    setForms(prev => ({ ...prev, [id]: { ...getForm(id), ...patch } }))
  }

  async function handleAccept(id: string) {
    const f = getForm(id)
    if (!f.target_capacity || parseInt(f.target_capacity) < 2) {
      toast.error('모집 정원을 2명 이상 입력해주세요')
      return
    }
    setLoading(id)
    const res = await fetch(`/api/class-requests/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_capacity: parseInt(f.target_capacity),
        price_per_person: f.price_per_person ? parseInt(f.price_per_person) : null,
        schedule_date: f.schedule_date || null,
      }),
    })
    const data = await res.json()
    setLoading(null)
    if (!res.ok) { toast.error(data.error ?? '오류'); return }
    toast.success('클래스 요청을 수락하고 모집을 시작합니다')
    setRequests(prev => prev.filter(r => r.id !== id))
    setExpanded(null)
    router.refresh()
  }

  const displayList = tab === 'open' ? requests : myRequests

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="deep" size={16} />
          <span className="text-xs font-medium text-brand-deep uppercase tracking-wider">Studio</span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-brand-ink">클래스 요청 관리</h1>
          <Link href="/studio" className="text-sm text-brand-grey hover:text-brand-deep">← 스튜디오</Link>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('open')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === 'open' ? 'bg-brand-deep text-white' : 'bg-white text-brand-grey border border-brand-mist'}`}
          >
            새 요청 ({requests.length})
          </button>
          <button
            onClick={() => setTab('mine')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === 'mine' ? 'bg-brand-deep text-white' : 'bg-white text-brand-grey border border-brand-mist'}`}
          >
            내가 수락한 요청 ({myRequests.length})
          </button>
        </div>

        {displayList.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-brand-mist/30">
            <p className="text-brand-grey">
              {tab === 'open' ? '새로운 클래스 요청이 없습니다' : '수락한 클래스 요청이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayList.map((r) => {
              const s = STATUS_LABELS[r.status] ?? STATUS_LABELS.open
              const f = getForm(r.id)
              return (
                <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 overflow-hidden">
                  <button
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-semibold ${s.color}`}>{s.label}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-ink truncate">{r.title}</p>
                        <p className="text-xs text-brand-grey mt-0.5">
                          📍 {r.preferred_region}
                          {r.preferred_date && ` · ${r.preferred_date}`}
                          {r.requester && ` · 요청자: ${(r.requester as any).name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-xs text-brand-grey">
                      {r.target_capacity && (
                        <span className="font-semibold text-brand-ink">{r.current_count}/{r.target_capacity}명</span>
                      )}
                      <span>{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                      <span>{expanded === r.id ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {expanded === r.id && (
                    <div className="px-5 pb-5 border-t border-brand-mist/20">
                      {r.message && (
                        <p className="mt-4 text-sm text-brand-grey bg-brand-bg rounded-lg px-3 py-2 mb-4">{r.message}</p>
                      )}

                      {tab === 'mine' ? (
                        <div className="mt-4 space-y-2 text-sm">
                          {r.target_capacity && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-brand-grey mb-1">
                                <span>모집 현황</span>
                                <span className="font-semibold text-brand-ink">{r.current_count} / {r.target_capacity}명</span>
                              </div>
                              <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-brand-deep rounded-full"
                                  style={{ width: `${Math.min(100, (r.current_count / r.target_capacity) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                          {r.price_per_person && <p className="text-xs text-brand-grey">1인 {r.price_per_person.toLocaleString()}원</p>}
                          {r.schedule_date && <p className="text-xs text-brand-grey">확정일: {new Date(r.schedule_date).toLocaleDateString('ko-KR')}</p>}
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3 bg-brand-bg rounded-xl p-4">
                          <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider">요청 수락 — 모집 조건 설정</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-brand-grey block mb-1">모집 정원 *</label>
                              <input
                                type="number" min={2} max={50}
                                value={f.target_capacity}
                                onChange={e => setForm(r.id, { target_capacity: e.target.value })}
                                placeholder="예: 10"
                                className="w-full px-2.5 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-brand-grey block mb-1">1인 가격 (원)</label>
                              <input
                                type="number" min={0}
                                value={f.price_per_person}
                                onChange={e => setForm(r.id, { price_per_person: e.target.value })}
                                placeholder="예: 50000"
                                className="w-full px-2.5 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-brand-grey block mb-1">확정 일정 (선택)</label>
                            <input
                              type="datetime-local"
                              value={f.schedule_date}
                              onChange={e => setForm(r.id, { schedule_date: e.target.value })}
                              className="w-full px-2.5 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                            />
                          </div>
                          <button
                            onClick={() => handleAccept(r.id)}
                            disabled={loading === r.id}
                            className="w-full py-2 bg-brand-deep text-white rounded-lg text-sm font-medium hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
                          >
                            {loading === r.id ? '처리 중...' : '수락하고 모집 시작'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
