import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { groupRequestReceivedHtml } from '@/lib/email/templates/group-request-received'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.authenticart.co.kr'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { org_name, contact_name, contact_email, contact_phone, region, lesson_theme, preferred_date, participant_count, message, reference_images } = body

  if (!org_name || !contact_name || !contact_email || !contact_phone || !region || !participant_count) {
    return NextResponse.json({ error: '필수 항목을 모두 입력해주세요' }, { status: 400 })
  }

  // 단체 출강 최소 인원 정책(5인) 서버 검증 — 클라이언트 min 우회 방지
  if (Number(participant_count) < 5) {
    return NextResponse.json({ error: '단체 출강은 최소 5인 이상부터 신청 가능합니다' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin.from('group_lesson_requests').insert({
    org_name, contact_name, contact_email, contact_phone,
    region, lesson_theme: lesson_theme ?? null,
    preferred_date: preferred_date ?? null,
    participant_count: Number(participant_count),
    message: message ?? null,
    reference_images: reference_images ?? [],
  } as any)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── 자동 1차 응답 + 운영자 즉시 알림 (베스트에포트) ──
  // 1) 문의자에게 접수 확인 자동 회신 (이탈 방지)
  void sendEmail({
    to: contact_email,
    subject: '[오센틱아트] 단체 출강 문의가 접수되었습니다',
    html: groupRequestReceivedHtml({
      contactName: contact_name,
      orgName: org_name,
      region,
      participantCount: Number(participant_count),
      lessonTheme: lesson_theme,
      preferredDate: preferred_date,
    }),
  }).catch(() => {})

  // 2) admin에게 신규 B2B 문의 즉시 통지 (이메일 + 인앱)
  void admin.from('users').select('id, email').eq('role', 'admin').then(({ data: admins }) => {
    const summary = `${org_name} · ${region} · ${participant_count}명${lesson_theme ? ` · ${lesson_theme}` : ''}`
    for (const a of (admins ?? []) as any[]) {
      if (a.email) {
        void sendEmail({
          to: a.email,
          subject: `[오센틱아트 운영] 신규 단체 문의 — ${org_name}`,
          html: `<div style="font-family:sans-serif;padding:16px;">
            <p><strong>신규 B2B 단체 출강 문의</strong></p>
            <p>${summary}</p>
            <p>연락처: ${contact_name} / ${contact_phone} / ${contact_email}</p>
            ${message ? `<p>메시지: ${message}</p>` : ''}
            <p><a href="${SITE}/admin/group-requests">관리자에서 확인 →</a></p>
          </div>`,
        }).catch(() => {})
      }
      void admin.from('notifications').insert({
        user_id: a.id,
        type: 'group_request',
        title: '신규 단체 출강 문의',
        body: summary,
        link: '/admin/group-requests',
      })
    }
  })

  return NextResponse.json({ ok: true })
}
