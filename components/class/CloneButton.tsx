'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

export default function CloneButton({ classId }: { classId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClone() {
    if (!confirm('이 클래스를 복사하시겠습니까?')) return
    setLoading(true)
    const res = await fetch('/api/classes/clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: classId }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('복사에 실패했습니다'); return }
    const { id } = await res.json()
    toast.success('클래스가 복사되었습니다')
    router.push(`/studio/classes/${id}/edit`)
  }

  return (
    <button
      onClick={handleClone}
      disabled={loading}
      className="flex items-center gap-1 text-xs text-brand-grey hover:text-brand-deep transition-colors disabled:opacity-50"
    >
      <Copy size={12} />
      {loading ? '복사 중...' : '복사'}
    </button>
  )
}
