#!/usr/bin/env node
// 홈 featured 로테이션 — 매일 발행이 쌓이므로 최신 N편만 홈 노출(is_featured=true), 나머지는 내린다.
// 사용: node scripts/rotate-featured.mjs [N]   (기본 3)
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const N = Number(process.argv[2] || 3)
const env = {}
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim()
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const { data: recent, error } = await sb
  .from('blog_posts')
  .select('slug')
  .eq('status', 'published')
  .order('published_at', { ascending: false })
  .limit(N)
if (error) { console.error('조회 실패:', error.message); process.exit(1) }
const keep = (recent || []).map(r => r.slug)

// 현재 featured 전부 내리고 → 최신 N편만 올림 (2단계, 멱등)
await sb.from('blog_posts').update({ is_featured: false }).eq('is_featured', true)
if (keep.length) await sb.from('blog_posts').update({ is_featured: true }).in('slug', keep)

console.log(`featured 로테이션 완료 — 최신 ${keep.length}편 홈 노출: ${keep.join(', ')}`)
