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
// 색인 게이트 (2026-07-12): 실측상 얇은 글이 "크롤됐으나 색인 거부"로 떨어졌다.
// 색인 안 되면 검색에도 AI 답변(RAG)에도 못 나가므로, 색인 가능성을 발행 전에 강제한다.
const MIN = 2000                 // 최소 본문 글자수(구 1000 → 상향)
const MIN_NUMBERS = 3            // 고유 수치(가격·시간·인원 등) 최소 개수
const MIN_INTERNAL_LINKS = 2     // 내부링크 최소(고아 페이지 방지)

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
  // 글자수 — 얇은 글은 색인 거부의 1순위 원인
  if (c.length < MIN) issues.push({ slug: post.slug, type: '글자수부족', word: `${c.length}자`, ctx: `최소 ${MIN}자 (얇은 글은 색인 거부됨)` })

  // 고유 수치 — 일반론만 있는 글은 색인되지 않는다(가격·소요시간·인원·난이도 등)
  const nums = (c.match(/\d[\d,]*\s*(원|만원|분|시간|명|개|주|일|살|cm|ml|g)/g) || [])
  if (nums.length < MIN_NUMBERS) issues.push({ slug: post.slug, type: '고유정보부족', word: `수치 ${nums.length}개`, ctx: `최소 ${MIN_NUMBERS}개(가격·시간·인원 등 구체 수치)` })

  // 내부링크 — 고아 페이지는 크롤조차 되지 않는다
  const internal = (c.match(/\]\(\/(blog|classes|artworks)[^)]*\)/g) || [])
  if (internal.length < MIN_INTERNAL_LINKS) issues.push({ slug: post.slug, type: '내부링크부족', word: `${internal.length}개`, ctx: `최소 ${MIN_INTERNAL_LINKS}개(고아 페이지 방지)` })

  // 추출 가능한 형태 — AI는 문단 단위로 추출한다(표·번호목록·체크리스트 중 1개 이상)
  const extractable = /\n\|.*\|/.test(c) || /\n\s*\d\.\s/.test(c) || /\n\s*-\s\[/.test(c)
  if (!extractable) issues.push({ slug: post.slug, type: '추출형식없음', word: '표/번호목록 없음', ctx: '비교표 또는 번호 단계 1개 이상 필요' })

  // FAQ — AI 답변의 상당수가 FAQ 구조에서 나온다
  if (!Array.isArray(post.faq) || post.faq.length < 4) issues.push({ slug: post.slug, type: 'FAQ부족', word: `${(post.faq || []).length}개`, ctx: '정확히 4개' })
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
