import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin', 'branch_manager'].includes(u?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { instructor_id, admin_memo, status } = await req.json()
  const admin = await createAdminClient()

  const update: Record<string, unknown> = { status: status ?? 'assigned' }
  if (instructor_id) update.assigned_instructor_id = instructor_id
  if (admin_memo) update.admin_memo = admin_memo

  const { error } = await admin.from('group_lesson_requests').update(update as any).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (instructor_id) {
    void admin.from('notifications').insert({
      user_id: instructor_id,
      type: 'group_lesson_assigned',
      title: '단체 출강 요청이 배정되었습니다',
      body: '새로운 단체 출강 요청이 배정되었습니다. 확인해주세요.',
      link: '/studio',
    } as any)
  }

  return NextResponse.json({ ok: true })
}
