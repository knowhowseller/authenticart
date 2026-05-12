import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const admin = await createAdminClient()
  const { data: req_ } = await admin.from('class_open_requests').select('*').eq('id', id).single()
  if (!req_) return NextResponse.json({ error: '요청 없음' }, { status: 404 })
  if (req_.status !== 'recruiting') return NextResponse.json({ error: '참여 불가한 상태입니다' }, { status: 400 })
  if (req_.current_count >= req_.target_capacity) return NextResponse.json({ error: '정원이 가득 찼습니다' }, { status: 400 })

  const { error: joinErr } = await admin.from('class_open_request_participants').insert({
    request_id: id, user_id: user.id, status: 'joined',
  } as any)

  if (joinErr) {
    if (joinErr.code === '23505') return NextResponse.json({ error: '이미 참여 중입니다' }, { status: 400 })
    return NextResponse.json({ error: joinErr.message }, { status: 500 })
  }

  const newCount = req_.current_count + 1
  await admin.from('class_open_requests').update({ current_count: newCount } as any).eq('id', id)

  // 정원 충족 시 자동으로 결제 요청 트리거
  if (newCount >= req_.target_capacity) {
    await admin.from('class_open_requests').update({ status: 'payment_pending' } as any).eq('id', id)

    const { data: participants } = await admin
      .from('class_open_request_participants')
      .select('user_id')
      .eq('request_id', id)
      .eq('status', 'joined')

    const notifs = (participants ?? []).map((p: any) => ({
      user_id: p.user_id,
      type: 'class_request_payment',
      title: '클래스 모집이 완료되었습니다!',
      body: `"${req_.title}" 모집 정원이 찼습니다. 결제를 완료하면 클래스가 확정됩니다.`,
      link: `/class-requests/${id}`,
    }))
    if (notifs.length > 0) void admin.from('notifications').insert(notifs as any)

    await admin.from('class_open_request_participants')
      .update({ status: 'payment_requested' } as any)
      .eq('request_id', id).eq('status', 'joined')
  }

  return NextResponse.json({ ok: true, current_count: newCount, is_full: newCount >= req_.target_capacity })
}
