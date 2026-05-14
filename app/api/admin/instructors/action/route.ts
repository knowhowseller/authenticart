import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { instructorApprovedHtml, instructorRejectedHtml } from '@/lib/email/templates/instructor-approved'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  const actorRole = u?.role ?? ''
  if (!['admin', 'branch_manager'].includes(actorRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { instructor_id, action, reason } = await req.json()
  if (!instructor_id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // 지부장이 승인할 경우 자신의 branch_id를 강사에게 자동 설정
  let actorBranchId: string | null = null
  if (actorRole === 'branch_manager') {
    const { data: branch } = await admin
      .from('branches').select('id').eq('manager_id', user.id).maybeSingle()
    actorBranchId = branch?.id ?? null
  }

  const { data: instructor } = await admin
    .from('users')
    .select('name, email')
    .eq('id', instructor_id)
    .single()

  if (action === 'approve') {
    const updatePayload: Record<string, any> = {
      status: 'approved',
      approved_at: new Date().toISOString(),
    }
    if (actorBranchId) updatePayload.branch_id = actorBranchId

    const { error: profileErr } = await admin
      .from('instructor_profiles')
      .update(updatePayload)
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

    void admin.from('notifications').insert({
      user_id: instructor_id,
      type: 'instructor_approved',
      title: '강사 승인이 완료되었습니다',
      body: '강사 신청이 승인되었습니다. 이제 클래스를 등록할 수 있습니다.',
      link: '/studio',
    } as any)
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

    void admin.from('notifications').insert({
      user_id: instructor_id,
      type: 'instructor_rejected',
      title: '강사 신청이 반려되었습니다',
      body: reason ? `반려 사유: ${reason}` : '강사 신청이 반려되었습니다. 자세한 내용은 관리자에게 문의해주세요.',
      link: '/my/instructor-status',
    } as any)
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
