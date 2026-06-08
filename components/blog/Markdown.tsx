import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * 의존성 없는 경량 마크다운 렌더러.
 * 실제 시맨틱 HTML 요소(h2/h3/p/ul/blockquote 등)를 생성하므로
 * 검색엔진·AI 크롤러가 문서 구조를 정확히 파싱할 수 있다(AEO 최적화).
 * dangerouslySetInnerHTML을 사용하지 않아 XSS에 안전하다.
 *
 * 지원 문법: ## ### #### 제목 / - * 목록 / 1. 순서목록 / > 인용 /
 *            ![alt](url) 이미지 / --- 구분선 / **굵게** *기울임* `코드` [링크](url)
 */

// ── 인라인 파서: 굵게/기울임/코드/링크 ──
function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // 토큰 패턴을 순서대로 매칭
  const pattern =
    /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    const key = `${keyPrefix}-i${i++}`
    if (match[2] !== undefined) {
      nodes.push(<strong key={key} className="font-semibold text-brand-ink">{match[2]}</strong>)
    } else if (match[4] !== undefined) {
      nodes.push(<em key={key}>{match[4]}</em>)
    } else if (match[6] !== undefined) {
      nodes.push(
        <code key={key} className="px-1.5 py-0.5 rounded bg-brand-bg text-brand-deep text-[0.9em] font-mono">
          {match[6]}
        </code>,
      )
    } else if (match[8] !== undefined && match[9] !== undefined) {
      const href = match[9]
      const internal = href.startsWith('/')
      if (internal) {
        nodes.push(
          <Link key={key} href={href} className="text-brand-deep underline underline-offset-2 hover:text-brand-amber">
            {match[8]}
          </Link>,
        )
      } else {
        nodes.push(
          <a key={key} href={href} target="_blank" rel="noopener noreferrer"
             className="text-brand-deep underline underline-offset-2 hover:text-brand-amber">
            {match[8]}
          </a>,
        )
      }
    }
    lastIndex = pattern.lastIndex
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

export default function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // 빈 줄 스킵
    if (trimmed === '') { i++; continue }

    // 구분선
    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      blocks.push(<hr key={key++} className="my-8 border-brand-mist/40" />)
      i++; continue
    }

    // 이미지 (단독 줄)
    const img = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (img) {
      blocks.push(
        <figure key={key++} className="my-6">
          {/* 블로그 본문 외부 이미지 — next/image 도메인 화이트리스트 의존 회피를 위해 img 사용 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img[2]} alt={img[1]} loading="lazy" className="w-full rounded-2xl border border-brand-mist/20" />
          {img[1] && <figcaption className="text-center text-xs text-brand-grey mt-2">{img[1]}</figcaption>}
        </figure>,
      )
      i++; continue
    }

    // 표 (GFM): 헤더 행 다음 줄이 구분선(|---|---|)일 때
    if (
      trimmed.startsWith('|') &&
      i + 1 < lines.length &&
      /^\|?[\s:|-]+\|?$/.test(lines[i + 1].trim()) &&
      lines[i + 1].includes('-')
    ) {
      const splitRow = (l: string) => {
        let s = l.trim()
        if (s.startsWith('|')) s = s.slice(1)
        if (s.endsWith('|')) s = s.slice(0, -1)
        return s.split('|').map((c) => c.trim())
      }
      const header = splitRow(trimmed)
      i += 2 // 헤더 + 구분선 건너뜀
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i].trim()))
        i++
      }
      blocks.push(
        <div key={key++} className="my-6 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {header.map((c, idx) => (
                  <th key={idx} className="border border-brand-mist/40 bg-brand-bg px-3 py-2 text-left font-semibold text-brand-ink whitespace-nowrap">
                    {parseInline(c, `th${key}-${idx}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="even:bg-brand-bg/40">
                  {r.map((c, ci) => (
                    <td key={ci} className="border border-brand-mist/30 px-3 py-2 align-top text-brand-ink/90">
                      {parseInline(c, `td${key}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    // 제목
    const h = trimmed.match(/^(#{2,4})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      const inner = parseInline(h[2], `h${key}`)
      if (level === 2) blocks.push(<h2 key={key++} className="text-2xl font-bold text-brand-ink mt-10 mb-4 scroll-mt-20">{inner}</h2>)
      else if (level === 3) blocks.push(<h3 key={key++} className="text-xl font-bold text-brand-ink mt-8 mb-3">{inner}</h3>)
      else blocks.push(<h4 key={key++} className="text-lg font-semibold text-brand-ink mt-6 mb-2">{inner}</h4>)
      i++; continue
    }

    // 인용
    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      blocks.push(
        <blockquote key={key++} className="my-6 pl-4 border-l-4 border-brand-amber bg-brand-amber/5 py-3 pr-4 rounded-r-xl text-brand-grey italic">
          {parseInline(quoteLines.join(' '), `q${key}`)}
        </blockquote>,
      )
      continue
    }

    // 순서 없는 목록
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
        i++
      }
      blocks.push(
        <ul key={key++} className="my-4 space-y-2 list-disc pl-5 text-brand-ink/90">
          {items.map((it, idx) => <li key={idx} className="leading-relaxed">{parseInline(it, `ul${key}-${idx}`)}</li>)}
        </ul>,
      )
      continue
    }

    // 순서 있는 목록
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push(
        <ol key={key++} className="my-4 space-y-2 list-decimal pl-5 text-brand-ink/90">
          {items.map((it, idx) => <li key={idx} className="leading-relaxed">{parseInline(it, `ol${key}-${idx}`)}</li>)}
        </ol>,
      )
      continue
    }

    // 일반 문단 (연속된 비어있지 않은 줄을 하나의 문단으로)
    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{2,4})\s+/.test(lines[i].trim()) &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^>\s?/.test(lines[i].trim()) &&
      !/^---+$/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('|') &&
      !/^!\[([^\]]*)\]\(([^)]+)\)$/.test(lines[i].trim())
    ) {
      para.push(lines[i].trim())
      i++
    }
    blocks.push(
      <p key={key++} className="my-4 leading-[1.85] text-brand-ink/90">
        {parseInline(para.join(' '), `p${key}`)}
      </p>,
    )
  }

  return <div className="text-[15px] md:text-base">{blocks}</div>
}
