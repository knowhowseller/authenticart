'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Play } from 'lucide-react'

export default function TriggerPayoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleTrigger() {
    if (!window.confirm('정산 집계를 지금 실행하시겠습니까?\n이미 집계된 월은 중복 생성되지 않습니다.')) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/payouts/trigger', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? '오류')
      toast.success(d.message ?? '정산 집계 완료')
      window.location.reload()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleTrigger}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-brand-deep text-white rounded-xl hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
    >
      <Play size={12} />
      {loading ? '실행 중...' : '지금 집계 실행'}
    </button>
  )
}
