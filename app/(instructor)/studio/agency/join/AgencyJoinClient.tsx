'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'

export default function AgencyJoinClient({
  inviteId,
  agencyName,
  token,
}: {
  inviteId: string
  agencyName: string
  token: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('로그인이 필요합니다'); setLoading(false); return }

    const { data: invite } = await supabase
      .from('agency_invites')
      .select('agency_id')
      .eq('id', inviteId)
      .single()

    if (!invite) { toast.error('초대 링크가 유효하지 않습니다'); setLoading(false); return }

    const [r1, r2] = await Promise.all([
      supabase
        .from('instructor_profiles')
        .update({ agency_id: invite.agency_id })
        .eq('instructor_id', user.id),
      supabase
        .from('agency_invites')
        .update({ used_by: user.id, used_at: new Date().toISOString() })
        .eq('id', inviteId),
    ])

    setLoading(false)
    if (r1.error || r2.error) { toast.error(r1.error?.message ?? r2.error?.message); return }
    toast.success(`${agencyName}에 합류했습니다!`)
    router.push('/studio')
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">🏢</div>
        <h1 className="text-xl font-bold text-brand-ink mb-2">에이전시 초대</h1>
        <p className="text-brand-grey text-sm mb-2">
          <strong className="text-brand-deep">{agencyName}</strong>에서 초대장을 보냈습니다.
        </p>
        <p className="text-xs text-brand-grey mb-6">
          수락하면 해당 에이전시의 소속 강사로 등록됩니다.
          에이전시 수수료가 예약 정산 시 자동 공제됩니다.
        </p>
        <Button onClick={handleJoin} loading={loading} className="w-full" size="lg">
          합류하기
        </Button>
      </div>
    </div>
  )
}
