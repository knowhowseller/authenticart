'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'
import Button from '@/components/ui/Button'

interface WaitlistButtonProps {
  scheduleId: string
  initialWaitlisted: boolean
  initialPosition?: number | null
}

export default function WaitlistButton({ scheduleId, initialWaitlisted, initialPosition }: WaitlistButtonProps) {
  const router = useRouter()
  const [waitlisted, setWaitlisted] = useState(initialWaitlisted)
  const [position, setPosition] = useState<number | null>(initialPosition ?? null)
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    setLoading(true)
    const res = await fetch('/api/waitlists/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule_id: scheduleId }),
    })
    setLoading(false)

    if (res.status === 401) {
      toast.error('로그인이 필요합니다')
      router.push('/login')
      return
    }
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? '오류가 발생했습니다'); return }

    setWaitlisted(true)
    setPosition(data.position)
    toast.success(`대기 신청 완료! 현재 ${data.position}번째 대기 중입니다.`)
  }

  async function handleLeave() {
    if (!window.confirm('대기 신청을 취소하시겠습니까?')) return
    setLoading(true)
    const res = await fetch('/api/waitlists/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule_id: scheduleId }),
    })
    setLoading(false)

    if (!res.ok) { toast.error('오류가 발생했습니다'); return }
    setWaitlisted(false)
    setPosition(null)
    toast.success('대기 신청이 취소되었습니다')
  }

  if (waitlisted) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-3 bg-brand-amber/10 rounded-xl border border-brand-amber/30">
          <Clock size={14} className="text-brand-amber flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-brand-ink">대기 신청 완료</p>
            {position && (
              <p className="text-xs text-brand-grey">현재 {position}번째 대기 중</p>
            )}
            <p className="text-xs text-brand-grey">자리가 나면 이메일로 안내드립니다</p>
          </div>
        </div>
        <button
          onClick={handleLeave}
          disabled={loading}
          className="w-full text-sm text-brand-grey hover:text-red-500 transition-colors py-1 disabled:opacity-50"
        >
          대기 취소
        </button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full"
      loading={loading}
      onClick={handleJoin}
    >
      <Clock size={15} className="mr-1.5" />
      대기 신청하기
    </Button>
  )
}
