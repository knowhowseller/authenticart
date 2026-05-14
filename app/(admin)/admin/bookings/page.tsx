import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import AdminBookingsClient from './AdminBookingsClient'

export default async function AdminBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = u?.role ?? ''
  if (!['admin', 'branch_manager'].includes(role)) redirect('/')

  // 지부장: 지부 소속 강사의 클래스 예약만 조회
  let branchId: string | null = null
  let branchClassIds: string[] | null = null
  if (role === 'branch_manager') {
    const { data: branch } = await supabase
      .from('branches').select('id').eq('manager_id', user.id).maybeSingle()
    branchId = branch?.id ?? null

    if (branchId) {
      const { data: branchClasses } = await supabase
        .from('classes').select('id').eq('branch_id', branchId)
      branchClassIds = (branchClasses ?? []).map((c: any) => c.id)
    }
  }

  let bookings: any[] = []
  if (role === 'branch_manager' && branchClassIds !== null) {
    if (branchClassIds.length > 0) {
      // 지부 클래스의 schedule_id 목록 조회
      const { data: schedules } = await supabase
        .from('class_schedules').select('id').in('class_id', branchClassIds)
      const scheduleIds = (schedules ?? []).map((s: any) => s.id)

      if (scheduleIds.length > 0) {
        const { data } = await supabase
          .from('bookings')
          .select(`
            id, status, gross_amount, instructor_payout, created_at, payment_id,
            users!student_id(name, email),
            class_schedules!schedule_id(
              start_at,
              classes!class_id(title, users!instructor_id(name))
            )
          `)
          .in('schedule_id', scheduleIds)
          .order('created_at', { ascending: false })
          .limit(500)
        bookings = data ?? []
      }
    }
  } else if (role === 'admin') {
    const { data } = await supabase
      .from('bookings')
      .select(`
        id, status, gross_amount, instructor_payout, created_at, payment_id,
        users!student_id(name, email),
        class_schedules!schedule_id(
          start_at,
          classes!class_id(title, users!instructor_id(name))
        )
      `)
      .order('created_at', { ascending: false })
      .limit(500)
    bookings = data ?? []
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">
            {role === 'branch_manager' ? '지부장' : 'Admin'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-4">예약 현황</h1>

        {role === 'branch_manager' && !branchId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6 text-sm text-yellow-700">
            ⚠️ 아직 배정된 지부가 없습니다. 관리자에게 지부 배정을 요청해주세요.
          </div>
        )}
        {role === 'branch_manager' && branchId && (
          <div className="bg-brand-deep/5 border border-brand-deep/10 rounded-xl px-4 py-2.5 mb-6 text-sm text-brand-deep">
            내 지부 클래스 예약만 표시됩니다
          </div>
        )}

        <AdminBookingsClient bookings={bookings as any} />
      </div>
    </div>
  )
}
