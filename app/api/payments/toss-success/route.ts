import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { calcBookingFees, calcBranchShare } from '@/lib/utils/fees'
import { sendEmail } from '@/lib/email/resend'
import { bookingConfirmedHtml } from '@/lib/email/templates/booking-confirmed'
import { orderConfirmedHtml } from '@/lib/email/templates/order-confirmed'

const TOSS_AUTH = `Basic ${Buffer.from((process.env.TOSS_SECRET_KEY ?? '') + ':').toString('base64')}`

// 금액 불일치 등으로 결제를 무효화해야 할 때 토스 결제 취소(환불). 베스트에포트.
async function cancelTossPayment(paymentKey: string, reason: string) {
  try {
    await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}/cancel`, {
      method: 'POST',
      headers: { Authorization: TOSS_AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancelReason: reason }),
    })
  } catch {
    /* 취소 실패해도 결제는 'paid'로 확정하지 않으므로 미충족 상태로 남음 */
  }
}

function failRedirect(request: Request, reason: string) {
  return NextResponse.redirect(new URL(`/payment/fail?reason=${reason}`, request.url))
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const paymentKey = url.searchParams.get('paymentKey')
  const orderId   = url.searchParams.get('orderId')
  const amount    = url.searchParams.get('amount')
  const type      = url.searchParams.get('type') ?? 'booking'

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.redirect(new URL('/payment/fail?reason=invalid_params', request.url))
  }

  // Toss 결제 승인 API 직접 호출
  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from((process.env.TOSS_SECRET_KEY ?? '') + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount: parseInt(amount) }),
  })

  const payment = await tossRes.json()
  if (!tossRes.ok) {
    const msg = encodeURIComponent(payment.message ?? '결제 승인 실패')
    return NextResponse.redirect(new URL(`/payment/fail?reason=${msg}`, request.url))
  }

  const supabase = await createAdminClient()
  const parsedAmount = parseInt(amount)

  if (type === 'booking') {
    // ── 결제금액 서버 검증(D-1) + 멱등성(D-2) ──
    const { data: bk } = await supabase
      .from('bookings').select('status, gross_amount, discount_amount').eq('id', orderId).single()
    if (!bk) return failRedirect(request, 'order_not_found')
    if (bk.status === 'paid' || bk.status === 'completed') {
      return NextResponse.redirect(new URL('/my/bookings?success=1', request.url))
    }
    const expectedBooking = (bk.gross_amount ?? 0) - (bk.discount_amount ?? 0)
    if (parsedAmount !== expectedBooking) {
      await cancelTossPayment(paymentKey, '결제 금액 불일치')
      return failRedirect(request, 'amount_mismatch')
    }

    // 강사의 에이전시 및 지부 조회
    const { data: bookingInfo } = await supabase
      .from('bookings')
      .select(`
        class_schedules!schedule_id(
          classes!class_id(
            instructor_id,
            instructor_profiles!instructor_id(
              agency_id,
              branch_id,
              agencies!agency_id(id, commission_rate),
              branches!branch_id(id)
            )
          )
        )
      `)
      .eq('id', orderId)
      .single()

    const profile = (bookingInfo as any)
      ?.class_schedules?.classes?.instructor_profiles
    const agencyId = profile?.agency_id ?? null
    const agencyRate = profile?.agencies?.commission_rate ?? 0
    const branchId = profile?.branch_id ?? null

    const { pg_fee, platform_fee, agency_fee, instructor_payout } =
      calcBookingFees(parsedAmount, agencyRate)
    const { branch_share, hq_share } = branchId
      ? calcBranchShare(platform_fee)
      : { branch_share: 0, hq_share: platform_fee }

    const { error } = await supabase.from('bookings').update({
      status: 'paid',
      payment_id: paymentKey,
      pg_fee,
      platform_fee,
      instructor_payout,
      agency_id: agencyId,
      agency_fee,
      agency_rate: agencyRate,
      branch_commission: branch_share,
      hq_revenue: hq_share,
      receipt_url: payment.receipt?.url ?? null,
    }).eq('id', orderId)

    if (error) {
      return NextResponse.redirect(new URL('/payment/fail?reason=db_update_failed', request.url))
    }

    // 일반회원(member)이 클래스 결제 완료 시 수강생(student)으로 승격 + 쿠폰 사용 처리
    const { data: paidBooking } = await supabase
      .from('bookings').select('student_id, coupon_id, discount_amount').eq('id', orderId).single()
    if (paidBooking?.student_id) {
      const { data: paidUser } = await supabase
        .from('users').select('role').eq('id', paidBooking.student_id).single()
      if (paidUser?.role === 'member') {
        await supabase.from('users').update({ role: 'student' }).eq('id', paidBooking.student_id)
      }
      // 쿠폰 사용 기록
      if (paidBooking.coupon_id && paidBooking.discount_amount > 0) {
        await supabase.from('coupon_uses').insert({
          coupon_id: paidBooking.coupon_id,
          user_id: paidBooking.student_id,
          booking_id: orderId,
          discount_amount: paidBooking.discount_amount,
        }).then(() =>
          supabase.rpc('increment_coupon_count', { p_coupon_id: paidBooking.coupon_id })
        )
      }
    }

    // 예약 확정 이메일
    const { data: booking } = await supabase
      .from('bookings')
      .select('student_id, gross_amount, class_schedules!schedule_id(start_at, classes!class_id(title))')
      .eq('id', orderId)
      .single()

    if (booking) {
      const { data: student } = await supabase
        .from('users').select('name, email').eq('id', (booking as any).student_id).single()
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

    if ((booking as any)?.student_id) {
      void supabase.from('notifications').insert({
        user_id: (booking as any).student_id,
        type: 'booking',
        title: '예약이 확정되었습니다',
        body: `${(booking as any)?.class_schedules?.classes?.title ?? '클래스'} 결제가 완료되었습니다.`,
        link: '/my/bookings',
      })
    }

    return NextResponse.redirect(new URL('/my/bookings?success=1', request.url))
  }

  // type === 'artwork'
  if (type === 'artwork') {
    // ── 금액 검증(D-1) + 멱등성(D-2): amount = 작품가 + 배송비 (주문 생성 시 서버 저장) ──
    const { data: aoCheck } = await supabase
      .from('artwork_orders')
      .select('status, amount')
      .eq('id', orderId).single()
    if (!aoCheck) return failRedirect(request, 'order_not_found')
    if ((aoCheck as any).status === 'paid' || (aoCheck as any).status === 'completed') {
      return NextResponse.redirect(new URL('/my/artwork-orders?success=1', request.url))
    }
    const expectedArtwork = (aoCheck as any).amount ?? -1
    if (parsedAmount !== expectedArtwork) {
      await cancelTossPayment(paymentKey, '결제 금액 불일치')
      return failRedirect(request, 'amount_mismatch')
    }

    const { error } = await supabase.from('artwork_orders').update({
      status: 'paid',
      payment_id: paymentKey,
      receipt_url: payment.receipt?.url ?? null,
    }).eq('id', orderId)

    if (error) {
      return NextResponse.redirect(new URL('/payment/fail?reason=db_update_failed', request.url))
    }

    const { data: artworkOrder } = await supabase
      .from('artwork_orders')
      .select('artwork_id, buyer_id, artworks!artwork_id(title, seller_id)')
      .eq('id', orderId)
      .single()

    if (artworkOrder) {
      await supabase.from('artworks').update({ status: 'sold_out' }).eq('id', (artworkOrder as any).artwork_id)
      const artworkTitle = (artworkOrder as any).artworks?.title ?? '작품'
      const sellerId = (artworkOrder as any).artworks?.seller_id
      // 구매자 알림
      void supabase.from('notifications').insert({
        user_id: (artworkOrder as any).buyer_id,
        type: 'payment',
        title: '작품 결제가 완료되었습니다',
        body: `"${artworkTitle}" 주문이 접수되었습니다.`,
        link: '/my/artwork-orders',
      })
      // 판매자 알림
      if (sellerId) {
        void supabase.from('notifications').insert({
          user_id: sellerId,
          type: 'order',
          title: '작품이 판매되었습니다',
          body: `"${artworkTitle}" 주문이 들어왔습니다.`,
          link: '/my/artworks',
        })
      }
    }

    return NextResponse.redirect(new URL('/my/artwork-orders?success=1', request.url))
  }

  // type === 'class_request'
  if (type === 'class_request') {
    const requestId = url.searchParams.get('requestId')
    const userId    = url.searchParams.get('userId')
    if (!requestId || !userId) {
      return NextResponse.redirect(new URL('/payment/fail?reason=invalid_params', request.url))
    }

    // ── 금액 검증(D-1): 1인 결제금액 = price_per_person ──
    const { data: reqPrice } = await supabase
      .from('class_open_requests').select('price_per_person').eq('id', requestId).single()
    if (!reqPrice) return failRedirect(request, 'order_not_found')
    if (parsedAmount !== (reqPrice.price_per_person ?? -1)) {
      await cancelTossPayment(paymentKey, '결제 금액 불일치')
      return failRedirect(request, 'amount_mismatch')
    }

    // 참여자 상태를 paid로 업데이트 (status='payment_requested'만 대상 → 멱등성 부분 방어)
    await supabase
      .from('class_open_request_participants')
      .update({ status: 'paid' })
      .eq('request_id', requestId)
      .eq('user_id', userId)
      .eq('status', 'payment_requested')

    // 전원 결제 완료 여부 확인
    const { data: reqData } = await supabase
      .from('class_open_requests')
      .select('id, title, target_capacity, requester_id')
      .eq('id', requestId)
      .single()

    const { count: paidCount } = await supabase
      .from('class_open_request_participants')
      .select('id', { count: 'exact', head: true })
      .eq('request_id', requestId)
      .eq('status', 'paid')

    if (reqData && paidCount !== null && paidCount >= (reqData.target_capacity ?? 1)) {
      await supabase
        .from('class_open_requests')
        .update({ status: 'confirmed' })
        .eq('id', requestId)
      // 요청자에게 확정 알림
      void supabase.from('notifications').insert({
        user_id: reqData.requester_id,
        type: 'booking',
        title: '클래스 요청이 확정되었습니다',
        body: `"${reqData.title}" 모든 참가자가 결제 완료했습니다.`,
        link: '/my/class-requests',
      })
    }

    // 본인 알림
    void supabase.from('notifications').insert({
      user_id: userId,
      type: 'payment',
      title: '클래스 요청 결제 완료',
      body: `"${reqData?.title ?? '클래스 요청'}" 결제가 완료되었습니다.`,
      link: '/my/class-requests',
    })

    return NextResponse.redirect(new URL('/my/class-requests?success=1', request.url))
  }

  // type === 'cart' — multiple orders paid together
  if (type === 'cart') {
    const orderIdsParam = url.searchParams.get('orderIds')
    if (orderIdsParam) {
      const ids = orderIdsParam.split(',').filter(Boolean)
      // ── 금액 검증(D-1) + 멱등성(D-2): 합계 = Σ total_amount ──
      const { data: cartOrders } = await supabase
        .from('orders').select('id, total_amount, status').in('id', ids)
      if (!cartOrders || cartOrders.length !== ids.length) return failRedirect(request, 'order_not_found')
      if (cartOrders.every((o) => o.status === 'paid')) {
        return NextResponse.redirect(new URL('/my/orders?success=1&from=cart', request.url))
      }
      const expectedCart = cartOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0)
      if (parsedAmount !== expectedCart) {
        await cancelTossPayment(paymentKey, '결제 금액 불일치')
        return failRedirect(request, 'amount_mismatch')
      }
      await supabase.from('orders').update({
        status: 'paid',
        payment_id: paymentKey,
        receipt_url: payment.receipt?.url ?? null,
      }).in('id', ids)

      const { data: paidOrders } = await supabase
        .from('orders')
        .select('product_id, quantity, buyer_id')
        .in('id', ids)
      const buyerId = (paidOrders ?? [])[0]?.buyer_id
      if (buyerId) {
        void supabase.from('notifications').insert({
          user_id: buyerId,
          type: 'order',
          title: '주문이 완료되었습니다',
          body: `${ids.length}개 상품 주문이 접수되었습니다.`,
          link: '/my/orders',
        })
      }
    }
    return NextResponse.redirect(new URL('/my/orders?success=1&from=cart', request.url))
  }

  // type === 'order'
  // ── 금액 검증(D-1) + 멱등성(D-2) ──
  const { data: orderCheck } = await supabase
    .from('orders').select('status, total_amount').eq('id', orderId).single()
  if (!orderCheck) return failRedirect(request, 'order_not_found')
  if (orderCheck.status === 'paid') {
    return NextResponse.redirect(new URL('/my/orders?success=1', request.url))
  }
  if (parsedAmount !== (orderCheck.total_amount ?? -1)) {
    await cancelTossPayment(paymentKey, '결제 금액 불일치')
    return failRedirect(request, 'amount_mismatch')
  }

  await supabase.from('orders').update({
    status: 'paid',
    payment_id: paymentKey,
    receipt_url: payment.receipt?.url ?? null,
  }).eq('id', orderId)

  const { data: order } = await supabase
    .from('orders')
    .select('buyer_id, quantity, total_amount, shipping_name, shipping_address, products!product_id(name), product_id')
    .eq('id', orderId)
    .single()

  if (order) {
    const { data: buyer } = await supabase
      .from('users').select('name, email').eq('id', (order as any).buyer_id).single()
    // 인앱 알림
    void supabase.from('notifications').insert({
      user_id: (order as any).buyer_id,
      type: 'order',
      title: '주문이 완료되었습니다',
      body: `"${(order as any).products?.name ?? '상품'}" 주문이 접수되었습니다.`,
      link: '/my/orders',
    })
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

  return NextResponse.redirect(new URL('/my/orders?success=1', request.url))
}
