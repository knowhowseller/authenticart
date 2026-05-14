import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, ShadingType, TableLayoutType, Header,
  ImageRun
} from 'docx'
import { writeFileSync, readFileSync } from 'fs'

const BRAND_AMBER = '00B4D8'
const BRAND_DEEP  = '1A1A2E'
const BRAND_GREY  = '6B7280'
const LIGHT_BG    = 'F0FAFF'
const TABLE_HDR   = '1A1A2E'
const TABLE_ALT   = 'F8FAFC'

const noBorder = {
  top:    { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left:   { style: BorderStyle.NONE, size: 0 },
  right:  { style: BorderStyle.NONE, size: 0 },
}

const thinBorder = {
  top:    { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
  left:   { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
  right:  { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
}

function heading1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BRAND_AMBER } },
    run: { color: BRAND_DEEP, bold: true, size: 36 },
  })
}

function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: BRAND_DEEP })],
    spacing: { before: 360, after: 160 },
  })
}

function heading3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: '374151' })],
    spacing: { before: 280, after: 120 },
  })
}

function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: '374151', ...opts })],
    spacing: { before: 80, after: 80 },
  })
}

function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: '374151' })],
    bullet: { level },
    spacing: { before: 60, after: 60 },
  })
}

function callout(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: BRAND_DEEP, bold: true })],
    spacing: { before: 120, after: 120 },
    indent: { left: 360, right: 360 },
    shading: { type: ShadingType.SOLID, color: LIGHT_BG },
    border: {
      left: { style: BorderStyle.SINGLE, size: 16, color: BRAND_AMBER },
    },
  })
}

function spacer() {
  return new Paragraph({ text: '', spacing: { before: 100, after: 100 } })
}

function hdrCell(text, widthPct) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, size: 20, color: 'FFFFFF' })],
      alignment: AlignmentType.CENTER,
    })],
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: TABLE_HDR },
    borders: thinBorder,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
  })
}

function dataCell(text, widthPct, alt = false, align = AlignmentType.LEFT) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, size: 20, color: '374151' })],
      alignment: align,
    })],
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: alt ? TABLE_ALT : 'FFFFFF' },
    borders: thinBorder,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
  })
}

function makeTable(headers, rows) {
  const colW = Math.floor(100 / headers.length)
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map(h => hdrCell(h, colW)), tableHeader: true }),
      ...rows.map((row, ri) =>
        new TableRow({ children: row.map(cell => dataCell(cell, colW, ri % 2 === 1)) })
      ),
    ],
  })
}

// ──────────────────────────────────────────────────────────
//  문서 콘텐츠 빌드
// ──────────────────────────────────────────────────────────

const children = [

  // ── 표지 ──
  new Paragraph({
    children: [new TextRun({ text: 'AUTHENTICART  오센틱아트', bold: true, size: 52, color: BRAND_DEEP })],
    alignment: AlignmentType.CENTER, spacing: { before: 800, after: 240 },
  }),
  new Paragraph({
    children: [new TextRun({ text: '마케팅 실행 계획', bold: true, size: 64, color: BRAND_AMBER })],
    alignment: AlignmentType.CENTER, spacing: { before: 0, after: 240 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Phase 1~3 로드맵 기반 채널별 전략 · 예산 · KPI', size: 28, color: BRAND_GREY })],
    alignment: AlignmentType.CENTER, spacing: { before: 0, after: 800 },
  }),
  new Paragraph({
    children: [new TextRun({ text: '작성 기준일: 2026년 5월 14일', size: 22, color: BRAND_GREY })],
    alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 },
  }),
  new Paragraph({
    children: [new TextRun({ text: '문서 버전: v1.0  |  배포 대상: 내부 운영 · 파트너 검토용', size: 22, color: BRAND_GREY })],
    alignment: AlignmentType.CENTER, spacing: { before: 0, after: 1200 },
  }),
  new Paragraph({ children: [new TextRun({ text: '', size: 22 })], pageBreakBefore: true }),

  // ── Executive Summary ──
  heading1('Executive Summary'),
  callout('핵심 레버: 강사 수수료 86.7% — 클래스101(65%) 대비 연간 +780만 원'),
  spacer(),
  body('오센틱아트 마케팅의 핵심 레버는 단 하나, "강사 수수료 86.7%"입니다. 클래스101 대비 연간 780만 원을 더 벌 수 있다는 메시지가 강사를 유입시키고, 검증된 강사의 클래스가 수강생을 끌어들이며, 수강생이 재료를 사고 작품을 팔면서 플랫폼 생태계가 돌아갑니다.'),
  spacer(),
  heading3('Phase 1 마케팅 3대 축'),
  bullet('강사 집중 공략 — 레진아트 강사 DM·커뮤니티 (수수료 메시지)'),
  bullet('SEO 선점 — "공예클래스 [지역]" 키워드 블로그 100편'),
  bullet('B2B 씨앗 심기 — HR 담당자 대상 공예 팀빌딩 패키지 영업'),
  spacer(),

  // ── 1. STP ──
  heading1('1. STP 전략'),

  heading2('1-1. 세분화 (Segmentation)'),
  makeTable(
    ['세그먼트', '설명', '규모 (추정)'],
    [
      ['레진아트 강사', '인스타·유튜브 팔로워 보유. 타 플랫폼 수수료 불만.', '국내 2,000~5,000명'],
      ['취미 공예 수강생', '20~40대 여성. 원데이클래스 경험 70%+. 재구매율 높음.', '핵심 수요층 200만 명+'],
      ['기업 복지 담당자', '팀빌딩·문화행사 예산 보유. 체험형 활동 선호.', '전국 기업 수만 개'],
      ['공예 재료 공급사', '스마트스토어 중심. 강사 추천 채널 없음.', '국내 활동 수백 개'],
    ]
  ),
  spacer(),

  heading2('1-2. 타겟팅 (Targeting)'),
  callout('Phase 1 집중 타겟: 레진아트 강사 (공급자) + 서울·경기 공예 수강생 (수요자)'),
  bullet('레진아트는 오센틱아트 창업자의 전문 분야 → 신뢰 기반 영업 가능'),
  bullet('강사 유입이 수강생 유입을 자동 유발하는 구조'),
  bullet('레진아트 성공 → 캔들·플라워·도자기 순차 확장'),
  spacer(),

  heading2('1-3. 포지셔닝 (Positioning)'),
  callout('"강사에게 가장 공정한 공예 플랫폼"'),
  body('수수료 86.7%를 전면에 내세워 타 플랫폼에서 이탈하는 강사를 집중 흡수합니다.'),
  heading3('부수 포지셔닝'),
  bullet('수강생: "클래스 예약부터 재료 구매까지 한 곳에서"'),
  bullet('기업: "전문 공예 강사와 함께하는 팀빌딩"'),
  bullet('공급사: "강사가 추천하는 재료 쇼핑몰 입점"'),
  spacer(),

  // ── 2. Phase별 계획 ──
  heading1('2. Phase별 마케팅 실행 계획'),

  heading2('Phase 1 (0~6개월): 레진아트 거점 구축'),
  makeTable(
    ['핵심 목표', '수치'],
    [
      ['강사 승인 완료', '50명'],
      ['누적 후기', '200건'],
      ['월 GMV', '5,000만 원'],
      ['SEO 목표', '"공예클래스 서울" 구글 3페이지 이내'],
    ]
  ),
  spacer(),

  heading3('2-1. 강사 모집 캠페인'),
  body('타겟: 인스타·유튜브 팔로워 1,000명 이상 레진아트 강사'),
  callout('월 매출 300만 원 기준 ─ 클래스101 실수령 195만 원 vs 오센틱아트 260만 원 (차이: 연간 +780만 원)'),
  spacer(),
  makeTable(
    ['채널', '방법', '주간 목표'],
    [
      ['인스타그램 DM', '레진아트 해시태그 강사 탐색 → 개별 DM', '20건/주'],
      ['네이버 카페', '레진아트/공예 강사 커뮤니티 홍보 게시글', '주 2개 카페'],
      ['유튜브 강사 접촉', '공예 유튜버 DM + 콜라보 제안', '월 10명'],
      ['오프라인 공방 방문', '지역 레진아트 공방 직접 방문 설명', '주 2~3곳'],
    ]
  ),
  spacer(),

  heading3('얼리버드 강사 온보딩 패키지 (첫 3개월)'),
  bullet('첫 달 플랫폼 수수료 0% — 강사 100% 수령'),
  bullet('강사 소개 페이지 SEO 최적화 무료 지원'),
  bullet('공식 SNS 강사 피처링 보장 (인스타 1회 + 블로그 1편)'),
  spacer(),

  heading3('2-2. SEO / 블로그 콘텐츠 전략'),
  body('목표: 6개월간 블로그 100편 발행 (월 17편)'),
  spacer(),
  makeTable(
    ['콘텐츠 필러', '편수', '예시 주제'],
    [
      ['지역별 클래스 가이드', '40편', '"서울 레진아트 원데이클래스 추천 TOP 5"'],
      ['장르 입문 가이드', '20편', '"레진아트 처음 시작하는 법"'],
      ['강사 인터뷰·성공 스토리', '20편', '"월 300만 원 버는 레진아트 강사의 하루"'],
      ['수강생 후기·작품 갤러리', '10편', '"레진아트 원데이클래스 후기"'],
      ['B2B·팀빌딩 콘텐츠', '10편', '"팀빌딩 아이디어 공예 체험 어때요"'],
    ]
  ),
  spacer(),

  heading3('우선 공략 SEO 키워드'),
  makeTable(
    ['키워드', '경쟁도', '우선순위'],
    [
      ['레진아트 클래스', '중', 'P0'],
      ['레진아트 원데이클래스', '중', 'P0'],
      ['공예 원데이클래스 [서울/경기/부산]', '낮음', 'P0'],
      ['레진아트 강사되는법', '낮음', 'P1'],
      ['캔들만들기 클래스', '중', 'P1'],
      ['도자기체험 [지역]', '낮음', 'P2'],
    ]
  ),
  spacer(),

  heading3('2-3. 인스타그램 · 숏폼 콘텐츠'),
  makeTable(
    ['콘텐츠 유형', '비율', '형식', '빈도'],
    [
      ['강사 작품 갤러리', '40%', '정방형 이미지·릴스', '매일 1건'],
      ['클래스 소개·예약 안내', '30%', '카드뉴스·릴스', '주 3건'],
      ['수강생 후기·결과물', '20%', '스토리·피드', '주 2건'],
      ['플랫폼·이벤트 소식', '10%', '카드뉴스', '주 1건'],
    ]
  ),
  spacer(),

  heading3('릴스 후킹 문구 예시 (월별 4편)'),
  bullet('"클래스 팔면 86.7% 가져가는 공예 플랫폼이 있다고?"'),
  bullet('"레진아트 원데이클래스, 이렇게 예쁜 결과물 나왔어요"'),
  bullet('"퇴근 후 혼자 가는 공예 클래스, 이제 이 앱 하나로"'),
  bullet('"강사님이 직접 추천하는 레진 재료 쇼핑 꿀팁"'),
  spacer(),

  heading3('2-4. B2B 파이프라인 구축'),
  body('타겟: 50~500인 기업 복지·교육 담당자'),
  callout('팀원 10명이 함께 만드는 레진아트 코스터 — 1인당 3만 원, 강사 파견, 재료 일체 포함, 2시간 완성'),
  spacer(),
  makeTable(
    ['패키지', '인원', '단가', '포함 내용'],
    [
      ['스탠다드', '10명', '30만 원', '레진 코스터 제작·재료·강사 파견·2시간'],
      ['프리미엄', '20명', '55만 원', '스탠다드 + 기념 포장 + 단체 사진'],
      ['기업 맞춤', '50명+', '견적', '테마 커스텀·브랜딩 가능'],
    ]
  ),
  spacer(),

  body('영업 채널:'),
  bullet('링크드인 — HR 담당자 DM 영업'),
  bullet('기업 복지몰 입점 (퍼플, 복지나라, 베네피아)'),
  bullet('지역 상공회의소 기업 복지 행사 제안'),
  spacer(),

  heading2('Phase 2 (6~18개월): 전 장르 확장 + 벤더·에이전시'),
  makeTable(
    ['핵심 목표', '수치'],
    [
      ['강사', '300명'],
      ['입점 벤더', '10개사'],
      ['입점 에이전시', '5개'],
      ['월 GMV', '3억 원'],
    ]
  ),
  spacer(),

  heading3('장르 확장 패턴 (레진 → 캔들 → 플라워 → 도자기 → 주얼리)'),
  bullet('해당 장르 Top 5 강사 얼리버드 섭외 (첫 달 수수료 0%)'),
  bullet('장르 특화 블로그 20편 발행 (SEO 조기 선점)'),
  bullet('인스타 해시태그 장르별 집중 운영 2주'),
  bullet('장르 특화 재료 공급사 1~2개 벤더 입점 유도'),
  bullet('"XXX장르 클래스 오픈" 공식 보도자료 발행'),
  spacer(),

  heading3('벤더 입점 인센티브'),
  bullet('첫 3개월 수수료 10% 적용 (이후 15%)'),
  bullet('강사 연결 우선 노출 보장'),
  bullet('오센틱아트 공식 SNS 입점 소개 게시물'),
  spacer(),

  heading2('Phase 3 (18개월~3년): 공예 허브화'),
  makeTable(
    ['핵심 목표', '수치'],
    [
      ['강사', '2,000명'],
      ['지부', '10개'],
      ['연 GMV', '100억 원+'],
    ]
  ),
  spacer(),
  makeTable(
    ['전략', '내용'],
    [
      ['오센틱아트 인증 강사 제도', '"AA급 인증" 배지 → 강사 자발 홍보'],
      ['공예 미디어 채널화', '유튜브 "오센틱아트 TV" — 강사 제작 콘텐츠 큐레이션'],
      ['구독 키트 론칭', '월정액 재료 키트 × 클래스 연동 → D2C 수익원 추가'],
      ['K-공예 해외 마케팅', '해외 공예 커뮤니티 대상 한국 공예 클래스 홍보'],
      ['오프라인 이벤트', '연 1회 "오센틱아트 공예 페스티벌" 개최'],
    ]
  ),
  spacer(),

  // ── 3. 채널별 전략 ──
  heading1('3. 채널별 마케팅 전략 요약'),
  makeTable(
    ['채널', 'Phase 1', 'Phase 2', 'Phase 3'],
    [
      ['인스타그램', '강사 모집 DM + 피드 운영', '장르별 전문 콘텐츠', '브랜드 미디어화'],
      ['SEO 블로그', '지역+장르 키워드 100편', '장르 확장 50편 추가', '롱테일 키워드 집대성'],
      ['유튜브', '강사 소개 릴스', '장르 입문 시리즈', '오센틱아트TV 채널'],
      ['네이버 카페', '공예 강사 커뮤니티 홍보', '장르별 카페 공략', '오센틱아트 공식 카페'],
      ['링크드인', 'HR 담당자 B2B 영업', 'B2B 콘텐츠 마케팅', '파트너십 소식'],
      ['이메일', '강사 뉴스레터 (온보딩)', '수강생 리텐션 시퀀스', '벤더·에이전시 전용'],
      ['오프라인', '강사 방문 영업', '공예 전시회', '연 1회 페스티벌'],
    ]
  ),
  spacer(),

  // ── 4. 콘텐츠 캘린더 ──
  heading1('4. 콘텐츠 캘린더 (Phase 1 — 1개월 예시)'),
  makeTable(
    ['주차', '인스타 피드', '블로그', '릴스', 'B2B 액션'],
    [
      ['1주', '강사 소개 × 3', '서울 레진아트 클래스 추천', '수수료 비교 영상', '링크드인 HR 담당자 20명 DM'],
      ['2주', '수강생 작품 × 3', '레진아트 입문 가이드', '수강생 후기 영상', '기업 복지 담당자 카페 게시물'],
      ['3주', '강사 인터뷰 × 2 + 이벤트 × 1', '경기 원데이클래스 추천', '강사 하루 일상', '복지몰 입점 문의 2곳'],
      ['4주', '작품 갤러리 × 3', '레진아트 재료 준비물', '클래스 예약 방법', 'B2B 견적 제안서 발송 5건'],
    ]
  ),
  spacer(),

  // ── 5. 예산 ──
  heading1('5. 예산 계획 (Phase 1 — 6개월)'),
  body('최소 비용 구조 — 대부분의 실행을 대표가 직접 운영하는 것을 전제합니다.'),
  spacer(),
  makeTable(
    ['항목', '월 예산', '6개월 합계', '비고'],
    [
      ['인스타·구글 광고', '20만 원', '120만 원', '강사 모집 타겟팅 광고'],
      ['블로그 콘텐츠 제작', '30만 원', '180만 원', '외주 작가 활용 시 편당 2만 원'],
      ['강사 얼리버드 수수료 지원', '50만 원', '300만 원', '첫 달 수수료 0% 지원'],
      ['B2B 영업 (교통·출장)', '10만 원', '60만 원', '공방 방문 등'],
      ['오프라인 행사 참가', '20만 원', '120만 원', '공예 전시회·박람회'],
      ['강사 환영 패키지', '10만 원', '60만 원', '오센틱아트 브랜드 굿즈'],
      ['합계', '140만 원/월', '840만 원', ''],
    ]
  ),
  spacer(),
  body('Phase 2는 GMV 성장에 따라 매출의 3~5%를 마케팅에 재투자하는 구조로 전환.'),
  spacer(),

  // ── 6. KPI ──
  heading1('6. KPI 대시보드'),

  heading2('Phase 1 KPI (6개월 목표)'),
  makeTable(
    ['지표', '목표', '측정 방법'],
    [
      ['강사 승인 수', '50명', 'Supabase 어드민'],
      ['강사 DM 발송 수', '500건', '스프레드시트 추적'],
      ['강사 전환율', '10%', '(승인 수 / DM 수)'],
      ['클래스 개설 수', '150개', 'Supabase 어드민'],
      ['누적 예약 건수', '600건', '어드민 대시보드'],
      ['누적 후기 수', '200건', '어드민 대시보드'],
      ['월 GMV', '5,000만 원', '어드민 대시보드'],
      ['SEO 순위', '"공예클래스 서울" 3페이지 내', '구글 서치콘솔'],
      ['인스타 팔로워', '3,000명', '인스타 인사이트'],
      ['B2B 수주 건수', '5건', 'CRM 스프레드시트'],
      ['월 방문자 (UV)', '5,000', 'GA4'],
    ]
  ),
  spacer(),

  heading2('Phase 2 KPI (18개월 목표)'),
  makeTable(
    ['지표', '목표'],
    [
      ['강사 승인 수', '300명'],
      ['입점 벤더 수', '10개사'],
      ['입점 에이전시 수', '5개'],
      ['월 GMV', '3억 원'],
      ['모바일 앱 다운로드', '10,000건'],
      ['인스타 팔로워', '20,000명'],
      ['누적 후기 수', '2,000건'],
    ]
  ),
  spacer(),

  // ── 7. 즉시 실행 체크리스트 ──
  heading1('7. 즉시 실행 체크리스트'),

  heading2('이번 주 (Phase 1 킥오프)'),
  bullet('인스타그램 공식 계정 프로필 최적화 (바이오 링크 → 오센틱아트 URL)'),
  bullet('강사 모집 DM 템플릿 작성 (수수료 86.7% 메시지 포함)'),
  bullet('레진아트 강사 50명 인스타 발굴 (팔로워 1,000명 이상)'),
  bullet('블로그 첫 5편 제작 시작 ("서울 레진아트 원데이클래스 추천")'),
  bullet('홈페이지 SEO 메타 태그 수정 (GAP 5 실행)'),
  bullet('B2B 제안서 1페이지 초안 작성'),
  spacer(),

  heading2('이번 달 완료 목표'),
  bullet('강사 DM 80건 발송 → 강사 10명 이상 접촉 완료'),
  bullet('블로그 17편 발행'),
  bullet('인스타 피드 30개 게시 + 릴스 4편'),
  bullet('기업 복지 담당자 링크드인 DM 20건 발송'),
  bullet('네이버 공예 카페 2곳 홍보 게시물'),
  spacer(),

  // ── 8. 리스크 ──
  heading1('8. 리스크 및 대응'),
  makeTable(
    ['리스크', '가능성', '대응 방안'],
    [
      ['강사 DM 무응답 (전환율 5% 이하)', '높음', '오프라인 공방 직접 방문으로 전환'],
      ['SEO 성과 지연 (3개월 이상)', '중간', '네이버 카페·블로그 병행으로 단기 트래픽 확보'],
      ['경쟁사 유사 수수료 제도 출시', '낮음', '수수료 외 차별점 강화 (재료 연결·인증 제도)'],
      ['B2B 영업 사이클 길어짐', '높음', '중소기업 복지 담당자 직접 연락 + 즉시 시연 데모 준비'],
      ['강사 유입 후 클래스 비활성화', '중간', '온보딩 체크리스트 + 1:1 운영 코칭 제공'],
    ]
  ),
  spacer(),

  // ── 부록: DM 템플릿 ──
  heading1('부록: 강사 모집 DM 템플릿'),
  heading3('인스타그램 첫 DM (강사 대상)'),
  new Paragraph({
    children: [
      new TextRun({ text: '안녕하세요, 오센틱아트입니다 :)\n\n', size: 22, color: '374151' }),
      new TextRun({ text: '[강사님 이름/계정]', size: 22, color: '374151', italics: true }),
      new TextRun({ text: '님의 레진아트 작품을 너무 멋지게 보고 있어요.\n\n저희는 공예 강사에게 업계 최고 수준의 정산을 지향하는 플랫폼인데요, 수강생 결제액의 ', size: 22, color: '374151' }),
      new TextRun({ text: '86.7%를 강사님이 직접 받으실 수 있습니다.', size: 22, color: BRAND_DEEP, bold: true }),
      new TextRun({ text: '\n\n클래스101 65% 대비 동일 매출 기준 연간 780만 원 차이가 납니다.\n\n현재 레진아트 강사 얼리버드 모집 중이고, 첫 달은 수수료 0%로 100% 다 가져가시는 조건으로 시작하실 수 있어요.\n\n관심 있으시면 간단히 소개드릴게요 — 편한 시간에 연락 주세요!\n오센틱아트: authenticart.vercel.app', size: 22, color: '374151' }),
    ],
    spacing: { before: 120, after: 120 },
    shading: { type: ShadingType.SOLID, color: 'F9FAFB' },
    indent: { left: 360, right: 360 },
    border: { left: { style: BorderStyle.SINGLE, size: 16, color: BRAND_AMBER } },
  }),
  spacer(),
  spacer(),

  new Paragraph({
    children: [new TextRun({ text: '작성: 오센틱아트 마케팅부  |  2026년 5월 14일', size: 20, color: BRAND_GREY, italics: true })],
    alignment: AlignmentType.CENTER,
  }),
]

// ──────────────────────────────────────────────────────────
//  문서 생성 및 저장
// ──────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Malgun Gothic', size: 22, color: '374151' },
        paragraph: { spacing: { line: 340 } },
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        run: { bold: true, size: 36, color: BRAND_DEEP, font: 'Malgun Gothic' },
        paragraph: { spacing: { before: 400, after: 200 } },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        run: { bold: true, size: 28, color: BRAND_DEEP, font: 'Malgun Gothic' },
        paragraph: { spacing: { before: 360, after: 160 } },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
      },
    },
    children,
  }],
})

const buffer = await Packer.toBuffer(doc)
writeFileSync('outputs/04-marketing/20260514-오센틱아트-마케팅계획.docx', buffer)
console.log('완료: outputs/04-marketing/20260514-오센틱아트-마케팅계획.docx')
