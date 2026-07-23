export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Hexagon from '@/components/brand/Hexagon'
import Markdown from '@/components/blog/Markdown'
import BlogCover from '@/components/blog/BlogCover'
import JsonLd from '@/components/seo/JsonLd'
import { categoryLabel, categoryEmoji, readingMinutes, stripMarkdown, type BlogPost, type BlogPostCard } from '@/lib/blog'
import { ChevronLeft, Eye, Clock } from 'lucide-react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.authenticart.co.kr'

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  const decoded = decodeURIComponent(slug)
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', decoded)
    .eq('status', 'published')
    .single()
  return (data as BlogPost) ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: '글을 찾을 수 없습니다' }

  const title = post.seo_title || post.title
  const description = post.seo_description || post.excerpt || stripMarkdown(post.content)
  const url = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`

  return {
    title,
    description,
    keywords: post.tags?.join(', '),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: post.published_at ?? post.created_at,
      modifiedTime: post.updated_at,
      authors: [post.author_name],
      tags: post.tags,
      ...(post.cover_image ? { images: [{ url: post.cover_image }] } : {}),
    },
    twitter: {
      card: post.cover_image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(post.cover_image ? { images: [post.cover_image] } : {}),
    },
  }
}

function fmtDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const supabase = await createClient()

  // 조회수 증가 (실패해도 페이지 렌더에는 영향 없음)
  await supabase.rpc('increment_blog_view', { post_slug: post.slug })

  // 관련 글 (같은 카테고리) — 최신글에만 링크가 몰려 오래된 글이 고아(색인 탈락)가 되던 문제를
  // 막기 위해 "최신 + 오래된" 글을 함께 노출한다. 모든 형제 글 페이지가 오래된 글로도 내부링크를
  // 흘려보내, 카테고리 안에서 링크 자산이 고르게 퍼지고 크롤 경로가 생긴다.
  const { data: poolData } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image, category, tags, author_name, published_at, created_at, view_count')
    .eq('status', 'published')
    .eq('category', post.category)
    .neq('id', post.id)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(60)
  const pool = (poolData ?? []) as BlogPostCard[]
  const newest = pool.slice(0, 3)
  // 오래된 쪽을 slice(-3) 고정으로 뽑으면 카테고리에서 "가장 오래된 3편"만 계속 링크를 받고
  // 나머지 오래된 글은 여전히 고아로 남는다(2026-07-23 실측: 6/8 발행 롱폼 22편 중 색인 2편, 9%).
  // 현재 글 slug 해시로 시작점을 정해 형제 글마다 다른 3편을 링크하면, 카테고리 안의 오래된 글
  // 전체가 순환적으로 인바운드를 받는다. 해시는 결정적이라 렌더·재검증 사이에 결과가 흔들리지 않는다.
  const older = pool.slice(3)
  const seed = [...post.slug].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  const oldest = older.length
    ? Array.from({ length: Math.min(3, older.length) }, (_, i) => older[(seed + i) % older.length])
    : []
  const seen = new Set<string>()
  const related = [...newest, ...oldest].filter((r) => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  }).slice(0, 6)

  const url = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`
  const description = post.seo_description || post.excerpt || stripMarkdown(post.content)

  // ── JSON-LD (AEO): BlogPosting + BreadcrumbList + FAQPage ──
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    ...(post.cover_image ? { image: [post.cover_image] } : {}),
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    author: { '@type': 'Organization', name: post.author_name, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: '오센틱아트',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo/logo-light.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(post.tags?.length ? { keywords: post.tags.join(', ') } : {}),
    articleSection: categoryLabel(post.category),
    inLanguage: 'ko-KR',
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: '공예 매거진', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  }

  const faqLd =
    post.faq && post.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: post.faq.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null

  const ldData = [articleLd, breadcrumbLd, ...(faqLd ? [faqLd] : [])]

  return (
    <div className="min-h-screen bg-brand-bg">
      <JsonLd data={ldData} />

      <article className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-brand-grey hover:text-brand-deep mb-6">
          <ChevronLeft size={14} />
          공예 매거진
        </Link>

        {/* 헤더 */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Hexagon color="amber" size={13} />
            <span className="text-xs font-semibold text-brand-amber uppercase tracking-wider">
              {categoryEmoji(post.category)} {categoryLabel(post.category)}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-ink leading-tight mb-4">{post.title}</h1>
          {post.excerpt && <p className="text-base text-brand-grey leading-relaxed mb-5">{post.excerpt}</p>}
          <div className="flex items-center gap-3 text-xs text-brand-grey border-b border-brand-mist/30 pb-5">
            <span className="font-medium text-brand-ink">{post.author_name}</span>
            <span>·</span>
            <span>{fmtDate(post.published_at ?? post.created_at)}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Clock size={12} />{readingMinutes(post.content)}분</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Eye size={12} />{post.view_count}</span>
          </div>
        </header>

        {/* 대표 이미지 (없으면 제목 썸네일 자동 생성) */}
        <div className="mb-8 rounded-2xl overflow-hidden border border-brand-mist/20 aspect-[16/7]">
          {post.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <BlogCover title={post.title} category={post.category} size="hero" />
          )}
        </div>

        {/* 본문 */}
        <div className="bg-white rounded-2xl p-7 md:p-10 shadow-sm border border-brand-mist/30">
          <Markdown content={post.content} />

          {/* 태그 */}
          {post.tags?.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-10 pt-6 border-t border-brand-mist/30">
              {post.tags.map((t) => (
                <span key={t} className="text-xs px-3 py-1 rounded-full bg-brand-bg text-brand-grey">#{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* FAQ 섹션 (있을 때만) */}
        {post.faq && post.faq.length > 0 && (
          <section className="mt-8 bg-white rounded-2xl p-7 md:p-8 shadow-sm border border-brand-mist/30">
            <h2 className="text-xl font-bold text-brand-ink mb-5">자주 묻는 질문</h2>
            <div className="space-y-4">
              {post.faq.map((f, idx) => (
                <details key={idx} className="group border-b border-brand-mist/20 pb-4 last:border-0">
                  <summary className="cursor-pointer font-medium text-brand-ink list-none flex items-start gap-2">
                    <span className="text-brand-amber font-bold">Q.</span>
                    <span className="flex-1">{f.q}</span>
                  </summary>
                  <p className="mt-2 pl-6 text-sm text-brand-grey leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-8 bg-brand-deep rounded-2xl p-7 text-center">
          <p className="text-white font-semibold text-lg mb-1">취미가 직업이 되는 곳, 오센틱아트</p>
          <p className="text-brand-mist text-sm mb-5">공예 클래스 예약부터 강사 자격 취득까지 한 곳에서</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/classes" className="bg-brand-amber text-brand-ink text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-brand-amber/90 transition-colors">
              클래스 둘러보기
            </Link>
            <Link href="/signup/instructor" className="border border-white/40 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-white/10 transition-colors">
              강사 신청하기
            </Link>
          </div>
        </div>

        {/* 관련 글 */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-bold text-brand-ink mb-5">함께 읽으면 좋은 글</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/blog/${encodeURIComponent(r.slug)}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-brand-mist/30 hover:shadow-md transition-all"
                >
                  <div className="aspect-[16/10] bg-brand-mist/10 relative overflow-hidden">
                    {r.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.cover_image} alt={r.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">{categoryEmoji(r.category)}</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-brand-ink leading-snug line-clamp-2 group-hover:text-brand-deep transition-colors">
                      {r.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  )
}
