'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

export default function BoardAdminActions({ postId }: { postId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('이 게시물을 삭제하시겠습니까?')) return
    setDeleting(true)
    const res = await fetch(`/api/board/${postId}`, { method: 'DELETE' })
    setDeleting(false)
    if (!res.ok) { toast.error('삭제 실패'); return }
    toast.success('게시물이 삭제되었습니다')
    router.push('/board')
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-500 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      <Trash2 size={13} />
      {deleting ? '삭제 중...' : '게시물 삭제'}
    </button>
  )
}
