#!/usr/bin/env node
// 발행 전 품질 게이트 — 광고법 금칙어·CTA·글자수 검사.
// 문제가 있으면 문맥과 함께 출력하고 exit 1 (오케스트레이터가 Claude 재검토로 넘김).
// 단순 매칭은 오탐(예: "완벽하지 않아도")이 나므로, 최종 판단은 Claude가 문맥으로 한다.
// 사용: node scripts/check-content.mjs <posts.json>
import fs from 'node:fs'

const p = process.argv[2]
if (!p) { console.error('사용법: node scripts/check-content.mjs <posts.json>'); process.exit(2) }
const j = JSON.parse(fs.readFileSync(p, 'utf8'))

const BAN = /(최고|최상급|유일|업계\s*1위|1위|보장|완벽|무조건|절대|100%|국내\s*최초)/g
const OK_ROUTES = new Set(['/classes', '/artworks', '/group-request', '/signup/instructor', '/blog', '/'])
const MIN = 1000

const issues = []
for (const post of j.posts) {
  const c = post.content || ''
  // 광고법 의심어 + 문맥
  for (const m of c.matchAll(BAN)) {
    const i = m.index
    issues.push({ slug: post.slug, type: '광고법의심', word: m[0], ctx: c.slice(Math.max(0, i - 25), i + 25).replace(/\n/g, ' ') })
  }
  // CTA 라우트
  for (const m of c.matchAll(/\]\((\/[a-z-]+)/g)) {
    if (!OK_ROUTES.has(m[1])) issues.push({ slug: post.slug, type: 'CTA비표준', word: m[1], ctx: '' })
  }
  // 글자수
  if (c.length < MIN) issues.push({ slug: post.slug, type: '글자수부족', word: `${c.length}자`, ctx: `최소 ${MIN}자` })
}

if (!issues.length) {
  console.log(`검수 통과 ✓ (${j.posts.length}편, 광고법·CTA·글자수 이상 없음)`)
  process.exit(0)
}
console.log(`검수 지적 ${issues.length}건 (Claude 문맥 재검토 필요):`)
for (const it of issues) {
  console.log(`  [${it.type}] ${it.slug} · "${it.word}"${it.ctx ? ` · …${it.ctx}…` : ''}`)
}
process.exit(1)
