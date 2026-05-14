import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { payout_account } = await request.json()
  if (!payout_account || typeof payout_account !== 'string' || payout_account.trim() === '') {
    return NextResponse.json({ error: '계좌 정보를 입력해주세요' }, { status: 400 })
  }

  const { data: vendor } = await supabase.from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

  const admin = await createAdminClient()
  const { error } = await admin.from('vendors').update({ payout_account: payout_account.trim() }).eq('id', vendor.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
