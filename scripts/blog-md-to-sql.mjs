// 블로그 원고(.md, YAML 프런트매터 + 본문) → Supabase 발행용 SQL(INSERT ... ON CONFLICT) 생성기.
// 사용: node scripts/blog-md-to-sql.mjs <input.md> <output.sql> [--featured] [--draft]
import fs from 'node:fs'

const [, , input, output, ...flags] = process.argv
if (!input || !output) {
  console.error('사용법: node scripts/blog-md-to-sql.mjs <input.md> <output.sql> [--featured] [--draft]')
  process.exit(1)
}
const isFeatured = flags.includes('--featured')
const status = flags.includes('--draft') ? 'draft' : 'published'

const raw = fs.readFileSync(input, 'utf8').replace(/\r\n/g, '\n')
const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
if (!m) { console.error('프런트매터(--- ... ---)를 찾지 못했습니다'); process.exit(1) }
const [, fm, body] = m

// ── 프런트매터 파싱 (이 프로젝트 고정 포맷 전용) ──
function scalar(key) {
  const r = new RegExp(`^${key}:\\s*(.*)$`, 'm').exec(fm)
  if (!r) return null
  let v = r[1].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  return v
}
function tagsArr() {
  const r = /^tags:\s*\[(.*)\]\s*$/m.exec(fm)
  if (!r) return []
  return r[1].split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
}
function faqArr() {
  // faq 블록은 프런트매터 마지막 키. faq: 이후 끝까지(또는 다음 최상위 키 전까지) 캡처.
  const start = /^faq:\s*$/m.exec(fm)
  if (!start) return []
  const after = fm.slice(start.index + start[0].length)
  // 다음 최상위 키(들여쓰기 없는 key:) 만나면 중단
  const stop = after.search(/\n(?=\S+:)/)
  const block = { 1: stop === -1 ? after : after.slice(0, stop) }
  const lines = block[1].split('\n')
  const items = []
  let cur = null
  for (const line of lines) {
    const q = line.match(/^\s*-\s*q:\s*(.*)$/)
    const a = line.match(/^\s*a:\s*(.*)$/)
    if (q) { if (cur) items.push(cur); cur = { q: unq(q[1]), a: '' } }
    else if (a && cur) { cur.a = unq(a[1]) }
  }
  if (cur) items.push(cur)
  return items
}
function unq(s) { s = s.trim(); return (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")) ? s.slice(1, -1) : s }

const post = {
  slug: scalar('slug'),
  title: scalar('title'),
  category: scalar('category') || 'guide',
  excerpt: scalar('excerpt') || '',
  author_name: scalar('author_name') || '오센틱아트',
  seo_title: scalar('seo_title') || '',
  seo_description: scalar('seo_description') || '',
  tags: tagsArr(),
  faq: faqArr(),
  content: body.trim(),
}

// ── SQL 안전 출력 헬퍼 ──
const dollar = (s, tag) => `$${tag}$${s}$${tag}$`           // 달러 인용(이스케이프 불필요)
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`     // 일반 문자열 리터럴
const pgArray = (arr) => `ARRAY[${arr.map(lit).join(', ')}]::text[]`
const faqJson = JSON.stringify(post.faq)

const sql = `-- 오센틱아트 블로그 발행 SQL (자동 생성: ${input})
-- Supabase SQL 에디터에 붙여넣고 Run 하면 발행됩니다. 재실행 시 같은 slug는 갱신(upsert).
INSERT INTO public.blog_posts
  (slug, title, excerpt, content, category, tags, faq, author_name, status, is_featured, seo_title, seo_description, published_at)
VALUES (
  ${lit(post.slug)},
  ${lit(post.title)},
  ${lit(post.excerpt)},
  ${dollar(post.content, 'content')},
  ${lit(post.category)},
  ${pgArray(post.tags)},
  ${dollar(faqJson, 'faq')}::jsonb,
  ${lit(post.author_name)},
  '${status}',
  ${isFeatured ? 'true' : 'false'},
  ${lit(post.seo_title)},
  ${lit(post.seo_description)},
  ${status === 'published' ? 'now()' : 'NULL'}
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  faq = EXCLUDED.faq,
  author_name = EXCLUDED.author_name,
  status = EXCLUDED.status,
  is_featured = EXCLUDED.is_featured,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  published_at = COALESCE(public.blog_posts.published_at, EXCLUDED.published_at),
  updated_at = now();
`

fs.writeFileSync(output, sql, 'utf8')
console.log(`✅ SQL 생성: ${output}`)
console.log(`   slug=${post.slug} | tags=${post.tags.length} | faq=${post.faq.length} | status=${status} | featured=${isFeatured}`)
