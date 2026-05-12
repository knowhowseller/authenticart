import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { booking_id, coupon_id, discount_amount } = await req.json()
  if (!booking_id || !coupon_id || discount_amount == null) {
    return NextResponse.json({ error: '필수 파라미터가 없습니다' }, { status: 400 })
  }

  // 본인 예약 확인
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, gross_amount, status, student_id')
    .eq('id', booking_id)
    .eq('student_id', user.id)
    .single()

  if (!booking) return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 })
  if (booking.status !== 'approved') {
    return NextResponse.json({ error: '결제 대기 상태의 예약에만 쿠폰을 적용할 수 있습니다' }, { status: 400 })
  }

  const { error } = await supabase
    .from('bookings')
    .update({ coupon_id, discount_amount })
    .eq('id', booking_id)
    .eq('student_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ final_amount: booking.gross_amount - discount_amount })
}
