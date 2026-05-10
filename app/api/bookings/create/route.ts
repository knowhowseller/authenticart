import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { calcFees } from '@/lib/utils/fees'
import { sendEmail } from '@/lib/email/resend'
import { bookingRequestNotifyHtml } from '@/lib/email/templates/booking-request-notify'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await request.json()
  const { schedule_id, gross_amount, confirmation_mode } = body

  if (!schedule_id || !gross_amount) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
  }

  const { data: schedule } = await supabase
    .from('class_schedules')
    .select('max_students, booked_count, class_id, start_at, classes!class_id(title, instructor_id)')
    .eq('id', schedule_id)
    .single()

  if (!schedule) return NextResponse.json({ error: '일정을 찾을 수 없습니다' }, { status: 404 })

  const availableSeats = (schedule.max_students ?? 0) - (schedule.booked_count ?? 0)
  if (availableSeats <= 0) {
    return NextResponse.json({ error: '잔여 좌석이 없습니다' }, { status: 400 })
  }

  // 중복 예약 확인
  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('schedule_id', schedule_id)
    .eq('student_id', user.id)
    .not('status', 'in', '(cancelled,rejected,expired,refunded)')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: '이미 예약하셨습니다' }, { status: 409 })
  }

  const { pg_fee, platform_fee, instructor_payout } = calcFees(gross_amount)
  const isRequest = confirmation_mode === 'request'

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      schedule_id,
      student_id: user.id,
      status: 'pending_approval',
      approval_expires_at: isRequest
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null,
      gross_amount,
      pg_fee,
      platform_fee,
      instructor_payout,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // request 모드: 강사에게 알림 이메일 발송
  if (isRequest) {
    const cls = (schedule as any).classes
    const instructorId = cls?.instructor_id
    if (instructorId) {
      const admin = await createAdminClient()
      const [{ data: student }, { data: instructor }] = await Promise.all([
        admin.from('users').select('name').eq('id', user.id).single(),
        admin.from('users').select('name, email').eq('id', instructorId).single(),
      ])

      if (instructor?.email) {
        await sendEmail({
          to: instructor.email,
          subject: '[오센틱아트] 새 예약 신청이 도착했습니다',
          html: bookingRequestNotifyHtml({
            instructorName: instructor.name,
            studentName: student?.name ?? '수강생',
            className: cls?.title ?? '클래스',
            startAt: (schedule as any).start_at ?? '',
            bookingId: booking.id,
          }),
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ booking_id: booking.id })
}
