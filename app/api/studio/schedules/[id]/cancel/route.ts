import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { refundCompleteHtml } from '@/lib/email/templates/refund-complete'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['instructor', 'admin'].includes(userData?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { reason } = await request.json()
  if (!reason?.trim()) return NextResponse.json({ error: '취소 사유를 입력해주세요' }, { status: 400 })

  const { data: schedule } = await supabase
    .from('class_schedules')
    .select('id, start_at, classes!class_id(title, instructor_id)')
    .eq('id', id)
    .single()

  if (!schedule) return NextResponse.json({ error: '회차를 찾을 수 없습니다' }, { status: 404 })

  const classInstructor = (schedule as any).classes?.instructor_id
  if (classInstructor !== user.id && userData?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (new Date(schedule.start_at) < new Date()) {
    return NextResponse.json({ error: '이미 시작된 회차는 취소할 수 없습니다' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // paid 상태 예약 전부 조회
  const { data: paidBookings } = await admin
    .from('bookings')
    .select('id, payment_id, gross_amount, student_id')
    .eq('schedule_id', id)
    .eq('status', 'paid')

  const className = (schedule as any).classes?.title ?? '클래스'
  const tossSecret = process.env.TOSS_SECRET_KEY!
  let refundedCount = 0

  for (const booking of paidBookings ?? []) {
    if (!booking.payment_id) continue

    const tossRes = await fetch(`https://api.tosspayments.com/v1/payments/${booking.payment_id}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(tossSecret + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancelReason: `강사 회차 취소: ${reason}`, cancelAmount: booking.gross_amount }),
    })

    if (!tossRes.ok) continue

    await admin.from('bookings').update({
      status: 'refunded',
      refund_amount: booking.gross_amount,
      refunded_at: new Date().toISOString(),
      refund_reason: `강사 회차 취소: ${reason}`,
    }).eq('id', booking.id)

    refundedCount++

    const { data: student } = await admin.from('users').select('name, email').eq('id', booking.student_id).single()
    if (student?.email) {
      await sendEmail({
        to: student.email,
        subject: '[오센틱아트] 클래스 회차가 취소되어 환불 처리되었습니다',
        html: refundCompleteHtml({
          userName: student.name,
          className,
          refundAmount: booking.gross_amount,
          originalAmount: booking.gross_amount,
        }),
      }).catch(() => {})
    }
  }

  // 예약 없는 경우도 삭제 가능
  const { error: deleteError } = await admin
    .from('class_schedules')
    .delete()
    .eq('id', id)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  return NextResponse.json({ ok: true, refunded_count: refundedCount })
}
