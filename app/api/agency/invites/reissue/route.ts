import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { old_invite_id } = await request.json()
  if (!old_invite_id) return NextResponse.json({ error: 'invite_id required' }, { status: 400 })

  // 에이전시 소유자 확인
  const { data: agency } = await supabase
    .from('agencies')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!agency) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = await createAdminClient()
  // 기존 초대 만료 처리
  await admin.from('agency_invites').update({ expires_at: new Date().toISOString() }).eq('id', old_invite_id).eq('agency_id', agency.id)

  // 새 초대 링크 발급
  const { data: newInvite, error } = await admin
    .from('agency_invites')
    .insert({ agency_id: agency.id })
    .select('id, token, expires_at, used_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, invite: newInvite })
}
