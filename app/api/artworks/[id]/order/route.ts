import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { shipping_name, shipping_phone, shipping_address } = await req.json()
  const admin = await createAdminClient()

  const { data: artwork } = await admin.from('artworks').select('*').eq('id', id).single()
  if (!artwork || artwork.status !== 'active' || artwork.stock < 1) {
    return NextResponse.json({ error: '구매 불가한 작품입니다' }, { status: 400 })
  }
  if (artwork.seller_id === user.id) {
    return NextResponse.json({ error: '본인 작품은 구매할 수 없습니다' }, { status: 400 })
  }

  const { data: order, error } = await admin.from('artwork_orders').insert({
    artwork_id: id,
    buyer_id: user.id,
    seller_id: artwork.seller_id,
    amount: artwork.price,
    status: 'pending',
    shipping_name: shipping_name ?? null,
    shipping_phone: shipping_phone ?? null,
    shipping_address: shipping_address ?? null,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ order_id: order.id, amount: artwork.price })
}
