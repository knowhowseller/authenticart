// 운영자 일일 다이제스트 — 흩어진 미처리 건을 매일 1통으로 요약해 admin에게 발송.
// 1인 운영 핵심: "관리자 페이지 안 들어가도 오늘 할 일을 파악".
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.authenticart.co.kr'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = await createAdminClient()
  const count = async (q: any) => (await q).count ?? 0
  const head = { count: 'exact' as const, head: true }

  const [
    instructors, classes, bookings, vendors, agencies, disputes, payouts, groups,
  ] = await Promise.all([
    count(supabase.from('instructor_profiles').select('id', head).eq('status', 'pending')),
    count(supabase.from('classes').select('id', head).eq('status', 'draft')),
    count(supabase.from('bookings').select('id', head).eq('status', 'pending_approval')),
    count(supabase.from('vendors').select('id', head).eq('status', 'pending')),
    count(supabase.from('agencies').select('id', head).eq('status', 'pending')),
    count(supabase.from('disputes').select('id', head).in('status', ['open', 'under_review', 'escalated'])),
    count(supabase.from('payouts').select('id', head).eq('status', 'pending')),
    count(supabase.from('group_lesson_requests').select('id', head).eq('status', 'open')),
  ])

  const rows = [
    { label: '강사 신청 대기', n: instructors, href: '/admin/instructors' },
    { label: '클래스 검수 대기', n: classes, href: '/admin/classes' },
    { label: '예약 승인 대기', n: bookings, href: '/admin/bookings' },
    { label: '벤더 입점 대기', n: vendors, href: '/admin/vendors' },
    { label: '에이전시 신청 대기', n: agencies, href: '/admin/agencies' },
    { label: '분쟁 미해결', n: disputes, href: '/admin/disputes' },
    { label: '정산 지급 대기', n: payouts, href: '/admin/payouts' },
    { label: 'B2B 단체 문의', n: groups, href: '/admin/group-requests' },
  ]
  const total = rows.reduce((s, r) => s + r.n, 0)

  // 수신자: admin 역할 사용자 이메일
  const { data: admins } = await supabase.from('users').select('email').eq('role', 'admin')
  const emails = (admins ?? []).map((a: any) => a.email).filter(Boolean)
  if (emails.length === 0) return NextResponse.json({ ok: true, total, sent: 0, reason: 'no_admin' })

  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)
  const tableRows = rows.map((r) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#1A1A2E;">${r.label}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:${r.n > 0 ? '#F59E0B' : '#9D9D9D'};">${r.n}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:right;"><a href="${SITE}${r.href}" style="color:#1A1A2E;font-size:12px;">열기 →</a></td>
    </tr>`).join('')

  const html = `
  <div style="font-family:'Malgun Gothic',sans-serif;max-width:560px;margin:0 auto;">
    <div style="background:#1A1A2E;padding:24px;border-radius:12px 12px 0 0;">
      <p style="color:#F59E0B;font-size:12px;letter-spacing:2px;margin:0 0 4px;">AUTHENTIC ART · 운영 다이제스트</p>
      <h1 style="color:#fff;font-size:20px;margin:0;">${today} 오늘 처리할 일 ${total}건</h1>
    </div>
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #eee;border-top:none;">
      ${tableRows}
    </table>
    <div style="padding:16px;text-align:center;">
      <a href="${SITE}/admin" style="display:inline-block;background:#F59E0B;color:#1A1A2E;font-weight:700;padding:12px 24px;border-radius:999px;text-decoration:none;font-size:14px;">관리자 대시보드 →</a>
    </div>
    <p style="color:#9D9D9D;font-size:11px;text-align:center;">매일 오전 9시 자동 발송 · 오센틱아트</p>
  </div>`

  let sent = 0
  for (const email of emails) {
    await sendEmail({
      to: email,
      subject: `[오센틱아트 운영] ${today} 처리할 일 ${total}건`,
      html,
    }).catch(() => {})
    sent++
  }

  return NextResponse.json({ ok: true, total, sent, breakdown: rows.map((r) => ({ [r.label]: r.n })) })
}
