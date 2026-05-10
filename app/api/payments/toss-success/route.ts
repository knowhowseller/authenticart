import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const paymentKey = url.searchParams.get('paymentKey')
  const orderId = url.searchParams.get('orderId')
  const amount = url.searchParams.get('amount')
  const type = url.searchParams.get('type') ?? 'booking'

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.redirect(new URL('/?error=payment_invalid', request.url))
  }

  const res = await fetch(new URL('/api/webhooks/toss', request.url).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentKey, orderId, amount: parseInt(amount), type }),
  })

  if (!res.ok) {
    return NextResponse.redirect(new URL('/?error=payment_failed', request.url))
  }

  const redirectTo = type === 'booking' ? '/my/bookings' : '/my/orders'
  return NextResponse.redirect(new URL(redirectTo + '?success=1', request.url))
}
