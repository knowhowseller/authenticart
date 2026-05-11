import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { refundCompleteHtml } from '@/lib/email/templates/refund-complete'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = await createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select('id, status, total_amount, payment_id, buyer_id, products!product_id(name)')
    .eq('id', id)
    .single()

  if (!order) return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 })
  if (!['paid', 'preparing'].includes(order.status)) {
    return NextResponse.json({ error: '환불 가능한 주문이 아닙니다' }, { status: 400 })
  }
  if (!order.payment_id) {
    return NextResponse.json({ error: '결제 정보가 없습니다' }, { status: 400 })
  }

  const tossRes = await fetch(`https://api.tosspayments.com/v1/payments/${order.payment_id}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cancelReason: '관리자 환불 처리', cancelAmount: order.total_amount }),
  })

  if (!tossRes.ok) {
    const err = await tossRes.json()
    return NextResponse.json({ error: err.message ?? '결제 취소 실패' }, { status: 500 })
  }

  await admin.from('orders').update({ status: 'refunded' }).eq('id', id)
  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'order_refund',
    target_type: 'orders',
    target_id: id,
    metadata: { refund_amount: order.total_amount },
  })

  const { data: buyer } = await admin.from('users').select('name, email').eq('id', order.buyer_id).single()
  if (buyer?.email) {
    await sendEmail({
      to: buyer.email,
      subject: '[오센틱아트] 주문 환불이 처리되었습니다',
      html: refundCompleteHtml({
        userName: buyer.name,
        className: (order as any).products?.name ?? '상품',
        refundAmount: order.total_amount,
        originalAmount: order.total_amount,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
