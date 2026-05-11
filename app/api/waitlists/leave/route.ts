import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { schedule_id } = await req.json()
  if (!schedule_id) return NextResponse.json({ error: 'schedule_id required' }, { status: 400 })

  const { error } = await supabase
    .from('class_waitlists')
    .delete()
    .eq('schedule_id', schedule_id)
    .eq('user_id', user.id)
    .in('status', ['waiting', 'notified'])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ waitlisted: false })
}
