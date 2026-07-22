// publish-quota.mjs — 오늘 몇 편을 발행할지 "색인률"이 정한다.
//
// 왜: 발행량을 늘릴수록 색인률이 떨어지는 역설(2026-07 실측: 6월 80% → 7월 22%).
// 색인 안 된 글은 검색에도 AI 답변(RAG)에도 후보로 못 들어가므로, 색인이 안 되는 상태에서
// 계속 찍어내는 건 크롤 예산만 태우고 사이트 평판을 깎는 순손실이다.
// → 색인률이 회복될 때까지 신규 발행을 줄이고/멈추고, 기존 글 보강으로 전환한다.
//
// 출력(stdout): JSON { quota, rate, mode, reason }
//   mode = publish (신규 발행) | reinforce (신규 중단, 기존 미색인 글 보강)
import fs from 'node:fs'

const WEIGHTS = 'D:\\키워드엔진\\data\\weights.json'
// 엔진은 브랜드명을 정규화해 저장한다(오센틱아트 → authenticart). 키를 틀리면 조용히 rate=null이 되어 제동이 안 걸린다.
const BRAND = 'authenticart'

// 색인률 → 오늘 발행 편수. 색인이 잘 될 때만 양을 늘린다.
const LADDER = [
  { min: 0.80, quota: 2, reason: '색인 양호 — 정상 발행' },
  { min: 0.60, quota: 1, reason: '색인 보통 — 편수 축소, 분량·고유정보 우선' },
  { min: 0.00, quota: 0, reason: '색인률 미달 — 신규 발행 중단, 기존 미색인 글 보강이 우선' },
]

let rate = null
try {
  const w = JSON.parse(fs.readFileSync(WEIGHTS, 'utf8'))
  rate = w?.brand_bias?.[BRAND]?.index_rate ?? null
} catch { /* 엔진 미측정 시 보수적으로 진행 */ }

// 아직 측정 전이면 보수적으로 1편(과거처럼 3편 찍지 않는다)
if (rate == null) {
  console.log(JSON.stringify({ quota: 1, rate: null, mode: 'publish', reason: '색인률 미측정(reinforce.js 실행 전) — 보수적으로 1편' }))
  process.exit(0)
}

const step = LADDER.find((l) => rate >= l.min)
console.log(JSON.stringify({
  quota: step.quota,
  rate,
  mode: step.quota === 0 ? 'reinforce' : 'publish',
  reason: `색인률 ${Math.round(rate * 100)}% — ${step.reason}`,
}))
