import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const secret = process.env.CRON_SECRET ?? ''

  try {
    const res = await fetch(`${origin}/api/cron/monthly-payout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `정산 집계 실패: ${text}` }, { status: 500 })
    }
    return NextResponse.json({ ok: true, message: '정산 집계가 완료되었습니다' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
