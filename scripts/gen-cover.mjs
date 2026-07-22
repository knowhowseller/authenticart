#!/usr/bin/env node
// 블로그 커버(썸네일) 생성 모듈 — 로컬 ComfyUI + FLUX.1 dev.
// 텍스트 없는 브랜드 톤 16:9 이미지를 생성해 PNG Buffer로 반환한다(발행/백필에서 Storage 업로드).
//
// 모듈 사용:  import { generateCoverPng } from './gen-cover.mjs'
//             const buf = await generateCoverPng({ title, category, imagePrompt })
// CLI 테스트: node scripts/gen-cover.mjs "제목" guide "a cozy resin craft table" --out cover.png
//
// 환경변수(선택): COMFYUI_URL(기본 127.0.0.1:8188), COMFYUI_HOME(자동기동용 포터블 경로)
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

/**
 * Storage 객체 키(파일명)를 ASCII-안전하게 만든다.
 * Supabase Storage는 키에 한글 등 비ASCII를 거부("Invalid key")하므로,
 * 영문 slug는 그대로, 한글 등 포함 slug는 slug 해시로 대체(결정적 → 재실행 시 동일 객체 덮어씀).
 */
export function coverKey(slug) {
  if (/^[A-Za-z0-9._-]+$/.test(slug)) return `${slug}.png`
  const h = crypto.createHash('sha1').update(slug).digest('hex').slice(0, 16)
  return `k-${h}.png`
}

/** 본문 삽화용 키: slug 기반 ASCII-안전 + 인덱스(-b1,-b2). */
export function imageKey(slug, idx = 1) {
  const base = /^[A-Za-z0-9._-]+$/.test(slug)
    ? slug
    : `k-${crypto.createHash('sha1').update(slug).digest('hex').slice(0, 16)}`
  return `${base}-b${idx}.png`
}

const SERVER = process.env.COMFYUI_URL || '127.0.0.1:8188'
const HOME = process.env.COMFYUI_HOME || 'D:\\ComfyUI_windows_portable'
const CKPT = process.env.COMFYUI_FLUX_CKPT || 'flux1-dev-fp8.safetensors'

// 브랜드 톤(딥틸·앰버, 수공예 레진/공예). 텍스트 없는 편집형 사진.
const STYLE = 'handcrafted resin art and craft studio aesthetic, deep teal and warm amber accents, soft natural studio lighting, elegant, minimal, editorial product photography, high detail, no text, no words, no letters, no watermark, no logo'
const NEG = 'text, letters, words, typography, watermark, logo, signature, low quality, blurry, distorted, deformed, ugly, oversaturated, cluttered'

// 카테고리별 폴백 씬(글에 image_prompt가 없을 때)
const CATEGORY_SCENE = {
  guide: 'a bright beginner-friendly craft workshop table with resin art tools, molds, dried flowers and pigments neatly arranged',
  story: 'two people enjoying a cozy handmade craft one-day class together at a warm wooden studio table',
  trend: 'a beautifully arranged handmade resin keepsake gift with dried flowers, soft gift wrapping nearby',
  instructor: 'an artisan teaching a resin craft class in a bright airy studio, focused hands shaping a piece',
  review: 'elegant finished handmade resin artworks displayed on a minimal wooden shelf',
  news: 'a modern craft studio scene with handmade resin pieces and natural materials',
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function alive() {
  try {
    const r = await fetch(`http://${SERVER}/system_stats`, { signal: AbortSignal.timeout(3000) })
    return r.ok
  } catch { return false }
}

async function ensureRunning() {
  if (await alive()) return true
  const py = path.join(HOME, 'python_embeded', 'python.exe')
  const main = path.join(HOME, 'ComfyUI', 'main.py')
  if (!fs.existsSync(py)) return false
  const child = spawn(py, ['-s', main, '--windows-standalone-build', '--port', String(SERVER.split(':')[1] || 8188)],
    { cwd: HOME, detached: true, stdio: 'ignore', windowsHide: true })
  child.unref()
  for (let i = 0; i < 120; i++) { if (await alive()) return true; await sleep(1000) }
  return false
}

export function buildCoverPrompt({ title = '', category = 'guide', imagePrompt = '' } = {}) {
  const scene = (imagePrompt && imagePrompt.trim())
    || CATEGORY_SCENE[category] || CATEGORY_SCENE.guide
  return `${scene}, ${STYLE}`
}

/** 완성된 프롬프트 텍스트로 이미지 1장 생성 → PNG Buffer. 실패 시 throw. */
// 코디네이터 공존 게이트: 다른 무거운 작업(로컬 AI 자원 코디네이터 CLI·영상·학습 등)이 자원을 점유 중이면 대기.
// 블로그 배치는 모델을 재사용하므로 /free 는 호출하지 않는다(모델 스래싱 방지). 자원 위급(임계 이하)일 때만 대기.
async function coordGate({ vram = 2500, ram = 4000, poll = 12, timeoutMin = 30 } = {}) {
  const os = await import('node:os')
  const { execSync } = await import('node:child_process')
  const freeVram = () => { try { return parseInt(execSync('nvidia-smi --query-gpu=memory.free --format=csv,noheader,nounits', { timeout: 8000 }).toString().trim().split('\n')[0], 10) } catch { return -1 } }
  const t0 = Date.now()
  while (true) {
    const r = Math.round(os.freemem() / 1048576), v = freeVram()
    if (r >= ram && (v < 0 || v >= vram)) return
    if (Date.now() - t0 > timeoutMin * 60000) return
    console.error(`[gate] 자원 위급(RAM ${r}MB, VRAM ${v}MB) — ${poll}s 대기…`)
    await new Promise((res) => setTimeout(res, poll * 1000))
  }
}

async function runGraph(promptText, { width = 1024, height = 1024, seed = 0 } = {}) {
  if (!(await ensureRunning())) throw new Error('ComfyUI 서버 기동 실패')
  if (!seed || seed <= 0) seed = Date.now() % 2_000_000_000
  await coordGate()

  const graph = {
    '1': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    '2': { class_type: 'CLIPTextEncode', inputs: { text: promptText, clip: ['1', 1] } },
    '3': { class_type: 'CLIPTextEncode', inputs: { text: NEG, clip: ['1', 1] } },
    '4': { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
    '5': { class_type: 'KSampler', inputs: { seed, steps: 20, cfg: 1.0, sampler_name: 'euler',
           scheduler: 'normal', denoise: 1.0, model: ['1', 0], positive: ['2', 0], negative: ['3', 0], latent_image: ['4', 0] } },
    '6': { class_type: 'VAEDecode', inputs: { samples: ['5', 0], vae: ['1', 2] } },
    '7': { class_type: 'SaveImage', inputs: { filename_prefix: 'blogcover', images: ['6', 0] } },
  }

  const sub = await fetch(`http://${SERVER}/prompt`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: graph }),
  })
  if (!sub.ok) throw new Error(`제출 실패: ${(await sub.text()).slice(0, 300)}`)
  const { prompt_id } = await sub.json()

  for (let i = 0; i < 300; i++) {
    await sleep(2000)
    const h = await (await fetch(`http://${SERVER}/history/${prompt_id}`)).json()
    const rec = h[prompt_id]
    if (!rec) continue
    const img = rec.outputs?.['7']?.images?.[0]
    if (img) {
      const qs = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' })
      const bytes = await (await fetch(`http://${SERVER}/view?${qs}`)).arrayBuffer()
      return Buffer.from(bytes)
    }
    if (rec.status?.status_str === 'error') throw new Error(`실행 실패: ${JSON.stringify(rec.status).slice(0, 300)}`)
  }
  throw new Error('생성 시간 초과')
}

/** (구) 커버 PNG. 현재는 미사용이지만 호환 위해 유지. 16:9. */
export async function generateCoverPng({ title, category = 'guide', imagePrompt = '', width = 1280, height = 720, seed = 0 } = {}) {
  return runGraph(buildCoverPrompt({ title, category, imagePrompt }), { width, height, seed })
}

/** 본문 삽화 PNG Buffer. 영어 장면 프롬프트 + 브랜드 스타일. 기본 3:2. */
export async function generateBodyImage({ prompt = '', category = 'guide', width = 1216, height = 832, seed = 0 } = {}) {
  const scene = (prompt && prompt.trim()) || CATEGORY_SCENE[category] || CATEGORY_SCENE.guide
  return runGraph(`${scene}, ${STYLE}`, { width, height, seed })
}

// ── CLI ──
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isMain) {
  const a = process.argv.slice(2)
  const outIdx = a.indexOf('--out')
  const out = outIdx >= 0 ? a[outIdx + 1] : `cover-${Date.now()}.png`
  const pos = a.filter((x, i) => !x.startsWith('--') && i !== outIdx + 1)
  const [title, category = 'guide', imagePrompt = ''] = pos
  if (!title) { console.error('사용법: node scripts/gen-cover.mjs "제목" [category] ["image prompt"] [--out cover.png]'); process.exit(1) }
  generateCoverPng({ title, category, imagePrompt })
    .then((buf) => { fs.writeFileSync(out, buf); console.log(path.resolve(out), `(${Math.round(buf.length / 1024)} KB)`) })
    .catch((e) => { console.error('ERROR:', e.message); process.exit(1) })
}
