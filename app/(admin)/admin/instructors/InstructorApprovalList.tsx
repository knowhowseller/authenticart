'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Profile {
  id: string
  instructor_id: string
  bio: string | null
  region: string | null
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

  async function handleAction(profileId: string, instructorId: string, action: 'approve' | 'reject') {
    setLoading(profileId)
    const res = await fetch('/api/admin/instructors/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructor_id: instructorId, action }),
    })
    const json = await res.json()
    setLoading(null)

    if (!res.ok) {
      toast.error(json.error ?? '처리 실패')
      return
    }
    toast.success(action === 'approve' ? '승인 완료' : '거절 완료')
    setList(prev => prev.filter(p => p.id !== profileId))
  }

  if (list.length === 0) return null

  return (
    <div className="space-y-3">
      {list.map(p => (
        <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-brand-ink">{p.users?.name ?? '이름 없음'}</p>
                <span className="text-xs text-brand-grey">{p.users?.email}</span>
              </div>
              {p.region && (
                <p className="text-xs text-brand-grey mb-2">지역: {p.region}</p>
              )}
              {p.bio && (
                <p className="text-sm text-brand-ink/80 line-clamp-3 whitespace-pre-line">{p.bio}</p>
              )}
              <p className="text-xs text-brand-grey mt-2">
                신청일: {new Date(p.created_at).toLocaleDateString('ko-KR')}
                {p.approved_at && ` · 승인일: ${new Date(p.approved_at).toLocaleDateString('ko-KR')}`}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 items-center">
              <Link
                href={`/admin/instructors/${p.instructor_id}/edit`}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-brand-mist text-brand-grey hover:bg-brand-bg transition-colors"
              >
                편집
              </Link>
              {mode === 'pending' && (
                <>
                  <button
                    onClick={() => handleAction(p.id, p.instructor_id, 'reject')}
                    disabled={loading === p.id}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    거절
                  </button>
                  <button
                    onClick={() => handleAction(p.id, p.instructor_id, 'approve')}
                    disabled={loading === p.id}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-deep text-white hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
                  >
                    {loading === p.id ? '처리중...' : '승인'}
                  </button>
                </>
              )}
              {mode === 'approved' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                  승인됨
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
