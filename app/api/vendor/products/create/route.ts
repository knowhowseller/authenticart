import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (!vendor) return NextResponse.json({ error: '벤더 계정이 없습니다' }, { status: 403 })
  if (vendor.status !== 'approved') {
    return NextResponse.json({ error: '승인된 벤더만 상품을 등록할 수 있습니다' }, { status: 403 })
  }

  const body = await req.json()
  const { name, category, description, retail_price, wholesale_price, stock_qty, is_active, thumbnail_url } = body

  if (!name || !category || !retail_price) {
    return NextResponse.json({ error: '상품명, 카테고리, 소비자가를 입력해주세요' }, { status: 400 })
  }
  if (retail_price <= 0) {
    return NextResponse.json({ error: '올바른 가격을 입력해주세요' }, { status: 400 })
  }
  // 도매가가 지정된 경우 소비자가보다 낮아야 함 (P2-4)
  if (wholesale_price != null && wholesale_price >= retail_price) {
    return NextResponse.json({ error: '도매가(강사가)는 소비자가보다 낮아야 합니다' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('products')
    .insert({
      name,
      category,
      description: description ?? null,
      retail_price,
      wholesale_price: wholesale_price ?? null,
      stock_qty: stock_qty ?? 0,
      is_active: is_active ?? true,
      thumbnail_url: thumbnail_url ?? null,
      vendor_id: vendor.id,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product_id: data.id })
}
