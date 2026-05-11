import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
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

  // 본인 클래스 회차인지 확인
  const { data: schedule } = await supabase
    .from('class_schedules')
    .select('id, start_at, end_at, classes!class_id(instructor_id)')
    .eq('id', id)
    .single()

  if (!schedule) return NextResponse.json({ error: '회차를 찾을 수 없습니다' }, { status: 404 })

  const classInstructor = (schedule as any).classes?.instructor_id
  if (classInstructor !== user.id && userData?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const startAt = new Date(schedule.start_at)
  if (startAt > new Date()) {
    return NextResponse.json({ error: '아직 시작되지 않은 회차입니다' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data: updated, error } = await admin
    .from('bookings')
    .update({ status: 'completed' })
    .eq('status', 'paid')
    .eq('schedule_id', id)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, completed_count: updated?.length ?? 0 })
}
