import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin', 'branch_manager'].includes(u?.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, content, is_pinned, is_published } = await req.json()
  if (!title?.trim() || !content?.trim()) return NextResponse.json({ error: '제목과 내용을 입력해주세요' }, { status: 400 })

  const { data, error } = await supabase
    .from('notices')
    .insert({ title: title.trim(), content: content.trim(), is_pinned: !!is_pinned, is_published: is_published !== false, created_by: user.id })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
