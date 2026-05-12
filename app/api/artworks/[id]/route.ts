import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await req.json()
  const admin = await createAdminClient()

  const { data: existing } = await admin.from('artworks').select('seller_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: '없음' }, { status: 404 })
  if (existing.seller_id !== user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { error } = await admin.from('artworks').update({ ...body, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const admin = await createAdminClient()
  const { data: existing } = await admin.from('artworks').select('seller_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: '없음' }, { status: 404 })
  if (existing.seller_id !== user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { error } = await admin.from('artworks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
