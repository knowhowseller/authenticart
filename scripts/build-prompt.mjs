#!/usr/bin/env node
// 원고 생성 프롬프트에 엔진 학습 다이제스트를 주입 = 자기강화 폐루프의 마지막 고리.
// learning.js digest(win/loss 실측 학습 요약)를 daily-blog-prompt.txt 뒤에 붙여 최종 프롬프트를 만든다.
// 사용: node scripts/build-prompt.mjs <YYYYMMDD>  → out/daily-prompt-final.txt
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const date = process.argv[2] || ''
let prompt = fs.readFileSync('scripts/daily-blog-prompt.txt', 'utf8').split('{{DATE}}').join(date)

let digest = ''
try {
  // execFile(args 배열) — 셸 미경유로 한글 인수 인코딩 안전
  digest = execFileSync('node', ['learning.js', 'digest', '오센틱아트'],
    { cwd: 'D:/키워드엔진', encoding: 'utf8' })
} catch (e) {
  console.error('learning digest 생성 skip:', e.message)
}

if (digest.trim()) {
  prompt += '\n\n---\n## 학습 다이제스트 (엔진 실측 성과 — 이긴 패턴은 더, 진 패턴은 회피)\n'
    + digest.trim()
    + '\n\n→ 위 승리 주제·제목구조·의도를 우선 반영하고, 실패 패턴은 피해서 작성하라.'
}

fs.mkdirSync('out', { recursive: true })
fs.writeFileSync('out/daily-prompt-final.txt', prompt)
console.error(`프롬프트 생성 (학습 다이제스트 ${digest.trim() ? '포함' : '없음'}) → out/daily-prompt-final.txt`)
