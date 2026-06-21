// 블로그 글 수정 — admin·branch_manager 전용. 전달된 필드만 부분 업데이트.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/blog'
import { submitBlogPost } from '@/lib/indexnow'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin', 'branch_manager'].includes(u?.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // 현재 상태 조회 (발행 전환 시 published_at 세팅 판단용)
  const { data: current } = await supabase.from('blog_posts').select('status, published_at, slug').eq('id', id).single()
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.content !== undefined) updates.content = body.content.trim()
  if (body.excerpt !== undefined) updates.excerpt = body.excerpt.trim() || null
  if (body.cover_image !== undefined) updates.cover_image = body.cover_image.trim() || null
  if (body.category !== undefined) updates.category = body.category.trim()
  if (body.author_name !== undefined) updates.author_name = body.author_name.trim() || '오센틱아트'
  if (body.seo_title !== undefined) updates.seo_title = body.seo_title.trim() || null
  if (body.seo_description !== undefined) updates.seo_description = body.seo_description.trim() || null
  if (body.is_featured !== undefined) updates.is_featured = !!body.is_featured

  if (body.slug !== undefined && body.slug.trim()) {
    let slug = slugify(body.slug)
    const { data: dup } = await supabase.from('blog_posts').select('id').eq('slug', slug).neq('id', id).maybeSingle()
    if (dup) slug = `${slug}-${Date.now().toString().slice(-5)}`
    updates.slug = slug
  }

  if (body.tags !== undefined) {
    updates.tags = Array.isArray(body.tags) ? body.tags.map((t: string) => t.trim()).filter(Boolean).slice(0, 15) : []
  }
  if (body.faq !== undefined) {
    updates.faq = Array.isArray(body.faq)
      ? body.faq.filter((f: any) => f?.q?.trim() && f?.a?.trim()).map((f: any) => ({ q: f.q.trim(), a: f.a.trim() })).slice(0, 20)
      : []
  }

  if (body.status !== undefined) {
    const status = body.status === 'published' ? 'published' : 'draft'
    updates.status = status
    // 최초 발행 시 발행일 기록
    if (status === 'published' && !current.published_at) {
      updates.published_at = new Date().toISOString()
    }
  }

  const { error } = await supabase.from('blog_posts').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 수정 후 최종 상태가 발행이면 IndexNow 재색인 요청 (내용·slug 변경 반영, 실패 무시)
  const finalStatus = body.status !== undefined ? (body.status === 'published' ? 'published' : 'draft') : current.status
  const finalSlug = (updates.slug as string | undefined) ?? current.slug
  if (finalStatus === 'published' && finalSlug) await submitBlogPost(finalSlug)

  return NextResponse.json({ ok: true })
}
