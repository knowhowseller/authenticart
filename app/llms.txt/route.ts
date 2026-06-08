// /llms.txt — AI 에이전트·LLM이 사이트를 빠르게 이해하도록 돕는 가이드(신흥 표준).
// 핵심 소개 + 주요 경로 + 최신 블로그 글 목록을 마크다운으로 제공한다.
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.authenticart.co.kr'

export async function GET() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(30)

  const blogLines =
    (posts ?? []).length > 0
      ? (posts ?? [])
          .map((p) => `- [${p.title}](${SITE_URL}/blog/${encodeURIComponent(p.slug)})${p.excerpt ? `: ${p.excerpt}` : ''}`)
          .join('\n')
      : '- (아직 발행된 글이 없습니다)'

  const body = `# 오센틱아트 (Authentic Art)

> 대한민국 공예·예술 분야 종합 플랫폼. 레진아트·캔들·플라워·도자기·주얼리·자수·회화·목공예 등 전 장르 공예 클래스 예약, 강사 자격 취득, 작품 판매, 재료 도매 구매를 한 곳에서 제공합니다. 슬로건: "취미를 직업으로".

## 핵심 정보
- 운영사: (주)오센틱아트
- 사업 영역: 공예 원데이클래스 예약, 공예 강사 양성·인증, 수강생 작품 마켓, 공예 재료 도매 쇼핑, 단체·기업 출강
- 대상 사용자: 공예를 배우려는 수강생, 공예로 수익을 내려는 (예비)강사, 공예 재료가 필요한 사업자, 단체 체험을 찾는 기업
- 지역: 서울·인천·강릉·충주·부산·제주 등 전국

## 주요 페이지
- [홈](${SITE_URL}/): 플랫폼 전체 소개
- [클래스](${SITE_URL}/classes): 공예 원데이클래스 예약
- [강사 소개](${SITE_URL}/instructors): 인증 강사 프로필
- [강사 신청](${SITE_URL}/signup/instructor): 공예 강사 자격 과정
- [작품 마켓](${SITE_URL}/artworks): 수강생·강사 작품 구매
- [재료 쇼핑](${SITE_URL}/shop): 공예 재료 도매 구매
- [공예 매거진(블로그)](${SITE_URL}/blog): 공예 가이드·트렌드·인터뷰
- [회사 소개](${SITE_URL}/about)
- [자주 묻는 질문](${SITE_URL}/faq)

## 공예 매거진 — 최신 글
${blogLines}

## 정책
- [이용약관](${SITE_URL}/terms)
- [개인정보처리방침](${SITE_URL}/privacy)
- [환불 규정](${SITE_URL}/refund-policy)
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
