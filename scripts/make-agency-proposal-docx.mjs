import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, TableLayoutType, AlignmentType, BorderStyle, ShadingType,
  PageBreak, HeadingLevel,
} from 'docx'
import { writeFileSync } from 'fs'

const F = '맑은 고딕'
const DEEP   = '1F4145'
const AMBER  = 'FFBF00'
const NAVY   = '144e8c'
const GOLD   = 'FFBF00'
const WHITE  = 'FFFFFF'
const GREY   = '6B7280'
const LIGHT  = 'F3F4F6'
const GREEN  = '065F46'
const GREEN_BG = 'D1FAE5'
const BLUE_BG  = 'EFF6FF'
const BLUE     = '1E40AF'
const none = {
  top:    { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right:  { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

const sp = (n = 120) => new Paragraph({ spacing: { after: n } })

const heading1 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 36, color: DEEP, font: F })],
  spacing: { before: 400, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: AMBER } },
})

const heading2 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 28, color: NAVY, font: F })],
  spacing: { before: 300, after: 120 },
})

const body = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, size: 22, font: F, ...opts })],
  spacing: { after: 80 },
})

const bullet = (text) => new Paragraph({
  children: [new TextRun({ text: `• ${text}`, size: 22, font: F })],
  spacing: { after: 60 },
  indent: { left: 360 },
})

const callout = (text, bg = BLUE_BG, fg = BLUE) => new Table({
  layout: TableLayoutType.FIXED,
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [new TableRow({ children: [new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: 22, color: fg, font: F, bold: true })], alignment: AlignmentType.CENTER })],
    shading: { type: ShadingType.SOLID, color: bg },
    borders: none,
    margins: { top: 160, bottom: 160, left: 220, right: 220 },
  })]})],
})

const hdrCell = (text, bg = DEEP, fg = WHITE, w) => new TableCell({
  children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: fg, font: F })], alignment: AlignmentType.CENTER })],
  shading: { type: ShadingType.SOLID, color: bg },
  borders: none,
  margins: { top: 100, bottom: 100, left: 120, right: 120 },
  ...(w ? { width: { size: w, type: WidthType.PERCENTAGE } } : {}),
})

const dataCell = (text, bg = LIGHT, align = AlignmentType.CENTER) => new TableCell({
  children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: F })], alignment: align })],
  shading: { type: ShadingType.SOLID, color: bg },
  borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
})

const step = (num, title, desc) => new Table({
  layout: TableLayoutType.FIXED,
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [new TableRow({ children: [
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: `STEP ${num}`, bold: true, size: 22, color: WHITE, font: F })], alignment: AlignmentType.CENTER })],
      shading: { type: ShadingType.SOLID, color: AMBER },
      borders: none,
      margins: { top: 100, bottom: 100, left: 100, right: 100 },
      width: { size: 12, type: WidthType.PERCENTAGE },
    }),
    new TableCell({
      children: [
        new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 22, color: DEEP, font: F })], spacing: { after: 40 } }),
        new Paragraph({ children: [new TextRun({ text: desc, size: 20, color: '374151', font: F })] }),
      ],
      borders: none,
      margins: { top: 100, bottom: 100, left: 200, right: 100 },
    }),
  ]})],
})

const faqItem = (q, a) => [
  new Paragraph({ children: [new TextRun({ text: `Q. ${q}`, bold: true, size: 22, color: NAVY, font: F })], spacing: { before: 160, after: 40 } }),
  new Paragraph({ children: [new TextRun({ text: `A. ${a}`, size: 22, color: '374151', font: F })], spacing: { after: 100 }, indent: { left: 200 } }),
]

// ── 커버 페이지 ─────────────────────────────────────
const cover = [
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({
      children: [
        new Paragraph({ children: [new TextRun({ text: 'AuthenticArt', bold: true, size: 52, color: AMBER, font: F })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: '에이전시 파트너 프로그램', bold: true, size: 44, color: WHITE, font: F })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: 'Agency Partner Program', size: 28, color: AMBER, font: F, italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
        new Paragraph({ children: [new TextRun({ text: '소개만 해도 수수료 10%', size: 26, color: WHITE, font: F, bold: true })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
        new Paragraph({ children: [new TextRun({ text: '기획·운영·정산은 오센틱아트가 모두 처리합니다', size: 22, color: 'D1D5DB', font: F })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
        new Paragraph({ children: [new TextRun({ text: '2026년 5월', size: 20, color: '9CA3AF', font: F })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: 'authenticresinmaster@gmail.com  |  authenticart.vercel.app', size: 20, color: '9CA3AF', font: F })], alignment: AlignmentType.CENTER }),
      ],
      shading: { type: ShadingType.SOLID, color: DEEP },
      borders: none,
      margins: { top: 800, bottom: 800, left: 400, right: 400 },
    })]})],
  }),
  new Paragraph({ children: [new PageBreak()] }),
]

// ── 섹션 1: 오센틱아트 소개 ─────────────────────────
const sec1 = [
  heading1('1. 오센틱아트는 어떤 플랫폼인가요?'),
  body('오센틱아트는 전문 공예 강사와 기업·수강생을 연결하는 플랫폼입니다.'),
  sp(120),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [hdrCell('항목', DEEP, WHITE, 25), hdrCell('내용', DEEP, WHITE, 75)] }),
      new TableRow({ children: [dataCell('서비스', 'EFF6FF'), dataCell('출강형 공예 체험 / 원데이 클래스 / B2B 팀빌딩', 'FFFFFF', AlignmentType.LEFT)] }),
      new TableRow({ children: [dataCell('장르', LIGHT), dataCell('레진아트, 캔들, 플라워, 가죽공예, 도자기, 주얼리 등', 'FFFFFF', AlignmentType.LEFT)] }),
      new TableRow({ children: [dataCell('강사', 'EFF6FF'), dataCell('검증된 전문 강사 네트워크 (전국)', 'FFFFFF', AlignmentType.LEFT)] }),
      new TableRow({ children: [dataCell('인프라', LIGHT), dataCell('예약·결제·정산·후기 시스템 자체 운영', 'FFFFFF', AlignmentType.LEFT)] }),
      new TableRow({ children: [dataCell('기업 고객', 'EFF6FF'), dataCell('팀빌딩, 신입 환영회, 창립기념일, 명절 행사 등', 'FFFFFF', AlignmentType.LEFT)] }),
    ],
  }),
  sp(160),
  callout('파트너사가 할 일: 기업 클라이언트에게 오센틱아트를 소개하는 것뿐\n오센틱아트가 할 일: 기획서·견적·강사 배정·운영·사후 관리 전부', BLUE_BG, BLUE),
  sp(),
]

// ── 섹션 2: 수익 모델 ────────────────────────────────
const sec2 = [
  heading1('2. 에이전시 파트너 수익 모델'),
  heading2('수수료 구조'),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [hdrCell('파트너 등급', DEEP, WHITE, 28), hdrCell('수수료율', AMBER, DEEP, 22), hdrCell('등급 조건', DEEP, WHITE, 50)] }),
      new TableRow({ children: [dataCell('스탠다드', LIGHT), dataCell('10%', 'EFF6FF'), dataCell('파트너 계약 체결 즉시', LIGHT)] }),
      new TableRow({ children: [dataCell('실버', 'E0E7FF'), dataCell('12%', 'EFF6FF'), dataCell('분기 3건 이상 성사', LIGHT)] }),
      new TableRow({ children: [dataCell('골드 ⭐', 'FEF3C7'), dataCell('15%', 'FFFBEB'), dataCell('분기 6건 이상 성사', LIGHT)] }),
    ],
  }),
  sp(80),
  body('수수료 정산: 행사 완료 후 월 1회 일괄 정산 (매월 5일 지급)', { color: GREY, italics: true }),
  sp(200),

  heading2('수익 시뮬레이션'),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [hdrCell('시나리오', DEEP, WHITE, 20), hdrCell('월 소개', DEEP, WHITE, 20), hdrCell('행사 규모', DEEP, WHITE, 20), hdrCell('계약금액', DEEP, WHITE, 20), hdrCell('월 수수료', AMBER, DEEP, 20)] }),
      new TableRow({ children: [dataCell('A — 스탠다드', LIGHT), dataCell('2건', LIGHT), dataCell('20인/건', LIGHT), dataCell('120만 원', LIGHT), dataCell('12만 원', 'DBEAFE')] }),
      new TableRow({ children: [dataCell('B — 실버', LIGHT), dataCell('5건', LIGHT), dataCell('30인/건', LIGHT), dataCell('450만 원', LIGHT), dataCell('54만 원', 'DBEAFE')] }),
      new TableRow({ children: [dataCell('C — 골드', 'FEF3C7'), dataCell('10건', 'FEF3C7'), dataCell('50인/건', 'FEF3C7'), dataCell('1,500만 원', 'FEF3C7'), dataCell('225만 원', 'FDE68A')] }),
    ],
  }),
  sp(80),
  body('※ 위 수치는 시뮬레이션입니다. 실제 계약금액은 인원·장르·장소에 따라 결정됩니다.', { color: GREY, italics: true, size: 18 }),
  sp(),
]

// ── 섹션 3: 프로그램 라인업 ──────────────────────────
const sec3 = [
  heading1('3. 파트너사가 제공하는 프로그램 라인업'),
  heading2('기업 팀빌딩 패키지'),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [hdrCell('패키지', DEEP, WHITE, 20), hdrCell('인원', DEEP, WHITE, 15), hdrCell('시간', DEEP, WHITE, 12), hdrCell('단가(참고)', AMBER, DEEP, 20), hdrCell('추천 상황', DEEP, WHITE, 33)] }),
      new TableRow({ children: [dataCell('미니 체험', LIGHT), dataCell('10~20인', LIGHT), dataCell('1.5h', LIGHT), dataCell('30만 원~', LIGHT), dataCell('소규모 팀·신입 환영', LIGHT)] }),
      new TableRow({ children: [dataCell('스탠다드', 'FFFFFF'), dataCell('20~50인', 'FFFFFF'), dataCell('2h', 'FFFFFF'), dataCell('60~150만 원', 'FFFFFF'), dataCell('분기 팀빌딩·창립기념일', 'FFFFFF')] }),
      new TableRow({ children: [dataCell('프리미엄', LIGHT), dataCell('50~100인', LIGHT), dataCell('2.5h', LIGHT), dataCell('150~300만 원', LIGHT), dataCell('전사 워크숍·연간 행사', LIGHT)] }),
      new TableRow({ children: [dataCell('대형 행사', 'FFFFFF'), dataCell('100인 이상', 'FFFFFF'), dataCell('협의', 'FFFFFF'), dataCell('별도 협의', 'FFFFFF'), dataCell('전사 이벤트·전시회 연계', 'FFFFFF')] }),
    ],
  }),
  sp(200),

  heading2('장르별 프로그램'),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [hdrCell('장르', NAVY, WHITE, 22), hdrCell('특징', NAVY, WHITE, 45), hdrCell('추천 타겟', NAVY, WHITE, 33)] }),
      new TableRow({ children: [dataCell('레진아트 ⭐인기', LIGHT), dataCell('귀걸이·소품·트레이 제작', LIGHT), dataCell('20~40대 여성 팀', LIGHT)] }),
      new TableRow({ children: [dataCell('캔들 워크숍', 'FFFFFF'), dataCell('시즌 향 선택, 명절 선물로 인기', 'FFFFFF'), dataCell('전 연령, 명절 시즌', 'FFFFFF')] }),
      new TableRow({ children: [dataCell('플라워 클래스', LIGHT), dataCell('꽃다발·화관·드라이플라워', LIGHT), dataCell('신입·입사 기념', LIGHT)] }),
      new TableRow({ children: [dataCell('가죽공예', 'FFFFFF'), dataCell('카드지갑·키링, 남성 선호도 높음', 'FFFFFF'), dataCell('혼성 팀', 'FFFFFF')] }),
      new TableRow({ children: [dataCell('도자기 핀칭', LIGHT), dataCell('나만의 그릇 제작, 고급 체험', LIGHT), dataCell('임원·VIP 행사', LIGHT)] }),
      new TableRow({ children: [dataCell('맞춤 기획', 'FEF3C7'), dataCell('브랜드 로고 접목, 기업 테마 반영', 'FEF3C7'), dataCell('브랜딩 행사', 'FEF3C7')] }),
    ],
  }),
  sp(),
]

// ── 섹션 4: 파트너 지원 내용 ─────────────────────────
const sec4 = [
  heading1('4. 오센틱아트가 파트너사에게 제공하는 지원'),
  heading2('영업 지원'),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [hdrCell('지원 항목', DEEP, WHITE, 28), hdrCell('내용', DEEP, WHITE, 72)] }),
      new TableRow({ children: [dataCell('공동 제안서', LIGHT), dataCell('파트너사 브랜드 포함 맞춤 제안서 즉시 제작', LIGHT)] }),
      new TableRow({ children: [dataCell('견적서', 'FFFFFF'), dataCell('클라이언트 요구사항 기반 24시간 내 견적 제공', 'FFFFFF')] }),
      new TableRow({ children: [dataCell('데모 자료', LIGHT), dataCell('행사 현장 사진·영상·후기 자료 제공', LIGHT)] }),
      new TableRow({ children: [dataCell('시뮬레이션', 'FFFFFF'), dataCell('클라이언트 인원·예산 기반 최적 패키지 제안', 'FFFFFF')] }),
    ],
  }),
  sp(160),

  heading2('파트너 전용 혜택'),
  bullet('전담 파트너 매니저 배정 (카카오톡 직통 연락)'),
  bullet('파트너 전용 단가 제공 (소비자가 대비 할인 — 마진 자율 설정 가능)'),
  bullet('공동 SNS 홍보 (오센틱아트 채널에 파트너사 소개)'),
  bullet('우선 강사 배정 (성수기 일정 선점 가능)'),
  bullet('분기 파트너 간담회 초청 (신규 프로그램 우선 소개)'),
  sp(),
]

// ── 섹션 5: 차별화 ──────────────────────────────────
const sec5 = [
  heading1('5. 왜 오센틱아트와 함께해야 하는가'),
  heading2('파트너사 관점의 차별화'),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [hdrCell('기존 팀빌딩 콘텐츠', '6B7280', WHITE, 45), hdrCell('오센틱아트 공예 체험', AMBER, DEEP, 55)] }),
      new TableRow({ children: [dataCell('볼링·탈출방·요리클래스', LIGHT), dataCell('아직 안 해본 새로운 경험', LIGHT)] }),
      new TableRow({ children: [dataCell('참여 후 남는 것 없음', 'FFFFFF'), dataCell('완성품 가져가기 (오래 기억됨)', 'FFFFFF')] }),
      new TableRow({ children: [dataCell('대규모 일체형 진행', LIGHT), dataCell('소그룹 1:1 강사 지도, 몰입도 ↑', LIGHT)] }),
      new TableRow({ children: [dataCell('기획·섭외·운영 모두 직접', 'FFFFFF'), dataCell('오센틱아트가 모두 처리', 'FFFFFF')] }),
    ],
  }),
  sp(160),
  callout('클라이언트 후기: "회사에서 만든 거, 집에 두고 매일 쓰고 있어요"\n팀원들이 자연스럽게 대화하며 결속 → SNS 인증 자연 발생 → 기업 문화 홍보로 이어짐', GREEN_BG, GREEN),
  sp(),
]

// ── 섹션 6: 협력 프로세스 ────────────────────────────
const sec6 = [
  heading1('6. 협력 프로세스'),
  step(1, '파트너 계약 체결', '오센틱아트와 에이전시 파트너 협약서 서명 (수수료율·정산 조건·비밀유지 포함)'),
  sp(80),
  step(2, '클라이언트 소개', '파트너사가 클라이언트 정보 전달 (회사명·담당자·인원 규모·희망 일정)'),
  sp(80),
  step(3, '오센틱아트 → 직접 제안', '파트너사 브랜드 포함 맞춤 제안서·견적서 24시간 내 제공'),
  sp(80),
  step(4, '계약 체결 및 행사 진행', '계약·입금·강사 배정·현장 운영 모두 오센틱아트 처리'),
  sp(80),
  step(5, '수수료 정산', '행사 완료 후 익월 5일 파트너사 계좌로 자동 이체'),
  sp(),
]

// ── 섹션 7: FAQ ──────────────────────────────────────
const sec7 = [
  heading1('7. 자주 묻는 질문'),
  ...faqItem(
    '파트너 계약에 최소 소개 건수 의무가 있나요?',
    '없습니다. 부담 없이 시작하실 수 있습니다. 실적에 따라 수수료율만 올라가는 구조입니다.'
  ),
  ...faqItem(
    '클라이언트가 직접 오센틱아트에 연락하면 수수료가 안 나오나요?',
    '파트너사가 소개한 클라이언트는 등록 후 첫 거래 1년 이내 모든 계약에 수수료를 지급합니다. 직접 재계약도 포함됩니다.'
  ),
  ...faqItem(
    '지방 행사도 가능한가요?',
    '네. 서울·경기뿐 아니라 전국 주요 도시 강사 네트워크를 보유하고 있습니다. 출장비는 별도 협의합니다.'
  ),
  ...faqItem(
    '공동 제안서에 파트너사 로고를 넣을 수 있나요?',
    '가능합니다. 파트너사 브랜드 로고 포함 공동 제안서를 제작해 드립니다.'
  ),
  ...faqItem(
    '클라이언트에게 마진을 붙여서 판매해도 되나요?',
    '네. 파트너사 전용 단가(소비자가 대비 할인)를 제공하므로, 파트너사가 자율적으로 마진을 설정하실 수 있습니다.'
  ),
  sp(),
]

// ── 섹션 8: 신청 양식 & 마무리 ──────────────────────
const sec8 = [
  heading1('8. 파트너 신청'),
  body('아래 내용을 이메일로 보내주시면 영업일 1일 이내 연락드립니다.'),
  sp(80),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [hdrCell('파트너 신청 양식', DEEP, WHITE)] }),
      new TableRow({ children: [new TableCell({
        children: [
          body('회사명:'),
          body('담당자 성함:'),
          body('연락처 (전화 / 카카오):'),
          body('이메일:'),
          body('회사 소개 (업종·주요 서비스):'),
          body('주요 클라이언트 유형 (기업 규모·업종 등):'),
          body('월 예상 소개 건수 (대략):'),
          body('파트너십 시작 희망 시기:'),
          body('기타 문의사항:'),
        ],
        shading: { type: ShadingType.SOLID, color: 'F9FAFB' },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        margins: { top: 160, bottom: 160, left: 200, right: 200 },
      })]})
    ],
  }),
  sp(200),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({
      children: [
        new Paragraph({ children: [new TextRun({ text: '오센틱아트와 함께 성장하는 파트너가 되어주세요', bold: true, size: 24, color: WHITE, font: F })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
        new Paragraph({ children: [new TextRun({ text: '기획은 귀사가, 운영은 우리가. 클라이언트 만족은 우리가 함께 책임집니다.', size: 22, color: 'D1D5DB', font: F })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: 'authenticresinmaster@gmail.com', size: 22, color: AMBER, font: F, bold: true })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: 'authenticart.vercel.app', size: 22, color: AMBER, font: F })], alignment: AlignmentType.CENTER }),
      ],
      shading: { type: ShadingType.SOLID, color: DEEP },
      borders: none,
      margins: { top: 200, bottom: 200, left: 300, right: 300 },
    })]})],
  }),
  sp(),
  new Paragraph({
    children: [new TextRun({ text: '본 제안서의 수수료율·단가는 협의에 따라 조정될 수 있습니다. 작성일: 2026년 5월', size: 18, color: GREY, italics: true, font: F })],
    alignment: AlignmentType.CENTER,
  }),
]

// ── 문서 조립 ──────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: F, size: 22, color: '374151' },
        paragraph: { spacing: { line: 340 } },
      },
    },
  },
  sections: [{
    properties: {
      page: { margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 } },
    },
    children: [
      ...cover,
      ...sec1,
      ...sec2,
      ...sec3,
      ...sec4,
      ...sec5,
      ...sec6,
      ...sec7,
      ...sec8,
    ],
  }],
})

const buf = await Packer.toBuffer(doc)
writeFileSync('outputs/03-proposals/20260515-오센틱아트-에이전시파트너제안서.docx', buf)
console.log('완료: outputs/03-proposals/20260515-오센틱아트-에이전시파트너제안서.docx')
