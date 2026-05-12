import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { code, type, value, min_amount, max_uses, valid_until, description } = body

  if (!code || !type || !value) return NextResponse.json({ error: 'code, type, value required' }, { status: 400 })

  const { data: coupon, error } = await supabase.from('coupons').insert({
    code: code.toUpperCase(),
    type, value,
    min_amount: min_amount ?? 0,
    max_uses: max_uses ?? null,
    valid_until: valid_until ? new Date(valid_until + 'T23:59:59').toISOString() : null,
    description: description ?? null,
    created_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ coupon })
}
