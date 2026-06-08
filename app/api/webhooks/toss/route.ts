import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { calcFees } from '@/lib/utils/fees'
import { sendEmail } from '@/lib/email/resend'
import { bookingConfirmedHtml } from '@/lib/email/templates/booking-confirmed'
import { orderConfirmedHtml } from '@/lib/email/templates/order-confirmed'

export async function POST(request: Request) {
  const body = await request.json()
  const { paymentKey, orderId, amount, type } = body

  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  })

  const payment = await tossRes.json()
  if (!tossRes.ok) {
    return NextResponse.json({ error: payment.message }, { status: 400 })
  }

  const supabase = await createAdminClient()
  const { pg_fee, platform_fee, instructor_payout } = calcFees(amount)

  if (type === 'booking') {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'paid',
        payment_id: paymentKey,
        pg_fee,
        platform_fee,
        instructor_payout,
        receipt_url: payment.receipt?.url ?? null,
      })
      .eq('id', orderId)

    if (!error) {
      // 예약 확정 이메일 발송
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          student_id, gross_amount,
          class_schedules!schedule_id(start_at, classes!class_id(title))
        `)
        .eq('id', orderId)
        .single()

      if (booking) {
        const { data: student } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', (booking as any).student_id)
          .single()

        const schedule = (booking as any).class_schedules
        if (student?.email) {
          await sendEmail({
            to: student.email,
            subject: '[오센틱아트] 예약이 확정되었습니다',
            html: bookingConfirmedHtml({
              userName: student.name,
              className: schedule?.classes?.title ?? '클래스',
              startAt: schedule?.start_at ?? '',
              amount: booking.gross_amount,
              bookingId: orderId,
            }),
          }).catch(() => {})
        }
      }
    }
  } else if (type === 'order') {
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_id: paymentKey,
        receipt_url: payment.receipt?.url ?? null,
      })
      .eq('id', orderId)

    // 주문 확인 이메일
    const { data: order } = await supabase
      .from('orders')
      .select('buyer_id, quantity, total_amount, shipping_name, shipping_address, products!product_id(name)')
      .eq('id', orderId)
      .single()

    if (order) {
      const { data: buyer } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', (order as any).buyer_id)
        .single()

      if (buyer?.email) {
        await sendEmail({
          to: buyer.email,
          subject: '[오센틱아트] 주문이 접수되었습니다',
          html: orderConfirmedHtml({
            userName: buyer.name,
            productName: (order as any).products?.name ?? '상품',
            quantity: (order as any).quantity,
            totalAmount: (order as any).total_amount,
            shippingName: (order as any).shipping_name ?? '',
            shippingAddress: (order as any).shipping_address ?? '',
            orderId,
          }),
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ ok: true })
}
