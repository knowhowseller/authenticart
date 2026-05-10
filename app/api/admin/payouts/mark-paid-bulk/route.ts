import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { payout_ids } = await req.json()
  if (!Array.isArray(payout_ids) || payout_ids.length === 0) {
    return NextResponse.json({ error: 'Missing payout_ids' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('payouts')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .in('id', payout_ids)
    .eq('status', 'pending')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'payout_bulk_paid',
    target_type: 'payouts',
    target_id: payout_ids[0],
    metadata: { count: payout_ids.length, ids: payout_ids },
  })

  return NextResponse.json({ ok: true, count: payout_ids.length })
}
