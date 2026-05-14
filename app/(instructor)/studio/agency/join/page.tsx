import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AgencyJoinClient from './AgencyJoinClient'

export const metadata = { title: '에이전시 합류 | 오센틱아트' }

export default async function AgencyJoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  if (!token) redirect('/studio')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/studio/agency/join?token=${token}`)

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['instructor', 'admin'].includes(u?.role ?? '')) redirect('/')

  const { data: invite } = await supabase
    .from('agency_invites')
    .select('id, agency_id, expires_at, used_at, agencies!agency_id(agency_name)')
    .eq('token', token)
    .single()

  if (!invite || invite.used_at || new Date(invite.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-brand-ink mb-2">유효하지 않은 초대 링크입니다</p>
          <p className="text-sm text-brand-grey">링크가 만료되었거나 이미 사용된 링크입니다.</p>
        </div>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('instructor_profiles')
    .select('agency_id')
    .eq('instructor_id', user.id)
    .single()

  if (profile?.agency_id) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-brand-ink mb-2">이미 에이전시에 소속되어 있습니다</p>
          <p className="text-sm text-brand-grey">에이전시 탈퇴 후 다른 에이전시에 합류할 수 있습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <AgencyJoinClient
      inviteId={invite.id}
      agencyName={(invite as any).agencies?.agency_name ?? ''}
      token={token}
    />
  )
}
