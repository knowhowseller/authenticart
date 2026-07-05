#!/usr/bin/env node
// 매일 발행 결과를 텔레그램으로 요약 보고 (한글 메시지는 여기서 구성 → PowerShell 인코딩 회피).
// 사용: node scripts/notify-daily.mjs <YYYYMMDD> <ok|fail>
import fs from 'node:fs'
import https from 'node:https'

const date = process.argv[2] || ''
const status = process.argv[3] || 'ok'
const SITE = 'https://www.authenticart.co.kr'

let text
if (status === 'ok') {
  const p = `outputs/04-marketing/posts-auto-${date}.json`
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'))
    const lines = j.posts.map(x => `• ${x.title}\n  ${SITE}/blog/${x.slug}`).join('\n')
    text = `✅ [오센틱아트] 매일 블로그 발행 완료 (${date}) — ${j.posts.length}편\n${lines}`
  } catch {
    text = `⚠️ [오센틱아트] ${date} 발행 요약 실패: posts 파일을 읽지 못함`
  }
} else {
  text = `❌ [오센틱아트] 매일 블로그 발행 실패 (${date})\n로그: outputs/04-marketing/_daily_blog_${date}.log`
}

// 전역 봇 .env(seowoo_group) 토큰
const ENV = 'C:/Users/노하우셀러/seowoo_group/.env'
const env = {}
try { for (const l of fs.readFileSync(ENV, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim() } } catch {}
const token = env.TELEGRAM_BOT_TOKEN
const chats = (env.TELEGRAM_CHAT_ID || env.TELEGRAM_ALLOWED_USERS || '').split(',').map(s => s.trim()).filter(Boolean)
if (!token || !chats.length) { console.error('텔레그램 토큰/chat 없음'); process.exit(0) }

const send = chat => new Promise(res => {
  const body = JSON.stringify({ chat_id: chat, text: text.slice(0, 4096), disable_web_page_preview: true })
  const req = https.request({ host: 'api.telegram.org', path: `/bot${token}/sendMessage`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
    r => { r.on('data', () => {}); r.on('end', res) })
  req.on('error', () => res()); req.write(body); req.end()
})
for (const c of chats) await send(c)
console.error(`매일 알림 전송: ${chats.length}건`)
