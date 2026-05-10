const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, convertInchesToTwip,
  TableLayoutType, Header, Footer, PageNumber,
  NumberingLevel, NumberFormat
} = require('docx');
const fs = require('fs');

const md = fs.readFileSync(
  'C:\\Users\\노하우셀러\\aiagent\\context\\sessions\\20260504-new aiagent\\final-report.md',
  'utf8'
);

// Brand colors (서우)
const NAVY    = '144e8c';
const BLUE    = '439AE3';
const TEAL    = '005c70';
const GOLD    = 'f7931e';
const DARK    = '353535';
const LIGHT   = 'C9E4FA';
const WHITE   = 'FFFFFF';
const RED_HEX = 'C0392B';
const YELLOW  = 'F39C12';
const GREEN_H = '27AE60';

// ── helpers ────────────────────────────────────────────────────────────────

function boldRuns(text, base = {}) {
  // split on **...** and make bold
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((p, i) =>
    new TextRun({ text: p, bold: i % 2 === 1, ...base })
  );
}

function inlineRuns(text, base = {}) {
  // handle **bold**, *italic*, `code`
  const segments = [];
  const re = /\*\*(.*?)\*\*|\*(.*?)\*|`([^`]+)`/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index), bold: false, italics: false });
    if (m[1] !== undefined) segments.push({ text: m[1], bold: true, italics: false });
    else if (m[2] !== undefined) segments.push({ text: m[2], bold: false, italics: true });
    else if (m[3] !== undefined) segments.push({ text: m[3], bold: false, italics: false, font: 'Courier New', size: 18 });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), bold: false, italics: false });
  return segments.map(s => new TextRun({ ...base, ...s }));
}

function plainText(text) {
  return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/~~(.*?)~~/g, '$1');
}

function makePara(text, opts = {}) {
  return new Paragraph({
    children: inlineRuns(text, { size: opts.size || 22, color: opts.color || DARK, font: 'Malgun Gothic' }),
    spacing: { before: opts.before || 80, after: opts.after || 80 },
    alignment: opts.align || AlignmentType.LEFT,
    ...opts.paraOpts
  });
}

// ── table builder ──────────────────────────────────────────────────────────

function buildTable(lines) {
  // lines: array of pipe-separated strings
  const rows = lines
    .filter(l => !/^\s*\|[-:| ]+\|\s*$/.test(l))
    .map(l => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));

  if (rows.length === 0) return null;

  const colCount = rows[0].length;

  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((cols, ri) => {
      const isHeader = ri === 0;
      return new TableRow({
        tableHeader: isHeader,
        children: cols.map((cell) => {
          // strip emoji from cell text for display
          const cellText = cell;
          return new TableCell({
            shading: isHeader ? { type: ShadingType.SOLID, color: NAVY, fill: NAVY } : undefined,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: inlineRuns(cellText, {
                  size: 18,
                  color: isHeader ? WHITE : DARK,
                  bold: isHeader,
                  font: 'Malgun Gothic'
                }),
                alignment: AlignmentType.LEFT,
                spacing: { before: 40, after: 40 }
              })
            ]
          });
        })
      });
    })
  });
}

// ── main parser ────────────────────────────────────────────────────────────

function parseMarkdown(md) {
  const elements = [];
  const rawLines = md.split('\n');

  // strip YAML frontmatter
  let start = 0;
  if (rawLines[0].trim() === '---') {
    for (let i = 1; i < rawLines.length; i++) {
      if (rawLines[i].trim() === '---') { start = i + 1; break; }
    }
  }
  const lines = rawLines.slice(start);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // blank line
    if (line.trim() === '') { i++; continue; }

    // HR
    if (/^---+$/.test(line.trim())) {
      elements.push(new Paragraph({
        border: { bottom: { color: BLUE, size: 6, style: BorderStyle.SINGLE } },
        spacing: { before: 100, after: 100 }
      }));
      i++; continue;
    }

    // Headings
    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    const h4 = line.match(/^####\s+(.+)/);

    if (h1) {
      elements.push(new Paragraph({
        children: [new TextRun({ text: plainText(h1[1]), bold: true, size: 52, color: NAVY, font: 'Malgun Gothic' })],
        spacing: { before: 400, after: 200 },
        shading: { type: ShadingType.SOLID, color: LIGHT, fill: LIGHT },
        alignment: AlignmentType.CENTER
      }));
      i++; continue;
    }
    if (h2) {
      elements.push(new Paragraph({
        children: [new TextRun({ text: plainText(h2[1]), bold: true, size: 36, color: NAVY, font: 'Malgun Gothic' })],
        spacing: { before: 320, after: 120 },
        border: { bottom: { color: BLUE, size: 8, style: BorderStyle.SINGLE } }
      }));
      i++; continue;
    }
    if (h3) {
      elements.push(new Paragraph({
        children: [new TextRun({ text: plainText(h3[1]), bold: true, size: 26, color: TEAL, font: 'Malgun Gothic' })],
        spacing: { before: 240, after: 80 }
      }));
      i++; continue;
    }
    if (h4) {
      elements.push(new Paragraph({
        children: [new TextRun({ text: plainText(h4[1]), bold: true, size: 22, color: DARK, font: 'Malgun Gothic' })],
        spacing: { before: 160, after: 60 }
      }));
      i++; continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const qLines = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        qLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      qLines.forEach(ql => {
        if (ql.trim()) {
          elements.push(new Paragraph({
            children: inlineRuns(ql, { size: 20, color: '555555', italics: true, font: 'Malgun Gothic' }),
            indent: { left: 480 },
            border: { left: { color: GOLD, size: 12, style: BorderStyle.SINGLE } },
            spacing: { before: 60, after: 60 }
          }));
        }
      });
      continue;
    }

    // Table
    if (line.startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const tbl = buildTable(tableLines);
      if (tbl) {
        elements.push(tbl);
        elements.push(new Paragraph({ spacing: { before: 80, after: 80 } }));
      }
      continue;
    }

    // Unordered list
    if (/^[\s]*[-*+]\s/.test(line)) {
      const bullet = line.replace(/^[\s]*[-*+]\s/, '');
      elements.push(new Paragraph({
        children: inlineRuns(bullet, { size: 20, color: DARK, font: 'Malgun Gothic' }),
        bullet: { level: 0 },
        spacing: { before: 40, after: 40 }
      }));
      i++; continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const item = line.replace(/^\d+\.\s/, '');
      elements.push(new Paragraph({
        children: [new TextRun({ text: '  • ', bold: true, color: GOLD, font: 'Malgun Gothic', size: 20 }),
                   ...inlineRuns(item, { size: 20, color: DARK, font: 'Malgun Gothic' })],
        spacing: { before: 40, after: 40 },
        indent: { left: 240 }
      }));
      i++; continue;
    }

    // Code block
    if (line.startsWith('```')) {
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // closing ```
      codeLines.forEach(cl => {
        elements.push(new Paragraph({
          children: [new TextRun({ text: cl || ' ', font: 'Courier New', size: 18, color: '333333' })],
          shading: { type: ShadingType.SOLID, color: 'F5F5F5', fill: 'F5F5F5' },
          spacing: { before: 20, after: 20 },
          indent: { left: 360 }
        }));
      });
      continue;
    }

    // Regular paragraph
    if (line.trim()) {
      elements.push(new Paragraph({
        children: inlineRuns(line.trim(), { size: 22, color: DARK, font: 'Malgun Gothic' }),
        spacing: { before: 80, after: 80 },
        alignment: AlignmentType.LEFT
      }));
    }
    i++;
  }
  return elements;
}

// ── assemble document ──────────────────────────────────────────────────────

const bodyChildren = [
  // Cover page title block
  new Paragraph({
    children: [new TextRun({ text: '주식회사 서우 (SEOWOO)', bold: true, size: 56, color: WHITE, font: 'Malgun Gothic' })],
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
    spacing: { before: 600, after: 120 }
  }),
  new Paragraph({
    children: [new TextRun({ text: 'AI 에이전트 사업 — 신사업 기획 최종 보고서', bold: true, size: 36, color: WHITE, font: 'Malgun Gothic' })],
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
    spacing: { before: 0, after: 120 }
  }),
  new Paragraph({
    children: [new TextRun({ text: '"We grow together!"  |  작성 기준일: 2026-05-04', size: 24, color: LIGHT, font: 'Malgun Gothic' })],
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
    spacing: { before: 0, after: 600 }
  }),
  new Paragraph({ spacing: { before: 200, after: 200 } }),
  ...parseMarkdown(md)
];

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Malgun Gothic', size: 22, color: DARK }
      }
    }
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.2),
          right: convertInchesToTwip(1.2)
        }
      }
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: '주식회사 서우 (SEOWOO)  |  We grow together!  |  ', size: 16, color: '888888', font: 'Malgun Gothic' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888', font: 'Malgun Gothic' })
          ],
          alignment: AlignmentType.CENTER
        })]
      })
    },
    children: bodyChildren
  }]
});

Packer.toBuffer(doc).then(buf => {
  const out = 'C:\\Users\\노하우셀러\\Downloads\\서우_AI에이전트_신사업기획보고서_20260504.docx';
  fs.writeFileSync(out, buf);
  console.log('saved:', out);
}).catch(e => { console.error(e); process.exit(1); });
