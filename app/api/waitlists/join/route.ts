import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { schedule_id } = await req.json()
  if (!schedule_id) return NextResponse.json({ error: 'schedule_id required' }, { status: 400 })

  // 이미 유효한 예약이 있으면 불필요
  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('id')
    .eq('schedule_id', schedule_id)
    .eq('student_id', user.id)
    .not('status', 'in', '(cancelled,rejected,expired,refunded)')
    .maybeSingle()

  if (existingBooking) {
    return NextResponse.json({ error: '이미 예약하셨습니다' }, { status: 409 })
  }

  // 중복 대기 방지
  const { data: existing } = await supabase
    .from('class_waitlists')
    .select('id, status')
    .eq('schedule_id', schedule_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ waitlisted: true, position: null, alreadyExists: true })
  }

  const { error } = await supabase
    .from('class_waitlists')
    .insert({ schedule_id, user_id: user.id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 내 순서 계산
  const { count } = await supabase
    .from('class_waitlists')
    .select('id', { count: 'exact', head: true })
    .eq('schedule_id', schedule_id)
    .eq('status', 'waiting')

  return NextResponse.json({ waitlisted: true, position: count })
}
