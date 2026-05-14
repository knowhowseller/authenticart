import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// 벤더 월별 정산 집계
// 전월 확정된 주문(escrow_status=confirmed)을 vendor별로 합산해 vendor_payouts upsert
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()
  const now = new Date()
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const month = now.getMonth() === 0 ? 12 : now.getMonth()

  const monthStart = new Date(year, month - 1, 1).toISOString()
  const monthEnd = new Date(year, month, 1).toISOString()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_amount, product_id, products!product_id(vendor_id, retail_price)')
    .eq('escrow_status', 'confirmed')
    .eq('payout_status', 'pending')
    .gte('confirmed_at', monthStart)
    .lt('confirmed_at', monthEnd)

  type VendorAccum = {
    total_gross: number
    platform_fee: number
    payout_amount: number
    order_count: number
  }
  const vendorMap = new Map<string, VendorAccum>()

  for (const o of orders ?? []) {
    const vendorId = (o as any).products?.vendor_id
    if (!vendorId) continue

    const gross = (o as any).total_amount ?? 0
    const { data: vendor } = await supabase
      .from('vendors')
      .select('commission_rate')
      .eq('id', vendorId)
      .single()
    const rate = (vendor as any)?.commission_rate ?? 15
    const fee = Math.round(gross * rate / 100)

    const acc = vendorMap.get(vendorId) ?? {
      total_gross: 0, platform_fee: 0, payout_amount: 0, order_count: 0,
    }
    acc.total_gross += gross
    acc.platform_fee += fee
    acc.payout_amount += gross - fee
    acc.order_count += 1
    vendorMap.set(vendorId, acc)
  }

  const upserts = Array.from(vendorMap.entries()).map(([vendor_id, acc]) => ({
    vendor_id,
    period_year: year,
    period_month: month,
    ...acc,
    status: 'pending' as const,
  }))

  if (upserts.length > 0) {
    const { error } = await supabase
      .from('vendor_payouts')
      .upsert(upserts, { onConflict: 'vendor_id,period_year,period_month' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 정산 처리된 주문 payout_status → processing
    const orderIds = (orders ?? [])
      .filter(o => vendorMap.has((o as any).products?.vendor_id))
      .map(o => o.id)
    if (orderIds.length > 0) {
      await supabase.from('orders').update({ payout_status: 'processing' }).in('id', orderIds)
    }
  }

  return NextResponse.json({ ok: true, period: `${year}-${month}`, vendor_count: upserts.length })
}
