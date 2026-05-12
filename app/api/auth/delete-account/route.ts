import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { confirm } = await req.json()
  if (confirm !== '탈퇴합니다') {
    return NextResponse.json({ error: '확인 문구가 올바르지 않습니다' }, { status: 400 })
  }

  const { data: userData } = await supabase
    .from('users').select('role').eq('id', user.id).single()

  if (userData?.role === 'admin') {
    return NextResponse.json({ error: '관리자 계정은 탈퇴할 수 없습니다' }, { status: 400 })
  }

  const { data: activeBookings } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .in('status', ['pending_payment', 'pending_approval', 'approved', 'paid'])
  if ((activeBookings as any)?.count > 0) {
    return NextResponse.json({ error: '진행 중인 예약이 있어 탈퇴할 수 없습니다. 예약을 취소한 후 다시 시도해주세요.' }, { status: 400 })
  }

  const adminSupabase = await createAdminClient()
  const { error } = await adminSupabase.auth.admin.deleteUser(user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
