// 목적: 결제창에서 이탈해 1시간 넘게 'pending'으로 남은 상품 주문을 만료 처리하고,
//       주문 생성 시 선차감된 재고를 복구한다. (추가2 개선: 재고가 묶이는 문제 해소)
// 재고 복구 로직은 orders/cancel 라우트와 동일한 increment_stock RPC를 재사용한다.
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminClient()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  // 1시간 넘게 결제되지 않은 pending 주문 (재고 복구를 위해 상세 컬럼 필요)
  const { data: staleOrders } = await admin
    .from('orders')
    .select('id, product_id, quantity')
    .eq('status', 'pending')
    .lt('created_at', oneHourAgo)

  let expired = 0
  let restocked = 0
  for (const o of (staleOrders ?? []) as { id: string; product_id: string | null; quantity: number }[]) {
    // pending 조건부 업데이트 — 그사이 결제 완료(paid)됐으면 매칭 0건이라 건드리지 않는다(경합/멱등 안전).
    const { data: updated } = await admin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', o.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()
    if (!updated) continue
    expired++
    if (o.product_id && o.quantity > 0) {
      const { error } = await admin.rpc('increment_stock', {
        p_product_id: o.product_id,
        p_quantity: o.quantity,
      })
      if (!error) restocked++
    }
  }

  return NextResponse.json({ expired, restocked })
}
