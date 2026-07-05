#!/usr/bin/env node
// 텔레그램 알림 — 매일 발행 결과를 봇으로 보고(비전 weekly_run.js와 동일 방식).
// 토큰은 전역 봇 .env(seowoo_group)에서 읽는다(크리덴셜: 값 인용·커밋 금지).
// 사용: node scripts/tg-notify.mjs "메시지"   (또는 stdin 파이프)
import fs from 'node:fs'
import https from 'node:https'

const ENV = 'C:/Users/노하우셀러/seowoo_group/.env'
const env = {}
try {
  for (const l of fs.readFileSync(ENV, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim()
  }
} catch { /* .env 없으면 조용히 skip */ }

const token = env.TELEGRAM_BOT_TOKEN
const chats = (env.TELEGRAM_CHAT_ID || env.TELEGRAM_ALLOWED_USERS || '')
  .split(',').map(s => s.trim()).filter(Boolean)

let text = process.argv.slice(2).join(' ')
if (!text && !process.stdin.isTTY) {
  text = fs.readFileSync(0, 'utf8')
}
text = (text || '(빈 메시지)').slice(0, 4096)

if (!token || !chats.length) {
  console.error('텔레그램 토큰/chat 없음 — 알림 skip'); process.exit(0)
}

function send(chat) {
  return new Promise(resolve => {
    const body = JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true })
    const req = https.request({
      host: 'api.telegram.org', path: `/bot${token}/sendMessage`, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, r => { r.on('data', () => {}); r.on('end', resolve) })
    req.on('error', () => resolve()); req.write(body); req.end()
  })
}

for (const c of chats) await send(c)
console.error(`텔레그램 알림 전송: ${chats.length}건`)
