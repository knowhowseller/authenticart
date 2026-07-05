#!/usr/bin/env node
// 오센틱 키워드 주간 재수집 — 강화된 weights.json을 새 검색량 수집에 반영(폐루프 되먹임의 나머지 고리).
// 공유 엔진 keywords.js로 오센틱 대표 씨앗을 재수집(out 갱신) → keyword-refine로 재정제.
// node로 실행(한글 씨앗 인수 인코딩 안전). run-weekly-collect.ps1이 run-job으로 감싸 호출.
import { execFileSync } from 'node:child_process'

// 오센틱 공예 도메인 대표 씨앗 (그룹당 최대 5개 — keywords.js 제한)
const GROUPS = [
  ['원데이클래스', '공예체험', '레진아트', '캔들만들기', '플라워클래스'],
  ['단체공예', '기업워크숍', '집들이선물', '공방창업', '공예강사'],
  ['도자기공방', '반지공방', '디퓨저', '가죽공예', '캘리그라피'],
  ['향수공방', '비즈공예', '마크라메', '석고방향제', '어린이공예'],
]

let ok = 0
for (const g of GROUPS) {
  try {
    execFileSync('node', ['keywords.js', ...g], { cwd: 'D:/키워드엔진', stdio: 'inherit' })
    ok++
  } catch (e) {
    console.error('수집 실패:', g.join(','), e.message)
  }
}
console.error(`\n키워드 재수집 ${ok}/${GROUPS.length} 그룹 완료 → 재정제`)

// 재정제(엔진 out 전체 자동통합)
try {
  execFileSync('node', ['scripts/keyword-refine.mjs'], { stdio: 'inherit' })
} catch (e) {
  console.error('정제 실패:', e.message)
  process.exit(1)
}
