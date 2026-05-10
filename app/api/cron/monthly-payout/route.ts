import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

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

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      gross_amount, pg_fee, platform_fee, instructor_payout,
      class_schedules!schedule_id(classes!class_id(instructor_id))
    `)
    .eq('status', 'paid')
    .eq('payout_status', 'pending')
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd)

  type InstructorAccum = {
    total_gross: number
    total_pg_fee: number
    total_platform_fee: number
    total_payout: number
    booking_count: number
    order_count: number
  }

  const instructorMap = new Map<string, InstructorAccum>()

  for (const b of bookings ?? []) {
    const instructorId = (b as any).class_schedules?.classes?.instructor_id
    if (!instructorId) continue

    const acc = instructorMap.get(instructorId) ?? {
      total_gross: 0, total_pg_fee: 0, total_platform_fee: 0,
      total_payout: 0, booking_count: 0, order_count: 0,
    }
    acc.total_gross += (b as any).gross_amount ?? 0
    acc.total_pg_fee += (b as any).pg_fee ?? 0
    acc.total_platform_fee += (b as any).platform_fee ?? 0
    acc.total_payout += (b as any).instructor_payout ?? 0
    acc.booking_count += 1
    instructorMap.set(instructorId, acc)
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
  }

  return NextResponse.json({
    ok: true,
    period: `${year}-${month}`,
    instructor_count: upserts.length,
  })
}
