// 블로그 본문 삽화 삽입 — 로컬 FLUX 생성 이미지를 content 마크다운에 `![캡션](url)`로 넣는다.
// 렌더러(components/blog/Markdown.tsx)가 이를 <figure>+한글 <figcaption>으로 렌더 → 텍스트 가독성 보완.
//
// 두 모드:
//  - 마커 모드(신규 발행): 초안이 본문에 넣은 `[[IMG: 영어프롬프트 | 한글캡션]]`을 실제 이미지로 치환
//  - 자동 모드(기존글 백필): H2 뒤에 1~2장 자동 삽입, 캡션=해당 H2 제목(한글)
import { generateBodyImage, imageKey } from './gen-cover.mjs'

const BUCKET = 'blog-covers' // 블로그 이미지 공용 버킷(커버 폐기 후 삽화용으로 재사용)

// 카테고리별 자동 삽화 장면(영어). 백필용 — 글자 없는 공예 씬(캡션이 맥락 제공).
const SCENE_VARIANTS = {
  guide: [
    'a bright craft workshop table with resin art tools, molds, pigments and dried flowers neatly arranged, top-down',
    'close-up of hands carefully working on a handmade craft piece at a warm studio table',
  ],
  story: [
    'two people enjoying a cozy handmade craft one-day class together at a warm wooden studio table',
    'a couple smiling while holding their finished handmade craft pieces in a bright studio',
  ],
  trend: [
    'a beautifully arranged handmade resin keepsake gift with dried flowers and soft gift wrapping',
    'elegant handmade craft objects styled on a minimal interior shelf with natural light',
  ],
  instructor: [
    'an artisan teaching a small resin craft class in a bright airy studio, focused hands',
    'a craft instructor arranging materials and finished samples on a studio table',
  ],
  review: [
    'elegant finished handmade resin artworks displayed on a minimal wooden shelf',
    'a close-up detail of a beautiful finished handmade craft piece',
  ],
  news: [
    'a modern craft studio scene with handmade resin pieces and natural materials',
    'a styled flat-lay of handmade craft objects and tools on a clean surface',
  ],
}
// 공예 종류 감지(slug/제목 키워드) → 종류별 구체 장면. 백필 관련성↑.
const CRAFT_SCENES = [
  { kw: ['bead', '비즈', '목걸이', 'necklace', '팔찌', 'bracelet', '참-'], scenes: [
    'colorful glass beads and handmade beaded jewelry being made on a bright craft table, top-down',
    'close-up of hands stringing beads into a handmade bracelet at a studio table'] },
  { kw: ['candle', 'soy', '캔들', '향초', '소이'], scenes: [
    'soy candle making with wax, wicks and fragrance oils on a warm studio table',
    'a finished handmade soy candle glowing softly next to dried flowers'] },
  { kw: ['resin', '레진', '코스터', 'coaster', '오브제'], scenes: [
    'a teal resin coaster with dried flowers set inside, curing on a bright studio table with molds and pigments',
    'close-up of hands pouring clear resin into a round mold with flower petals'] },
  { kw: ['pottery', 'ceramic', '도자기', '물레', '핸드빌딩'], scenes: [
    'a pottery wheel with wet clay and finished ceramic bowls in a bright ceramics studio',
    'close-up of hands shaping clay into a bowl on a pottery wheel'] },
  { kw: ['ring', '반지', '은반지', '커플링', 'jewelry', '금속'], scenes: [
    'silver ring making tools and a handmade metal ring on a jeweler\'s workbench',
    'close-up of hands polishing a handmade silver ring'] },
  { kw: ['diffuser', '디퓨저', '향'], scenes: [
    'reed diffuser bottles with fragrance oils and rattan reeds on a minimal table',
    'a handmade reed diffuser next to dried flowers in soft light'] },
  { kw: ['calligraphy', '캘리'], scenes: [
    'calligraphy brushes, ink and elegant lettering practice on paper at a warm desk',
    'close-up of a hand writing calligraphy with a brush pen'] },
  { kw: ['flower', '플라워', '꽃', '플로리스트'], scenes: [
    'a fresh flower arrangement in progress with floral materials on a bright studio table',
    'close-up of hands arranging fresh flowers into a bouquet'] },
  { kw: ['leather', '가죽'], scenes: [
    'leather crafting tools, thread and a handmade leather item on a workbench',
    'close-up of hands stitching a handmade leather piece'] },
  { kw: ['무드등', '조명', 'lamp', 'light'], scenes: [
    'a handmade mood lamp glowing softly on a table in a cozy dim room',
    'a warm handmade resin light object casting soft glow'] },
  { kw: ['도자', '컵', 'mug', 'cup'], scenes: [
    'handmade ceramic mugs and cups on a wooden shelf in a pottery studio',
    'close-up of a freshly glazed handmade ceramic cup'] },
]
function detectScenes(slug = '', title = '') {
  const hay = `${slug} ${title}`.toLowerCase()
  for (const c of CRAFT_SCENES) if (c.kw.some(k => hay.includes(k.toLowerCase()))) return c.scenes
  return null
}

async function genUpload(sb, slug, category, prompt, idx) {
  const buf = await generateBodyImage({ prompt, category })
  const key = imageKey(slug, idx)
  const up = await sb.storage.from(BUCKET).upload(key, buf, { contentType: 'image/png', upsert: true })
  if (up.error) throw new Error(up.error.message)
  return sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl
}

/**
 * post.content에 본문 삽화를 삽입한 새 content를 반환.
 * @returns {Promise<{content:string, count:number, skipped?:boolean}>}
 */
export async function embedBodyImages(sb, post, { auto = false, maxImages = 2, force = false } = {}) {
  let content = post.content || ''
  const { slug, category = 'guide', title = '' } = post

  // ── 마커 모드(신규) ──
  if (!auto) {
    const re = /^[ \t]*\[\[IMG:\s*([^|\]]+?)\s*(?:\|\s*([^\]]*?))?\s*\]\][ \t]*$/gm
    const markers = [...content.matchAll(re)]
    if (!markers.length) return { content, count: 0 }
    let count = 0
    for (const m of markers) {
      if (count >= maxImages) { content = content.replace(m[0], ''); continue }
      const url = await genUpload(sb, slug, category, m[1].trim(), count + 1)
      content = content.replace(m[0], `![${(m[2] || '').trim()}](${url})`)
      count++
    }
    return { content, count }
  }

  // ── 자동 모드(기존글 백필) ──
  if (content.includes(`/${BUCKET}/`)) {
    if (!force) return { content, count: 0, skipped: true } // 이미 삽화 있음 → 멱등 스킵
    // force: 기존 생성 삽화 줄 제거 후 재삽입
    content = content.replace(new RegExp(`^!\\[[^\\]]*\\]\\([^)]*/${BUCKET}/[^)]*\\)\\s*$`, 'gm'), '')
      .replace(/\n{3,}/g, '\n\n')
  }
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const h2s = []
  // H2~H4 소제목 뒤에 삽입(일부 글은 #### 사용)
  lines.forEach((l, idx) => { if (/^#{2,4}\s+\S/.test(l.trim())) h2s.push(idx) })
  if (!h2s.length) return { content, count: 0 }

  const n = h2s.length >= 4 ? Math.min(2, maxImages) : 1
  const targets = [{ lineIndex: h2s[0], sceneIdx: 0 }]
  if (n >= 2) targets.push({ lineIndex: h2s[Math.floor(h2s.length / 2)], sceneIdx: 1 })

  const scenes = detectScenes(slug, title) || SCENE_VARIANTS[category] || SCENE_VARIANTS.guide

  const inserts = []
  let count = 0
  for (const t of targets) {
    const caption = lines[t.lineIndex].replace(/^#{2,4}\s+/, '').replace(/^\d+\.\s*/, '').trim()
    const url = await genUpload(sb, slug, category, scenes[t.sceneIdx % scenes.length], count + 1)
    inserts.push({ lineIndex: t.lineIndex, md: `\n![${caption}](${url})\n` })
    count++
  }
  // 아래에서 위로 삽입(인덱스 보존), 각 H2 라인 바로 뒤
  inserts.sort((a, b) => b.lineIndex - a.lineIndex)
  for (const ins of inserts) lines.splice(ins.lineIndex + 1, 0, ins.md)

  return { content: lines.join('\n'), count }
}
