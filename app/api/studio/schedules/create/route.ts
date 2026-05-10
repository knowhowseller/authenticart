import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['instructor', 'admin'].includes(userData?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { class_id, start_at, end_at, max_students } = await req.json()
  if (!class_id || !start_at || !max_students) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: cls } = await supabase
    .from('classes')
    .select('instructor_id, status')
    .eq('id', class_id)
    .single()

  if (!cls || cls.instructor_id !== user.id) {
    return NextResponse.json({ error: 'Class not found or unauthorized' }, { status: 404 })
  }
  if (cls.status !== 'published') {
    return NextResponse.json({ error: '게시된 클래스에만 회차를 추가할 수 있습니다' }, { status: 400 })
  }

  const { data: schedule, error } = await supabase
    .from('class_schedules')
    .insert({
      class_id,
      start_at,
      end_at: end_at || null,
      max_students,
      booked_count: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ schedule })
}
