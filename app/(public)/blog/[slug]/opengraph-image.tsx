import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { categoryLabel } from '@/lib/blog'

// 블로그 글별 동적 OG 이미지 — 제목·카테고리가 들어간 브랜드 카드.
// SNS·카카오·검색·AI 미리보기에서 제목 썸네일로 노출된다.
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = '오센틱아트 공예 매거진'

// 한글 OG는 글리프 서브셋 폰트를 로드해야 깨지지 않는다. (실패 시 폰트 없이 렌더 — 페이지엔 영향 없음)
async function loadKoreanFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(text)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    ).then((r) => r.text())
    const url = css.match(/src:\s*url\((https:[^)]+)\)\s*format/)?.[1]
    if (!url) return null
    return await fetch(url).then((r) => r.arrayBuffer())
  } catch {
    return null
  }
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let title = '오센틱아트 공예 매거진'
  let category = '공예 매거진'
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('blog_posts')
      .select('title, category')
      .eq('slug', decodeURIComponent(slug))
      .eq('status', 'published')
      .single()
    if (data?.title) title = data.title
    if (data?.category) category = categoryLabel(data.category)
  } catch {
    /* 폴백 텍스트 사용 */
  }

  const fontData = await loadKoreanFont(title + category + '오센틱아트 공예 매거진 Authentic Art')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1A1A2E 0%, #1A1A2E 55%, #2d3d44 100%)',
          padding: '72px',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, color: '#F59E0B', fontWeight: 700 }}>
          {category}
        </div>
        <div style={{ display: 'flex', fontSize: 66, fontWeight: 700, lineHeight: 1.25, maxWidth: '1000px' }}>
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 28, color: '#BEC9C9' }}>
          <div style={{ display: 'flex', width: 14, height: 14, background: '#F59E0B', borderRadius: 4 }} />
          오센틱아트 · 공예 매거진 · authenticart.co.kr
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData ? [{ name: 'NotoSansKR', data: fontData, weight: 700 as const, style: 'normal' as const }] : [],
    },
  )
}
