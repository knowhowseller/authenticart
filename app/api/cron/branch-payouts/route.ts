import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// 지부 월별 정산 집계
// 전월 결제 완료 예약의 branch_commission을 지부별로 합산
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

  // bookings에는 branch_commission이 있지만 branch_id가 없으므로
  // class_schedules → classes → instructor_profiles → branch_id 경로로 조회
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      platform_fee, branch_commission, hq_revenue,
      class_schedules!schedule_id(
        classes!class_id(
          instructor_profiles!instructor_id(branch_id)
        )
      )
    `)
    .eq('status', 'paid')
    .eq('branch_payout_status', 'pending')
    .gt('branch_commission', 0)
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd)

  type BranchAccum = {
    total_platform_fee: number
    branch_share: number
    hq_share: number
    booking_count: number
  }
  const branchMap = new Map<string, BranchAccum>()

  for (const b of bookings ?? []) {
    const branchId = (b as any).class_schedules?.classes?.instructor_profiles?.branch_id
    if (!branchId) continue

    const acc = branchMap.get(branchId) ?? {
      total_platform_fee: 0, branch_share: 0, hq_share: 0, booking_count: 0,
    }
    acc.total_platform_fee += (b as any).platform_fee ?? 0
    acc.branch_share += (b as any).branch_commission ?? 0
    acc.hq_share += (b as any).hq_revenue ?? 0
    acc.booking_count += 1
    branchMap.set(branchId, acc)
  }

  const upserts = Array.from(branchMap.entries()).map(([branch_id, acc]) => ({
    branch_id,
    period_year: year,
    period_month: month,
    ...acc,
    status: 'pending' as const,
  }))

  if (upserts.length > 0) {
    const { error } = await supabase
      .from('branch_payouts')
      .upsert(upserts, { onConflict: 'branch_id,period_year,period_month' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, period: `${year}-${month}`, branch_count: upserts.length })
}
