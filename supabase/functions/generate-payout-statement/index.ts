import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader ?? '' } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(req.url)
    const year = parseInt(url.searchParams.get('year') ?? String(new Date().getFullYear()))
    const month = parseInt(url.searchParams.get('month') ?? String(new Date().getMonth()))

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: payout } = await admin
      .from('payouts')
      .select('*')
      .eq('instructor_id', user.id)
      .eq('period_year', year)
      .eq('period_month', month)
      .single()

    if (!payout) {
      return new Response(JSON.stringify({ error: '정산 내역이 없습니다' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const monthStart = new Date(year, month - 1, 1).toISOString()
    const monthEnd = new Date(year, month, 1).toISOString()

    const { data: bookings } = await admin
      .from('bookings')
      .select(`
        id, gross_amount, pg_fee, platform_fee, instructor_payout, created_at,
        class_schedules!schedule_id(
          start_at,
          classes!class_id(title, instructor_id)
        ),
        users!student_id(name)
      `)
      .eq('status', 'paid')
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd)
      .then(({ data }) =>
        (data ?? []).filter((b: any) => b.class_schedules?.classes?.instructor_id === user.id)
      )

    return new Response(JSON.stringify({ payout, bookings }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
