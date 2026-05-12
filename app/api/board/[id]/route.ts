import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const admin = await createAdminClient()
  const { data: u } = await admin.from('users').select('role').eq('id', user.id).single()
  const { data: post } = await admin.from('board_posts').select('author_id').eq('id', id).single()
  if (!post) return NextResponse.json({ error: '없음' }, { status: 404 })

  const allowed = post.author_id === user.id || u?.role === 'admin'
  if (!allowed) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { error } = await admin.from('board_posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
