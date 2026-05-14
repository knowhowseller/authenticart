import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// 에이전시 월별 정산 집계
// 전월 결제 완료 예약 중 agency_id가 있는 건을 에이전시별로 합산
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
    .select('agency_id, gross_amount, agency_fee')
    .eq('status', 'paid')
    .eq('agency_payout_status', 'pending')
    .not('agency_id', 'is', null)
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd)

  type AgencyAccum = {
    total_gross: number
    agency_fee: number
    instructor_count: number
  }
  const agencyMap = new Map<string, AgencyAccum>()
  const instructorSets = new Map<string, Set<string>>()

  for (const b of bookings ?? []) {
    const agencyId = (b as any).agency_id
    if (!agencyId) continue

    const acc = agencyMap.get(agencyId) ?? { total_gross: 0, agency_fee: 0, instructor_count: 0 }
    acc.total_gross += (b as any).gross_amount ?? 0
    acc.agency_fee += (b as any).agency_fee ?? 0
    agencyMap.set(agencyId, acc)

    if (!instructorSets.has(agencyId)) instructorSets.set(agencyId, new Set())
  }

  // instructor_count는 해당 에이전시 소속 강사 수로 근사
  for (const [agencyId, acc] of agencyMap.entries()) {
    const { count } = await supabase
      .from('instructor_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
    acc.instructor_count = count ?? 0
  }

  const upserts = Array.from(agencyMap.entries()).map(([agency_id, acc]) => ({
    agency_id,
    period_year: year,
    period_month: month,
    total_gross: acc.total_gross,
    agency_fee: acc.agency_fee,
    instructor_count: acc.instructor_count,
    status: 'pending' as const,
  }))

  if (upserts.length > 0) {
    const { error } = await supabase
      .from('agency_payouts')
      .upsert(upserts, { onConflict: 'agency_id,period_year,period_month' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, period: `${year}-${month}`, agency_count: upserts.length })
}
