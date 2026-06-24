import {
  Document, Packer, Paragraph, TextRun,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, ShadingType, TableLayoutType, PageBreak,
  UnderlineType
} from 'docx'
import { writeFileSync } from 'fs'

const DEEP  = '1F4145'
const AMBER = 'FFBF00'
const AMBER_BG = 'FFFBEB'
const GREY  = '6B7280'
const WHITE = 'FFFFFF'
const ALT   = 'F8FAFC'
const GREEN = '065F46'
const GREEN_BG = 'ECFDF5'
const BLUE_BG = 'EFF6FF'
const BLUE = '1E40AF'

const thin = {
  top:    { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
  left:   { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
  right:  { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
}
const none = { top:{style:BorderStyle.NONE,size:0}, bottom:{style:BorderStyle.NONE,size:0}, left:{style:BorderStyle.NONE,size:0}, right:{style:BorderStyle.NONE,size:0} }

const F = 'Malgun Gothic'

function cover() {
  return [
    new Paragraph({ text: '', spacing: { before: 600 } }),
    new Paragraph({
      children: [new TextRun({ text: 'AUTHENTICART', bold: true, size: 28, color: GREY, font: F, characterSpacing: 200 })],
      alignment: AlignmentType.CENTER, spacing: { before: 0, after: 160 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '오센틱아트', bold: true, size: 56, color: DEEP, font: F })],
      alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '기업 공예 체험', bold: true, size: 72, color: AMBER, font: F })],
      alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '팀빌딩 프로그램 제안서', bold: true, size: 48, color: DEEP, font: F })],
      alignment: AlignmentType.CENTER, spacing: { before: 0, after: 480 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '전문 강사가 직접 찾아오는 공예 팀빌딩', size: 26, color: GREY, font: F })],
      alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '10인 기준 30만 원  ·  2시간 완성  ·  완성품 가져가기', size: 24, color: AMBER, bold: true, font: F })],
      alignment: AlignmentType.CENTER, spacing: { before: 0, after: 800 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'authenticresinmaster@gmail.com  |  authenticart.vercel.app', size: 22, color: GREY, font: F })],
      alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '2026년 5월', size: 22, color: GREY, font: F })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ]
}

function h1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 38, color: DEEP, font: F })],
    spacing: { before: 480, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: AMBER } },
  })
}
function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: DEEP, font: F })],
    spacing: { before: 360, after: 160 },
  })
}
function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: '374151', font: F })],
    spacing: { before: 240, after: 100 },
  })
}
function body(text, bold = false) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: '374151', bold, font: F })],
    spacing: { before: 80, after: 80 },
  })
}
function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: '374151', font: F })],
    bullet: { level: 0 },
    spacing: { before: 60, after: 60 },
  })
}
function sp() { return new Paragraph({ text: '', spacing: { before: 80, after: 80 } }) }

function callout(text, bg = AMBER_BG, border = AMBER) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: DEEP, bold: true, font: F })],
    spacing: { before: 140, after: 140 },
    indent: { left: 360, right: 360 },
    shading: { type: ShadingType.SOLID, color: bg },
    border: { left: { style: BorderStyle.SINGLE, size: 16, color: border } },
  })
}

function hCell(text, w, span = 1) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: WHITE, font: F })], alignment: AlignmentType.CENTER })],
    width: { size: w, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: DEEP },
    borders: thin,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
  })
}
function dCell(text, w, alt = false, align = AlignmentType.LEFT, bold = false) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: 20, color: '374151', bold, font: F })], alignment: align })],
    width: { size: w, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: alt ? ALT : WHITE },
    borders: thin,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
  })
}
function accentCell(text, w) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: 20, color: WHITE, bold: true, font: F })], alignment: AlignmentType.CENTER })],
    width: { size: w, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: AMBER },
    borders: thin,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
  })
}

function mkTable(headers, rows, colWidths) {
  const w = colWidths || Array(headers.length).fill(Math.floor(100 / headers.length))
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map((h, i) => hCell(h, w[i])), tableHeader: true }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((c, ci) => dCell(c, w[ci], ri % 2 === 1))
      })),
    ],
  })
}

// ── 패키지 테이블 ──
function pkgTable(title, rows, highlight = false) {
  const headerColor = highlight ? AMBER : DEEP
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 24, color: WHITE, font: F })], alignment: AlignmentType.CENTER })],
            columnSpan: 2,
            shading: { type: ShadingType.SOLID, color: headerColor },
            borders: thin, margins: { top: 120, bottom: 120, left: 120, right: 120 },
          }),
        ],
        tableHeader: true,
      }),
      ...rows.map(([k, v], ri) => new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: k, size: 20, bold: true, color: DEEP, font: F })] })],
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: ri % 2 === 0 ? 'F9FAFB' : WHITE },
            borders: thin, margins: { top: 80, bottom: 80, left: 120, right: 120 },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: v, size: 20, color: '374151', font: F })] })],
            width: { size: 70, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: ri % 2 === 0 ? WHITE : ALT },
            borders: thin, margins: { top: 80, bottom: 80, left: 120, right: 120 },
          }),
        ],
      })),
    ],
  })
}

// ── 프로세스 스텝 ──
function step(num, title, desc) {
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: `STEP\n${num}`, bold: true, size: 24, color: WHITE, font: F })], alignment: AlignmentType.CENTER })],
          width: { size: 12, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, color: AMBER },
          borders: none, margins: { top: 120, bottom: 120, left: 120, right: 120 },
          verticalAlign: 'center',
        }),
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 24, color: DEEP, font: F })], spacing: { after: 60 } }),
            new Paragraph({ children: [new TextRun({ text: desc, size: 20, color: GREY, font: F })] }),
          ],
          width: { size: 88, type: WidthType.PERCENTAGE },
          borders: none, margins: { top: 120, bottom: 120, left: 200, right: 120 },
        }),
      ],
    })],
  })
}

function stepArrow() {
  return new Paragraph({ children: [new TextRun({ text: '▼', size: 20, color: AMBER, font: F })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
}

// ──────────────────────────────────────────────────────────
//  문서 조립
// ──────────────────────────────────────────────────────────
const children = [
  ...cover(),

  // 1. 소개
  h1('1. 오센틱아트 소개'),
  body('오센틱아트는 전국 공예·예술 강사와 기업·기관을 연결하는 공예 종합 플랫폼입니다.'),
  sp(),
  mkTable(
    ['항목', '내용'],
    [
      ['플랫폼', 'authenticart.vercel.app'],
      ['서비스 범위', '클래스 예약 · 재료 쇼핑 · 작품 거래 · B2B 단체 출강'],
      ['강사 검증', '신청 후 관리자 심사 통과한 검증 강사만 활동'],
      ['결제·정산', '토스페이먼츠 공식 연동, 자동 정산 시스템'],
      ['장르', '레진아트 · 캔들 · 플라워 · 도자기 · 주얼리 · 자수 · 회화 · 목공예'],
    ],
    [30, 70]
  ),
  sp(),

  // 2. 왜 공예 팀빌딩인가
  h1('2. 왜 공예 팀빌딩인가'),
  callout('최근 기업 복지는 "경험"으로 이동하고 있습니다 — 상품권·포인트에서 함께 만들고 기억에 남는 것으로'),
  sp(),
  mkTable(
    ['항목', '공예 팀빌딩', '볼링·탈출방', '외식·회식'],
    [
      ['기억에 남는 결과물', '✅ 완성품 보유', '❌', '❌'],
      ['전 연령·체력 무관', '✅', '⚠️', '✅'],
      ['자연스러운 대화 유도', '✅ 손 쓰며 대화', '⚠️', '✅'],
      ['사진 콘텐츠 활용', '✅ 작품·작업 장면', '⚠️', '⚠️'],
      ['비용 대비 임팩트', '✅ 높음', '보통', '보통'],
    ],
    [32, 23, 22, 23]
  ),
  sp(),

  // 3. 패키지
  h1('3. 프로그램 패키지'),
  sp(),
  pkgTable('패키지 1 — 스탠다드', [
    ['대상 인원', '10명'],
    ['총 비용', '30만 원 (1인 3만 원)'],
    ['소요 시간', '2시간'],
    ['포함 내역', '전문 강사 파견 · 재료 일체 · 도구 일체 · 완성품 포장'],
    ['추천 장르', '레진아트 코스터 (기본) / 캔들 / 플라워 (선택 가능)'],
    ['진행 장소', '귀사 지정 장소 방문 (사무실·회의실·행사장)'],
  ]),
  sp(),
  pkgTable('패키지 2 — 프리미엄 ★ 추천', [
    ['대상 인원', '20명'],
    ['총 비용', '55만 원 (1인 2.75만 원)'],
    ['소요 시간', '2~2.5시간'],
    ['포함 내역', '스탠다드 + 기념 포장 박스 + 단체 기념 사진 촬영'],
    ['추천 장르', '레진아트 코스터·트레이 / 소이캔들 / 프리저브드 플라워'],
    ['진행 장소', '귀사 지정 장소 방문'],
  ], true),
  sp(),
  pkgTable('패키지 3 — 기업 맞춤', [
    ['대상 인원', '30명 이상'],
    ['비용', '별도 견적 (규모·장르·옵션에 따라 협의)'],
    ['포함 내역', '프리미엄 + 브랜드 로고 각인 · 테마 커스텀 · 다회차 운영'],
    ['특이사항', '창립기념일·워크숍·신제품 런칭 등 테마 반영 가능'],
  ]),
  sp(),
  callout('얼리버드 혜택 (2026년 8월 31일까지 계약 시): 기본 패키지 외 기념 포장 박스 무상 추가 제공', GREEN_BG, GREEN),
  sp(),

  // 4. 장르별 안내
  h1('4. 장르별 프로그램 안내'),
  sp(),
  mkTable(
    ['장르', '난이도', '소요시간', '결과물', '특징'],
    [
      ['레진아트 코스터', '★★☆', '1.5~2시간', '코스터 1개', '색상·디자인 직접 선택, 시각적으로 화려함'],
      ['소이 캔들', '★☆☆', '1~1.5시간', '캔들 1개', '향 선택 과정이 감성적, 실생활 사용 가능'],
      ['프리저브드 플라워 리스', '★★☆', '1.5~2시간', '리스 또는 액자 1개', '알레르기 없음, 사무실 인테리어 활용'],
    ],
    [20, 14, 16, 18, 32]
  ),
  sp(),

  // 5. 진행 프로세스
  h1('5. 진행 프로세스'),
  sp(),
  step('1', '문의 접수', '인원 / 희망 일정 / 장르 / 장소를 이메일로 알려주세요'),
  stepArrow(),
  step('2', '견적 발송 (24시간 내)', '오센틱아트가 맞춤 견적서 발송 — 장르·인원·옵션별 최종 금액 확정'),
  stepArrow(),
  step('3', '일정·강사 확정', '지역 내 검증 강사 매칭, 날짜·시간·장소 최종 확인'),
  stepArrow(),
  step('4', '사전 준비 안내 (행사 3일 전)', '진행 방식, 테이블 세팅 가이드, 준비 사항 공지'),
  stepArrow(),
  step('5', '현장 진행', '강사 30분 전 도착 → 세팅 → 2시간 진행 → 완성품 포장 + 기념사진'),
  sp(),

  // 6. 활용 상황
  h1('6. 이럴 때 딱 맞습니다'),
  mkTable(
    ['상황', '추천 패키지', '추천 장르'],
    [
      ['신입사원 OT / 환영 행사', '스탠다드 (10명)', '레진아트 코스터'],
      ['분기별 팀 결속 프로그램', '스탠다드~프리미엄', '캔들 또는 레진'],
      ['창립기념일 이벤트', '기업 맞춤', '로고 각인 레진 트레이'],
      ['임직원 명절 선물 제작', '프리미엄', '소이캔들 (선물 포장 포함)'],
      ['고객사 초청 VIP 행사', '기업 맞춤', '플라워·프리미엄 소재'],
      ['여성의 날 / 시즌 이벤트', '스탠다드', '플라워 리스'],
    ],
    [40, 30, 30]
  ),
  sp(),

  // 7. FAQ
  h1('7. 자주 묻는 질문 (FAQ)'),
  sp(),
  h3('Q. 미술을 전혀 못해도 괜찮나요?'),
  callout('A. 네, 완전 처음이어도 강사가 단계별로 안내해드립니다. 90% 이상의 참가자가 "생각보다 잘 됐어요!"라고 말합니다.', BLUE_BG, BLUE),
  sp(),
  h3('Q. 몇 명까지 한 번에 가능한가요?'),
  callout('A. 기본 10~20명이 최적이지만, 강사 추가 배정으로 50명 이상도 가능합니다. 별도 견적 문의 주세요.', BLUE_BG, BLUE),
  sp(),
  h3('Q. 회사 회의실에서도 진행할 수 있나요?'),
  callout('A. 네. 테이블이 있는 공간이면 어디든 가능합니다. 바닥 오염 방지 매트도 강사가 지참합니다.', BLUE_BG, BLUE),
  sp(),
  h3('Q. 행사 일정이 갑자기 변경되면 어떻게 되나요?'),
  callout('A. 행사 3일 전까지 일정 변경 시 100% 재조율 가능합니다. 자세한 정책은 계약서에 명시됩니다.', BLUE_BG, BLUE),
  sp(),
  h3('Q. 재료비가 따로 드나요?'),
  callout('A. 패키지 금액에 재료·도구·강사 파견비가 모두 포함됩니다. 추가 비용 없습니다.', BLUE_BG, BLUE),
  sp(),
  h3('Q. 세금계산서 발행이 가능한가요?'),
  callout('A. 네, 사업자 대상 세금계산서 발행 가능합니다. 문의 시 사업자등록번호를 알려주세요.', BLUE_BG, BLUE),
  sp(),

  // 8. 견적 요청
  h1('8. 견적 요청 안내'),
  body('아래 내용을 이메일로 보내주시면 24시간 내 맞춤 견적서를 발송해드립니다.', false),
  sp(),
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '견적 요청 양식', bold: true, size: 24, color: WHITE, font: F })], alignment: AlignmentType.CENTER })],
          columnSpan: 2,
          shading: { type: ShadingType.SOLID, color: DEEP },
          borders: thin, margins: { top: 120, bottom: 120, left: 120, right: 120 },
        }),
      ], tableHeader: true }),
      ...([
        ['회사명', ''],
        ['담당자 성함·직함', ''],
        ['연락처 (이메일 / 전화)', ''],
        ['희망 인원', '명'],
        ['희망 일정 1순위', '년   월   일   시'],
        ['희망 일정 2순위', '년   월   일   시'],
        ['진행 장소', '사무실 / 행사장 / 기타'],
        ['희망 장르', '(정하지 않아도 됩니다)'],
        ['특이사항·요청사항', ''],
        ['세금계산서 필요 여부', '필요  /  불필요'],
      ]).map(([k, v], ri) => new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k, size: 20, bold: true, color: DEEP, font: F })] })], width: { size: 35, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.SOLID, color: ri%2===0?'F9FAFB':WHITE }, borders: thin, margins:{top:80,bottom:80,left:120,right:120} }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: v, size: 20, color: GREY, font: F })] })], width: { size: 65, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.SOLID, color: ri%2===0?WHITE:ALT }, borders: thin, margins:{top:80,bottom:80,left:120,right:120} }),
      ]})),
    ],
  }),
  sp(),

  // 연락처 박스
  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [
      new TableCell({
        children: [
          new Paragraph({ children: [new TextRun({ text: '문의 및 견적 요청', bold: true, size: 24, color: WHITE, font: F })], alignment: AlignmentType.CENTER, spacing:{after:120} }),
          new Paragraph({ children: [new TextRun({ text: '이메일:  authenticresinmaster@gmail.com', size: 22, color: WHITE, font: F })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: '플랫폼:  authenticart.vercel.app', size: 22, color: WHITE, font: F })], alignment: AlignmentType.CENTER }),
        ],
        shading: { type: ShadingType.SOLID, color: DEEP },
        borders: none,
        margins: { top: 200, bottom: 200, left: 200, right: 200 },
      }),
    ]})],
  }),
  sp(),
  callout('담당자가 할 일은 인원과 날짜를 알려주는 것뿐입니다. 나머지는 오센틱아트가 모두 책임집니다.', GREEN_BG, GREEN),
  sp(),

  new Paragraph({
    children: [new TextRun({ text: '오센틱아트 (AuthenticArt)  |  authenticresinmaster@gmail.com  |  authenticart.vercel.app', size: 18, color: GREY, italics: true, font: F })],
    alignment: AlignmentType.CENTER, spacing: { before: 400 },
  }),
  new Paragraph({
    children: [new TextRun({ text: '본 제안서의 가격 및 조건은 참고용이며, 최종 계약 시 확정됩니다. | 2026년 5월 작성', size: 18, color: GREY, italics: true, font: F })],
    alignment: AlignmentType.CENTER,
  }),
]

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
    properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    children,
  }],
})

const buf = await Packer.toBuffer(doc)
writeFileSync('outputs/03-proposals/20260515-오센틱아트-B2B팀빌딩제안서.docx', buf)
console.log('완료: outputs/03-proposals/20260515-오센틱아트-B2B팀빌딩제안서.docx')
