import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, ShadingType, TableLayoutType, PageBreak
} from 'docx'
import { writeFileSync } from 'fs'

const DEEP   = '1F4145'
const AMBER  = 'FFBF00'
const GREY   = '6B7280'
const LIGHT  = 'FFFBEB'
const ALT    = 'F8FAFC'
const WHITE  = 'FFFFFF'
const GREEN  = '065F46'
const GREEN_BG = 'ECFDF5'

const thin = {
  top:    { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
  left:   { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
  right:  { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
}

function h1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 40, color: DEEP, font: 'Malgun Gothic' })],
    spacing: { before: 480, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: AMBER } },
  })
}
function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 30, color: DEEP, font: 'Malgun Gothic' })],
    spacing: { before: 360, after: 160 },
  })
}
function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: '374151', font: 'Malgun Gothic' })],
    spacing: { before: 280, after: 120 },
  })
}
function body(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: '374151', font: 'Malgun Gothic' })],
    spacing: { before: 80, after: 80 },
  })
}
function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: '374151', font: 'Malgun Gothic' })],
    bullet: { level: 0 },
    spacing: { before: 60, after: 60 },
  })
}
function callout(text, color = LIGHT, border = AMBER) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: DEEP, bold: true, font: 'Malgun Gothic' })],
    spacing: { before: 120, after: 120 },
    indent: { left: 360, right: 360 },
    shading: { type: ShadingType.SOLID, color },
    border: { left: { style: BorderStyle.SINGLE, size: 16, color: border } },
  })
}
function sp() { return new Paragraph({ text: '', spacing: { before: 80, after: 80 } }) }

function hCell(text, w) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, size: 20, color: WHITE, font: 'Malgun Gothic' })],
      alignment: AlignmentType.CENTER,
    })],
    width: { size: w, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: DEEP },
    borders: thin,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
  })
}
function dCell(text, w, alt = false, align = AlignmentType.LEFT) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, size: 20, color: '374151', font: 'Malgun Gothic' })],
      alignment: align,
    })],
    width: { size: w, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: alt ? ALT : WHITE },
    borders: thin,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
  })
}
function mkTable(headers, rows) {
  const w = Math.floor(100 / headers.length)
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map(h => hCell(h, w)), tableHeader: true }),
      ...rows.map((row, ri) =>
        new TableRow({ children: row.map(c => dCell(c, w, ri % 2 === 1)) })
      ),
    ],
  })
}

// ── 문서 빌드 ──
const children = [

  // 표지
  new Paragraph({ children: [new TextRun({ text: 'AUTHENTICART  오센틱아트', bold: true, size: 52, color: DEEP, font: 'Malgun Gothic' })], alignment: AlignmentType.CENTER, spacing: { before: 800, after: 240 } }),
  new Paragraph({ children: [new TextRun({ text: '광고·홍보 기획서', bold: true, size: 68, color: AMBER, font: 'Malgun Gothic' })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 240 } }),
  new Paragraph({ children: [new TextRun({ text: 'Phase 1 캠페인 전략 · 소재 · 매체 · 예산 집행 계획', size: 26, color: GREY, font: 'Malgun Gothic' })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 600 } }),
  new Paragraph({ children: [new TextRun({ text: '캠페인 기간: 2026년 6월 1일 ~ 8월 31일 (3개월)', size: 22, color: GREY, font: 'Malgun Gothic' })], alignment: AlignmentType.CENTER }),
  new Paragraph({ children: [new TextRun({ text: '총 광고 예산: 420만 원  |  목표: 강사 50명 · 월 GMV 5,000만 원', size: 22, color: GREY, font: 'Malgun Gothic' })], alignment: AlignmentType.CENTER, spacing: { after: 1200 } }),
  new Paragraph({ children: [new PageBreak()] }),

  // 1. 캠페인 전략
  h1('1. 캠페인 전략 개요'),
  h2('1-1. 캠페인 3개 축'),
  mkTable(
    ['캠페인', '타겟', '핵심 메시지', '예산 비중'],
    [
      ['A — 강사 모집', '레진아트·공예 강사', '수수료 86.7% — 업계 최고 조건', '50%'],
      ['B — 수강생 유입', '20~40대 공예 관심 여성', '내 근처 공예 클래스, 오센틱아트', '35%'],
      ['C — B2B 팀빌딩', '기업 복지·HR 담당자', '팀이 함께 만드는 공예 체험', '15%'],
    ]
  ),
  sp(),
  h2('1-2. 타겟별 핵심 메시지'),
  mkTable(
    ['타겟', 'Pain Point', '오센틱아트 해법', '광고 훅'],
    [
      ['강사', '클래스101·프립 수수료 30~35%', '수수료 13.3%만 공제 → 86.7% 수령', '"클래스 팔면 얼마 남아요?"'],
      ['수강생', '클래스·재료·마켓 앱 3개 사용', '한 앱에서 예약+재료+마켓', '"이걸 왜 여러 앱에서 했지?"'],
      ['기업 HR', '팀빌딩 아이디어 고갈', '강사 파견·재료 포함 공예 체험', '"올해 팀빌딩, 뭔가 다른 걸 해보세요"'],
    ]
  ),
  sp(),

  // 2. 광고 소재
  h1('2. 광고 소재 기획'),
  h2('캠페인 A — 강사 모집 소재'),
  h3('[A-1] 수수료 비교 카드뉴스 (인스타·페북 피드 5장 슬라이드)'),
  callout('콘셉트: 충격적인 숫자 비교 → 공감 → 해법 제시 → CTA'),
  body('장 1 (훅): 짙은 남색 배경 / "클래스 팔아봤자... 얼마나 남으세요?"'),
  body('장 2 (비교): 수수료 비교표 — 클래스101 195만 원 vs 오센틱아트 260만 원 (★)'),
  body('장 3 (강조): 앰버 배경 대형 텍스트 "연간 +780만 원"'),
  body('장 4 (신뢰): 얼리버드 혜택 4가지 체크리스트'),
  body('장 5 (CTA): "지금 강사 신청하기" / authenticart.vercel.app/instructor/apply'),
  sp(),

  h3('[A-2] 릴스 대본 — "강사님, 수수료 얼마 내고 계세요?" (15초)'),
  mkTable(
    ['시간', '화면', '자막'],
    [
      ['0~3초', '레진 작품 만드는 클로즈업', '"저 원데이클래스 강사인데요..."'],
      ['3~8초', '계산기 두드리는 손', '"수수료 35%... 이게 맞아?"'],
      ['8~13초', '오센틱아트 정산 화면', '"오센틱아트는 13.3%만 가져가요"'],
      ['13~15초', '로고 + URL', '"강사 신청 → authenticart.vercel.app"'],
    ]
  ),
  sp(),

  h3('[A-3] 검색광고 텍스트 (강사 타겟)'),
  body('키워드: 원데이클래스 강사 등록 / 클래스 플랫폼 수수료 / 공예 강사 플랫폼'),
  callout('제목1: 강사 수수료 86.7% — 업계 최고 | 제목2: 처음 한 달 수수료 0% 혜택 | 제목3: 레진·캔들·플라워 강사 모집 중'),
  body('설명문: "클래스101 대비 연간 780만 원 더 받는 공예 클래스 플랫폼. 예약·결제·정산·재료 쇼핑몰까지 한 번에."'),
  sp(),

  h2('캠페인 B — 수강생 유입 소재'),
  h3('[B-1] 릴스 — "이 앱 하나면 다 돼요" (20초)'),
  mkTable(
    ['시간', '화면', '자막'],
    [
      ['0~5초', '스마트폰 여러 앱 아이콘', '"공예 클래스 예약하려고 앱 3개 깔았어요 😅"'],
      ['5~12초', '앱 전환하며 헤매는 연출', '"클래스는 여기서, 재료는 저기서, 작품 팔려면 또..."'],
      ['12~18초', '오센틱아트 화면 자연스럽게 전환', '"오센틱아트 하나로 다 해결돼요. 예약 ✓ 재료 ✓ 마켓 ✓"'],
      ['18~20초', 'CTA', '"지금 클래스 찾아보기 👇"'],
    ]
  ),
  sp(),

  h3('[B-2] 지역 타겟 스토리 배너 (인스타·페북)'),
  body('형식: 세로형(9:16) 스토리 배너 — 지역별 5개 버전 (서울·경기·부산·제주·강릉)'),
  callout('이미지: 레진아트 작품 클로즈업 | 텍스트: "서울에서 레진아트 배우기 / 내 근처 강사가 직접 가르쳐요" | CTA: "클래스 보기"'),
  sp(),

  h3('[B-3] 검색광고 텍스트 (수강생 타겟)'),
  body('키워드: 레진아트 원데이클래스 / 공예클래스 근처 / 캔들만들기 클래스'),
  callout('제목1: 내 근처 레진아트 클래스 예약 | 제목2: 클래스+재료+작품마켓 한 곳에 | 제목3: 오늘 바로 예약 가능한 공예 클래스'),
  sp(),

  h2('캠페인 C — B2B 팀빌딩 소재'),
  h3('[C-1] 링크드인 스폰서드 콘텐츠'),
  body('이미지: 직원들이 테이블에 둘러앉아 레진 코스터를 만드는 장면 (밝은 오피스 분위기)'),
  callout('"올해 팀빌딩, 이건 어떠세요? 레진아트 코스터 — 1인당 3만 원, 전문 강사 파견, 재료 일체 포함, 2시간 완성"'),
  sp(),

  // 3. 매체별 집행
  h1('3. 매체별 광고 집행 계획'),
  h2('3-1. 인스타그램 광고'),
  mkTable(
    ['항목', '캠페인 A (강사)', '캠페인 B (수강생)'],
    [
      ['집행 형식', '피드 + 릴스', '스토리 + 릴스'],
      ['타겟 관심사', '공예, 핸드메이드, 소자본창업 / 25~45세', '원데이클래스, 레진아트 / 20~40세 여성'],
      ['지역', '전국', '서울·경기·부산·제주 (지역별 그룹)'],
      ['월 예산', '15만 원', '15만 원'],
      ['KPI', 'CPC 500원 이하', 'CPC 300원 이하'],
    ]
  ),
  sp(),

  h2('3-2. 구글 검색광고'),
  mkTable(
    ['항목', '캠페인 A (강사)', '캠페인 B (수강생)'],
    [
      ['광고 형식', '반응형 검색 광고(RSA)', '반응형 검색 광고(RSA)'],
      ['핵심 키워드', '원데이클래스 강사 등록, 공예 강사 플랫폼', '레진아트 원데이클래스, 공예클래스 [지역]'],
      ['입찰 전략', '전환수 최대화 (목표 CPA: 5,000원)', '클릭수 최대화 (목표 CPC: 300원)'],
      ['월 예산', '10만 원', '10만 원'],
      ['랜딩페이지', '/instructor/apply', '/classes (장르·지역 필터)'],
    ]
  ),
  sp(),

  h2('3-3. 네이버 / 카카오 / 링크드인'),
  mkTable(
    ['매체', '집행 형식', '타겟', '월 예산', 'KPI'],
    [
      ['네이버 파워링크', '검색 상단 노출', '공예 클래스 검색자', '10~15만 원', 'CPC 500원 이하'],
      ['카카오 비즈보드', '카카오톡 배너', '20~40대 여성 / 공방 3km 반경', '10만 원', '클래스 유입'],
      ['링크드인', '스폰서드 콘텐츠', 'HR·복지 담당자', '5~10만 원', 'B2B 문의 월 3건'],
    ]
  ),
  sp(),

  // 4. 랜딩페이지
  h1('4. 랜딩페이지 전략'),
  mkTable(
    ['랜딩 URL', '전환 목표', '핵심 섹션'],
    [
      ['/instructor/apply', '강사 신청서 제출', '수수료 비교 → 얼리버드 혜택 → 신청 폼'],
      ['/classes', '클래스 예약 완료', '장르+지역 필터 → 클래스 상세 → 결제'],
      ['/b2b (신규)', 'B2B 문의 폼 제출', '패키지 소개 → 진행 방식 → 문의 폼'],
    ]
  ),
  sp(),
  callout('[신규 개발 필요] /b2b 페이지 — 기업 팀빌딩 패키지 소개 + 문의 폼', GREEN_BG, GREEN),
  sp(),

  // 5. 예산
  h1('5. 월별 광고 예산 배분'),
  mkTable(
    ['구분', '1개월차 (6월)', '2개월차 (7월)', '3개월차 (8월)', '3개월 합계'],
    [
      ['인스타그램', '30만 원', '30만 원', '50만 원', '110만 원'],
      ['구글 검색', '20만 원', '30만 원', '20만 원', '70만 원'],
      ['네이버 검색', '10만 원', '15만 원', '20만 원', '45만 원'],
      ['카카오', '—', '10만 원', '10만 원', '20만 원'],
      ['링크드인', '5만 원', '10만 원', '10만 원', '25만 원'],
      ['콘텐츠 제작', '45만 원', '45만 원', '45만 원', '135만 원'],
      ['월 합계', '110만 원', '140만 원', '155만 원', '405만 원'],
    ]
  ),
  sp(),

  // 6. KPI
  h1('6. KPI & 성과 측정'),
  h2('6-1. 캠페인별 목표 KPI'),
  mkTable(
    ['캠페인', '지표', '1개월 목표', '3개월 목표'],
    [
      ['A. 강사 모집', '강사 신청서 제출', '20건', '80건'],
      ['A. 강사 모집', '강사 최종 승인', '10명', '50명'],
      ['A. 강사 모집', 'CPA (강사 1명)', '—', '14만 원 이하'],
      ['B. 수강생 유입', '클래스 목록 유입', '500 UV', '3,000 UV'],
      ['B. 수강생 유입', '예약 완료', '30건', '200건'],
      ['B. 수강생 유입', 'CPA (예약 1건)', '—', '3,500원 이하'],
      ['C. B2B', 'B2B 수주 완료', '1건', '5건'],
      ['C. B2B', '수주 단가', '—', '50만 원 이상'],
    ]
  ),
  sp(),

  h2('6-2. 광고 매체 효율 벤치마크'),
  mkTable(
    ['매체', '목표 CTR', '목표 CPC', '목표 전환율'],
    [
      ['인스타 피드', '1.5% 이상', '300원 이하', '2% 이상'],
      ['인스타 릴스', '3.0% 이상', '200원 이하', '1.5% 이상'],
      ['구글 검색', '5.0% 이상', '500원 이하', '5% 이상'],
      ['네이버 파워링크', '4.0% 이상', '500원 이하', '4% 이상'],
      ['링크드인', '0.5% 이상', '2,000원 이하', '3% 이상'],
    ]
  ),
  sp(),

  // 7. 소재 가이드라인
  h1('7. 광고 소재 가이드라인'),
  h2('7-1. 비주얼 디렉션'),
  mkTable(
    ['항목', '강사 모집 소재', '수강생 소재'],
    [
      ['색상 톤', '남색 + 앰버 — 전문적·신뢰감', '밝은 파스텔 + 화이트 — 따뜻함·설렘'],
      ['이미지 소재', '작업 중인 강사 손, 정산 화면 스크린샷', '수강생 웃는 모습, 완성된 작품 사진'],
      ['폰트', '굵은 산세리프 (숫자 강조)', '둥근 계열 고딕 (친근함)'],
      ['금지 소재', '스톡 이미지, 경쟁사 로고', '과장된 수익 문구 (광고법 위반)'],
    ]
  ),
  sp(),

  h2('7-2. 카피 5원칙'),
  bullet('숫자로 시작 — "86.7%", "연 780만 원", "1인 3만 원"'),
  bullet('질문형 훅 — "수수료 얼마 내고 계세요?", "왜 앱을 3개씩 써요?"'),
  bullet('Before/After 구조 — 현재 불편함 → 오센틱아트 해법'),
  bullet('CTA 명확화 — "지금 신청" / "클래스 찾기" / "견적 요청"'),
  bullet('과장 금지 — "최고", "보장", "무조건" 자제 (표시광고법 준수)'),
  sp(),

  // 8. 광고법
  h1('8. 광고법 준수 체크리스트'),
  body('배포 전 반드시 확인:'),
  bullet('"업계 최고" 표현 — 비교 근거 데이터 보유 여부 확인'),
  bullet('수수료 비교 수치 — 경쟁사 공개 정보 기반 + "추정치" 명시'),
  bullet('얼리버드 혜택 — 종료 조건 명시 ("선착순 50명", "~8월 31일까지")'),
  bullet('후기·추천사 사용 시 실제 사용 경험자 확인'),
  bullet('"수익 보장" 등 확정적 문구 배제'),
  bullet('개인정보 수집 광고 폼 — 수집 항목·목적·보유 기간 명시'),
  sp(),

  // 9. Phase 2 트리거
  h1('9. Phase 2 진입 트리거'),
  callout('아래 조건 모두 달성 시 → Phase 2 캠페인(인플루언서 + 유튜브 광고)으로 전환'),
  sp(),
  mkTable(
    ['조건', '목표 수치'],
    [
      ['강사 승인 수', '50명 이상'],
      ['월 GMV', '5,000만 원 이상'],
      ['클래스 개설 수', '150개 이상'],
      ['월 방문자 UV', '5,000 이상'],
    ]
  ),
  sp(),
  h3('Phase 2 추가 채널'),
  bullet('유튜브 인스트림 광고 (강사 스토리 15~30초)'),
  bullet('네이버 GFA (그래픽 배너)'),
  bullet('공예 마이크로 인플루언서 10명 협찬 (팔로워 1~5만 명)'),
  sp(),

  new Paragraph({
    children: [new TextRun({ text: '작성: 오센틱아트 마케팅부  |  2026년 5월 15일', size: 20, color: GREY, italics: true, font: 'Malgun Gothic' })],
    alignment: AlignmentType.CENTER,
  }),
]

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Malgun Gothic', size: 22, color: '374151' },
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
writeFileSync('outputs/04-marketing/20260515-오센틱아트-광고홍보기획서.docx', buf)
console.log('완료: outputs/04-marketing/20260515-오센틱아트-광고홍보기획서.docx')
