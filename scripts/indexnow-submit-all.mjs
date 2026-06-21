// 라이브 sitemap.xml 의 모든 URL 을 IndexNow 에 일괄 제출하는 1회성 스크립트.
// 배포 완료(키 파일 /<KEY>.txt 가 라이브) 후 실행한다.
//
//   node scripts/indexnow-submit-all.mjs
//
// 빙·네이버·Yandex·Seznam 등 IndexNow 참여 엔진에 한 번에 전파된다.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.authenticart.co.kr'
const INDEXNOW_KEY = '9d0817bd5e9a59d21ab9bfb876612795'
const ENDPOINT = 'https://api.indexnow.org/indexnow'

async function main() {
  // 1) 라이브 키 파일 검증
  const keyUrl = `${SITE_URL}/${INDEXNOW_KEY}.txt`
  const keyRes = await fetch(keyUrl)
  const keyBody = (await keyRes.text()).trim()
  if (!keyRes.ok || keyBody !== INDEXNOW_KEY) {
    console.error(`❌ 키 파일 검증 실패: ${keyUrl} (status ${keyRes.status}, body="${keyBody}")`)
    console.error('   → 배포가 완료되어 키 파일이 라이브인지 먼저 확인하세요.')
    process.exit(1)
  }
  console.log(`✅ 키 파일 확인: ${keyUrl}`)

  // 2) sitemap.xml 에서 모든 <loc> URL 추출
  const smRes = await fetch(`${SITE_URL}/sitemap.xml`)
  if (!smRes.ok) {
    console.error(`❌ sitemap.xml 조회 실패: status ${smRes.status}`)
    process.exit(1)
  }
  const xml = await smRes.text()
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].trim()).filter(Boolean)
  console.log(`📄 sitemap URL ${urls.length}건 추출`)
  if (urls.length === 0) process.exit(1)

  // 3) IndexNow 제출 (10,000건 이하면 한 번에)
  const host = new URL(SITE_URL).host
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation: keyUrl,
      urlList: urls.slice(0, 10000),
    }),
  })
  console.log(`📤 IndexNow 응답: ${res.status} ${res.statusText}`)
  if (res.ok) console.log(`✅ ${Math.min(urls.length, 10000)}건 제출 완료 (빙·네이버 등 전파)`)
  else {
    console.error('❌ 제출 실패 — 응답 본문:', await res.text())
    process.exit(1)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
