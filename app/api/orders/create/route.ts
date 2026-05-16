import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { product_id, quantity = 1, shipping_info } = await request.json()
  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 })

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, retail_price, wholesale_price, is_instructor_only, is_active, stock_qty')
    .eq('id', product_id)
    .single()

  if (productError || !product || !product.is_active) {
    return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 })
  }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = userData?.role ?? 'member'

  if (product.is_instructor_only && !['instructor', 'admin'].includes(role)) {
    return NextResponse.json({ error: '강사 인증 후 구매 가능합니다' }, { status: 403 })
  }

  const unitPrice = ['instructor', 'admin'].includes(role) && product.wholesale_price
    ? product.wholesale_price
    : product.retail_price

  const totalAmount = unitPrice * quantity

  const admin = await createAdminClient()

  // 재고 확인 + 차감을 atomic RPC로 처리 (P0-2)
  const { data: stockResult, error: stockError } = await admin.rpc('decrement_stock', {
    p_product_id: product_id,
    p_quantity: quantity,
  })

  if (stockError) {
    return NextResponse.json({ error: stockError.message }, { status: 500 })
  }

  const stockData = stockResult as { ok: boolean; error?: string }
  if (!stockData.ok) {
    return NextResponse.json({ error: stockData.error ?? '재고가 부족합니다' }, { status: 400 })
  }

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

  if (error) {
    // 주문 생성 실패 시 재고 복구
    await admin.from('products').update({ stock_qty: product.stock_qty }).eq('id', product_id)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ order_id: order.id })
}
