'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: '접수', color: 'bg-orange-50 text-orange-500' },
  reviewing: { label: '검토 중', color: 'bg-blue-50 text-blue-600' },
  assigned:  { label: '강사 배정', color: 'bg-green-50 text-green-600' },
  completed: { label: '완료', color: 'bg-brand-bg text-brand-grey' },
  cancelled: { label: '취소', color: 'bg-red-50 text-red-400' },
}

interface Instructor { id: string; name: string }
interface Request {
  id: string; org_name: string; contact_name: string; contact_email: string; contact_phone: string
  region: string; lesson_theme: string | null; preferred_date: string | null
  participant_count: number; message: string | null; status: string
  assigned_instructor_id: string | null; admin_memo: string | null; created_at: string
  reference_images: string[]
  users: { name: string } | null
}

export default function GroupRequestManager({ initialRequests, instructors }: { initialRequests: Request[]; instructors: Instructor[] }) {
  const router = useRouter()
  const [requests, setRequests] = useState(initialRequests)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [assignForm, setAssignForm] = useState<Record<string, { instructor_id: string; memo: string; status: string }>>({})
  const [loading, setLoading] = useState<string | null>(null)

  function getForm(id: string) {
    return assignForm[id] ?? { instructor_id: '', memo: '', status: 'assigned' }
  }
  function setForm(id: string, patch: Partial<{ instructor_id: string; memo: string; status: string }>) {
    setAssignForm(prev => ({ ...prev, [id]: { ...getForm(id), ...patch } }))
  }

  async function handleAssign(id: string) {
    const f = getForm(id)
    setLoading(id)
    const res = await fetch(`/api/admin/group-requests/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructor_id: f.instructor_id || null, admin_memo: f.memo || null, status: f.status }),
    })
    setLoading(null)
    if (!res.ok) { toast.error('처리 실패'); return }
    toast.success('저장되었습니다')
    setRequests(prev => prev.map(r => r.id === id ? {
      ...r,
      status: f.status,
      assigned_instructor_id: f.instructor_id || null,
      admin_memo: f.memo || null,
      users: instructors.find(i => i.id === f.instructor_id) ? { name: instructors.find(i => i.id === f.instructor_id)!.name } : r.users,
    } : r))
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
          <p className="text-brand-grey">접수된 단체 출강 요청이 없습니다</p>
        </div>
      ) : requests.map(r => {
        const s = STATUS_LABELS[r.status] ?? STATUS_LABELS.pending
        return (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 overflow-hidden">
            <button className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
              onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}>{s.label}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-ink truncate">{r.org_name}</p>
                  <p className="text-xs text-brand-grey">{r.region} · {r.participant_count}명 · {r.lesson_theme ?? '테마 미정'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 text-xs text-brand-grey">
                {r.users && <span className="text-brand-deep font-medium">배정: {r.users.name}</span>}
                <span>{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                <span className="text-brand-grey">{expanded === r.id ? '▲' : '▼'}</span>
              </div>
            </button>

            {expanded === r.id && (
              <div className="px-5 pb-5 border-t border-brand-mist/20">
                <div className="grid grid-cols-2 gap-3 text-sm mt-4 mb-4">
                  <div><span className="text-brand-grey text-xs">담당자</span><p className="font-medium">{r.contact_name}</p></div>
                  <div><span className="text-brand-grey text-xs">이메일</span><p className="font-medium">{r.contact_email}</p></div>
                  <div><span className="text-brand-grey text-xs">연락처</span><p className="font-medium">{r.contact_phone}</p></div>
                  <div><span className="text-brand-grey text-xs">희망 일정</span><p className="font-medium">{r.preferred_date ?? '-'}</p></div>
                </div>
                {r.message && <p className="text-sm text-brand-grey bg-brand-bg rounded-lg px-3 py-2 mb-4">{r.message}</p>}
                {r.reference_images?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-brand-grey mb-2">참고 사진</p>
                    <div className="flex gap-2 flex-wrap">
                      {r.reference_images.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`참고 ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-brand-mist hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 bg-brand-bg rounded-xl p-4">
                  <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider">관리자 처리</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-brand-grey block mb-1">강사 배정</label>
                      <select value={getForm(r.id).instructor_id}
                        onChange={e => setForm(r.id, { instructor_id: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber">
                        <option value="">강사 선택</option>
                        {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-brand-grey block mb-1">상태 변경</label>
                      <select value={getForm(r.id).status}
                        onChange={e => setForm(r.id, { status: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber">
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-brand-grey block mb-1">관리자 메모</label>
                    <input value={getForm(r.id).memo} onChange={e => setForm(r.id, { memo: e.target.value })}
                      placeholder="내부 메모 (강사에게 전달할 내용)"
                      className="w-full px-2.5 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
                  </div>
                  <button onClick={() => handleAssign(r.id)} disabled={loading === r.id}
                    className="w-full py-2 bg-brand-deep text-white rounded-lg text-sm font-medium hover:bg-brand-deep/90 disabled:opacity-50 transition-colors">
                    {loading === r.id ? '처리 중...' : '저장'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
