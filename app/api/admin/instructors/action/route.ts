import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { instructorApprovedHtml, instructorRejectedHtml } from '@/lib/email/templates/instructor-approved'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { instructor_id, action } = await req.json()
  if (!instructor_id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const admin = await createAdminClient()

  const { data: instructor } = await admin
    .from('users')
    .select('name, email')
    .eq('id', instructor_id)
    .single()

  if (action === 'approve') {
    const { error: profileErr } = await admin
      .from('instructor_profiles')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('instructor_id', instructor_id)

    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

    const { error: userErr } = await admin
      .from('users')
      .update({ role: 'instructor' })
      .eq('id', instructor_id)

    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })

    if (instructor?.email) {
      await sendEmail({
        to: instructor.email,
        subject: '[오센틱아트] 강사 승인이 완료되었습니다',
        html: instructorApprovedHtml({ name: instructor.name }),
      }).catch(() => {})
    }
  } else {
    const { error } = await admin
      .from('instructor_profiles')
      .update({ status: 'rejected' })
      .eq('instructor_id', instructor_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (instructor?.email) {
      await sendEmail({
        to: instructor.email,
        subject: '[오센틱아트] 강사 신청 검토 결과를 안내드립니다',
        html: instructorRejectedHtml({ name: instructor.name }),
      }).catch(() => {})
    }
  }

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: `instructor_${action}`,
    target_type: 'instructor_profiles',
    target_id: instructor_id,
    metadata: {},
  })

  return NextResponse.json({ ok: true })
}
