// 주간 KPI 리포트 — 매주 월요일 지난 7일 매출·예약·신규강사·GMV를 admin에게 요약 발송.
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.authenticart.co.kr'
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = await createAdminClient()
  const weekStart = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const cnt = async (q: any) => (await q).count ?? 0
  const head = { count: 'exact' as const, head: true }

  const [
    newUsers, newInstructors,
    { data: bk }, { data: od }, newArtworks,
    pendingPayoutRows,
  ] = await Promise.all([
    cnt(supabase.from('users').select('id', head).gte('created_at', weekStart)),
    cnt(supabase.from('instructor_profiles').select('id', head).eq('status', 'approved').gte('updated_at', weekStart)),
    supabase.from('bookings').select('gross_amount').in('status', ['paid', 'completed']).gte('created_at', weekStart),
    supabase.from('orders').select('total_amount').in('status', ['paid', 'shipped', 'delivered']).gte('created_at', weekStart),
    cnt(supabase.from('artworks').select('id', head).gte('created_at', weekStart)),
    supabase.from('payouts').select('total_payout').eq('status', 'pending'),
  ])

  const bookingCount = (bk ?? []).length
  const bookingGmv = (bk ?? []).reduce((s: number, b: any) => s + (b.gross_amount ?? 0), 0)
  const orderCount = (od ?? []).length
  const orderGmv = (od ?? []).reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0)
  const pendingPayout = ((pendingPayoutRows as any).data ?? []).reduce((s: number, p: any) => s + (p.total_payout ?? 0), 0)
  const totalGmv = bookingGmv + orderGmv

  const { data: admins } = await supabase.from('users').select('email').eq('role', 'admin')
  const emails = (admins ?? []).map((a: any) => a.email).filter(Boolean)
  if (emails.length === 0) return NextResponse.json({ ok: true, totalGmv, sent: 0, reason: 'no_admin' })

  const period = `${new Date(Date.now() - 7 * 864e5 + 9 * 36e5).toISOString().slice(0, 10)} ~ ${new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10)}`
  const card = (label: string, value: string) => `
    <td style="padding:14px;background:#fff;border:1px solid #eee;border-radius:10px;width:50%;">
      <p style="margin:0 0 4px;color:#9D9D9D;font-size:12px;">${label}</p>
      <p style="margin:0;color:#1A1A2E;font-size:18px;font-weight:700;">${value}</p>
    </td>`

  const html = `
  <div style="font-family:'Malgun Gothic',sans-serif;max-width:560px;margin:0 auto;">
    <div style="background:#1A1A2E;padding:24px;border-radius:12px 12px 0 0;">
      <p style="color:#F59E0B;font-size:12px;letter-spacing:2px;margin:0 0 4px;">AUTHENTIC ART · 주간 리포트</p>
      <h1 style="color:#fff;font-size:20px;margin:0;">주간 KPI</h1>
      <p style="color:#BEC9C9;font-size:12px;margin:6px 0 0;">${period}</p>
    </div>
    <div style="padding:16px;background:#F7F7F5;">
      <table style="width:100%;border-collapse:separate;border-spacing:8px;">
        <tr>${card('통합 GMV', won(totalGmv))}${card('신규 회원', `${newUsers}명`)}</tr>
        <tr>${card('클래스 예약', `${bookingCount}건 · ${won(bookingGmv)}`)}${card('샵 주문', `${orderCount}건 · ${won(orderGmv)}`)}</tr>
        <tr>${card('신규 승인 강사', `${newInstructors}명`)}${card('신규 작품', `${newArtworks}점`)}</tr>
        <tr>${card('정산 지급 대기', won(pendingPayout))}${card('', '')}</tr>
      </table>
    </div>
    <div style="padding:16px;text-align:center;background:#F7F7F5;border-radius:0 0 12px 12px;">
      <a href="${SITE}/admin/stats" style="display:inline-block;background:#F59E0B;color:#1A1A2E;font-weight:700;padding:12px 24px;border-radius:999px;text-decoration:none;font-size:14px;">통계 자세히 보기 →</a>
    </div>
    <p style="color:#9D9D9D;font-size:11px;text-align:center;">매주 월요일 자동 발송 · 오센틱아트</p>
  </div>`

  let sent = 0
  for (const email of emails) {
    await sendEmail({ to: email, subject: `[오센틱아트 주간] GMV ${won(totalGmv)} · 예약 ${bookingCount}건`, html }).catch(() => {})
    sent++
  }

  return NextResponse.json({ ok: true, totalGmv, bookingCount, orderCount, newUsers, newInstructors, sent })
}
