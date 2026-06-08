import { ImageResponse } from 'next/og'

// 사이트 기본 OG 이미지 (홈·기본 공유 미리보기)
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = '오센틱아트 — 공예·예술 클래스 & 재료 쇼핑 플랫폼'

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

export default async function OgImage() {
  const line1 = '취미를 직업으로'
  const line2 = '전 장르 공예 클래스 · 강사 양성 · 작품 판매 · 재료 도매'
  const fontData = await loadKoreanFont(line1 + line2 + '오센틱아트 Authentic Art authenticart.co.kr')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1A1A2E 0%, #2d3d44 100%)',
          color: '#ffffff',
          padding: '64px',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 8, color: '#F59E0B', fontWeight: 700, marginBottom: 24 }}>
          AUTHENTIC ART
        </div>
        <div style={{ display: 'flex', fontSize: 80, fontWeight: 700 }}>{line1}</div>
        <div style={{ display: 'flex', fontSize: 30, color: '#BEC9C9', marginTop: 28, maxWidth: 980 }}>{line2}</div>
        <div style={{ display: 'flex', fontSize: 26, color: '#7F9593', marginTop: 36 }}>authenticart.co.kr</div>
      </div>
    ),
    {
      ...size,
      fonts: fontData ? [{ name: 'NotoSansKR', data: fontData, weight: 700 as const, style: 'normal' as const }] : [],
    },
  )
}
