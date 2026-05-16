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
  // gross_amount는 클라이언트로부터 받지 않고 DB에서 조회한 가격 사용 (P0-1)
  const { schedule_id, confirmation_mode } = body

  if (!schedule_id) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
  }

  // 서버 측에서 일정 + 강의 가격 조회
  const { data: schedule } = await supabase
    .from('class_schedules')
    .select('max_students, booked_count, class_id, start_at, classes!class_id(title, instructor_id, price)')
    .eq('id', schedule_id)
    .single()

  if (!schedule) return NextResponse.json({ error: '일정을 찾을 수 없습니다' }, { status: 404 })

  const cls = (schedule as any).classes
  const gross_amount: number = cls?.price ?? 0

  if (!gross_amount || gross_amount <= 0) {
    return NextResponse.json({ error: '클래스 가격 정보를 확인할 수 없습니다' }, { status: 400 })
  }

  const { pg_fee, platform_fee, instructor_payout } = calcFees(gross_amount)
  const isRequest = confirmation_mode === 'request'
  const approvalExpiresAt = isRequest
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : null

  // 좌석 확인 + 중복 예약 확인 + 예약 생성을 atomic RPC로 처리 (P0-2)
  const { data: rpcResult, error: rpcError } = await supabase.rpc('reserve_seat', {
    p_schedule_id: schedule_id,
    p_student_id: user.id,
    p_gross_amount: gross_amount,
    p_pg_fee: pg_fee,
    p_platform_fee: platform_fee,
    p_instructor_payout: instructor_payout,
    p_is_request: isRequest,
    p_approval_expires_at: approvalExpiresAt,
  })

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 })
  }

  const result = rpcResult as { ok: boolean; error?: string; booking_id?: string }
  if (!result.ok) {
    const status = result.error === '잔여 좌석이 없습니다' ? 409
      : result.error === '이미 예약하셨습니다' ? 409
      : 400
    return NextResponse.json({ error: result.error }, { status })
  }

  const bookingId = result.booking_id!

  // request 모드: 강사에게 알림 이메일 발송
  if (isRequest) {
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
            bookingId,
          }),
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ booking_id: bookingId })
}
