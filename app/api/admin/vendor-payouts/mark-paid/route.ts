import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { payout_ids } = await req.json()
  const ids: string[] = Array.isArray(payout_ids) ? payout_ids : [payout_ids]
  if (ids.length === 0) return NextResponse.json({ error: 'payout_ids required' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin
    .from('vendor_payouts')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, count: ids.length })
}
