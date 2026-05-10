import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { class_id, action } = await req.json()
  if (!class_id || !['publish', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const newStatus = action === 'publish' ? 'published' : 'draft'

  const { error } = await admin
    .from('classes')
    .update({ status: newStatus })
    .eq('id', class_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: `class_${action}`,
    target_type: 'classes',
    target_id: class_id,
  })

  return NextResponse.json({ ok: true })
}
