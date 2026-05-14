import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, TableLayoutType, AlignmentType, BorderStyle, ShadingType,
  PageBreak,
} from 'docx'
import { writeFileSync } from 'fs'

const F       = '맑은 고딕'
const DEEP    = '1A1A2E'
const AMBER   = 'F59E0B'
const AMBER_D = 'D97706'
const NAVY    = '1E40AF'
const WHITE   = 'FFFFFF'
const GREY    = '6B7280'
const LIGHT   = 'F9FAFB'
const LIGHT2  = 'F3F4F6'
const DARK    = '111827'
const RED     = 'DC2626'
const GREEN   = '065F46'
const GREEN_L = 'D1FAE5'
const BLUE_L  = 'EFF6FF'
const BLUE    = '1E40AF'
const AMBER_L = 'FEF3C7'
const WARN    = 'FEF3C7'

const none = {
  top:    { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right:  { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}
const hairline = (c='E5E7EB') => ({
  top:    { style: BorderStyle.SINGLE, size: 1, color: c },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: c },
  left:   { style: BorderStyle.NONE },
  right:  { style: BorderStyle.NONE },
})

const sp  = (n=120) => new Paragraph({ spacing: { after: n } })
const hr  = () => new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB' } }, spacing: { before: 200, after: 200 } })

// 헤딩
const h1 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 38, color: DEEP, font: F })],
  spacing: { before: 400, after: 180 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: AMBER } },
})
const h2 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 28, color: NAVY, font: F })],
  spacing: { before: 300, after: 120 },
})
const h3 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 24, color: DEEP, font: F })],
  spacing: { before: 200, after: 80 },
})

// 본문
const body = (text, opts={}) => new Paragraph({
  children: [new TextRun({ text, size: 22, font: F, color: DARK, ...opts })],
  spacing: { after: 80 },
})
const bullet = (text, bold=false) => new Paragraph({
  children: [
    new TextRun({ text: '• ', size: 22, color: AMBER_D, font: F, bold: true }),
    new TextRun({ text, size: 22, font: F, color: DARK, bold }),
  ],
  indent: { left: 320 },
  spacing: { after: 60 },
})
const numbered = (n, text) => new Paragraph({
  children: [
    new TextRun({ text: `${n}.  `, size: 22, color: AMBER_D, font: F, bold: true }),
    new TextRun({ text, size: 22, font: F, color: DARK }),
  ],
  indent: { left: 320 },
  spacing: { after: 60 },
})

// 콜아웃 박스
const callout = (text, bg=BLUE_L, fg=BLUE, bold=true) => new Table({
  layout: TableLayoutType.FIXED,
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [new TableRow({ children: [new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: 22, color: fg, font: F, bold })], alignment: AlignmentType.CENTER })],
    shading: { type: ShadingType.SOLID, color: bg },
    borders: none,
    margins: { top: 160, bottom: 160, left: 200, right: 200 },
  })]})],
})

const bigCallout = (lines, bg=AMBER_L) => new Table({
  layout: TableLayoutType.FIXED,
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [new TableRow({ children: [new TableCell({
    children: lines.map((l, i) => new Paragraph({
      children: [new TextRun({ text: l.text, size: l.size||22, color: l.color||DARK, font: F, bold: l.bold||false })],
      alignment: AlignmentType.CENTER,
      spacing: { after: i < lines.length-1 ? 60 : 0 },
    })),
    shading: { type: ShadingType.SOLID, color: bg },
    borders: none,
    margins: { top: 200, bottom: 200, left: 240, right: 240 },
  })]})],
})

// 헤더 셀
const hCell = (text, bg=DEEP, fg=WHITE, w) => new TableCell({
  children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: fg, font: F })], alignment: AlignmentType.CENTER })],
  shading: { type: ShadingType.SOLID, color: bg },
  borders: none,
  margins: { top: 100, bottom: 100, left: 100, right: 100 },
  ...(w ? { width: { size: w, type: WidthType.PERCENTAGE } } : {}),
})
// 데이터 셀
const dCell = (text, bg=LIGHT, align=AlignmentType.CENTER, bold=false, color=DARK) => new TableCell({
  children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: F, bold, color })], alignment: align })],
  shading: { type: ShadingType.SOLID, color: bg },
  borders: hairline(),
  margins: { top: 80, bottom: 80, left: 100, right: 100 },
})

// STEP 박스
const step = (n, title, desc) => new Table({
  layout: TableLayoutType.FIXED,
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [new TableRow({ children: [
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: `${n}`, bold: true, size: 32, color: WHITE, font: F })], alignment: AlignmentType.CENTER })],
      shading: { type: ShadingType.SOLID, color: AMBER_D },
      borders: none,
      margins: { top: 120, bottom: 120, left: 80, right: 80 },
      width: { size: 8, type: WidthType.PERCENTAGE },
    }),
    new TableCell({
      children: [
        new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 24, color: DEEP, font: F })], spacing: { after: 40 } }),
        new Paragraph({ children: [new TextRun({ text: desc, size: 20, color: '4B5563', font: F })] }),
      ],
      borders: none,
      margins: { top: 120, bottom: 120, left: 200, right: 100 },
    }),
  ]})],
})

// ── 표지 ────────────────────────────────────────────────────────────────────
const cover = [
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({
      children: [
        new Paragraph({ children: [new TextRun({ text: 'AuthenticArt', bold: true, size: 56, color: AMBER, font: F })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
        new Paragraph({ children: [new TextRun({ text: '오센틱아트', bold: true, size: 40, color: WHITE, font: F })], alignment: AlignmentType.CENTER, spacing: { after: 240 } }),
        new Paragraph({ children: [new TextRun({ text: '강사님, 지금 수수료 얼마 내고 계신가요?', bold: true, size: 34, color: AMBER, font: F })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: '가르치는 것에만 집중하세요', size: 26, color: 'D1D5DB', font: F })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
        new Paragraph({ children: [new TextRun({ text: '나머지는 오센틱아트가 다 합니다', size: 26, color: 'D1D5DB', font: F })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
        new Paragraph({ children: [new TextRun({ text: '강사 수익률  86.7%', bold: true, size: 36, color: WHITE, font: F })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
        new Paragraph({ children: [new TextRun({ text: '업계 최고 수준  ·  추가 비용 없음  ·  자동 정산', size: 22, color: 'D1D5DB', font: F })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
        new Paragraph({ children: [new TextRun({ text: 'authenticresinmaster@gmail.com  |  authenticart.vercel.app', size: 18, color: '9CA3AF', font: F })], alignment: AlignmentType.CENTER }),
      ],
      shading: { type: ShadingType.SOLID, color: DEEP },
      borders: none,
      margins: { top: 800, bottom: 800, left: 400, right: 400 },
    })]})],
  }),
  new Paragraph({ children: [new PageBreak()] }),
]

// ── 섹션 0: 강사의 현실 ──────────────────────────────────────────────────────
const sec0 = [
  h1('먼저, 강사님의 현실을 말씀드릴게요'),
  body('클래스 하나를 열기까지 강사님이 직접 하는 일들입니다.'),
  sp(80),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: '클래스 전', bold: true, size: 22, color: WHITE, font: F })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
            ...[
              '카카오 오픈채팅 모집 공고 올리기',
              'DM 문의 일일이 답변하기',
              '입금 확인, 미입금자 독촉하기',
              '인원 확정 후 날짜 재조율하기',
              '재료 준비 목록 발송하기',
            ].map(t => new Paragraph({ children: [new TextRun({ text: `• ${t}`, size: 20, color: 'FEF3C7', font: F })], spacing: { after: 40 }, indent: { left: 100 } })),
          ],
          shading: { type: ShadingType.SOLID, color: '374151' },
          borders: none,
          margins: { top: 160, bottom: 160, left: 180, right: 180 },
          width: { size: 33, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: '클래스 당일', bold: true, size: 22, color: WHITE, font: F })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
            ...[
              '노쇼 연락 대기하기',
              '갑작스러운 환불 문의',
              '현금영수증 요청 처리',
            ].map(t => new Paragraph({ children: [new TextRun({ text: `• ${t}`, size: 20, color: 'FEF3C7', font: F })], spacing: { after: 40 }, indent: { left: 100 } })),
          ],
          shading: { type: ShadingType.SOLID, color: '374151' },
          borders: { left: { style: BorderStyle.SINGLE, size: 2, color: AMBER }, right: BorderStyle.NONE, top: BorderStyle.NONE, bottom: BorderStyle.NONE },
          margins: { top: 160, bottom: 160, left: 180, right: 180 },
          width: { size: 33, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: '클래스 후', bold: true, size: 22, color: WHITE, font: F })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
            ...[
              '후기 독촉 메시지 보내기',
              '재예약 문의 응대하기',
              '정산 날짜 기다리기',
              '다음 달 모집 공고 또 올리기',
            ].map(t => new Paragraph({ children: [new TextRun({ text: `• ${t}`, size: 20, color: 'FEF3C7', font: F })], spacing: { after: 40 }, indent: { left: 100 } })),
          ],
          shading: { type: ShadingType.SOLID, color: '374151' },
          borders: { left: { style: BorderStyle.SINGLE, size: 2, color: AMBER }, right: BorderStyle.NONE, top: BorderStyle.NONE, bottom: BorderStyle.NONE },
          margins: { top: 160, bottom: 160, left: 180, right: 180 },
          width: { size: 34, type: WidthType.PERCENTAGE },
        }),
      ]}),
    ],
  }),
  sp(120),
  callout('그리고 이 모든 일을 하면서 — 수수료 35%를 냅니다', WARN, RED, true),
  sp(),
]

// ── 섹션 1: 수수료 비교 ──────────────────────────────────────────────────────
const sec1 = [
  h1('수수료 비교 — 숫자로 확인하세요'),
  h2('플랫폼별 강사 실수령율'),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [hCell('플랫폼', DEEP, WHITE, 30), hCell('강사 수령', DEEP, WHITE, 22), hCell('플랫폼 수수료', DEEP, WHITE, 22), hCell('月 300만 원 실수령', AMBER, DEEP, 26)] }),
      new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '오센틱아트 ★', bold: true, size: 22, color: AMBER_D, font: F })], alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: AMBER_L }, borders: hairline(), margins: { top: 120, bottom: 120, left: 100, right: 100 } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '86.7%', bold: true, size: 26, color: GREEN, font: F })], alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: GREEN_L }, borders: hairline(), margins: { top: 120, bottom: 120, left: 100, right: 100 } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '13.3%', bold: true, size: 22, color: GREEN, font: F })], alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: GREEN_L }, borders: hairline(), margins: { top: 120, bottom: 120, left: 100, right: 100 } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '260만 원', bold: true, size: 26, color: GREEN, font: F })], alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: GREEN_L }, borders: hairline(), margins: { top: 120, bottom: 120, left: 100, right: 100 } }),
      ]}),
      new TableRow({ children: [dCell('탈잉', LIGHT), dCell('80%', LIGHT), dCell('20%', LIGHT), dCell('240만 원', LIGHT)] }),
      new TableRow({ children: [dCell('프립', 'FFFFFF'), dCell('75%', 'FFFFFF'), dCell('25%', 'FFFFFF'), dCell('225만 원', 'FFFFFF')] }),
      new TableRow({ children: [dCell('클래스101', LIGHT), dCell('65%', LIGHT, AlignmentType.CENTER, false, RED), dCell('35%', LIGHT, AlignmentType.CENTER, false, RED), dCell('195만 원', LIGHT, AlignmentType.CENTER, false, RED)] }),
    ],
  }),
  sp(80),
  body('오센틱아트 13.3% 구성: PG 수수료 3.3% (카드사 납부) + 플랫폼 수수료 10%. 추가 비용 없음.', { color: GREY, italics: true, size: 18 }),
  sp(200),
  h2('월 매출별 연간 수입 차이'),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [hCell('월 클래스 매출', DEEP, WHITE, 22), hCell('클래스101 (65%)', DEEP, WHITE, 24), hCell('오센틱아트 (86.7%)', AMBER, DEEP, 28), hCell('연간 차이', DEEP, WHITE, 26)] }),
      new TableRow({ children: [dCell('월 100만 원', LIGHT), dCell('65만 원', LIGHT), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '86.7만 원', bold: true, size: 22, color: GREEN, font: F })], alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: GREEN_L }, borders: hairline(), margins: { top: 80, bottom: 80, left: 100, right: 100 } }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '+260만 원', bold: true, size: 22, color: GREEN, font: F })], alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: GREEN_L }, borders: hairline(), margins: { top: 80, bottom: 80, left: 100, right: 100 } })] }),
      new TableRow({ children: [dCell('월 200만 원', 'FFFFFF'), dCell('130만 원', 'FFFFFF'), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '173.4만 원', bold: true, size: 22, color: GREEN, font: F })], alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: GREEN_L }, borders: hairline(), margins: { top: 80, bottom: 80, left: 100, right: 100 } }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '+520만 원', bold: true, size: 22, color: GREEN, font: F })], alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: GREEN_L }, borders: hairline(), margins: { top: 80, bottom: 80, left: 100, right: 100 } })] }),
      new TableRow({ children: [dCell('월 300만 원', LIGHT), dCell('195만 원', LIGHT), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '260.1만 원', bold: true, size: 24, color: GREEN, font: F })], alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: GREEN_L }, borders: hairline(), margins: { top: 80, bottom: 80, left: 100, right: 100 } }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '+780만 원', bold: true, size: 24, color: GREEN, font: F })], alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: GREEN_L }, borders: hairline(), margins: { top: 80, bottom: 80, left: 100, right: 100 } })] }),
      new TableRow({ children: [dCell('월 500만 원', 'FFFFFF'), dCell('325만 원', 'FFFFFF'), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '433.5만 원', bold: true, size: 24, color: GREEN, font: F })], alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: GREEN_L }, borders: hairline(), margins: { top: 80, bottom: 80, left: 100, right: 100 } }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '+1,300만 원', bold: true, size: 24, color: GREEN, font: F })], alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: GREEN_L }, borders: hairline(), margins: { top: 80, bottom: 80, left: 100, right: 100 } })] }),
    ],
  }),
  sp(100),
  bigCallout([
    { text: '같은 클래스, 같은 노력으로', size: 24, color: DARK, bold: false },
    { text: '연간 500만~1,300만 원이 달라집니다', size: 30, color: AMBER_D, bold: true },
  ], AMBER_L),
  sp(),
]

// ── 섹션 2: 시간을 돌려드립니다 ──────────────────────────────────────────────
const sec2 = [
  h1('강사님의 시간을 돌려드립니다'),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [hCell('지금 강사님이 직접 하는 일', '374151', WHITE, 50), hCell('오센틱아트에서는', GREEN, WHITE, 50)] }),
      new TableRow({ children: [dCell('카카오 문의 일일이 답변', LIGHT, AlignmentType.LEFT), dCell('수강생이 직접 예약·결제 완료', GREEN_L, AlignmentType.LEFT)] }),
      new TableRow({ children: [dCell('입금 확인·독촉 반복', 'FFFFFF', AlignmentType.LEFT), dCell('결제 완료 즉시 자동 확정', GREEN_L, AlignmentType.LEFT)] }),
      new TableRow({ children: [dCell('노쇼 대응·환불 처리', LIGHT, AlignmentType.LEFT), dCell('취소 정책 자동 적용', GREEN_L, AlignmentType.LEFT)] }),
      new TableRow({ children: [dCell('정산 날짜 기다리기', 'FFFFFF', AlignmentType.LEFT), dCell('매월 5일 자동 이체', GREEN_L, AlignmentType.LEFT)] }),
      new TableRow({ children: [dCell('다음 달 모집 공고 반복', LIGHT, AlignmentType.LEFT), dCell('클래스 상시 노출, 상시 예약', GREEN_L, AlignmentType.LEFT)] }),
      new TableRow({ children: [dCell('후기 수동 관리', 'FFFFFF', AlignmentType.LEFT), dCell('수강 후 자동 후기 요청', GREEN_L, AlignmentType.LEFT)] }),
    ],
  }),
  sp(100),
  callout('월 30~60시간 행정 업무 → 클래스 준비·개인 작업·휴식으로 돌려드립니다', BLUE_L, BLUE, true),
  sp(200),

  h2('강사 전용 스튜디오 페이지 — 무료 제공'),
  body('오센틱아트에 가입하면 강사님만의 스튜디오 페이지가 즉시 생성됩니다.'),
  sp(80),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({
      children: [
        new Paragraph({ children: [new TextRun({ text: '[ 강사님 스튜디오 페이지 ]', bold: true, size: 22, color: AMBER_D, font: F })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
        new Paragraph({ children: [new TextRun({ text: '프로필 사진  |  강사 소개 스토리  |  누적 수강생 N명  |  별점 ★4.9', size: 20, color: DEEP, font: F })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: '클래스 목록 · 사진 · 설명 · 일정  →  [ 예약하기 / 바로 결제 ]', size: 20, color: '374151', font: F })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: '수강생 후기 자동 수집  |  남은 자리 실시간 표시', size: 20, color: GREY, font: F })], alignment: AlignmentType.CENTER }),
      ],
      shading: { type: ShadingType.SOLID, color: 'FAFAFA' },
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: AMBER }, bottom: { style: BorderStyle.SINGLE, size: 4, color: AMBER }, left: { style: BorderStyle.SINGLE, size: 4, color: AMBER }, right: { style: BorderStyle.SINGLE, size: 4, color: AMBER } },
      margins: { top: 200, bottom: 200, left: 240, right: 240 },
    })]})],
  }),
  sp(80),
  body('이 링크 하나로 인스타그램 바이오·카카오 프로필을 대체합니다. 별도 링크 페이지 구독료 절약.', { color: GREY, italics: true }),
  sp(),
]

// ── 섹션 3: 추가 수익 ─────────────────────────────────────────────────────────
const sec3 = [
  h1('예상하지 못했던 추가 수입'),
  h2('B2B 기업 출강 — 플랫폼이 연결해드립니다'),
  body('기업 팀빌딩·복지 행사 수요가 오센틱아트로 직접 들어옵니다. 강사님이 직접 영업하지 않아도 됩니다.'),
  sp(80),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [hCell('기업 출강 인원', DEEP, WHITE, 30), hCell('강사 수령 예시', AMBER, DEEP, 35), hCell('월 2건 기준 추가 수입', DEEP, WHITE, 35)] }),
      new TableRow({ children: [dCell('10인', LIGHT), dCell('15~20만 원', LIGHT), dCell('월 +30~40만 원', GREEN_L)] }),
      new TableRow({ children: [dCell('20인', 'FFFFFF'), dCell('30~40만 원', 'FFFFFF'), dCell('월 +60~80만 원', GREEN_L)] }),
      new TableRow({ children: [dCell('50인', LIGHT), dCell('70~90만 원', LIGHT), dCell('월 +140~180만 원', GREEN_L)] }),
    ],
  }),
  sp(80),
  body('정규 클래스 외에 월 1~2건만 기업 출강해도 월 30~80만 원 추가. 이런 B2B 요청을 강사 혼자 받기는 쉽지 않습니다.', { color: GREY }),
  sp(200),

  h2('재료 추천 수익 — 수강생이 구매할 때마다'),
  body('클래스 준비물 안내 시 재료몰 상품을 연결하면, 수강생이 구매할 때마다 추가 수익이 발생합니다.'),
  sp(80),
  callout('"이번 클래스에 필요한 재료는 여기서 구매하세요" — 클릭 한 번으로 끝\n강사님이 신뢰하고 쓰는 재료를 수강생이 동일하게 구매합니다', BLUE_L, BLUE, false),
  sp(),
]

// ── 섹션 4: 걱정 해소 ─────────────────────────────────────────────────────────
const sec4 = [
  h1('걱정되시는 것들 — 미리 답변드립니다'),
  ...([
    ['지금 쓰는 플랫폼을 끊어야 하나요?', '아닙니다. 오센틱아트는 추가 채널로 사용하시면 됩니다. 독점 계약 조항 없습니다. 기존 채널과 병행 운영 권장합니다.'],
    ['수강생이 없는데 새로 모아야 하나요?', '"앞으로 예약은 여기서 해주세요" 한 마디면 됩니다. 기존 수강생을 오센틱아트로 이동시키고, 동시에 플랫폼 내 신규 수강생도 유입됩니다.'],
    ['플랫폼이 없어지면 수강생 데이터를 잃나요?', '강사님의 수강생은 강사님 것입니다. 수강생 연락처·예약 이력은 언제든 내보내기 가능합니다.'],
    ['클래스 최소 개수나 의무가 있나요?', '없습니다. 월 1개 클래스도 됩니다. 일시정지도 됩니다. 원할 때 원하는 만큼만 운영하세요.'],
    ['가입비나 월정액이 있나요?', '없습니다. 클래스 수익이 발생할 때만 13.3%가 차감됩니다. 수익 0원이면 수수료도 0원입니다.'],
    ['정산은 언제 받나요?', '매월 1일 마감, 5일 자동 이체입니다. 실시간 수익은 강사 대시보드에서 확인하세요.'],
  ]).flatMap(([q, a]) => [
    new Paragraph({ children: [new TextRun({ text: `Q.  ${q}`, bold: true, size: 22, color: NAVY, font: F })], spacing: { before: 160, after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: `A.  ${a}`, size: 22, color: DARK, font: F })], spacing: { after: 100 }, indent: { left: 180 } }),
  ]),
  sp(),
]

// ── 섹션 5: 얼리 파트너 혜택 ────────────────────────────────────────────────
const sec5 = [
  h1('지금 합류해야 하는 이유 — 타이밍이 전부입니다'),
  bigCallout([
    { text: '플랫폼은 선점이 전부입니다', size: 22, color: '374151', bold: false },
    { text: '강사 50명일 때 합류 vs 강사 1,000명일 때 합류', size: 24, color: DEEP, bold: true },
    { text: '노출 위치가 완전히 달라집니다', size: 22, color: RED, bold: true },
  ], WARN),
  sp(160),
  h2('얼리 파트너 강사 전용 혜택 (초기 50명 한정)'),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [hCell('혜택', DEEP, WHITE, 35), hCell('내용', DEEP, WHITE, 65)] }),
      new TableRow({ children: [dCell('플랫폼 메인 노출', AMBER_L, AlignmentType.CENTER, true, AMBER_D), dCell('신규 수강생에게 추천 강사로 우선 노출', AMBER_L, AlignmentType.LEFT)] }),
      new TableRow({ children: [dCell('공식 SNS 소개', 'FFFFFF', AlignmentType.CENTER, true), dCell('오센틱아트 인스타·카카오 공식 채널에 강사 소개', 'FFFFFF', AlignmentType.LEFT)] }),
      new TableRow({ children: [dCell('B2B 우선 배정', LIGHT, AlignmentType.CENTER, true), dCell('기업 출강 요청 시 얼리 파트너 먼저 매칭', LIGHT, AlignmentType.LEFT)] }),
      new TableRow({ children: [dCell('기능 직접 요청', 'FFFFFF', AlignmentType.CENTER, true), dCell('필요한 기능 직접 제안 → 우선 개발 반영', 'FFFFFF', AlignmentType.LEFT)] }),
    ],
  }),
  sp(),
]

// ── 섹션 6: 시작 방법 & 마무리 ───────────────────────────────────────────────
const sec6 = [
  h1('지금 바로 시작하는 방법 — 5분이면 충분합니다'),
  sp(80),
  step('1', '등록 의향 전달', '이메일에 이름·장르·활동 지역 한 줄만 보내주세요'),
  sp(80),
  step('2', '온보딩 링크 수신', '24시간 이내 오센틱아트 팀이 온보딩 링크 발송'),
  sp(80),
  step('3', '스튜디오 페이지 설정', '프로필·클래스·가격 입력 (약 20분 소요)'),
  sp(80),
  step('4', '첫 클래스 오픈', '예약 시작 — 강사님은 가르치는 것에만 집중하세요'),
  sp(240),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({
      children: [
        new Paragraph({ children: [new TextRun({ text: '강사님은 실력으로 여기까지 오셨습니다', bold: true, size: 26, color: WHITE, font: F })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: '수수료를 덜 내고, 행정에서 벗어나고, 더 많은 수강생을 만나는 것', size: 22, color: 'D1D5DB', font: F })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
        new Paragraph({ children: [new TextRun({ text: '그게 강사님이 원하는 환경 아닌가요?', size: 22, color: 'D1D5DB', font: F })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: '월 매출 200만 원이면 — 연간 500만 원이 더 생깁니다', bold: true, size: 28, color: AMBER, font: F })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: '그 돈으로 하고 싶은 것, 있으시잖아요', size: 24, color: 'E5E7EB', font: F })], alignment: AlignmentType.CENTER, spacing: { after: 240 } }),
        new Paragraph({ children: [new TextRun({ text: 'authenticresinmaster@gmail.com', bold: true, size: 26, color: AMBER, font: F })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
        new Paragraph({ children: [new TextRun({ text: 'authenticart.vercel.app', size: 22, color: 'D1D5DB', font: F })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
        new Paragraph({ children: [new TextRun({ text: '24시간 이내 답변 · 주말 포함', size: 18, color: '9CA3AF', font: F })], alignment: AlignmentType.CENTER }),
      ],
      shading: { type: ShadingType.SOLID, color: DEEP },
      borders: none,
      margins: { top: 400, bottom: 400, left: 400, right: 400 },
    })]})],
  }),
  sp(120),
  body('* 얼리 파트너 혜택은 초기 강사 50명 등록 시점 기준으로 적용됩니다.', { color: GREY, italics: true, size: 18 }),
  body('* 본 제안서의 수수료율은 현재 기준이며, 변경 시 사전 공지합니다. 작성일: 2026년 5월 15일', { color: GREY, italics: true, size: 18 }),
]

// ── 문서 조립 ───────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: F, size: 22, color: DARK },
        paragraph: { spacing: { line: 340 } },
      },
    },
  },
  sections: [{
    properties: {
      page: { margin: { top: 900, bottom: 900, left: 1100, right: 1100 } },
    },
    children: [
      ...cover,
      ...sec0,
      ...sec1,
      ...sec2,
      ...sec3,
      ...sec4,
      ...sec5,
      ...sec6,
    ],
  }],
})

const buf = await Packer.toBuffer(doc)
writeFileSync('outputs/03-proposals/20260515-오센틱아트-강사모집제안서.docx', buf)
console.log('완료: outputs/03-proposals/20260515-오센틱아트-강사모집제안서.docx')
