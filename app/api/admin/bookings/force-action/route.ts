import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { releaseAndNotify } from '@/lib/waitlist'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { booking_id, action, reason } = await req.json()
  if (!booking_id || !action) return NextResponse.json({ error: 'booking_id and action required' }, { status: 400 })
  if (!['cancel', 'refund'].includes(action)) return NextResponse.json({ error: 'action must be cancel or refund' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: booking } = await admin
    .from('bookings')
    .select('id, status, gross_amount, payment_id, student_id')
    .eq('id', booking_id)
    .single()

  if (!booking) return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 })

  if (action === 'cancel') {
    if (['cancelled', 'refunded', 'rejected'].includes(booking.status)) {
      return NextResponse.json({ error: '이미 처리된 예약입니다' }, { status: 400 })
    }
    const { error } = await admin
      .from('bookings')
      .update({ status: 'cancelled', refund_reason: reason ?? '관리자 강제 취소' })
      .eq('id', booking_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    releaseAndNotify(booking_id, admin).catch(() => {})

    await admin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'admin_force_cancel',
      target_type: 'bookings',
      target_id: booking_id,
      metadata: { reason: reason ?? '관리자 강제 취소' },
    })
    return NextResponse.json({ ok: true })
  }

  // action === 'refund'
  if (booking.status !== 'paid') {
    return NextResponse.json({ error: '결제 완료 상태의 예약만 환불할 수 있습니다' }, { status: 400 })
  }
  if (!booking.payment_id) {
    return NextResponse.json({ error: '결제 정보가 없습니다' }, { status: 400 })
  }

  const tossSecret = process.env.TOSS_SECRET_KEY!
  const tossRes = await fetch(`https://api.tosspayments.com/v1/payments/${booking.payment_id}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(tossSecret + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cancelReason: reason ?? '관리자 강제 환불',
      cancelAmount: booking.gross_amount,
    }),
  })

  if (!tossRes.ok) {
    const tossErr = await tossRes.json().catch(() => ({}))
    return NextResponse.json({ error: (tossErr as any).message ?? '결제 취소 실패' }, { status: 500 })
  }

  await admin.from('bookings').update({
    status: 'refunded',
    refund_amount: booking.gross_amount,
    refunded_at: new Date().toISOString(),
    refund_reason: reason ?? '관리자 강제 환불',
  }).eq('id', booking_id)

  releaseAndNotify(booking_id, admin).catch(() => {})

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'admin_force_refund',
    target_type: 'bookings',
    target_id: booking_id,
    metadata: { refund_amount: booking.gross_amount, reason: reason ?? '관리자 강제 환불' },
  })

  return NextResponse.json({ ok: true, refund_amount: booking.gross_amount })
}
