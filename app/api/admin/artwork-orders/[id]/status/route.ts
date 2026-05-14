import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const VALID_TRANSITIONS: Record<string, string[]> = {
  paid:      ['shipped'],
  shipped:   ['delivered'],
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { status: newStatus, tracking_carrier, tracking_number } = await request.json()
  if (!newStatus) return NextResponse.json({ error: 'status required' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: order } = await admin
    .from('artwork_orders')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!order) return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 })

  const allowed = VALID_TRANSITIONS[order.status] ?? []
  if (!allowed.includes(newStatus)) {
    return NextResponse.json({ error: `${order.status} → ${newStatus} 변경 불가` }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { status: newStatus }
  if (tracking_carrier) updateData.tracking_carrier = tracking_carrier
  if (tracking_number) updateData.tracking_number = tracking_number
  if (newStatus === 'delivered') {
    const now = new Date()
    updateData.delivered_at = now.toISOString()
    // 작품: 배송완료 후 3일 자동 구매확정
    updateData.auto_confirm_at = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
  }

  const { error } = await admin.from('artwork_orders').update(updateData).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 구매자에게 상태 변경 알림
  const { data: fullOrder } = await admin
    .from('artwork_orders')
    .select('buyer_id, artworks!artwork_id(title)')
    .eq('id', id)
    .single()

  if (fullOrder?.buyer_id) {
    const artworkTitle = (fullOrder as any).artworks?.title ?? '작품'
    const notifMap: Record<string, { title: string; body: string }> = {
      shipped:   { title: '작품이 발송되었습니다', body: `"${artworkTitle}" 배송이 시작되었습니다.` },
      delivered: { title: '작품이 배달되었습니다', body: `"${artworkTitle}" 배달 완료. 3일 후 자동 구매확정됩니다.` },
    }
    const notif = notifMap[newStatus]
    if (notif) {
      void admin.from('notifications').insert({
        user_id: fullOrder.buyer_id,
        type: 'order',
        title: notif.title,
        body: notif.body,
        link: '/my/artwork-orders',
      })
    }
  }

  return NextResponse.json({ ok: true, status: newStatus })
}
