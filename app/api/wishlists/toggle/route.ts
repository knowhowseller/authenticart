import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { class_id } = await req.json()
  if (!class_id) return NextResponse.json({ error: 'class_id required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('class_id', class_id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('wishlists').delete().eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ wishlisted: false })
  }

  const { error } = await supabase.from('wishlists').insert({ user_id: user.id, class_id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ wishlisted: true })
}
