import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST로도 호출 가능하도록 (관리자 수동 트리거)
export async function POST(req: NextRequest) { return handler(req) }
export async function GET(req: NextRequest) { return handler(req) }

async function handler(req: NextRequest) {
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

  // 클래스 예약 정산
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      gross_amount, pg_fee, platform_fee, instructor_payout, agency_fee, agency_id,
      class_schedules!schedule_id(classes!class_id(instructor_id))
    `)
    .eq('status', 'paid')
    .eq('payout_status', 'pending')
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd)

  // 작품 판매 정산 (강사가 작품을 판매한 경우)
  const { data: artworkOrders } = await supabase
    .from('artwork_orders')
    .select('total_price, seller_id, artworks!artwork_id(commission_rate)')
    .eq('status', 'confirmed')
    .eq('payout_status', 'pending')
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd)

  type InstructorAccum = {
    total_gross: number
    total_pg_fee: number
    total_platform_fee: number
    total_payout: number
    total_agency_fee: number
    agency_id: string | null
    booking_count: number
    order_count: number
    total_artwork_payout: number
    artwork_order_count: number
  }

  const instructorMap = new Map<string, InstructorAccum>()

  for (const b of bookings ?? []) {
    const instructorId = (b as any).class_schedules?.classes?.instructor_id
    if (!instructorId) continue

    const acc = instructorMap.get(instructorId) ?? {
      total_gross: 0, total_pg_fee: 0, total_platform_fee: 0,
      total_payout: 0, total_agency_fee: 0, agency_id: null,
      booking_count: 0, order_count: 0,
      total_artwork_payout: 0, artwork_order_count: 0,
    }
    acc.total_gross += (b as any).gross_amount ?? 0
    acc.total_pg_fee += (b as any).pg_fee ?? 0
    acc.total_platform_fee += (b as any).platform_fee ?? 0
    acc.total_payout += (b as any).instructor_payout ?? 0
    acc.total_agency_fee += (b as any).agency_fee ?? 0
    if ((b as any).agency_id) acc.agency_id = (b as any).agency_id
    acc.booking_count += 1
    instructorMap.set(instructorId, acc)
  }

  // 작품 정산 누적
  for (const ao of artworkOrders ?? []) {
    const sellerId = (ao as any).seller_id
    if (!sellerId) continue
    // 강사인지 확인
    const { data: profile } = await supabase
      .from('instructor_profiles')
      .select('instructor_id')
      .eq('instructor_id', sellerId)
      .single()
    if (!profile) continue

    const commissionRate = (ao as any).artworks?.commission_rate ?? 10
    const artworkPayout = Math.round((ao as any).total_price * (1 - commissionRate / 100))

    const acc = instructorMap.get(sellerId) ?? {
      total_gross: 0, total_pg_fee: 0, total_platform_fee: 0,
      total_payout: 0, total_agency_fee: 0, agency_id: null,
      booking_count: 0, order_count: 0,
      total_artwork_payout: 0, artwork_order_count: 0,
    }
    acc.total_artwork_payout += artworkPayout
    acc.artwork_order_count += 1
    instructorMap.set(sellerId, acc)
  }

  const upserts = Array.from(instructorMap.entries()).map(([instructor_id, acc]) => ({
    instructor_id,
    period_year: year,
    period_month: month,
    ...acc,
    status: 'pending' as const,
  }))

  if (upserts.length > 0) {
    const { error } = await supabase
      .from('payouts')
      .upsert(upserts, { onConflict: 'instructor_id,period_year,period_month' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 정산된 예약을 processing 상태로 변경
    await supabase
      .from('bookings')
      .update({ payout_status: 'processing' })
      .eq('status', 'paid')
      .eq('payout_status', 'pending')
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd)

    // 정산된 작품 주문도 processing으로 변경
    if ((artworkOrders ?? []).length > 0) {
      await supabase
        .from('artwork_orders')
        .update({ payout_status: 'processing' })
        .eq('status', 'confirmed')
        .eq('payout_status', 'pending')
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd)
    }
  }

  return NextResponse.json({
    ok: true,
    period: `${year}-${month}`,
    instructor_count: upserts.length,
  })
}
