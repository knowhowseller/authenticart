import type { MetadataRoute } from 'next'

// 공개 가능한 경로 / 차단 경로
const ALLOW = ['/', '/classes', '/instructors', '/shop', '/artworks', '/blog', '/notices', '/board', '/faq', '/about']
const DISALLOW = ['/admin/', '/studio/', '/branch/', '/api/', '/my/', '/login', '/signup', '/forgot-password', '/reset-password', '/payment/']

// AI 검색·생성형 엔진 크롤러 — 공개 콘텐츠 학습/인용을 허용해 AI 검색 노출(AEO)을 높인다
const AI_CRAWLERS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',        // OpenAI
  'ClaudeBot', 'anthropic-ai', 'Claude-User',        // Anthropic
  'PerplexityBot', 'Perplexity-User',                // Perplexity
  'Google-Extended',                                  // Google Gemini/AI Overviews
  'Applebot-Extended',                                // Apple Intelligence
  'CCBot',                                            // Common Crawl (다수 LLM 학습원)
  'Bytespider',                                       // 검색 AI
  'Amazonbot', 'cohere-ai', 'YouBot', 'Diffbot',
]

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.authenticart.co.kr'
  return {
    rules: [
      { userAgent: '*', allow: ALLOW, disallow: DISALLOW },
      // AI 크롤러: 공개 콘텐츠는 허용하되 비공개 영역은 동일하게 차단
      { userAgent: AI_CRAWLERS, allow: ALLOW, disallow: DISALLOW },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
