import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function calcRefund(gross: number, startAt: string): number {
  const diffDays = (new Date(startAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diffDays >= 7) return gross
  if (diffDays >= 3) return Math.round(gross * 0.5)
  return 0
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

    const { booking_id } = await req.json()

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: booking } = await admin
      .from('bookings')
      .select('id, status, gross_amount, payment_id, student_id, class_schedules!schedule_id(start_at)')
      .eq('id', booking_id)
      .eq('student_id', user.id)
      .single()

    if (!booking) {
      return new Response(JSON.stringify({ error: '예약을 찾을 수 없습니다' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (booking.status !== 'paid') {
      return new Response(JSON.stringify({ error: '환불 가능한 예약이 아닙니다' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const startAt = (booking as any).class_schedules?.start_at
    const refundAmount = calcRefund(booking.gross_amount, startAt)

    if (refundAmount === 0) {
      return new Response(JSON.stringify({ error: '환불 기간이 지났습니다 (클래스 3일 이내)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tossRes = await fetch(`https://api.tosspayments.com/v1/payments/${booking.payment_id}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(Deno.env.get('TOSS_SECRET_KEY')! + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancelReason: '고객 환불 요청', cancelAmount: refundAmount }),
    })

    if (!tossRes.ok) {
      const err = await tossRes.json()
      return new Response(JSON.stringify({ error: err.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await admin.from('bookings').update({ status: 'refunded' }).eq('id', booking_id)

    return new Response(JSON.stringify({ ok: true, refund_amount: refundAmount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
