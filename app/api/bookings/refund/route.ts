import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { calcRefundAmount } from '@/lib/utils/fees'
import { sendEmail } from '@/lib/email/resend'
import { refundCompleteHtml } from '@/lib/email/templates/refund-complete'
import { releaseAndNotify } from '@/lib/waitlist'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { booking_id } = await req.json()
  if (!booking_id) return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 })

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id, status, gross_amount, payment_id, student_id,
      class_schedules!schedule_id(start_at, classes!class_id(title))
    `)
    .eq('id', booking_id)
    .eq('student_id', user.id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.status !== 'paid') {
    return NextResponse.json({ error: '환불 가능한 예약이 아닙니다' }, { status: 400 })
  }
  if (!booking.payment_id) {
    return NextResponse.json({ error: '결제 정보가 없습니다' }, { status: 400 })
  }

  const schedule = (booking as any).class_schedules
  const startAt = schedule?.start_at
  if (!startAt) return NextResponse.json({ error: '클래스 일정 정보가 없습니다' }, { status: 400 })

  const refundAmount = calcRefundAmount(booking.gross_amount, new Date(startAt))
  if (refundAmount === 0) {
    return NextResponse.json({ error: '환불 기간이 지나 환불이 불가합니다 (당일 취소 시 환불 불가)' }, { status: 400 })
  }

  const tossSecret = process.env.TOSS_SECRET_KEY!
  const tossRes = await fetch(`https://api.tosspayments.com/v1/payments/${booking.payment_id}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(tossSecret + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cancelReason: '고객 환불 요청',
      cancelAmount: refundAmount,
    }),
  })

  if (!tossRes.ok) {
    const tossErr = await tossRes.json()
    return NextResponse.json({ error: tossErr.message ?? '결제 취소 실패' }, { status: 500 })
  }

  const admin = await createAdminClient()
  await admin.from('bookings').update({
    status: 'refunded',
    refund_amount: refundAmount,
    refunded_at: new Date().toISOString(),
    refund_reason: '고객 환불 요청',
  }).eq('id', booking_id)

  // 좌석 반환 + 대기자 알림
  releaseAndNotify(booking_id, admin).catch(() => {})

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'booking_refund',
    target_type: 'bookings',
    target_id: booking_id,
    metadata: { refund_amount: refundAmount, gross_amount: booking.gross_amount },
  })

  // 환불 완료 이메일
  const { data: studentUser } = await admin
    .from('users')
    .select('name, email')
    .eq('id', user.id)
    .single()

  if (studentUser?.email) {
    await sendEmail({
      to: studentUser.email,
      subject: '[오센틱아트] 환불이 처리되었습니다',
      html: refundCompleteHtml({
        userName: studentUser.name,
        className: schedule?.classes?.title ?? '클래스',
        refundAmount,
        originalAmount: booking.gross_amount,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, refund_amount: refundAmount })
}
