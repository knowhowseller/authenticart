// IndexNow — 콘텐츠 변경 시 빙·네이버·Yandex·Seznam 등 참여 검색엔진에 즉시 색인 요청.
// 한 엔드포인트에만 보내면 참여 엔진끼리 URL을 공유한다. (https://www.indexnow.org)
//
// 키 검증: 아래 INDEXNOW_KEY 와 동일한 내용을 가진 파일이
//   https://www.authenticart.co.kr/<KEY>.txt  로 공개되어 있어야 한다.
//   → public/9d0817bd5e9a59d21ab9bfb876612795.txt
//   ★ 키를 바꾸면 public 의 키 파일명·내용도 함께 바꿔야 한다.

export const INDEXNOW_KEY = '9d0817bd5e9a59d21ab9bfb876612795'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.authenticart.co.kr'
const ENDPOINT = 'https://api.indexnow.org/indexnow'

/**
 * IndexNow 에 URL 목록을 제출한다. (최대 10,000건/요청)
 * fire-and-forget — 실패해도 예외를 던지지 않으므로 호출부의 본 작업(발행 등)을 막지 않는다.
 * @returns 성공 여부 (true=2xx 응답)
 */
export async function submitToIndexNow(urls: string | string[]): Promise<boolean> {
  const list = (Array.isArray(urls) ? urls : [urls])
    .map(u => (u.startsWith('http') ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`))
    .filter(Boolean)
    .slice(0, 10000)

  if (list.length === 0) return false

  const host = new URL(SITE_URL).host

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: list,
      }),
    })
    // 200 OK / 202 Accepted = 정상 접수
    if (!res.ok) {
      console.warn(`[indexnow] 제출 실패 ${res.status} ${res.statusText} (${list.length}건)`)
      return false
    }
    return true
  } catch (e) {
    console.warn('[indexnow] 제출 예외:', e instanceof Error ? e.message : e)
    return false
  }
}

/** 블로그 글 slug 로 표준 URL 을 만들어 IndexNow 에 제출한다. */
export async function submitBlogPost(slug: string): Promise<boolean> {
  if (!slug) return false
  return submitToIndexNow(`${SITE_URL}/blog/${encodeURIComponent(slug)}`)
}
