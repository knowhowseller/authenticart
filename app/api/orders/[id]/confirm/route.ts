import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// 구매자 수동 구매 확정 — 배송 완료 후 7일 자동확정 전에 수동으로 에스크로 해제
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, status, escrow_status')
    .eq('id', id)
    .single()

  if (!order) return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 })
  if (order.buyer_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!['delivered', 'shipped'].includes(order.status)) {
    return NextResponse.json({ error: '배송 완료 후 구매 확정이 가능합니다' }, { status: 400 })
  }
  if (order.escrow_status === 'confirmed') {
    return NextResponse.json({ error: '이미 구매 확정된 주문입니다' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('orders')
    .update({
      escrow_status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
