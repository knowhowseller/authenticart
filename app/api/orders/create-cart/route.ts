import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

interface CartItem {
  product_id: string
  quantity: number
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { items, shipping_info } = await req.json() as {
    items: CartItem[]
    shipping_info: Record<string, string>
  }
  if (!items?.length) return NextResponse.json({ error: 'items required' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = userData?.role ?? 'member'

  const shippingAddress = shipping_info?.address
    ? `[${shipping_info.postcode}] ${shipping_info.address}${shipping_info.memo ? ` (${shipping_info.memo})` : ''}`
    : null

  const orderIds: string[] = []
  const reservedItems: Array<{ p_product_id: string; p_quantity: number }> = []
  let totalAmount = 0
  const orderNames: string[] = []

  async function cleanupFailedCart() {
    if (orderIds.length > 0) {
      await admin.from('orders').delete().in('id', orderIds)
    }
    for (const reserved of reservedItems) {
      await admin.rpc('increment_stock', reserved)
    }
  }

  for (const item of items) {
    if (!item.product_id || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      await cleanupFailedCart()
      return NextResponse.json({ error: '상품 수량이 올바르지 않습니다' }, { status: 400 })
    }

    const { data: product } = await supabase
      .from('products')
      .select('id, name, retail_price, wholesale_price, is_instructor_only, is_active')
      .eq('id', item.product_id)
      .single()

    if (!product || !product.is_active) {
      await cleanupFailedCart()
      return NextResponse.json({ error: `상품을 찾을 수 없습니다: ${item.product_id}` }, { status: 404 })
    }
    if (product.is_instructor_only && !['instructor', 'admin'].includes(role)) {
      await cleanupFailedCart()
      return NextResponse.json({ error: `강사 인증 필요: ${product.name}` }, { status: 403 })
    }

    const unitPrice = ['instructor', 'admin'].includes(role) && product.wholesale_price
      ? product.wholesale_price
      : product.retail_price
    const amount = unitPrice * item.quantity
    totalAmount += amount
    orderNames.push(product.name)

    const { data: stockResult, error: stockError } = await admin.rpc('decrement_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    })

    if (stockError) {
      await cleanupFailedCart()
      return NextResponse.json({ error: stockError.message }, { status: 500 })
    }

    const stockData = stockResult as { ok: boolean; error?: string }
    if (!stockData.ok) {
      await cleanupFailedCart()
      return NextResponse.json({ error: stockData.error ?? `재고 부족: ${product.name}` }, { status: 400 })
    }
    reservedItems.push({ p_product_id: item.product_id, p_quantity: item.quantity })

    const { data: order, error } = await admin
      .from('orders')
      .insert({
        buyer_id: user.id,
        product_id: item.product_id,
        quantity: item.quantity,
        total_amount: amount,
        status: 'pending',
        shipping_name: shipping_info?.recipient ?? null,
        shipping_phone: shipping_info?.phone ?? null,
        shipping_address: shippingAddress,
      })
      .select('id')
      .single()

    if (error) {
      await cleanupFailedCart()
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    orderIds.push(order.id)
  }

  const cartOrderId = `cart_${Date.now()}_${user.id.slice(0, 8)}`
  const orderName = orderNames.length === 1 ? orderNames[0] : `${orderNames[0]} 외 ${orderNames.length - 1}건`

  return NextResponse.json({
    cart_order_id: cartOrderId,
    order_ids: orderIds,
    total_amount: totalAmount,
    order_name: orderName,
  })
}
