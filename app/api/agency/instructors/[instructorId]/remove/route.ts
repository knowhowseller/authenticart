import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ instructorId: string }> }
) {
  const { instructorId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 현재 사용자가 에이전시 대표인지 확인
  const { data: agency } = await supabase
    .from('agencies')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!agency) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // 해당 강사가 내 에이전시 소속인지 확인
  const { data: profile } = await supabase
    .from('instructor_profiles')
    .select('instructor_id')
    .eq('instructor_id', instructorId)
    .eq('agency_id', agency.id)
    .single()
  if (!profile) return NextResponse.json({ error: '소속 강사가 아닙니다' }, { status: 404 })

  const admin = await createAdminClient()
  const { error } = await admin
    .from('instructor_profiles')
    .update({ agency_id: null })
    .eq('instructor_id', instructorId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
