import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AgencyApplyForm from './AgencyApplyForm'

export const metadata = { title: '에이전시 신청 | 오센틱아트' }

export default async function AgencyApplyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['instructor', 'admin'].includes(u?.role ?? '')) redirect('/studio')

  const { data: existing } = await supabase
    .from('agencies')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (existing) redirect('/studio/agency')

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-brand-ink mb-1">에이전시 신청</h1>
        <p className="text-sm text-brand-grey mb-2">
          공방·스튜디오·에이전시 단위로 소속 강사를 모집하고 플랫폼에서 통합 관리할 수 있습니다.
        </p>
        <p className="text-xs text-brand-grey mb-6">
          ※ 에이전시 대표자는 소속 강사로 동시 등록할 수 없습니다 (겸업 불허 정책).
        </p>
        <AgencyApplyForm />
      </div>
    </div>
  )
}
