import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { payout_id } = await req.json()
  if (!payout_id) return NextResponse.json({ error: 'Missing payout_id' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin
    .from('payouts')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', payout_id)
    .eq('status', 'pending')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'payout_mark_paid',
    target_type: 'payouts',
    target_id: payout_id,
  })

  return NextResponse.json({ ok: true })
}
