import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { classReminderHtml } from '@/lib/email/templates/class-reminder'
import type { ClassAttributes } from '@/types/database'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()
  const now = new Date()
  const twentyHoursLater = new Date(now.getTime() + 20 * 60 * 60 * 1000).toISOString()
  const twentyEightHoursLater = new Date(now.getTime() + 28 * 60 * 60 * 1000).toISOString()

  // 내일 수업 예정 & paid 상태 예약 조회
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, student_id,
      class_schedules!schedule_id(
        start_at,
        classes!class_id(
          title, location_address, attributes,
          users!instructor_id(name, phone)
        )
      )
    `)
    .eq('status', 'paid')
    .gte('class_schedules.start_at', twentyHoursLater)
    .lte('class_schedules.start_at', twentyEightHoursLater)

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  const studentIds = [...new Set(bookings.map((b: any) => b.student_id))]
  const { data: students } = await supabase
    .from('users')
    .select('id, name, email')
    .in('id', studentIds)

  const studentMap = new Map((students ?? []).map((s: any) => [s.id, s]))

  let sent = 0
  for (const booking of bookings) {
    const schedule = (booking as any).class_schedules
    const cls = schedule?.classes
    if (!cls) continue

    const student = studentMap.get((booking as any).student_id)
    if (!student?.email) continue

    const instructor = cls.users
    const attrs = (cls.attributes ?? {}) as ClassAttributes
    const materials = [
      ...(attrs.required_items ?? []),
    ]

    await sendEmail({
      to: student.email,
      subject: `[오센틱아트] 내일 "${cls.title}" 클래스가 있습니다`,
      html: classReminderHtml({
        userName: student.name,
        className: cls.title,
        startAt: schedule.start_at,
        locationAddress: cls.location_address,
        instructorName: instructor?.name ?? '',
        instructorPhone: instructor?.phone ?? null,
        materials,
      }),
    }).catch(() => {})

    sent++
  }

  return NextResponse.json({ ok: true, sent })
}
