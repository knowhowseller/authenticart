'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

const CRAFT_LABEL: Record<string, string> = {
  resin: '레진아트', candle: '캔들', flower: '플라워',
  ceramic: '도자기', jewelry: '주얼리', fabric: '패브릭', other: '기타',
}

interface Profile {
  id: string
  instructor_id: string
  bio: string | null
  region: string | null
  craft_types: string[] | null
  status: string
  created_at: string
  approved_at: string | null
  users: { name: string; email: string } | null
}

export default function InstructorApprovalList({
  profiles,
  mode,
}: {
  profiles: Profile[]
  mode: 'pending' | 'approved'
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [list, setList] = useState(profiles)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  async function handleApprove(profileId: string, instructorId: string) {
    setLoading(profileId)
    const res = await fetch('/api/admin/instructors/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructor_id: instructorId, action: 'approve' }),
    })
    const json = await res.json()
    setLoading(null)
    if (!res.ok) { toast.error(json.error ?? '처리 실패'); return }
    toast.success('승인 완료')
    setList(prev => prev.filter(p => p.id !== profileId))
  }

  function openReject(profileId: string) {
    setRejectingId(profileId)
    setRejectReason('')
  }

  async function confirmReject(profileId: string, instructorId: string) {
    if (!rejectReason.trim()) { toast.error('거절 사유를 입력해주세요'); return }
    setLoading(profileId)
    const res = await fetch('/api/admin/instructors/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructor_id: instructorId, action: 'reject', reason: rejectReason.trim() }),
    })
    const json = await res.json()
    setLoading(null)
    if (!res.ok) { toast.error(json.error ?? '처리 실패'); return }
    toast.success('거절 완료')
    setList(prev => prev.filter(p => p.id !== profileId))
    setRejectingId(null)
  }

  if (list.length === 0) return null

  return (
    <div className="space-y-3">
      {list.map(p => {
        const isRejecting = rejectingId === p.id
        return (
          <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-brand-ink">{p.users?.name ?? '이름 없음'}</p>
                  <span className="text-xs text-brand-grey">{p.users?.email}</span>
                </div>
                {p.region && (
                  <p className="text-xs text-brand-grey mb-2">활동 지역: {p.region}</p>
                )}
                {p.craft_types && p.craft_types.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {p.craft_types.map(ct => (
                      <span key={ct} className="text-xs px-2 py-0.5 rounded-full bg-brand-deep/10 text-brand-deep font-medium">
                        {CRAFT_LABEL[ct] ?? ct}
                      </span>
                    ))}
                  </div>
                )}
                {p.bio && (
                  <p className="text-sm text-brand-ink/80 line-clamp-3 whitespace-pre-line">{p.bio}</p>
                )}
                <p className="text-xs text-brand-grey mt-2">
                  신청일: {new Date(p.created_at).toLocaleDateString('ko-KR')}
                  {p.approved_at && ` · 승인일: ${new Date(p.approved_at).toLocaleDateString('ko-KR')}`}
                </p>
              </div>

              {mode === 'pending' && !isRejecting && (
                <div className="flex gap-2 flex-shrink-0 items-center">
                  <Link
                    href={`/admin/instructors/${p.instructor_id}/edit`}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-brand-mist text-brand-grey hover:bg-brand-bg transition-colors"
                  >
                    편집
                  </Link>
                  <button
                    onClick={() => openReject(p.id)}
                    disabled={loading === p.id}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    거절
                  </button>
                  <button
                    onClick={() => handleApprove(p.id, p.instructor_id)}
                    disabled={loading === p.id}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-deep text-white hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
                  >
                    {loading === p.id ? '처리중...' : '승인'}
                  </button>
                </div>
              )}

              {mode === 'approved' && (
                <div className="flex gap-2 flex-shrink-0 items-center">
                  <Link
                    href={`/admin/instructors/${p.instructor_id}/edit`}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-brand-mist text-brand-grey hover:bg-brand-bg transition-colors"
                  >
                    편집
                  </Link>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                    승인됨
                  </span>
                </div>
              )}
            </div>

            {isRejecting && (
              <div className="mt-4 pt-4 border-t border-brand-mist/30 space-y-2">
                <label className="text-xs font-medium text-brand-grey">
                  거절 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={2}
                  placeholder="예: 자기소개가 부족합니다. 강사 경력 및 작품 사진을 보완 후 재신청 부탁드립니다."
                  className="w-full px-3 py-2 text-sm border border-brand-mist rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  autoFocus
                />
                <p className="text-xs text-brand-grey">강사에게 이 사유가 알림으로 전달됩니다</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmReject(p.id, p.instructor_id)}
                    disabled={loading === p.id}
                    className="flex-1 px-3 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {loading === p.id ? '처리중...' : '거절 확인'}
                  </button>
                  <button
                    onClick={() => { setRejectingId(null); setRejectReason('') }}
                    className="flex-1 px-3 py-2 text-sm font-medium rounded-xl border border-brand-mist text-brand-grey hover:bg-brand-bg transition-colors"
                  >
                    취소
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
