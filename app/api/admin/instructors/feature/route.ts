import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { instructor_id, is_featured } = await req.json()
  if (!instructor_id || typeof is_featured !== 'boolean') {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('instructor_profiles')
    .update({ is_featured })
    .eq('instructor_id', instructor_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
