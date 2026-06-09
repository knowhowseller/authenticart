import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await req.json()
  const { title, description, price, images, category, material, size_info, stock, shipping_fee } = body
  if (!title || price === undefined) return NextResponse.json({ error: 'title, price required' }, { status: 400 })

  const admin = await createAdminClient()
  const { data, error } = await admin.from('artworks').insert({
    seller_id: user.id,
    title, description, price: Number(price),
    images: images ?? [],
    category: category ?? '기타',
    material: material ?? null,
    size_info: size_info ?? null,
    stock: Number(stock ?? 1),
    shipping_fee: Math.max(0, Math.floor(Number(shipping_fee ?? 0)) || 0),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ artwork: data })
}
