'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function CloseClassButton({ classId, status }: { classId: string; status: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (status === 'closed') return null

  async function handleClose() {
    if (!confirm('이 클래스를 마감 처리하시겠습니까? 마감 후 수강생이 예약할 수 없습니다.')) return
    setLoading(true)
    const res = await fetch('/api/classes/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: classId }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); toast.error(d.error ?? '마감 처리 실패'); return }
    toast.success('클래스가 마감 처리되었습니다')
    router.refresh()
  }

  return (
    <button
      onClick={handleClose}
      disabled={loading}
      className="text-xs text-brand-grey hover:text-red-500 transition-colors disabled:opacity-50"
    >
      {loading ? '처리 중...' : '마감'}
    </button>
  )
}
