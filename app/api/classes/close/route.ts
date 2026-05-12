import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { class_id } = await req.json()
  if (!class_id) return NextResponse.json({ error: 'class_id required' }, { status: 400 })

  const { data: cls } = await supabase
    .from('classes')
    .select('instructor_id, status')
    .eq('id', class_id)
    .single()

  if (!cls) return NextResponse.json({ error: '클래스를 찾을 수 없습니다' }, { status: 404 })

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (cls.instructor_id !== user.id && userData?.role !== 'admin') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }
  if (cls.status === 'closed') {
    return NextResponse.json({ error: '이미 마감된 클래스입니다' }, { status: 400 })
  }

  const { error } = await supabase
    .from('classes')
    .update({ status: 'closed' })
    .eq('id', class_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
