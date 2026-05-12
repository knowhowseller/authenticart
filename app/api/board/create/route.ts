import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()
  const { type, title, content, author_name, author_email, is_private } = body

  if (!type || !title || !content || !author_name) {
    return NextResponse.json({ error: 'type, title, content, author_name required' }, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  const admin = await createAdminClient()

  const { data: post, error } = await admin.from('board_posts').insert({
    type, title, content,
    author_id: user?.id ?? null,
    author_name,
    author_email: author_email ?? null,
    is_private: is_private ?? false,
  } as any).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post_id: post.id })
}
