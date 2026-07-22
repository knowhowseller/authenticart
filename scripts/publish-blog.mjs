#!/usr/bin/env node
// 블로그 자동 발행 — 대시보드 SQL 붙여넣기 없이 운영 DB에 직접 발행한다.
// service role key로 blog_posts upsert(멱등: onConflict slug) + featured 로테이션 + IndexNow 색인.
//
// 사용:
//   node scripts/publish-blog.mjs outputs/04-marketing/posts-5주차.json
//
// 입력 JSON 형식:
//   {
//     "posts": [ { slug,title,excerpt,content,category,tags:[],faq:[{q,a}],
//                  is_featured,seo_title,seo_description } , ... ],
//     "unfeature": ["직전주차-day1-slug", ...]   // featured 내릴 slug (선택)
//   }
//
// 전제: .env.local의 SUPABASE_SERVICE_ROLE_KEY가 운영(coabfjizufovypfappco)과 유효.
//   ※ 로컬 키가 만료면 Vercel 현재 값과 동기화(복사)만 하면 됨(재발급 아님).
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { embedBodyImages } from './embed-body-images.mjs'

const jsonPath = process.argv[2]
if (!jsonPath) { console.error('사용법: node scripts/publish-blog.mjs <posts.json>'); process.exit(1) }

// .env.local 로드
const env = {}
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim()
}
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('.env.local에 SUPABASE URL/SERVICE_ROLE_KEY 없음'); process.exit(1) }

const { posts = [], unfeature = [] } = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
const sb = createClient(url, key, { auth: { persistSession: false } })

async function main() {
  // 사전 연결 확인 (키 만료 조기 감지)
  const probe = await sb.from('blog_posts').select('slug', { count: 'exact', head: true })
  if (probe.error) {
    console.error('❌ DB 연결 실패(키 만료/무효 추정):', probe.error.message || '(빈 응답)')
    console.error('→ Vercel의 현재 SUPABASE_SERVICE_ROLE_KEY를 .env.local에 동기화 후 재시도.')
    process.exit(1)
  }

  // 1) featured 로테이션 — 직전 주차 내리기
  if (unfeature.length) {
    const { error } = await sb.from('blog_posts').update({ is_featured: false }).in('slug', unfeature)
    if (error) console.warn('featured 내리기 경고:', error.message)
    else console.log(`featured OFF: ${unfeature.length}건`)
  }

  // 1.5) 본문 삽화 삽입 — 초안의 [[IMG: 프롬프트 | 캡션]] 마커를 로컬 FLUX 이미지로 치환(비차단).
  //      썸네일(cover_image)은 채우지 않음 → 프론트가 글자 있는 CSS 카드로 노출(가독성).
  console.log(`본문 삽화 삽입(${posts.length}편)...`)
  for (const p of posts) {
    try {
      const r = await embedBodyImages(sb, p, { auto: false, maxImages: 2 })
      p.content = r.content
      if (r.count) console.log(`  삽화 ${r.count}장: ${p.slug}`)
    } catch (e) {
      console.warn(`  삽화 건너뜀(${p.slug}): ${e.message}`)
    }
  }

  // 2) 신규 발행 upsert (slug 충돌 시 갱신하지 않음 = 중복 발행 방지)
  const rows = posts.map(p => ({
    slug: p.slug, title: p.title, excerpt: p.excerpt, content: p.content,
    category: p.category, tags: p.tags ?? [], faq: p.faq ?? [],
    status: 'published', is_featured: !!p.is_featured,
    seo_title: p.seo_title ?? p.title, seo_description: p.seo_description ?? p.excerpt,
    published_at: new Date().toISOString(),
  }))
  const { data, error } = await sb.from('blog_posts')
    .upsert(rows, { onConflict: 'slug', ignoreDuplicates: true })
    .select('slug')
  if (error) { console.error('발행 실패:', error.message); process.exit(1) }
  console.log(`✅ 발행 upsert 완료: ${rows.length}편 요청 (신규 ${data?.length ?? 0}편)`)

  // 3) 발행 이력 기록 — 공유 키워드엔진의 measure.js/reinforce.js 성과·강화 루프 대상.
  //    (publish_log.csv에 없으면 측정·학습이 안 돎. 중복 url은 skip)
  const LOG = 'D:/키워드엔진/publish_log.csv'
  // 프로덕션 URL 강제 — .env.local이 localhost일 수 있어(개발용) 성과측정(measure.js GSC)이 못 찾는 것 방지
  let site = env.NEXT_PUBLIC_SITE_URL || ''
  if (!site || site.includes('localhost')) site = 'https://www.authenticart.co.kr'
  const today = new Date().toISOString().slice(0, 10)
  try {
    let logTxt = fs.existsSync(LOG)
      ? fs.readFileSync(LOG, 'utf8')
      : 'date,brand,channel,keyword,title,url,videoId,format,intent\n'
    if (!logTxt.endsWith('\n')) logTxt += '\n'
    let added = 0
    for (const p of posts) {
      const url = `${site}/blog/${p.slug}`
      if (logTxt.includes(url)) continue // 중복 방지
      const csv = s => String(s ?? '').replace(/[,\n]/g, ' ').trim()
      logTxt += `${today},오센틱아트,web,${csv(p.keyword)},${csv(p.title)},${url},,blog,${csv(p.intent)}\n`
      added++
    }
    fs.writeFileSync(LOG, logTxt)
    console.log(`publish_log 기록: +${added}건 (엔진 measure/reinforce 대상)`)
  } catch (e) {
    console.warn('publish_log 기록 경고(엔진 폴더 접근 실패):', e.message)
  }

  // 4) IndexNow 색인 (sitemap 일괄) — 별도 스크립트 재사용
  const idx = path.resolve('scripts/indexnow-submit-all.mjs')
  if (fs.existsSync(idx)) {
    console.log('→ IndexNow 색인은 다음으로 실행: node scripts/indexnow-submit-all.mjs')
  }
  console.log('\n발행 후 라이브 검증 권장: 신규 slug HTTP 200 + H1 + FAQ (percent-encoding).')
}

main().catch(e => { console.error('오류:', e.message); process.exit(1) })
