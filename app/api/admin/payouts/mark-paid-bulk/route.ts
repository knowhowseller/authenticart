import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { monthlyPayoutHtml } from '@/lib/email/templates/monthly-payout'

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
  const { data: updated, error } = await admin
    .from('payouts')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .in('id', payout_ids)
    .eq('status', 'pending')
    .select('instructor_id, period_year, period_month, total_gross, total_pg_fee, total_platform_fee, total_payout, booking_count')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = updated ?? []
  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'payout_bulk_paid',
    target_type: 'payouts',
    target_id: payout_ids[0],
    metadata: { count: rows.length, ids: payout_ids },
  })

  // 정산 명세 자동 발송 (실제 pending→paid 된 건만, 베스트에포트)
  const instIds = [...new Set(rows.map((p: any) => p.instructor_id))]
  if (instIds.length > 0) {
    const { data: insts } = await admin.from('users').select('id, name, email').in('id', instIds)
    const map = new Map((insts ?? []).map((i: any) => [i.id, i]))
    for (const p of rows as any[]) {
      const inst = map.get(p.instructor_id)
      if (!inst?.email) continue
      await sendEmail({
        to: inst.email,
        subject: `[오센틱아트] ${p.period_year}년 ${p.period_month}월 정산이 입금되었습니다`,
        html: monthlyPayoutHtml({
          instructorName: inst.name ?? '강사',
          year: p.period_year,
          month: p.period_month,
          totalGross: p.total_gross ?? 0,
          totalPgFee: p.total_pg_fee ?? 0,
          totalPlatformFee: p.total_platform_fee ?? 0,
          totalPayout: p.total_payout ?? 0,
          bookingCount: p.booking_count ?? 0,
        }),
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true, count: rows.length })
}
