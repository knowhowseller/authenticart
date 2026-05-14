import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (!vendor || vendor.status !== 'approved') {
    return NextResponse.json({ error: '승인된 벤더만 상품을 수정할 수 있습니다' }, { status: 403 })
  }

  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', id)
    .eq('vendor_id', vendor.id)
    .single()

  if (!product) return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 })

  const body = await req.json()
  const { name, description, price, stock_quantity, category, is_active, thumbnail_url } = body

  if (!name?.trim()) return NextResponse.json({ error: '상품명은 필수입니다' }, { status: 400 })
  if (typeof price !== 'number' || price < 0) return NextResponse.json({ error: '유효한 가격을 입력하세요' }, { status: 400 })
  if (typeof stock_quantity !== 'number' || stock_quantity < 0) return NextResponse.json({ error: '유효한 재고를 입력하세요' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin.from('products').update({
    name: name.trim(),
    description: description ?? null,
    price,
    stock_quantity,
    category: category ?? null,
    is_active: is_active ?? true,
    thumbnail_url: thumbnail_url ?? null,
  }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
