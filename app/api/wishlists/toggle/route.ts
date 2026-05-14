import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // 사용자 인증 확인 (anon 클라이언트)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { class_id } = await req.json()
  if (!class_id) return NextResponse.json({ error: 'class_id required' }, { status: 400 })

  // DB 조작은 admin 클라이언트로 (RLS JWT 전달 문제 방지)
  // 보안: user.id는 위에서 auth.getUser()로 검증된 값만 사용
  const admin = await createAdminClient()

  const { data: existing } = await admin
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('class_id', class_id)
    .maybeSingle()

  if (existing) {
    const { error } = await admin.from('wishlists').delete().eq('id', existing.id).eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ wishlisted: false })
  }

  const { error } = await admin.from('wishlists').insert({ user_id: user.id, class_id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ wishlisted: true })
}
