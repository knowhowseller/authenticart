'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils/format'

interface ClassItem {
  id: string
  title: string
  region: string
  price: number
  description?: string | null
  thumbnail_url?: string | null
  created_at: string
  users: any
}

export default function ClassApprovalList({
  classes,
  mode,
}: {
  classes: ClassItem[]
  mode: 'draft' | 'published'
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [list, setList] = useState(classes)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  async function handlePublish(classId: string) {
    setLoading(classId)
    const res = await fetch('/api/admin/classes/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: classId, action: 'publish' }),
    })
    const json = await res.json()
    setLoading(null)
    if (!res.ok) { toast.error(json.error ?? '처리 실패'); return }
    toast.success('게시 완료')
    setList(prev => prev.filter(c => c.id !== classId))
  }

  function openReject(classId: string) {
    setRejectingId(classId)
    setRejectReason('')
    setExpanded(null)
  }

  async function confirmReject(classId: string) {
    if (!rejectReason.trim()) { toast.error('반려 사유를 입력해주세요'); return }
    setLoading(classId)
    const res = await fetch('/api/admin/classes/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: classId, action: 'reject', reason: rejectReason.trim() }),
    })
    const json = await res.json()
    setLoading(null)
    if (!res.ok) { toast.error(json.error ?? '처리 실패'); return }
    toast.success('반려 완료')
    setList(prev => prev.filter(c => c.id !== classId))
    setRejectingId(null)
  }

  if (list.length === 0) return null

  return (
    <div className="space-y-3">
      {list.map(c => {
        const isRejecting = rejectingId === c.id
        return (
          <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* 썸네일 */}
                {c.thumbnail_url ? (
                  <img
                    src={c.thumbnail_url}
                    alt={c.title}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-brand-mist/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-brand-mist/30 flex items-center justify-center flex-shrink-0 text-brand-grey text-xs">
                    이미지 없음
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand-ink truncate">{c.title}</p>
                  <p className="text-xs text-brand-grey mt-0.5">
                    {c.users?.name} · {c.region} · {formatPrice(c.price)}
                  </p>
                  <p className="text-xs text-brand-grey mt-0.5">
                    등록일: {new Date(c.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>

                {/* 버튼 영역 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/admin/classes/${c.id}/edit`}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-brand-mist text-brand-grey hover:bg-brand-bg transition-colors"
                  >
                    수정
                  </Link>
                  {mode === 'draft' && !isRejecting && (
                    <>
                      <button
                        onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-brand-mist text-brand-grey hover:bg-brand-bg transition-colors"
                      >
                        상세보기
                      </button>
                      <button
                        onClick={() => openReject(c.id)}
                        disabled={loading === c.id}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        반려
                      </button>
                      <button
                        onClick={() => handlePublish(c.id)}
                        disabled={loading === c.id}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-deep text-white hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
                      >
                        {loading === c.id ? '처리중...' : '게시'}
                      </button>
                    </>
                  )}
                  {mode === 'published' && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                      게시 중
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 설명 확장 */}
            {expanded === c.id && c.description && (
              <div className="px-5 pb-5 border-t border-brand-mist/30 pt-4">
                <p className="text-sm text-brand-ink/80 whitespace-pre-line">{c.description}</p>
              </div>
            )}

            {/* 반려 사유 입력 */}
            {isRejecting && (
              <div className="px-5 pb-5 border-t border-brand-mist/30 pt-4 space-y-2">
                <label className="text-xs font-medium text-brand-grey">
                  반려 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={2}
                  placeholder="예: 클래스 설명이 부족합니다. 재료비 포함 여부, 준비물 안내를 추가해주세요."
                  className="w-full px-3 py-2 text-sm border border-brand-mist rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  autoFocus
                />
                <p className="text-xs text-brand-grey">강사에게 이 사유가 알림으로 전달됩니다</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmReject(c.id)}
                    disabled={loading === c.id}
                    className="flex-1 px-3 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {loading === c.id ? '처리중...' : '반려 확인'}
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
