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

    const { schedule_id } = await req.json()
    if (!schedule_id) {
      return new Response(JSON.stringify({ error: 'Missing schedule_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check schedule availability
    const { data: schedule } = await admin
      .from('class_schedules')
      .select('id, max_students, booked_count, classes!class_id(id, price, confirmation_mode, instructor_id)')
      .eq('id', schedule_id)
      .single()

    if (!schedule) {
      return new Response(JSON.stringify({ error: '회차를 찾을 수 없습니다' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (schedule.booked_count >= schedule.max_students) {
      return new Response(JSON.stringify({ error: '정원이 마감되었습니다' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const cls = (schedule as any).classes
    if (cls.instructor_id === user.id) {
      return new Response(JSON.stringify({ error: '본인 클래스는 예약할 수 없습니다' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check duplicate
    const { data: existing } = await admin
      .from('bookings')
      .select('id')
      .eq('student_id', user.id)
      .eq('schedule_id', schedule_id)
      .not('status', 'in', '(cancelled,expired,refunded)')
      .single()

    if (existing) {
      return new Response(JSON.stringify({ error: '이미 예약된 회차입니다' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isInstant = cls.confirmation_mode === 'instant'
    const approvalExpiresAt = isInstant
      ? null
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const pgFee = Math.round(cls.price * 0.033)
    const platformFee = Math.round(cls.price * 0.10)
    const instructorPayout = cls.price - pgFee - platformFee

    const { data: booking, error } = await admin
      .from('bookings')
      .insert({
        student_id: user.id,
        schedule_id,
        status: isInstant ? 'pending_payment' : 'pending_approval',
        gross_amount: cls.price,
        pg_fee: pgFee,
        platform_fee: platformFee,
        instructor_payout: instructorPayout,
        payout_status: 'pending',
        approval_expires_at: approvalExpiresAt,
      })
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ booking, confirmation_mode: cls.confirmation_mode }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
