import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminClient()
  const now = new Date().toISOString()
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()

  // 강사 응답 기한 초과 (pending_approval)
  const { data: expiredApproval } = await admin
    .from('bookings')
    .update({ status: 'expired' })
    .eq('status', 'pending_approval')
    .lt('approval_expires_at', now)
    .select('id')

  // 결제 기한 초과 (approved → student didn't pay in time)
  const { data: expiredPayment } = await admin
    .from('bookings')
    .update({ status: 'expired' })
    .eq('status', 'approved')
    .lt('payment_expires_at', now)
    .select('id')

  // 수업 종료된 회차의 paid 예약을 completed로 전환
  const { data: endedSchedules } = await admin
    .from('class_schedules')
    .select('id')
    .or(`end_at.lt.${now},and(end_at.is.null,start_at.lt.${threeHoursAgo})`)

  let completedCount = 0
  if (endedSchedules && endedSchedules.length > 0) {
    const scheduleIds = endedSchedules.map((s: any) => s.id)
    const { data: completed } = await admin
      .from('bookings')
      .update({ status: 'completed' })
      .eq('status', 'paid')
      .in('schedule_id', scheduleIds)
      .select('id')
    completedCount = completed?.length ?? 0
  }

  return NextResponse.json({
    expired_approval: expiredApproval?.length ?? 0,
    expired_payment: expiredPayment?.length ?? 0,
    completed: completedCount,
  })
}
