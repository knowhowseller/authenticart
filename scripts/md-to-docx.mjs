import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, AlignmentType,
  WidthType, BorderStyle, ShadingType,
  PageBreak, SectionType, Header,
  convertInchesToTwip, convertMillimetersToTwip,
  UnderlineType
} from 'docx'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const inputPath = process.argv[2]
const outputPath = process.argv[3]

const raw = readFileSync(inputPath, 'utf8')

// Strip YAML frontmatter
const content = raw.replace(/^---[\s\S]*?---\n/, '').replace(/^---\n/, '')

const BRAND_DEEP = '1A1A2E'
const BRAND_AMBER = 'D97706'
const BRAND_MIST = 'E5E7EB'
const BRAND_GREY = '6B7280'
const WHITE = 'FFFFFF'
const LIGHT_BG = 'F9F9FB'

function parseBold(text) {
  const runs = []
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true }))
    } else if (part) {
      runs.push(new TextRun({ text: part }))
    }
  }
  return runs.length ? runs : [new TextRun({ text: text })]
}

function parseInline(text) {
  // Handle bold and backtick code spans
  const runs = []
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let m
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) {
      runs.push(new TextRun({ text: text.slice(last, m.index) }))
    }
    const chunk = m[0]
    if (chunk.startsWith('**')) {
      runs.push(new TextRun({ text: chunk.slice(2, -2), bold: true }))
    } else {
      runs.push(new TextRun({ text: chunk.slice(1, -1), font: 'Courier New', size: 18 }))
    }
    last = m.index + chunk.length
  }
  if (last < text.length) {
    runs.push(new TextRun({ text: text.slice(last) }))
  }
  return runs.length ? runs : [new TextRun({ text })]
}

function tableCell(text, isHeader = false, width = null) {
  const clean = text.replace(/\*\*/g, '').trim()
  return new TableCell({
    children: [new Paragraph({
      children: parseInline(text.trim()),
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 40 },
    })],
    shading: isHeader ? { fill: BRAND_DEEP, type: ShadingType.CLEAR } : { fill: WHITE },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    ...(width ? { width: { size: width, type: WidthType.DXA } } : {}),
  })
}

function makeTable(headerRow, bodyRows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BRAND_MIST },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_MIST },
      left: { style: BorderStyle.SINGLE, size: 4, color: BRAND_MIST },
      right: { style: BorderStyle.SINGLE, size: 4, color: BRAND_MIST },
      insideH: { style: BorderStyle.SINGLE, size: 2, color: BRAND_MIST },
      insideV: { style: BorderStyle.SINGLE, size: 2, color: BRAND_MIST },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headerRow.map(h => {
          const clean = h.replace(/\*\*/g, '').trim()
          return new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: clean, bold: true, color: WHITE, size: 18 })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 60 },
            })],
            shading: { fill: BRAND_DEEP, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
          })
        }),
      }),
      ...bodyRows.map((row, i) => new TableRow({
        children: row.map(cell => {
          return new TableCell({
            children: [new Paragraph({
              children: parseInline(cell.trim()),
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 40 },
            })],
            shading: { fill: i % 2 === 0 ? WHITE : LIGHT_BG, type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
          })
        }),
      })),
    ],
  })
}

function parseTableRow(line) {
  return line.split('|').slice(1, -1).map(s => s.trim())
}

function isTableSep(line) {
  return /^\|[-|: ]+\|$/.test(line.trim())
}

const lines = content.split('\n')
const children = []
let i = 0

while (i < lines.length) {
  const line = lines[i]
  const trimmed = line.trim()

  // Skip blank
  if (!trimmed) { i++; continue }

  // Horizontal rule
  if (/^---+$/.test(trimmed)) { i++; continue }

  // Table detection
  if (trimmed.startsWith('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
    let headerRow = null
    const bodyRows = []
    while (i < lines.length && lines[i].trim().startsWith('|')) {
      if (isTableSep(lines[i])) {
        i++
        continue
      }
      const row = parseTableRow(lines[i])
      if (headerRow === null) {
        headerRow = row
      } else {
        bodyRows.push(row)
      }
      i++
    }
    if (headerRow) {
      children.push(makeTable(headerRow, bodyRows))
      children.push(new Paragraph({ text: '', spacing: { before: 80, after: 80 } }))
    }
    continue
  }

  // Code block
  if (trimmed.startsWith('```')) {
    i++ // skip opening ```
    const codeLines = []
    while (i < lines.length && !lines[i].trim().startsWith('```')) {
      codeLines.push(lines[i])
      i++
    }
    i++ // skip closing ```
    for (const cl of codeLines) {
      children.push(new Paragraph({
        children: [new TextRun({ text: cl, font: 'Courier New', size: 18, color: BRAND_DEEP })],
        spacing: { before: 0, after: 0, line: 276 },
        indent: { left: convertMillimetersToTwip(5) },
        shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
      }))
    }
    children.push(new Paragraph({ text: '', spacing: { before: 80, after: 80 } }))
    continue
  }

  // Blockquote
  if (trimmed.startsWith('>')) {
    const text = trimmed.replace(/^>\s*/, '')
    if (text) {
      children.push(new Paragraph({
        children: parseInline(text),
        indent: { left: convertMillimetersToTwip(8), right: convertMillimetersToTwip(8) },
        spacing: { before: 60, after: 60 },
        shading: { fill: 'FEF3C7', type: ShadingType.CLEAR },
        border: {
          left: { style: BorderStyle.SINGLE, size: 12, color: BRAND_AMBER },
        },
      }))
    }
    i++
    continue
  }

  // H1
  if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
    const text = trimmed.replace(/^# /, '')
    children.push(new Paragraph({
      children: [new TextRun({ text, bold: true, size: 48, color: BRAND_DEEP })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 160 },
    }))
    i++; continue
  }

  // H2
  if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
    const text = trimmed.replace(/^## /, '')
    children.push(new Paragraph({
      children: [new TextRun({ text, bold: true, size: 32, color: BRAND_DEEP })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 320, after: 120 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_AMBER },
      },
    }))
    i++; continue
  }

  // H3
  if (trimmed.startsWith('### ')) {
    const text = trimmed.replace(/^### /, '')
    children.push(new Paragraph({
      children: [new TextRun({ text, bold: true, size: 24, color: BRAND_DEEP })],
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 240, after: 80 },
    }))
    i++; continue
  }

  // Bullet list
  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
    const text = trimmed.replace(/^[-*] /, '')
    children.push(new Paragraph({
      children: parseInline(text),
      bullet: { level: 0 },
      spacing: { before: 40, after: 40 },
      indent: { left: convertMillimetersToTwip(6) },
    }))
    i++; continue
  }

  // Numbered list
  if (/^\d+\.\s/.test(trimmed)) {
    const text = trimmed.replace(/^\d+\.\s/, '')
    children.push(new Paragraph({
      children: parseInline(text),
      numbering: { reference: 'numbering', level: 0 },
      spacing: { before: 40, after: 40 },
    }))
    i++; continue
  }

  // Regular paragraph
  children.push(new Paragraph({
    children: parseInline(trimmed),
    spacing: { before: 80, after: 80 },
  }))
  i++
}

const doc = new Document({
  numbering: {
    config: [{
      reference: 'numbering',
      levels: [{
        level: 0,
        format: 'decimal',
        text: '%1.',
        alignment: AlignmentType.START,
        style: { paragraph: { indent: { left: convertMillimetersToTwip(6), hanging: convertMillimetersToTwip(4) } } },
      }],
    }],
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertMillimetersToTwip(25),
          bottom: convertMillimetersToTwip(25),
          left: convertMillimetersToTwip(25),
          right: convertMillimetersToTwip(25),
        },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'AUTHENTICART (오센틱아트)', bold: true, size: 16, color: BRAND_DEEP }),
              new TextRun({ text: '   |   공식 비즈니스 보고서   |   기밀', size: 16, color: BRAND_GREY }),
            ],
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: BRAND_MIST } },
          }),
        ],
      }),
    },
    children,
  }],
})

const buffer = await Packer.toBuffer(doc)
writeFileSync(outputPath, buffer)
console.log('✅ Done:', outputPath)
