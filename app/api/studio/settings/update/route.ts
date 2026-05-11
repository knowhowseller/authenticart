import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['instructor', 'admin'].includes(userData?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { bio, region, profile_image, payout_account } = body

  const profileUpdate: Record<string, unknown> = {}
  if (bio !== undefined) profileUpdate.bio = bio
  if (region !== undefined) profileUpdate.region = region
  if (profile_image !== undefined) profileUpdate.profile_image = profile_image

  if (payout_account !== undefined) {
    const { bank, account, holder } = payout_account ?? {}
    if (payout_account && (!bank || !account || !holder)) {
      return NextResponse.json({ error: '계좌 정보를 모두 입력해주세요' }, { status: 400 })
    }
    profileUpdate.payout_account = payout_account
  }

  if (Object.keys(profileUpdate).length === 0) {
    return NextResponse.json({ error: '변경할 정보가 없습니다' }, { status: 400 })
  }

  const { error } = await supabase
    .from('instructor_profiles')
    .update(profileUpdate)
    .eq('instructor_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
