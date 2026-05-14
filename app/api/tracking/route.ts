import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchTracking } from '@/lib/utils/delivery'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const carrier = req.nextUrl.searchParams.get('carrier')
  const number  = req.nextUrl.searchParams.get('number')
  if (!carrier || !number) {
    return NextResponse.json({ error: 'carrier, number 파라미터가 필요합니다' }, { status: 400 })
  }

  const info = await fetchTracking(carrier, number)
  if (!info) return NextResponse.json({ error: '배송정보를 가져올 수 없습니다' }, { status: 502 })

  return NextResponse.json(info)
}
