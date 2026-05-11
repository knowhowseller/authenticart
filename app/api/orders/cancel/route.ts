import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { order_id } = await req.json()
  if (!order_id) return NextResponse.json({ error: 'order_id required' }, { status: 400 })

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, buyer_id')
    .eq('id', order_id)
    .eq('buyer_id', user.id)
    .single()

  if (!order) return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 })
  if (order.status !== 'pending') {
    return NextResponse.json({ error: '결제 대기 상태의 주문만 취소할 수 있습니다' }, { status: 400 })
  }

  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', order_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
