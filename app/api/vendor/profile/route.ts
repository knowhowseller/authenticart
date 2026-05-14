import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return NextResponse.json({ error: '벤더 계정이 없습니다' }, { status: 403 })

  const body = await req.json()
  const allowed = ['logo_url', 'banner_url', 'description', 'website_url']
  const update: Record<string, any> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }
  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: '변경할 항목이 없습니다' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin.from('vendors').update(update).eq('id', vendor.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
