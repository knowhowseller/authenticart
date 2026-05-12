import { createClient } from '@/lib/supabase/server'
import RequestsList from './RequestsList'

async function getPendingRequests(userId: string) {
  const supabase = await createClient()
  const { data: myClasses } = await supabase
    .from('classes')
    .select('id')
    .eq('instructor_id', userId)
  const classIds = (myClasses ?? []).map((c: any) => c.id)
  if (classIds.length === 0) return []

  const { data: schedules } = await supabase
    .from('class_schedules')
    .select('id')
    .in('class_id', classIds)
  const scheduleIds = (schedules ?? []).map((s: any) => s.id)
  if (scheduleIds.length === 0) return []

  const { data } = await supabase
    .from('bookings')
    .select(`
      id, status, gross_amount, approval_expires_at, created_at,
      users!student_id(name, email, phone),
      class_schedules!schedule_id(
        start_at, end_at,
        classes!class_id(title, price)
      )
    `)
    .eq('status', 'pending_approval')
    .in('schedule_id', scheduleIds)
    .order('approval_expires_at', { ascending: true })
  return data ?? []
}

export default async function RequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const requests = await getPendingRequests(user.id)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-brand-ink mb-1">예약 신청 관리</h1>
        <p className="text-brand-grey text-sm mb-6">request 모드 클래스의 대기 중인 예약 신청을 처리하세요</p>
        <RequestsList initialRequests={requests as any[]} />
      </div>
    </div>
  )
}
