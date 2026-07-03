#!/usr/bin/env node
// 오센틱아트 키워드 정제기 — 공유 키워드엔진(D:\키워드엔진) 산출 CSV를
// 공예 도메인 온토픽으로 필터링하고, 블로그 7타겟에 자동 분류한다.
//
// 배경: 네이버 연관키워드는 광범위(오프토픽 섞임)해 기회점수 상위가 '나는솔로·레시피·
//       가볼만한곳' 같은 노이즈로 오염된다. 온토픽 앵커/오프토픽 필터로 정제한다.
//
// 사용: node scripts/keyword-refine.mjs [입력CSV...]
//       (인자 없으면 아래 DEFAULT_INPUTS 사용)
//
// 출력: outputs/04-marketing/keyword-plan-authenticart.csv  (타겟·의도·기회점수)
import fs from 'node:fs'
import path from 'node:path'

// 공유 키워드엔진 out 폴더의 모든 수집 결과(naver_*·keywords_naver_*)를 자동 통합.
// → 씨앗을 추가 수집할수록 정제 커버리지가 자동으로 넓어진다(자기강화).
const OUT_DIR = 'D:/키워드엔진/out'
const DEFAULT_INPUTS = fs.existsSync(OUT_DIR)
  ? fs.readdirSync(OUT_DIR)
      .filter(f => /^(naver_|keywords_naver_).*\.csv$/.test(f))
      .map(f => path.join(OUT_DIR, f))
  : []

// ── 공예 도메인 온토픽 앵커 (하나라도 포함되면 후보) ──
const ANCHORS = [
  '공예','클래스','원데이','체험','만들기','diy','diy','레진','캔들','플라워','플라워',
  '도자기','도예','비즈','주얼리','반지','목걸이','팔찌','귀걸이','향수','디퓨저','디퓨져',
  '마크라메','가죽','레더','캘리','그림','페인팅','드로잉','도안','몰드','키링','키홀더',
  '공방','취미','소품','자수','뜨개','니트','압화','석고','왁스','비누','향초','캔들',
  '데이트','선물','부자재','재료','클레이','미니어처','우드','목공','원데이클래스','공예체험',
  '텀블러','컵','트레이','코스터','오브제','무드등','석고방향제','스노우볼','키트','만들기클래스',
]

// ── 강한 오프토픽 (포함되면 제외) ──
const OFFTOPIC = [
  '레시피','볶음','찌개','국수','갈비','샌드위치','비빔','제육','닭볶음','김치','소갈비',
  '나는솔로','가볼만한곳','놀거리','전시회','박람회','킨텍스','코엑스','관광','여행','맛집',
  '자기계발','패키지','축제','지비츠','슬라임','역','상가','뷔페','호텔','펜션','캠핑',
  '주식','부동산','대출','보험','다이어트','운동','헬스','영어','토익','자격증시험',
]

// ── 7타겟 분류 (첫 매칭 우선, 없으면 '입문') ──
const TARGETS = [
  { key: '커플', kw: ['데이트','커플','연인','기념일','100일','프로포즈'] },
  { key: '선물', kw: ['선물','기프트','답례','생일선물','집들이','승진'] },
  { key: '학부모', kw: ['아이','키즈','어린이','초등','유아','방학','체험학습','아동'] },
  { key: 'B2B', kw: ['단체','기업','워크숍','워크샵','회식','팀빌딩','사내','행사','원데이단체'] },
  { key: '강사', kw: ['강사','부업','창업','공방창업','자격','부수입','투잡'] },
  { key: '작품', kw: ['작품','구매','판매','인테리어','오브제','소품샵'] },
  // 나머지 → '입문'
]

function classifyTarget(kw) {
  const s = kw.toLowerCase()
  for (const t of TARGETS) if (t.kw.some(k => s.includes(k.toLowerCase()))) return t.key
  return '입문'
}

// 검색의도 추정(간이): 만들기/체험/클래스 = 상업(전환 유망), 그 외 정보
function intent(kw) {
  const s = kw.toLowerCase()
  if (/(클래스|원데이|체험|공방|수업|배우기|예약)/.test(s)) return '거래'   // 클래스 예약 직결
  if (/(만들기|diy|재료|키트|몰드|도안|부자재)/.test(s)) return '상업'       // 만들기 의향
  return '정보'
}

function parseCsv(p) {
  if (!fs.existsSync(p)) { console.warn(`(건너뜀) 없음: ${p}`); return [] }
  const txt = fs.readFileSync(p, 'utf8').replace(/^﻿/, '')
  const rows = []
  for (const line of txt.split(/\r?\n/).slice(1)) {
    if (!line.trim()) continue
    // "키워드",pc,mob,total,"경쟁",score
    const m = line.match(/^"(.*?)",(\d+),(\d+),(\d+),"([^"]*)",(\d+)/)
    if (!m) continue
    rows.push({ keyword: m[1], pc: +m[2], mob: +m[3], total: +m[4], comp: m[5], score: +m[6] })
  }
  return rows
}

const inputs = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_INPUTS
const all = inputs.flatMap(parseCsv)

// dedup(키워드 최고 score 유지)
const byKw = new Map()
for (const r of all) {
  const cur = byKw.get(r.keyword)
  if (!cur || r.score > cur.score) byKw.set(r.keyword, r)
}

const MIN_VOL = 100
const refined = [...byKw.values()]
  .filter(r => r.total >= MIN_VOL)
  .filter(r => {
    const s = r.keyword.toLowerCase()
    if (OFFTOPIC.some(o => s.includes(o.toLowerCase()))) return false
    return ANCHORS.some(a => s.includes(a.toLowerCase()))
  })
  .map(r => ({ ...r, target: classifyTarget(r.keyword), intent: intent(r.keyword) }))
  .sort((a, b) => b.score - a.score)

// 출력 CSV
const outDir = path.resolve('outputs/04-marketing')
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, 'keyword-plan-authenticart.csv')
const header = 'keyword,target,intent,totalVol,comp,score'
const body = refined.map(r =>
  `"${r.keyword}",${r.target},${r.intent},${r.total},"${r.comp}",${r.score}`).join('\n')
fs.writeFileSync(outPath, '﻿' + header + '\n' + body, 'utf8')

// 콘솔 요약
console.log(`입력 ${all.length}행 → 정제 ${refined.length}개 (온토픽·검색량≥${MIN_VOL})`)
console.log(`저장: ${outPath}\n`)
const groups = {}
for (const r of refined) (groups[r.target] ??= []).push(r)
for (const [t, list] of Object.entries(groups)) {
  console.log(`\n■ ${t} (${list.length}개) — 상위 8`)
  for (const r of list.slice(0, 8)) {
    console.log(`  ${String(r.score).padStart(6)}  ${r.total.toString().padStart(6)}vol ${r.comp}  ${r.intent}  ${r.keyword}`)
  }
}
