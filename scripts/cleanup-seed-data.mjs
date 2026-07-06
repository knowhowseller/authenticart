#!/usr/bin/env node
// 운영 DB 시드/테스트 데이터 정리 — 전부 "가역" 상태 변경만 수행(DELETE 없음).
//
// 대상 (2026-07-05 라이브 검토에서 확인된 노출 항목):
//   1. 시드 클래스 c0000000-…-0001~0004 → status 'draft' (0002_seed.sql 유래)
//   2. 시드 강사 프로필(김레진 00000000-…-0002 / 박아트 00000000-…-0003) → status 'pending'
//   3. 김유진 강사 bio 깨짐("레진아트 강사" 반복) → 정상 문구로 교체
//   4. 게시판 테스트 글 3건(2026-05-12 작성) → is_private true
//   5. 작품 '바다 레진 테이블'(로고 placeholder 이미지) → status 'hidden'
//   6. 지난 날짜인데 '모집 중'으로 남은 class_open_requests → 'cancelled'
//
// 사용: node scripts/cleanup-seed-data.mjs          (미리보기)
//       node scripts/cleanup-seed-data.mjs --apply  (실제 반영)
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const APPLY = process.argv.includes('--apply')

const env = {}
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim()
}
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('.env.local에 SUPABASE URL/SERVICE_ROLE_KEY 없음'); process.exit(1) }
const sb = createClient(url, key, { auth: { persistSession: false } })

const SEED_CLASS_IDS = [1, 2, 3, 4].map(n => `c0000000-0000-0000-0000-00000000000${n}`)
const SEED_INSTRUCTOR_IDS = ['00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003']
const CLEAN_BIO = '레진아트 전문 강사. 인천을 중심으로 클래스와 단체 출강을 진행합니다.'

async function main() {
  console.log(`모드: ${APPLY ? '⚡ 실제 반영(--apply)' : '👀 미리보기'}\n`)

  // 1. 시드 클래스
  const { data: cls } = await sb.from('classes').select('id, title, status').in('id', SEED_CLASS_IDS)
  console.log('1) 시드 클래스 → draft:')
  for (const c of cls ?? []) console.log(`   - [${c.status}] ${c.title}`)
  if (APPLY && cls?.length) {
    const { error } = await sb.from('classes').update({ status: 'draft' }).in('id', SEED_CLASS_IDS).eq('status', 'published')
    console.log(error ? `   ❌ ${error.message}` : '   ✅ draft 처리')
  }

  // 2. 시드 강사 프로필
  const { data: profs } = await sb.from('instructor_profiles')
    .select('instructor_id, status, bio, users!instructor_id(name)')
    .in('instructor_id', SEED_INSTRUCTOR_IDS)
  console.log('\n2) 시드 강사 프로필 → pending:')
  for (const p of profs ?? []) console.log(`   - [${p.status}] ${p.users?.name}`)
  if (APPLY && profs?.length) {
    const { error } = await sb.from('instructor_profiles').update({ status: 'pending' }).in('instructor_id', SEED_INSTRUCTOR_IDS)
    console.log(error ? `   ❌ ${error.message}` : '   ✅ pending 처리')
  }

  // 3. 깨진 bio (반복 텍스트) — 시드가 아닌 실제 계정이므로 bio만 교체
  const { data: broken } = await sb.from('instructor_profiles')
    .select('instructor_id, bio, users!instructor_id(name)')
    .like('bio', '%레진아트 강사 레진아트 강사%')
  console.log('\n3) 깨진 bio 교체:')
  for (const b of broken ?? []) console.log(`   - ${b.users?.name}: "${(b.bio ?? '').slice(0, 40)}…" → "${CLEAN_BIO}"`)
  if (APPLY && broken?.length) {
    for (const b of broken) {
      const { error } = await sb.from('instructor_profiles').update({ bio: CLEAN_BIO }).eq('instructor_id', b.instructor_id)
      console.log(error ? `   ❌ ${error.message}` : `   ✅ ${b.users?.name} bio 교체`)
    }
  }

  // 4. 게시판 테스트 글 → 비공개
  const { data: posts } = await sb.from('board_posts')
    .select('id, type, title, is_private, created_at')
    .lt('created_at', '2026-06-01')
    .eq('is_private', false)
  console.log('\n4) 게시판 테스트 글(6/1 이전 공개글) → is_private:')
  for (const p of posts ?? []) console.log(`   - [${p.type}] ${p.title} (${p.created_at?.slice(0, 10)})`)
  if (APPLY && posts?.length) {
    const { error } = await sb.from('board_posts').update({ is_private: true }).in('id', posts.map(p => p.id))
    console.log(error ? `   ❌ ${error.message}` : '   ✅ 비공개 처리')
  }

  // 5. placeholder 작품 → hidden
  const { data: art } = await sb.from('artworks').select('id, title, status').eq('title', '바다 레진 테이블')
  console.log('\n5) placeholder 작품 → hidden:')
  for (const a of art ?? []) console.log(`   - [${a.status}] ${a.title}`)
  if (APPLY && art?.length) {
    const { error } = await sb.from('artworks').update({ status: 'hidden' }).in('id', art.map(a => a.id))
    console.log(error ? `   ❌ ${error.message}` : '   ✅ hidden 처리')
  }

  // 6. 날짜 지난 모집 중 그룹 클래스 → cancelled (schedule_date 기준)
  const { data: reqs } = await sb.from('class_open_requests')
    .select('id, title, status, schedule_date')
    .in('status', ['open', 'accepted', 'recruiting'])
    .lt('schedule_date', new Date().toISOString())
  console.log('\n6) 기한 지난 모집 중 요청 → cancelled:')
  for (const r of reqs ?? []) console.log(`   - [${r.status}] ${r.title} (수업일 ${r.schedule_date?.slice(0, 10)})`)
  if (APPLY && reqs?.length) {
    const { error } = await sb.from('class_open_requests').update({ status: 'cancelled' }).in('id', reqs.map(r => r.id))
    console.log(error ? `   ❌ ${error.message}` : '   ✅ cancelled 처리')
  }

  // 7. 내부용 공지(홈페이지 보완사항 종합) → 비공개
  const { data: notices } = await sb.from('notices')
    .select('id, title, is_published')
    .eq('is_published', true)
    .like('title', '%홈페이지 보완사항%')
  console.log('\n7) 내부용 공지 → is_published false:')
  for (const n of notices ?? []) console.log(`   - ${n.title}`)
  if (APPLY && notices?.length) {
    const { error } = await sb.from('notices').update({ is_published: false }).in('id', notices.map(n => n.id))
    console.log(error ? `   ❌ ${error.message}` : '   ✅ 비공개 처리')
  }

  console.log(`\n완료. ${APPLY ? '' : '실제 반영은 --apply 로 실행.'}`)
}

main().catch(e => { console.error(e); process.exit(1) })
