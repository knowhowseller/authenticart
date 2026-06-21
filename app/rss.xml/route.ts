// 블로그(공예 매거진) RSS 2.0 피드 — /rss.xml
// 빙·네이버 웹마스터에 "사이트맵/피드"로 제출하면 신규 글 색인이 빨라진다.
import { createClient } from '@/lib/supabase/server'
import { categoryLabel, stripMarkdown } from '@/lib/blog'

export const revalidate = 1800 // 30분 캐시

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.authenticart.co.kr'

// XML 특수문자 이스케이프
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, content, category, author_name, published_at, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50)

  const list = posts ?? []
  const lastBuild = list[0]?.published_at ?? list[0]?.updated_at ?? new Date().toISOString()

  const items = list
    .map((p) => {
      const url = `${SITE_URL}/blog/${encodeURIComponent(p.slug)}`
      const desc = (p.excerpt && p.excerpt.trim()) || stripMarkdown(p.content ?? '', 200)
      const pubDate = p.published_at ? new Date(p.published_at).toUTCString() : new Date().toUTCString()
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <description>${esc(desc)}</description>
      <category>${esc(categoryLabel(p.category))}</category>
      <author>${esc(p.author_name || '오센틱아트')}</author>
      <pubDate>${pubDate}</pubDate>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>오센틱아트 공예 매거진</title>
    <link>${SITE_URL}/blog</link>
    <description>레진아트·캔들·플라워·도자기 등 전 장르 공예 클래스·작품·강사 이야기와 가이드</description>
    <language>ko</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800',
    },
  })
}
