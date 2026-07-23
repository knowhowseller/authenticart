// sync-publish-log.mjs — 엔진 발행이력(publish_log.csv)에 빠진 블로그 글을 편입한다.
//
// 왜: 엔진의 색인률·학습은 publish_log.csv를 분모로 쓴다. 엔진 밖에서 만든 글(초기 수동 발행분 등)은
// 이력에 없어 **색인률 통계에서 통째로 빠지고**, 하필 그런 글일수록 색인이 안 돼 색인률이 과대집계된다.
// 실측(2026-07-23): 엔진 보고 69%(43편 기준) vs sitemap 전수 39%(34/87).
//
// 왜 import_sitemap.js를 쓰지 않는가: 그쪽은 URL 문자열 완전일치로 중복을 판정하는데,
// publish_log는 한글 URL, sitemap은 퍼센트 인코딩이라 **같은 글이 중복 등록**된다(실측 43건).
// 여기서는 디코딩해서 비교하고, 기존 이력과 같은 형태(디코딩 URL)로 기록한다.
// 발행일도 sitemap의 lastmod가 아니라 DB의 published_at을 쓴다(lastmod는 본문 수정 때마다 바뀐다).
//
// 사용: node scripts/sync-publish-log.mjs [--apply]
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const APPLY = process.argv.includes('--apply')
const LOG = 'D:\\키워드엔진\\publish_log.csv'
const BRAND = '오센틱아트'
const BASE = 'https://www.authenticart.co.kr'

const env = {}
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim()
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const { data: posts, error } = await sb
  .from('blog_posts')
  .select('slug, title, published_at, category')
  .eq('status', 'published')
  .order('published_at', { ascending: true })
if (error) { console.error('조회 실패:', error.message); process.exit(1) }

const raw = fs.readFileSync(LOG, 'utf8')
const lines = raw.split(/\r?\n/)
const norm = (u) => { try { return decodeURIComponent(u).trim() } catch { return u.trim() } }
// 브랜드 무관 전수 비교 — 같은 URL이 다른 브랜드명으로 들어가 있어도 중복을 막는다.
const known = new Set(lines.slice(1).filter(Boolean).map((l) => norm(l.split(',').find((c) => c.startsWith('http')) || '')))

const esc = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
const add = []
for (const p of posts) {
  const url = `${BASE}/blog/${p.slug}`
  if (known.has(norm(url))) continue
  const kw = p.slug.replace(/-/g, ' ').trim()
  add.push([(p.published_at || '').slice(0, 10), BRAND, 'web', kw, p.title || kw, url, '', 'blog', '정보'].map(esc).join(','))
}

console.log(`DB 발행글 ${posts.length}편 · 이력에 이미 있음 ${posts.length - add.length}편 · 편입 대상 ${add.length}편`)
// process.exit()로 끊으면 supabase 클라이언트의 열린 핸들과 겹쳐 libuv assertion이 뜬다 → 분기로 끝낸다.
if (!add.length) {
  console.log('편입할 글 없음 — 이력이 이미 전수를 담고 있다.')
} else {
  console.log('\n편입 예시(최대 5):')
  add.slice(0, 5).forEach((l) => console.log('  + ' + l.slice(0, 120)))

  if (!APPLY) {
    console.log('\n--dry-run — 변경 없음. 적용하려면 --apply')
  } else {
    fs.copyFileSync(LOG, LOG.replace(/\.csv$/, `.bak-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`))
    const tail = raw.endsWith('\n') ? '' : '\n'
    fs.appendFileSync(LOG, tail + add.join('\n') + '\n', 'utf8')
    console.log(`\n완료: ${add.length}건 편입(백업 .bak-*.csv 생성).`)
    console.log('다음: node D:\\키워드엔진\\measure.js 로 색인 재측정 → publish-quota가 실제 색인률을 읽는다.')
  }
}
