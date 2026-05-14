import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { calcArtworkRate } from '@/lib/utils/fees'

// 작품 수수료율 월별 갱신
// 직전 월 주문 건수를 기준으로 seller_artwork_stats를 업데이트하고 등급 하락 시 1개월 유예 적용
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

  // 전월 확정(paid) 작품 주문을 판매자별로 집계
  const { data: orders } = await supabase
    .from('artwork_orders')
    .select('seller_id, total_price')
    .eq('status', 'paid')
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd)

  type SellerAccum = { order_count: number; total_gmv: number }
  const sellerMap = new Map<string, SellerAccum>()
  for (const o of orders ?? []) {
    const sid = (o as any).seller_id
    if (!sid) continue
    const acc = sellerMap.get(sid) ?? { order_count: 0, total_gmv: 0 }
    acc.order_count += 1
    acc.total_gmv += (o as any).total_price ?? 0
    sellerMap.set(sid, acc)
  }

  let updated = 0
  for (const [seller_id, acc] of sellerMap.entries()) {
    // 직전 기록으로 유예 여부 판단
    const prevYear = month === 1 ? year - 1 : year
    const prevMonth = month === 1 ? 12 : month - 1
    const { data: prevStat } = await supabase
      .from('seller_artwork_stats')
      .select('applied_rate, is_grace')
      .eq('seller_id', seller_id)
      .eq('year', prevYear)
      .eq('month', prevMonth)
      .single()

    const earnedRate = calcArtworkRate(0, acc.order_count)
    const prevRate = prevStat?.applied_rate ?? 10
    const isGrace = earnedRate > Number(prevRate) && !prevStat?.is_grace

    const appliedRate = isGrace ? Number(prevRate) : earnedRate

    await supabase
      .from('seller_artwork_stats')
      .upsert({
        seller_id,
        year,
        month,
        order_count: acc.order_count,
        total_gmv: acc.total_gmv,
        applied_rate: appliedRate,
        earned_rate: earnedRate,
        is_grace: isGrace,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'seller_id,year,month' })

    updated++
  }

  return NextResponse.json({ ok: true, period: `${year}-${month}`, sellers_updated: updated })
}
