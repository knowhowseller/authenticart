#!/usr/bin/env node
// 기존 발행글 본문 삽화 백필 — content에 로컬 FLUX 삽화(H2 뒤 1~2장)를 삽입하고 DB 업데이트.
// 멱등: 이미 삽화(/blog-covers/ URL)가 있는 글은 자동 skip.
//
// 사용:
//   node scripts/backfill-body-images.mjs --limit 1   # 1편 테스트
//   node scripts/backfill-body-images.mjs --dry        # 대상만 출력
//   node scripts/backfill-body-images.mjs              # 전체
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import { embedBodyImages } from './embed-body-images.mjs'

const args = process.argv.slice(2)
const limIdx = args.indexOf('--limit')
const limit = limIdx >= 0 ? parseInt(args[limIdx + 1], 10) : 0
const dry = args.includes('--dry')
const force = args.includes('--force')

const env = {}
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim()
}
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('.env.local에 SUPABASE URL/SERVICE_ROLE_KEY 없음'); process.exit(1) }
const sb = createClient(url, key, { auth: { persistSession: false } })

async function main() {
  let q = sb.from('blog_posts')
    .select('slug, title, category, content')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
  if (limit > 0) q = q.limit(limit)
  const { data: posts, error } = await q
  if (error) { console.error('조회 실패:', error.message); process.exit(1) }

  // 이미 삽화 있는 글 제외 (--force면 재생성 위해 포함)
  const targets = force ? posts : posts.filter(p => !(p.content || '').includes('/blog-covers/'))
  console.log(`발행글 ${posts.length}편 중 대상 ${targets.length}편${force ? ' (force 재생성)' : ''}${limit ? ` (limit ${limit})` : ''}`)
  if (dry) { targets.forEach(p => console.log(`  - ${p.slug} [${p.category}]`)); return }

  let ok = 0, skip = 0, fail = 0
  for (const p of targets) {
    try {
      const r = await embedBodyImages(sb, p, { auto: true, maxImages: 2, force })
      if (!r.count) { console.log(`  ⏭️  ${p.slug} (H2 없음/스킵)`); skip++; continue }
      const { error: uerr } = await sb.from('blog_posts').update({ content: r.content }).eq('slug', p.slug)
      if (uerr) throw new Error(uerr.message)
      console.log(`  ✅ ${p.slug} — 삽화 ${r.count}장`)
      ok++
    } catch (e) {
      console.warn(`  ❌ ${p.slug}: ${e.message}`)
      fail++
    }
  }
  console.log(`\n백필 완료: 성공 ${ok} / 스킵 ${skip} / 실패 ${fail} / 대상 ${targets.length}`)
}

main().catch(e => { console.error('오류:', e.message); process.exit(1) })
