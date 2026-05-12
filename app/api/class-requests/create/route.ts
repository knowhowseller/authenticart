import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { title, preferred_region, preferred_date, message } = await req.json()
  if (!title || !preferred_region) {
    return NextResponse.json({ error: 'title, preferred_region required' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin.from('class_open_requests').insert({
    requester_id: user.id, title, preferred_region,
    preferred_date: preferred_date ?? null,
    message: message ?? null,
  } as any).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
