import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return NextResponse.json({ error: '벤더 계정이 없습니다' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const type = formData.get('type') as string | null // 'logo' | 'banner'
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })
  if (!['logo', 'banner'].includes(type ?? '')) return NextResponse.json({ error: 'type must be logo or banner' }, { status: 400 })

  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: '5MB 이하 파일만 업로드 가능합니다' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const contentType = file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`
  const path = `vendors/${vendor.id}/${type}-${Date.now()}.${ext}`

  const admin = await createAdminClient()
  const { error } = await admin.storage
    .from('vendor-images')
    .upload(path, Buffer.from(await file.arrayBuffer()), { upsert: true, contentType })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = admin.storage.from('vendor-images').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
