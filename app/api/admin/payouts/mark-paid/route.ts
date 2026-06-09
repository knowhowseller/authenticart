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

  const { payout_id } = await req.json()
  if (!payout_id) return NextResponse.json({ error: 'Missing payout_id' }, { status: 400 })

  const admin = await createAdminClient()
  // pending → paid 인 경우에만 갱신되고 해당 행을 반환(이미 paid면 빈 배열 → 이메일 미발송)
  const { data: updated, error } = await admin
    .from('payouts')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', payout_id)
    .eq('status', 'pending')
    .select('instructor_id, period_year, period_month, total_gross, total_pg_fee, total_platform_fee, total_payout, booking_count')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const payout = updated?.[0]
  if (payout) {
    await admin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'payout_mark_paid',
      target_type: 'payouts',
      target_id: payout_id,
    })

    // 정산 명세 자동 발송 (베스트에포트 — 실패해도 지급 처리에는 영향 없음)
    const { data: inst } = await admin.from('users').select('name, email').eq('id', payout.instructor_id).single()
    if (inst?.email) {
      await sendEmail({
        to: inst.email,
        subject: `[오센틱아트] ${payout.period_year}년 ${payout.period_month}월 정산이 입금되었습니다`,
        html: monthlyPayoutHtml({
          instructorName: inst.name ?? '강사',
          year: payout.period_year,
          month: payout.period_month,
          totalGross: payout.total_gross ?? 0,
          totalPgFee: payout.total_pg_fee ?? 0,
          totalPlatformFee: payout.total_platform_fee ?? 0,
          totalPayout: payout.total_payout ?? 0,
          bookingCount: payout.booking_count ?? 0,
        }),
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true })
}
