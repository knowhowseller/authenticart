import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['instructor', 'admin'].includes(userData?.role ?? '')) {
    return NextResponse.json({ error: '강사만 수락할 수 있습니다' }, { status: 403 })
  }

  const { target_capacity, price_per_person, schedule_date } = await req.json()
  if (!target_capacity || !price_per_person) {
    return NextResponse.json({ error: 'target_capacity, price_per_person required' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data: req_ } = await admin.from('class_open_requests').select('*').eq('id', id).single()
  if (!req_) return NextResponse.json({ error: '요청 없음' }, { status: 404 })
  if (req_.status !== 'open') return NextResponse.json({ error: '이미 처리된 요청입니다' }, { status: 400 })

  const { error } = await admin.from('class_open_requests').update({
    status: 'recruiting',
    instructor_id: user.id,
    target_capacity: Number(target_capacity),
    price_per_person: Number(price_per_person),
    schedule_date: schedule_date ? new Date(schedule_date).toISOString() : null,
  } as any).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  void admin.from('notifications').insert({
    user_id: req_.requester_id,
    type: 'class_request_accepted',
    title: '클래스 요청이 수락되었습니다',
    body: `"${req_.title}" 요청을 강사가 수락했습니다. 모집 중이니 주변에 알려주세요!`,
    link: `/class-requests/${id}`,
  } as any)

  return NextResponse.json({ ok: true })
}
