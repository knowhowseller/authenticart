import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://authenticart.kr'
  const supabase = await createClient()

  const [{ data: classes }, { data: instructors }] = await Promise.all([
    supabase.from('classes').select('id, updated_at').eq('status', 'published'),
    supabase.from('instructor_profiles').select('instructor_id, updated_at').eq('status', 'approved'),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, priority: 1, changeFrequency: 'daily' },
    { url: `${baseUrl}/classes`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${baseUrl}/shop`, priority: 0.8, changeFrequency: 'daily' },
    { url: `${baseUrl}/instructors`, priority: 0.7, changeFrequency: 'weekly' },
    { url: `${baseUrl}/about`, priority: 0.5, changeFrequency: 'monthly' },
    { url: `${baseUrl}/terms`, priority: 0.3, changeFrequency: 'monthly' },
    { url: `${baseUrl}/privacy`, priority: 0.3, changeFrequency: 'monthly' },
  ]

  const classRoutes: MetadataRoute.Sitemap = (classes ?? []).map(c => ({
    url: `${baseUrl}/classes/${c.id}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
    priority: 0.8,
    changeFrequency: 'weekly',
  }))

  const instructorRoutes: MetadataRoute.Sitemap = (instructors ?? []).map(i => ({
    url: `${baseUrl}/instructors/${i.instructor_id}`,
    lastModified: i.updated_at ? new Date(i.updated_at) : undefined,
    priority: 0.6,
    changeFrequency: 'weekly',
  }))

  return [...staticRoutes, ...classRoutes, ...instructorRoutes]
}
