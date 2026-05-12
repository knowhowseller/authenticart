import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { bookingApprovedHtml } from '@/lib/email/templates/booking-approved'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { booking_id } = await request.json()
  const admin = await createAdminClient()

  const { data: booking } = await admin
    .from('bookings')
    .select(`
      id, status, gross_amount, student_id,
      class_schedules!schedule_id(start_at, classes!class_id(instructor_id, title))
    `)
    .eq('id', booking_id)
    .single()

  if (!booking) return NextResponse.json({ error: '예약 없음' }, { status: 404 })

  const schedule = (booking.class_schedules as any)
  const cls = schedule?.classes
  if (cls?.instructor_id !== user.id) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  if (booking.status !== 'pending_approval') {
    return NextResponse.json({ error: '처리할 수 없는 상태' }, { status: 400 })
  }

  const paymentExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  await admin
    .from('bookings')
    .update({ status: 'approved', payment_expires_at: paymentExpiresAt })
    .eq('id', booking_id)

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'booking_approved',
    target_type: 'booking',
    target_id: booking_id,
    metadata: {},
  })

  // 수강생 정보 조회 후 메일 발송
  const { data: student } = await admin
    .from('users')
    .select('name, email')
    .eq('id', booking.student_id)
    .single()

  if (student?.email) {
    await sendEmail({
      to: student.email,
      subject: '[오센틱아트] 예약 신청이 승인되었습니다 - 24시간 내 결제 완료',
      html: bookingApprovedHtml({
        userName: student.name,
        className: cls?.title ?? '클래스',
        startAt: schedule?.start_at ?? '',
        amount: booking.gross_amount,
        bookingId: booking_id,
        paymentDeadline: paymentExpiresAt,
      }),
    }).catch(() => {})
  }

  void admin.from('notifications').insert({
    user_id: booking.student_id,
    type: 'booking_approved',
    title: '예약이 승인되었습니다',
    body: `${cls?.title ?? '클래스'} 예약이 승인되었습니다. 24시간 내 결제를 완료해주세요.`,
    link: `/my/bookings`,
  } as any)

  return NextResponse.json({ ok: true })
}
