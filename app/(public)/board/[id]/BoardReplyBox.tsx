'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function BoardReplyBox({ postId }: { postId: string }) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!content.trim()) return
    setSaving(true)
    const res = await fetch(`/api/board/${postId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('등록 실패'); return }
    toast.success('답글이 등록되었습니다')
    setContent('')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30">
      <textarea value={content} onChange={e => setContent(e.target.value)}
        rows={3} placeholder="답글을 입력하세요"
        className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none" />
      <div className="flex justify-end mt-2">
        <button onClick={handleSubmit} disabled={saving || !content.trim()}
          className="px-4 py-2 bg-brand-deep text-white rounded-lg text-sm font-medium hover:bg-brand-deep/90 disabled:opacity-50 transition-colors">
          {saving ? '등록 중...' : '답글 등록'}
        </button>
      </div>
    </div>
  )
}
