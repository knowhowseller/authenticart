import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== Deno.env.get('CRON_SECRET')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

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

  type Accum = {
    total_gross: number
    total_pg_fee: number
    total_platform_fee: number
    total_payout: number
    booking_count: number
    order_count: number
  }

  const map = new Map<string, Accum>()

  for (const b of bookings ?? []) {
    const id = (b as any).class_schedules?.classes?.instructor_id
    if (!id) continue
    const acc = map.get(id) ?? { total_gross: 0, total_pg_fee: 0, total_platform_fee: 0, total_payout: 0, booking_count: 0, order_count: 0 }
    acc.total_gross += (b as any).gross_amount ?? 0
    acc.total_pg_fee += (b as any).pg_fee ?? 0
    acc.total_platform_fee += (b as any).platform_fee ?? 0
    acc.total_payout += (b as any).instructor_payout ?? 0
    acc.booking_count += 1
    map.set(id, acc)
  }

  const upserts = Array.from(map.entries()).map(([instructor_id, acc]) => ({
    instructor_id,
    period_year: year,
    period_month: month,
    ...acc,
    status: 'pending',
  }))

  if (upserts.length > 0) {
    const { error } = await supabase
      .from('payouts')
      .upsert(upserts, { onConflict: 'instructor_id,period_year,period_month' })
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    await supabase
      .from('bookings')
      .update({ payout_status: 'processing' })
      .eq('status', 'paid')
      .eq('payout_status', 'pending')
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd)
  }

  return new Response(JSON.stringify({ ok: true, period: `${year}-${month}`, count: upserts.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
