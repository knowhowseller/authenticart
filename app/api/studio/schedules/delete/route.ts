import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { schedule_id } = await req.json()
  if (!schedule_id) return NextResponse.json({ error: 'Missing schedule_id' }, { status: 400 })

  const { data: schedule } = await supabase
    .from('class_schedules')
    .select('id, booked_count, classes!class_id(instructor_id)')
    .eq('id', schedule_id)
    .single()

  if (!schedule) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if ((schedule as any).classes?.instructor_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (schedule.booked_count > 0) {
    return NextResponse.json({ error: '예약자가 있는 회차는 삭제할 수 없습니다' }, { status: 400 })
  }

  const { error } = await supabase
    .from('class_schedules')
    .delete()
    .eq('id', schedule_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
