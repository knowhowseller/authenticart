import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { org_name, contact_name, contact_email, contact_phone, region, lesson_theme, preferred_date, participant_count, message, reference_images } = body

  if (!org_name || !contact_name || !contact_email || !contact_phone || !region || !participant_count) {
    return NextResponse.json({ error: '필수 항목을 모두 입력해주세요' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin.from('group_lesson_requests').insert({
    org_name, contact_name, contact_email, contact_phone,
    region, lesson_theme: lesson_theme ?? null,
    preferred_date: preferred_date ?? null,
    participant_count: Number(participant_count),
    message: message ?? null,
    reference_images: reference_images ?? [],
  } as any)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
