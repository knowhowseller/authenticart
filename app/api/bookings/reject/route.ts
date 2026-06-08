import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { releaseAndNotify } from '@/lib/waitlist'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { booking_id, reason } = await request.json()
  const admin = await createAdminClient()

  const { data: booking } = await admin
    .from('bookings')
    .select('id, status, student_id, class_schedules!schedule_id(classes!class_id(instructor_id, title))')
    .eq('id', booking_id)
    .single()

  if (!booking) return NextResponse.json({ error: '예약 없음' }, { status: 404 })

  const cls = (booking.class_schedules as any)?.classes
  if (cls?.instructor_id !== user.id) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  await admin.from('bookings').update({
    status: 'rejected',
    refund_reason: reason,
  }).eq('id', booking_id)

  releaseAndNotify(booking_id, admin).catch(() => {})

  void admin.from('notifications').insert({
    user_id: (booking as any).student_id,
    type: 'booking_rejected',
    title: '예약이 거절되었습니다',
    body: `${cls?.title ?? '클래스'} 예약이 거절되었습니다.${reason ? ` 사유: ${reason}` : ''}`,
    link: `/my/bookings`,
  } as any)

  return NextResponse.json({ ok: true })
}
