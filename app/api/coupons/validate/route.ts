import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { code, amount } = await req.json()
  if (!code || !amount) return NextResponse.json({ error: 'code, amount required' }, { status: 400 })

  const now = new Date().toISOString()
  const { data: coupon } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .lte('valid_from', now)
    .single()

  if (!coupon) return NextResponse.json({ error: '유효하지 않은 쿠폰 코드입니다' }, { status: 404 })
  if (coupon.valid_until && coupon.valid_until < now) {
    return NextResponse.json({ error: '만료된 쿠폰입니다' }, { status: 400 })
  }
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({ error: '사용 한도를 초과한 쿠폰입니다' }, { status: 400 })
  }
  if (amount < coupon.min_amount) {
    return NextResponse.json({
      error: `${coupon.min_amount.toLocaleString()}원 이상 결제 시 사용 가능합니다`,
    }, { status: 400 })
  }

  // 이미 사용했는지
  const { data: existing } = await supabase
    .from('coupon_uses')
    .select('id')
    .eq('coupon_id', coupon.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: '이미 사용한 쿠폰입니다' }, { status: 400 })

  const discount = coupon.type === 'percent'
    ? Math.round(amount * coupon.value / 100)
    : Math.min(coupon.value, amount)

  return NextResponse.json({
    coupon_id: coupon.id,
    discount,
    type: coupon.type,
    value: coupon.value,
    description: coupon.description,
  })
}
