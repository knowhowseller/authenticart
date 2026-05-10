import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { paymentKey, orderId, amount, type } = await req.json()

    // Confirm payment with Toss
    const tossRes = await fetch(`https://api.tosspayments.com/v1/payments/confirm`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(Deno.env.get('TOSS_SECRET_KEY')! + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })

    if (!tossRes.ok) {
      const err = await tossRes.json()
      return new Response(JSON.stringify({ error: err.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payment = await tossRes.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (type === 'booking') {
      const pgFee = Math.round(amount * 0.033)
      const platformFee = Math.round(amount * 0.10)
      const instructorPayout = amount - pgFee - platformFee

      await supabase.from('bookings').update({
        status: 'paid',
        payment_id: paymentKey,
        gross_amount: amount,
        pg_fee: pgFee,
        platform_fee: platformFee,
        instructor_payout: instructorPayout,
        payout_status: 'pending',
      }).eq('id', orderId)

      const { data: booking } = await supabase
        .from('bookings')
        .select('schedule_id')
        .eq('id', orderId)
        .single()

      if (booking) {
        await supabase.rpc('decrement_seat', { p_booking_id: orderId })
      }
    } else if (type === 'order') {
      await supabase.from('orders').update({
        status: 'paid',
        payment_id: paymentKey,
      }).eq('id', orderId)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
