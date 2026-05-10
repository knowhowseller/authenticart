import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { product_id, name, category, description, retail_price, wholesale_price, stock_qty, is_active, thumbnail_url } = body

  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin
    .from('products')
    .update({
      name,
      category,
      description: description ?? null,
      retail_price,
      wholesale_price,
      stock_qty,
      is_active,
      thumbnail_url: thumbnail_url ?? null,
    })
    .eq('id', product_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
