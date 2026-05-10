'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils/format'

interface ClassItem {
  id: string
  title: string
  region: string
  price: number
  description?: string | null
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

  async function handleAction(classId: string, action: 'publish' | 'reject') {
    setLoading(classId)
    const res = await fetch('/api/admin/classes/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: classId, action }),
    })
    const json = await res.json()
    setLoading(null)

    if (!res.ok) {
      toast.error(json.error ?? '처리 실패')
      return
    }
    toast.success(action === 'publish' ? '게시 완료' : '반려 완료')
    setList(prev => prev.filter(c => c.id !== classId))
  }

  if (list.length === 0) return null

  return (
    <div className="space-y-3">
      {list.map(c => (
        <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 overflow-hidden">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-brand-ink truncate">{c.title}</p>
                <p className="text-xs text-brand-grey mt-0.5">
                  {c.users?.name} · {c.region} · {formatPrice(c.price)}
                </p>
                <p className="text-xs text-brand-grey mt-0.5">
                  등록일: {new Date(c.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {mode === 'draft' && (
                  <>
                    <button
                      onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-brand-mist text-brand-grey hover:bg-brand-bg transition-colors"
                    >
                      상세보기
                    </button>
                    <button
                      onClick={() => handleAction(c.id, 'reject')}
                      disabled={loading === c.id}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      반려
                    </button>
                    <button
                      onClick={() => handleAction(c.id, 'publish')}
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
          {expanded === c.id && c.description && (
            <div className="px-5 pb-5 border-t border-brand-mist/30 pt-4">
              <p className="text-sm text-brand-ink/80 whitespace-pre-line">{c.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
