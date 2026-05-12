'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function ClassRequestJoinButton({ requestId, isJoined, isFull }: {
  requestId: string; isJoined: boolean; isFull: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(isJoined)

  async function handleJoin() {
    setLoading(true)
    const res = await fetch(`/api/class-requests/${requestId}/join`, { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? '오류'); return }
    setJoined(true)
    if (data.is_full) {
      toast.success('정원이 찼습니다! 결제 안내 알림을 확인해주세요.')
    } else {
      toast.success(`참여 신청 완료 (${data.current_count}/${data.target_capacity ?? '?'}명)`)
    }
    router.refresh()
  }

  if (joined) {
    return (
      <span className="px-3 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-medium flex-shrink-0">
        참여 중
      </span>
    )
  }
  if (isFull) {
    return (
      <span className="px-3 py-2 bg-brand-bg text-brand-grey rounded-xl text-xs font-medium flex-shrink-0">
        정원 마감
      </span>
    )
  }
  return (
    <button onClick={handleJoin} disabled={loading}
      className="px-4 py-2 bg-brand-deep text-white rounded-xl text-xs font-medium hover:bg-brand-deep/90 disabled:opacity-50 transition-colors flex-shrink-0">
      {loading ? '신청 중...' : '참여하기'}
    </button>
  )
}
