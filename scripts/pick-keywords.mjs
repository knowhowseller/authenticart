#!/usr/bin/env node
// 오늘 발행할 키워드 N건 선정 — 키워드엔진 정제 결과에서 데이터로 고른다.
//  · 입력: outputs/04-marketing/keyword-plan-authenticart.csv (keyword,target,intent,totalVol,comp,score)
//  · 제외: D:\키워드엔진\publish_log.csv 의 오센틱아트 발행 키워드(중복 발행 방지)
//  · 규칙: 타겟 다양성(라운드로빈) + 타겟 내 score 상위
//  · 출력: JSON 배열 [{keyword,target,intent,vol,score}] → stdout (또는 --out 파일)
import fs from 'node:fs'
import path from 'node:path'

const N = Number(process.argv[2] || 3)
const outArg = process.argv.indexOf('--out')
const PLAN = 'outputs/04-marketing/keyword-plan-authenticart.csv'
const LOG = 'D:/키워드엔진/publish_log.csv'

function parsePlan(p) {
  const rows = []
  const txt = fs.readFileSync(p, 'utf8').replace(/^﻿/, '')
  for (const line of txt.split(/\r?\n/).slice(1)) {
    if (!line.trim()) continue
    // "keyword",target,intent,vol,"comp",score
    const m = line.match(/^"(.*?)",([^,]*),([^,]*),(\d+),"([^"]*)",(\d+)/)
    if (!m) continue
    rows.push({ keyword: m[1], target: m[2], intent: m[3], vol: +m[4], comp: m[5], score: +m[6] })
  }
  return rows
}

// 이미 발행한 오센틱 키워드
const published = new Set()
if (fs.existsSync(LOG)) {
  for (const l of fs.readFileSync(LOG, 'utf8').split(/\r?\n/)) {
    const c = l.split(',')
    if (c[1] === '오센틱아트' && c[3]) published.add(c[3].trim())
  }
}

const cand = parsePlan(PLAN)
  .filter(r => !published.has(r.keyword))
  .sort((a, b) => b.score - a.score)

// 타겟별 버킷 → 라운드로빈으로 다양성 확보
const buckets = {}
for (const r of cand) (buckets[r.target] ??= []).push(r)
const order = Object.keys(buckets).sort((a, b) => (buckets[b][0]?.score || 0) - (buckets[a][0]?.score || 0))
const picked = []
let i = 0
while (picked.length < N && order.some(t => buckets[t].length)) {
  const t = order[i % order.length]; i++
  if (buckets[t].length) picked.push(buckets[t].shift())
}

const result = picked.map(r => ({ keyword: r.keyword, target: r.target, intent: r.intent, vol: r.vol, score: r.score }))
const json = JSON.stringify(result, null, 2)
if (outArg > -1 && process.argv[outArg + 1]) {
  const op = process.argv[outArg + 1]
  fs.mkdirSync(path.dirname(op), { recursive: true })
  fs.writeFileSync(op, json)
  console.error(`선정 ${result.length}건 → ${op}`)
} else {
  console.log(json)
}
