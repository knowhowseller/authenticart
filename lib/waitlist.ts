import { SupabaseClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/resend'
import { waitlistNotifiedHtml } from '@/lib/email/templates/waitlist-notified'

const NOTIFY_WINDOW_HOURS = 24

export async function releaseAndNotify(bookingId: string, admin: SupabaseClient) {
  // 좌석 반환 + schedule_id 반환
  const { data: scheduleId } = await admin.rpc('release_seat', { p_booking_id: bookingId })
  if (!scheduleId) return

  // 첫 번째 대기자 조회
  const { data: entry } = await admin
    .from('class_waitlists')
    .select('id, user_id')
    .eq('schedule_id', scheduleId)
    .eq('status', 'waiting')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!entry) return

  const expiresAt = new Date(Date.now() + NOTIFY_WINDOW_HOURS * 60 * 60 * 1000).toISOString()

  await admin
    .from('class_waitlists')
    .update({ status: 'notified', notified_at: new Date().toISOString(), expires_at: expiresAt })
    .eq('id', entry.id)

  const [{ data: user }, { data: schedule }] = await Promise.all([
    admin.from('users').select('name, email').eq('id', entry.user_id).single(),
    admin
      .from('class_schedules')
      .select('start_at, classes!class_id(id, title)')
      .eq('id', scheduleId)
      .single(),
  ])

  if (!user?.email || !schedule) return

  const cls = (schedule as any).classes
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://authenticart.kr'

  await sendEmail({
    to: user.email,
    subject: `[오센틱아트] "${cls?.title}" 클래스 자리가 생겼어요!`,
    html: waitlistNotifiedHtml({
      userName: user.name,
      className: cls?.title ?? '클래스',
      startAt: (schedule as any).start_at,
      bookingUrl: `${siteUrl}/classes/${cls?.id}`,
      expiresAt,
    }),
  }).catch(() => {})
}
