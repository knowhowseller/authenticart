import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { orderShippedHtml } from '@/lib/email/templates/order-shipped'

const VALID_TRANSITIONS: Record<string, string[]> = {
  paid: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
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

  const body = await request.json()
  const { status: newStatus, tracking_number } = body as { status: string; tracking_number?: string }

  if (!newStatus) return NextResponse.json({ error: 'status required' }, { status: 400 })
  if (newStatus === 'shipped' && !tracking_number?.trim()) {
    return NextResponse.json({ error: '운송장 번호를 입력해주세요' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select('id, status, total_amount, buyer_id, shipping_address, products!product_id(name)')
    .eq('id', id)
    .single()

  if (!order) return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 })

  const allowed = VALID_TRANSITIONS[order.status] ?? []
  if (!allowed.includes(newStatus)) {
    return NextResponse.json({ error: `${order.status} → ${newStatus} 변경 불가` }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { status: newStatus }
  if (tracking_number?.trim()) updateData.tracking_number = tracking_number.trim()
  if (newStatus === 'delivered') {
    const now = new Date()
    updateData.delivered_at = now.toISOString()
    updateData.auto_confirm_at = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }

  const { error } = await admin.from('orders').update(updateData).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'order_status_update',
    target_type: 'orders',
    target_id: id,
    metadata: { from: order.status, to: newStatus, tracking_number: tracking_number ?? null },
  })

  if (newStatus === 'shipped') {
    const { data: buyer } = await admin.from('users').select('name, email').eq('id', order.buyer_id).single()
    if (buyer?.email) {
      await sendEmail({
        to: buyer.email,
        subject: '[오센틱아트] 상품이 발송되었습니다',
        html: orderShippedHtml({
          userName: buyer.name,
          productName: (order as any).products?.name ?? '상품',
          totalAmount: order.total_amount,
          trackingNumber: tracking_number!,
          shippingAddress: order.shipping_address ?? '',
          orderId: id,
        }),
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true, status: newStatus })
}
