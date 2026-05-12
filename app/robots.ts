import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://authenticart.co.kr'
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/classes', '/classes/', '/instructors', '/instructors/', '/shop', '/shop/', '/notices', '/faq'],
        disallow: ['/admin/', '/studio/', '/api/', '/my/', '/login', '/signup', '/forgot-password', '/reset-password'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
