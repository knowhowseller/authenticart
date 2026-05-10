import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { product_id, quantity = 1, shipping_info } = await request.json()
  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 })

  const admin = await createAdminClient()

  const { data: product } = await admin
    .from('products')
    .select('id, name, retail_price, wholesale_price, is_instructor_only, is_active, stock_qty')
    .eq('id', product_id)
    .single()

  if (!product || !product.is_active) {
    return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 })
  }

  if ((product.stock_qty ?? 0) < quantity) {
    return NextResponse.json({ error: '재고가 부족합니다' }, { status: 400 })
  }

  const { data: userData } = await admin.from('users').select('role').eq('id', user.id).single()
  const role = userData?.role ?? 'student'

  if (product.is_instructor_only && !['instructor', 'admin'].includes(role)) {
    return NextResponse.json({ error: '강사 인증 후 구매 가능합니다' }, { status: 403 })
  }

  const unitPrice = ['instructor', 'admin'].includes(role) && product.wholesale_price
    ? product.wholesale_price
    : product.retail_price

  const totalAmount = unitPrice * quantity

  const { data: order, error } = await admin
    .from('orders')
    .insert({
      buyer_id: user.id,
      product_id,
      quantity,
      total_amount: totalAmount,
      status: 'pending',
      shipping_name: shipping_info?.recipient ?? null,
      shipping_phone: shipping_info?.phone ?? null,
      shipping_address: shipping_info?.address
        ? `[${shipping_info.postcode}] ${shipping_info.address}${shipping_info.memo ? ` (${shipping_info.memo})` : ''}`
        : null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ order_id: order.id })
}
