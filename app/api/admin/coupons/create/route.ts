import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { code, type, value, min_amount, max_uses, valid_until, description, target_user_email } = body

  if (!code || !type || !value) return NextResponse.json({ error: 'code, type, value required' }, { status: 400 })

  let target_user_id: string | null = null
  if (target_user_email) {
    const { data: targetUser } = await supabase
      .from('users').select('id').eq('email', target_user_email).single()
    if (!targetUser) return NextResponse.json({ error: `이메일 ${target_user_email}에 해당하는 회원이 없습니다` }, { status: 400 })
    target_user_id = targetUser.id
  }

  const { data: coupon, error } = await supabase.from('coupons').insert({
    code: code.toUpperCase(),
    type, value,
    min_amount: min_amount ?? 0,
    max_uses: max_uses ?? null,
    valid_until: valid_until ? new Date(valid_until + 'T23:59:59').toISOString() : null,
    description: description ?? null,
    created_by: user.id,
    target_user_id,
  } as any).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ coupon })
}
