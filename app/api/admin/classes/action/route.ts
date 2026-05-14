import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin', 'branch_manager'].includes(u?.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { class_id, action, reason } = await req.json()
  if (!class_id || !['publish', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const newStatus = action === 'publish' ? 'published' : 'draft'

  const { data: cls, error } = await admin
    .from('classes')
    .update({ status: newStatus })
    .eq('id', class_id)
    .select('title, instructor_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (action === 'publish' && cls?.instructor_id) {
    void admin.from('notifications').insert({
      user_id: cls.instructor_id,
      type: 'class_published',
      title: '클래스가 게시되었습니다',
      body: `"${cls.title}" 클래스가 검수를 통과해 공개되었습니다.`,
      link: '/studio/classes',
    } as any)
  }

  if (action === 'reject' && cls?.instructor_id) {
    void admin.from('notifications').insert({
      user_id: cls.instructor_id,
      type: 'class_rejected',
      title: '클래스 검수가 반려되었습니다',
      body: reason
        ? `"${cls.title}" 반려 사유: ${reason}`
        : `"${cls.title}" 클래스가 반려되었습니다. 내용을 수정 후 재등록해주세요.`,
      link: '/studio/classes',
    } as any)
  }

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: `class_${action}`,
    target_type: 'classes',
    target_id: class_id,
    metadata: reason ? { reason } : {},
  })

  return NextResponse.json({ ok: true })
}
