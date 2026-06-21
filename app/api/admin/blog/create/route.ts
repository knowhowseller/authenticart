// 블로그 글 생성 — admin·branch_manager 전용
// POST body: { title, slug, excerpt, content, cover_image, category, tags[], faq[], author_name, status, is_featured, seo_title, seo_description }
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
  const title = (body.title ?? '').trim()
  const content = (body.content ?? '').trim()
  if (!title || !content) return NextResponse.json({ error: '제목과 본문을 입력해주세요' }, { status: 400 })

  let slug = (body.slug ?? '').trim() ? slugify(body.slug) : slugify(title)
  if (!slug) slug = `post-${Date.now()}`

  // 슬러그 중복 시 접미사 부여
  const { data: existing } = await supabase.from('blog_posts').select('id').eq('slug', slug).maybeSingle()
  if (existing) slug = `${slug}-${Date.now().toString().slice(-5)}`

  const status = body.status === 'published' ? 'published' : 'draft'
  const tags = Array.isArray(body.tags) ? body.tags.map((t: string) => t.trim()).filter(Boolean).slice(0, 15) : []
  const faq = Array.isArray(body.faq)
    ? body.faq
        .filter((f: any) => f?.q?.trim() && f?.a?.trim())
        .map((f: any) => ({ q: f.q.trim(), a: f.a.trim() }))
        .slice(0, 20)
    : []

  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      slug,
      title,
      content,
      excerpt: (body.excerpt ?? '').trim() || null,
      cover_image: (body.cover_image ?? '').trim() || null,
      category: (body.category ?? 'guide').trim(),
      tags,
      faq,
      author_name: (body.author_name ?? '').trim() || '오센틱아트',
      status,
      is_featured: !!body.is_featured,
      seo_title: (body.seo_title ?? '').trim() || null,
      seo_description: (body.seo_description ?? '').trim() || null,
      published_at: status === 'published' ? new Date().toISOString() : null,
      created_by: user.id,
    })
    .select('id, slug')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 발행 상태로 생성된 경우에만 IndexNow 즉시 색인 요청 (실패해도 발행은 유지)
  if (status === 'published') await submitBlogPost(data.slug)

  return NextResponse.json({ id: data.id, slug: data.slug })
}
