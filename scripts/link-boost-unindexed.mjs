// link-boost-unindexed.mjs — 색인된 글 → 미색인 글로 본문 내부링크를 흘려 크롤 경로를 만든다.
//
// 왜 방향이 중요한가: 2026-07-12에는 "미색인 글에" 링크를 넣었다. 그런데 그 글들은 크롤 자체가
// 안 되는 상태라 아웃바운드 링크는 구글에 전달되지 않는다. 링크 신호는 **크롤되는 페이지에서
// 출발해야** 도착지에 도달한다. 그래서 이 스크립트는 색인 확인된 글의 본문에만 블록을 넣고,
// 링크 대상은 미색인 글로 고정한다.
//
// 사용: node scripts/link-boost-unindexed.mjs [--apply]
//   기본은 dry-run(변경 없음). --apply를 줘야 DB에 쓴다. 백업은 scripts/_tmp/에 자동 저장.
// 선행: node scripts/audit-sitemap-index.js 로 sitemap-audit.json 생성(색인 상태 원천).
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const APPLY = process.argv.includes('--apply')
const AUDIT = process.argv.find((a) => a.startsWith('--audit='))?.slice(8)
  || path.join('scripts', '_tmp', 'sitemap-audit.json')
const BLOCK = '## 함께 보면 좋은 글'
const PER_POST = 3 // 색인된 글 1편이 흘려보낼 링크 수

const env = {}
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim()
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const audit = JSON.parse(fs.readFileSync(AUDIT, 'utf8'))
const state = {}
for (const a of audit) {
  const slug = decodeURIComponent(String(a.url).replace('/blog/', ''))
  // 주의: "색인이 생성되지 않음"도 "색인이 생성"을 포함한다 → 긍정형은 종결어미로만 판정한다.
  state[slug] = /생성되었습니다/.test(a.coverage) ? 'indexed' : 'unindexed'
}

const { data: posts, error } = await sb
  .from('blog_posts')
  .select('slug, title, content, category, published_at')
  .eq('status', 'published')
  .order('published_at', { ascending: false })
if (error) { console.error('조회 실패:', error.message); process.exit(1) }

const indexed = posts.filter((p) => state[p.slug] === 'indexed')
const unindexed = posts.filter((p) => state[p.slug] === 'unindexed')
if (!indexed.length || !unindexed.length) { console.error('색인 상태 매칭 실패 — audit 파일을 확인하라'); process.exit(1) }

// 링크 대상 우선순위: 본문이 길수록(살릴 가치 큼) 먼저. 6/8 롱폼(3,000자+)이 자연히 상위에 온다.
const targets = [...unindexed].sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0))
const received = Object.fromEntries(targets.map((t) => [t.slug, 0]))

// 링크를 흘려보낼 소스: 색인된 글 중 아직 "함께 보면 좋은 글" 블록이 없는 글.
// 이미 블록이 있는 글은 기존 링크를 보존한다(덮어쓰면 7/12 조치가 사라진다).
const sources = indexed.filter((p) => !p.content.includes(BLOCK))

const plan = []
for (const src of sources) {
  // 같은 카테고리를 먼저, 그다음 전체. 각 그룹 안에서는 아직 적게 받은 대상부터(균등 분배).
  const rank = (t) => (t.category === src.category ? 0 : 1) * 1000 + received[t.slug]
  const picks = targets
    .filter((t) => t.slug !== src.slug && !src.content.includes(`/blog/${t.slug}`))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, PER_POST)
  if (picks.length < PER_POST) continue
  picks.forEach((t) => received[t.slug]++)
  const lines = picks.map((t) => `- [${t.title}](/blog/${t.slug})`).join('\n')
  plan.push({ slug: src.slug, category: src.category, picks: picks.map((p) => p.slug), content: `${src.content.replace(/\s+$/, '')}\n\n${BLOCK}\n\n${lines}\n` })
}

console.log(`색인 ${indexed.length}편 · 미색인 ${unindexed.length}편`)
console.log(`링크 출발지(블록 없는 색인글): ${sources.length}편 → 삽입 계획 ${plan.length}편 × ${PER_POST}링크`)
const got = targets.filter((t) => received[t.slug] > 0).length
console.log(`인바운드를 받는 미색인 글: ${got}/${targets.length}편`)
console.log('\n상위 수혜 글(본문 3,000자+ 우선):')
targets.filter((t) => (t.content?.length || 0) >= 3000).slice(0, 12)
  .forEach((t) => console.log(`  +${received[t.slug]}  ${t.content.length}자  ${t.slug}`))
const zero = targets.filter((t) => received[t.slug] === 0)
if (zero.length) console.log(`\n인바운드 0으로 남는 미색인 글: ${zero.length}편 (본문 짧은 순)`)

if (!APPLY) { console.log('\n--dry-run — 변경 없음. 적용하려면 --apply'); process.exit(0) }

const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
const backup = path.join('scripts', '_tmp', `backup-linkboost-${stamp}.json`)
fs.mkdirSync(path.dirname(backup), { recursive: true })
fs.writeFileSync(backup, JSON.stringify(plan.map((p) => ({ slug: p.slug, content: posts.find((x) => x.slug === p.slug).content })), null, 1), 'utf8')
console.log(`\n백업 저장(가역): ${backup}`)

let ok = 0
for (const p of plan) {
  const { error: uerr } = await sb.from('blog_posts').update({ content: p.content }).eq('slug', p.slug)
  if (uerr) console.error(`  실패 ${p.slug}: ${uerr.message}`)
  else { ok++; process.stdout.write(`\r  적용 ${ok}/${plan.length}`) }
}
console.log(`\n완료: ${ok}편 갱신. IndexNow 재제출 권장 — node scripts/indexnow-submit-all.mjs`)
