import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AgencyDashboardClient from './AgencyDashboardClient'

export const metadata = { title: '에이전시 대시보드 | 오센틱아트' }

export default async function AgencyDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!agency) redirect('/studio/agency/apply')

  const [{ data: instructors }, { data: invites }, { data: rawPayouts }] = await Promise.all([
    supabase
      .from('instructor_profiles')
      .select('instructor_id, status, users!instructor_id(name, email)')
      .eq('agency_id', agency.id),
    supabase
      .from('agency_invites')
      .select('id, token, expires_at, used_at, users!used_by(name)')
      .eq('agency_id', agency.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('agency_payouts')
      .select('*')
      .eq('agency_id', agency.id)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .limit(6),
  ])

  // 강사별 수익 내역 조회 (각 정산 기간별)
  const payoutsWithDetails = await Promise.all(
    (rawPayouts ?? []).map(async (p: any) => {
      const { data: instructorPayouts } = await supabase
        .from('payouts')
        .select('instructor_id, total_gross, agency_fee, users!instructor_id(name)')
        .eq('agency_id', agency.id)
        .eq('period_year', p.period_year)
        .eq('period_month', p.period_month)
      const instructor_details = (instructorPayouts ?? []).map((ip: any) => ({
        instructor_id: ip.instructor_id,
        name: ip.users?.name ?? '-',
        gross: ip.total_gross,
        fee: ip.agency_fee,
      }))
      return { ...p, instructor_details }
    })
  )

  return (
    <AgencyDashboardClient
      agency={agency}
      instructors={(instructors ?? []) as any[]}
      invites={(invites ?? []) as any[]}
      payouts={payoutsWithDetails as any[]}
    />
  )
}
