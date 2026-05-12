import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { review_id, reply } = await req.json()
  if (!review_id || !reply?.trim()) return NextResponse.json({ error: '필수 값 누락' }, { status: 400 })

  // 해당 리뷰의 클래스 강사인지 확인
  const { data: review } = await supabase
    .from('class_reviews')
    .select('id, class_id, classes!class_id(instructor_id)')
    .eq('id', review_id)
    .single()

  if (!review) return NextResponse.json({ error: '리뷰를 찾을 수 없습니다' }, { status: 404 })

  const instructorId = (review as any).classes?.instructor_id
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (instructorId !== user.id && userData?.role !== 'admin') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { error } = await supabase
    .from('class_reviews')
    .update({ reply: reply.trim(), replied_at: new Date().toISOString() })
    .eq('id', review_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
