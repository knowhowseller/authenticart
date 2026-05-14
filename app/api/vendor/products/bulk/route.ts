import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

interface BulkProduct {
  name: string
  category?: string
  retail_price: number
  wholesale_price?: number
  stock_qty: number
  is_instructor_only: boolean
  description?: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: vendor } = await supabase
    .from('vendors').select('id, status').eq('user_id', user.id).single()
  if (!vendor) return NextResponse.json({ error: '벤더 계정이 없습니다' }, { status: 403 })
  if (vendor.status !== 'approved') return NextResponse.json({ error: '승인된 벤더만 상품을 등록할 수 있습니다' }, { status: 403 })

  const { products } = await req.json() as { products: BulkProduct[] }
  if (!Array.isArray(products) || products.length === 0)
    return NextResponse.json({ error: '상품 데이터가 없습니다' }, { status: 400 })
  if (products.length > 200)
    return NextResponse.json({ error: '한 번에 최대 200개까지 등록 가능합니다' }, { status: 400 })

  const errors: string[] = []
  const rows = products.map((p, i) => {
    const row = i + 2
    if (!p.name?.trim()) { errors.push(`${row}행: 상품명 필수`); return null }
    if (!p.retail_price || p.retail_price <= 0) { errors.push(`${row}행: 소비자가 오류`); return null }
    if (p.stock_qty < 0) { errors.push(`${row}행: 재고 오류`); return null }
    return {
      vendor_id: vendor.id,
      name: p.name.trim(),
      category: p.category?.trim() || null,
      retail_price: Math.round(p.retail_price),
      wholesale_price: p.wholesale_price && p.wholesale_price > 0 ? Math.round(p.wholesale_price) : null,
      stock_qty: Math.max(0, Math.round(p.stock_qty ?? 0)),
      is_instructor_only: !!p.is_instructor_only,
      description: p.description?.trim() || null,
      is_active: true,
      images: [],
    }
  }).filter(Boolean)

  if (errors.length > 0) return NextResponse.json({ error: errors.join('\n') }, { status: 400 })

  const admin = await createAdminClient()
  const { data, error } = await admin.from('products').insert(rows as any[]).select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, count: data?.length ?? 0 })
}
