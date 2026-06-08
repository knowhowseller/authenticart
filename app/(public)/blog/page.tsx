export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Hexagon from '@/components/brand/Hexagon'
import JsonLd from '@/components/seo/JsonLd'
import { BLOG_CATEGORIES, categoryLabel, categoryEmoji, type BlogPostCard } from '@/lib/blog'
import BlogCover from '@/components/blog/BlogCover'
import { Eye } from 'lucide-react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.authenticart.co.kr'

export const metadata: Metadata = {
  title: '공예 매거진 — 가이드·트렌드·강사 인터뷰',
  description:
    '레진아트·캔들·플라워·도자기 등 공예 입문 가이드, 취미를 직업으로 만드는 방법, 강사 인터뷰와 클래스 후기. 오센틱아트 공예 매거진에서 확인하세요.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: '오센틱아트 공예 매거진',
    description: '공예 입문 가이드·트렌드·강사 인터뷰·클래스 후기',
    url: `${SITE_URL}/blog`,
    type: 'website',
  },
}

function fmtDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image, category, tags, author_name, published_at, created_at, view_count')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (category) query = query.eq('category', category)

  const { data } = await query
  const posts = (data ?? []) as BlogPostCard[]
  const featured = posts[0]
  const rest = posts.slice(1)

  // JSON-LD: 블로그 + 글 목록 (AI 검색이 컬렉션을 인식)
  const blogLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: '오센틱아트 공예 매거진',
    description: '공예 입문 가이드·트렌드·강사 인터뷰·클래스 후기',
    url: `${SITE_URL}/blog`,
    publisher: {
      '@type': 'Organization',
      name: '오센틱아트',
      url: SITE_URL,
    },
    blogPost: posts.slice(0, 20).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${SITE_URL}/blog/${encodeURIComponent(p.slug)}`,
      datePublished: p.published_at ?? p.created_at,
      ...(p.excerpt ? { description: p.excerpt } : {}),
      ...(p.cover_image ? { image: p.cover_image } : {}),
    })),
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <JsonLd data={blogLd} />

      {/* 헤더 */}
      <section className="bg-brand-deep py-14">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Hexagon color="amber" size={14} />
            <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Magazine</span>
            <Hexagon color="amber" size={14} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">공예 매거진</h1>
          <p className="text-brand-mist text-sm md:text-base">
            취미를 직업으로 — 공예 입문 가이드부터 트렌드, 강사들의 진짜 이야기까지
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* 카테고리 필터 */}
        <div className="flex gap-2 flex-wrap mb-8 justify-center">
          <Link
            href="/blog"
            className={`text-sm px-4 py-1.5 rounded-full border transition-all ${
              !category
                ? 'bg-brand-deep text-white border-brand-deep'
                : 'border-brand-mist/50 text-brand-grey hover:border-brand-amber hover:bg-brand-amber/5'
            }`}
          >
            전체
          </Link>
          {BLOG_CATEGORIES.map((c) => (
            <Link
              key={c.code}
              href={`/blog?category=${c.code}`}
              className={`text-sm px-4 py-1.5 rounded-full border transition-all ${
                category === c.code
                  ? 'bg-brand-deep text-white border-brand-deep'
                  : 'border-brand-mist/50 text-brand-grey hover:border-brand-amber hover:bg-brand-amber/5'
              }`}
            >
              {c.emoji} {c.label}
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-brand-mist/30">
            <p className="text-brand-grey">아직 발행된 글이 없습니다</p>
          </div>
        ) : (
          <>
            {/* 대표 글 */}
            {featured && !category && (
              <Link
                href={`/blog/${encodeURIComponent(featured.slug)}`}
                className="group block mb-10 bg-white rounded-3xl overflow-hidden border border-brand-mist/30 hover:shadow-lg transition-all md:flex"
              >
                <div className="md:w-1/2 aspect-[16/10] md:aspect-auto bg-brand-mist/10 relative overflow-hidden">
                  {featured.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featured.cover_image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <BlogCover title={featured.title} category={featured.category} size="hero" />
                  )}
                </div>
                <div className="md:w-1/2 p-7 flex flex-col justify-center">
                  <span className="text-xs font-semibold text-brand-amber mb-2">
                    {categoryEmoji(featured.category)} {categoryLabel(featured.category)}
                  </span>
                  <h2 className="text-2xl font-bold text-brand-ink mb-3 leading-snug group-hover:text-brand-deep transition-colors">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="text-sm text-brand-grey leading-relaxed line-clamp-3 mb-4">{featured.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-brand-grey">
                    <span>{featured.author_name}</span>
                    <span>·</span>
                    <span>{fmtDate(featured.published_at ?? featured.created_at)}</span>
                  </div>
                </div>
              </Link>
            )}

            {/* 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(category ? posts : rest).map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${encodeURIComponent(p.slug)}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-brand-mist/30 hover:shadow-md transition-all flex flex-col"
                >
                  <div className="aspect-[16/10] bg-brand-mist/10 relative overflow-hidden">
                    {p.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.cover_image} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <BlogCover title={p.title} category={p.category} />
                    )}
                    {p.cover_image && (
                      <span className="absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full bg-white/90 text-brand-deep backdrop-blur-sm">
                        {categoryLabel(p.category)}
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-brand-ink leading-snug mb-2 line-clamp-2 group-hover:text-brand-deep transition-colors">
                      {p.title}
                    </h3>
                    {p.excerpt && <p className="text-xs text-brand-grey leading-relaxed line-clamp-2 mb-3 flex-1">{p.excerpt}</p>}
                    <div className="flex items-center justify-between text-xs text-brand-grey/70 mt-auto pt-2">
                      <span>{fmtDate(p.published_at ?? p.created_at)}</span>
                      <span className="flex items-center gap-1"><Eye size={12} />{p.view_count}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
