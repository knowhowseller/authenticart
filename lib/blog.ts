// 블로그/매거진 공용 타입·상수·헬퍼

export interface BlogFaqItem {
  q: string
  a: string
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  cover_image: string | null
  category: string
  tags: string[]
  faq: BlogFaqItem[]
  author_name: string
  status: 'draft' | 'published'
  is_featured: boolean
  view_count: number
  seo_title: string | null
  seo_description: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

// 목록/카드용 경량 타입
export type BlogPostCard = Pick<
  BlogPost,
  'id' | 'slug' | 'title' | 'excerpt' | 'cover_image' | 'category' | 'tags' | 'author_name' | 'published_at' | 'created_at' | 'view_count'
>

export const BLOG_CATEGORIES = [
  { code: 'guide', label: '공예 가이드', emoji: '📘' },
  { code: 'story', label: '브랜드 스토리', emoji: '✨' },
  { code: 'instructor', label: '강사 인터뷰', emoji: '🎤' },
  { code: 'trend', label: '공예 트렌드', emoji: '🔥' },
  { code: 'review', label: '클래스 후기', emoji: '💬' },
  { code: 'news', label: '소식', emoji: '📣' },
] as const

export function categoryLabel(code: string): string {
  return BLOG_CATEGORIES.find((c) => c.code === code)?.label ?? code
}

export function categoryEmoji(code: string): string {
  return BLOG_CATEGORIES.find((c) => c.code === code)?.emoji ?? '📄'
}

/**
 * 제목 → URL 슬러그 변환.
 * 한글은 그대로 두고(브라우저가 인코딩), 공백은 -, 특수문자는 제거.
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // 문자/숫자/공백/하이픈만 허용
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/** 마크다운/HTML 제거 후 순수 텍스트 추출 (메타 설명·요약 폴백용) */
export function stripMarkdown(md: string, maxLen = 160): string {
  const text = md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 이미지
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 링크 → 텍스트
    .replace(/[#>*_`~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > maxLen ? text.slice(0, maxLen).trimEnd() + '…' : text
}

/** 본문 글자 수 기반 예상 읽기 시간(분) */
export function readingMinutes(content: string): number {
  const chars = content.replace(/\s/g, '').length
  return Math.max(1, Math.round(chars / 500)) // 한글 약 500자/분 기준
}
