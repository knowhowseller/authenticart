import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: userData } = await admin.from('users').select('name, role').eq('id', user.id).single()
  const isAdmin = ['admin', 'branch_manager'].includes(userData?.role ?? '')

  const { data: reply, error } = await admin.from('board_replies').insert({
    post_id: id,
    author_id: user.id,
    author_name: userData?.name ?? '회원',
    content,
    is_admin: isAdmin,
  } as any).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (isAdmin) {
    await admin.from('board_posts').update({ status: 'in_progress' } as any).eq('id', id)
  }

  return NextResponse.json({ reply })
}
