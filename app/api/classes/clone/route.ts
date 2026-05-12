import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { class_id } = await req.json()
  if (!class_id) return NextResponse.json({ error: 'class_id required' }, { status: 400 })

  const { data: src } = await supabase
    .from('classes')
    .select('instructor_id, title, description, region, location_address, price, capacity, confirmation_mode, attributes, thumbnail_url, images')
    .eq('id', class_id)
    .single()

  if (!src) return NextResponse.json({ error: '클래스를 찾을 수 없습니다' }, { status: 404 })

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (src.instructor_id !== user.id && userData?.role !== 'admin') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { data: newClass, error } = await supabase
    .from('classes')
    .insert({
      instructor_id: src.instructor_id,
      title: `${src.title} (복사본)`,
      description: src.description,
      region: src.region,
      location_address: src.location_address,
      price: src.price,
      capacity: src.capacity,
      confirmation_mode: src.confirmation_mode,
      attributes: src.attributes,
      thumbnail_url: src.thumbnail_url,
      images: src.images,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: newClass.id })
}
