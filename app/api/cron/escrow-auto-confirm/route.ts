import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// 에스크로 자동 구매확정
// products: 배송완료 후 7일 / artworks: 배송완료 후 3일

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminClient()
  const now = new Date().toISOString()

  // products 주문 자동 확정 (auto_confirm_at 도래 + 아직 미확정)
  const { data: confirmedOrders } = await admin
    .from('orders')
    .update({
      escrow_status: 'confirmed',
      confirmed_at: now,
    })
    .eq('escrow_status', 'holding')
    .not('auto_confirm_at', 'is', null)
    .lte('auto_confirm_at', now)
    .select('id')

  // artwork_orders 자동 확정
  const { data: confirmedArtworkOrders } = await admin
    .from('artwork_orders')
    .update({
      escrow_status: 'confirmed',
      confirmed_at: now,
    })
    .eq('escrow_status', 'holding')
    .not('auto_confirm_at', 'is', null)
    .lte('auto_confirm_at', now)
    .select('id')

  return NextResponse.json({
    orders_confirmed: confirmedOrders?.length ?? 0,
    artwork_orders_confirmed: confirmedArtworkOrders?.length ?? 0,
  })
}
