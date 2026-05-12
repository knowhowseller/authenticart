'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function ArtworkActions({ artworkId, currentStatus }: { artworkId: string; currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const newStatus = currentStatus === 'active' ? 'hidden' : 'active'
    const res = await fetch(`/api/artworks/${artworkId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('변경 실패'); return }
    toast.success(newStatus === 'hidden' ? '숨김 처리되었습니다' : '판매 중으로 변경되었습니다')
    router.refresh()
  }

  async function remove() {
    if (!confirm('작품을 삭제하시겠습니까?')) return
    setLoading(true)
    const res = await fetch(`/api/artworks/${artworkId}`, { method: 'DELETE' })
    setLoading(false)
    if (!res.ok) { toast.error('삭제 실패'); return }
    toast.success('삭제되었습니다')
    router.refresh()
  }

  return (
    <div className="flex gap-2 flex-shrink-0">
      <button onClick={toggle} disabled={loading}
        className="px-2.5 py-1.5 text-xs rounded-lg border border-brand-mist text-brand-grey hover:text-brand-ink transition-colors disabled:opacity-50">
        {currentStatus === 'active' ? '숨기기' : '공개'}
      </button>
      <button onClick={remove} disabled={loading}
        className="px-2.5 py-1.5 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
        삭제
      </button>
    </div>
  )
}
