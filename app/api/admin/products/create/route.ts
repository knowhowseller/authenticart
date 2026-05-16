import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, category, description, retail_price, wholesale_price, stock_qty, is_active, thumbnail_url } = body

  if (!name || !category || !retail_price) {
    return NextResponse.json({ error: '필수 항목을 입력해주세요' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('products')
    .insert({
      name,
      category,
      description: description ?? null,
      retail_price,
      wholesale_price: wholesale_price ?? retail_price,
      stock_qty: stock_qty ?? 0,
      is_active: is_active ?? true,
      thumbnail_url: thumbnail_url ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'product_create',
    target_type: 'products',
    target_id: data.id,
    metadata: { name, category, retail_price, wholesale_price: wholesale_price ?? null },
  })

  return NextResponse.json({ product_id: data.id })
}
