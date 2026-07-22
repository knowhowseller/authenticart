# 오센틱아트 현재 상태 (최신)
> 마지막 갱신: 2026-07-17

---

## 2026-07-17 랙돌 고양이 캐릭터 IP 사업계획서 완료 (✅ 초안 완료, 대표 검토 대기)

### 새 사업 기획 — 랙돌 캐릭터 IP 글로벌 브랜드

- **세션**: 20260717-new-business (new-business 워크플로우)
- **목표**: 랙돌 고양이 캐릭터 IP 기반 글로벌 라이프스타일 브랜드 — 디지털 IP 우선, POD 드롭십, 0원 부트스트랩, 1인+AI 운영
- **완료된 에이전트**: market-researcher / competitor-analyst / keyword-researcher / analyst / financial-reporter / legal-researcher / compliance-checker / proposal-writer
- **산출물**: `context/sessions/20260717-new-business/proposal-writer-output.md`

### 핵심 확정 결정사항

| 항목 | 확정 내용 |
|------|----------|
| 예산 | 실질 0원 부트스트랩. 월 고정비 $0 시작 → 매출 게이트별 재투자 |
| Gate 2 집행 시점 | 누적 $130~150 권장 (즉시 $100 집행은 Midjourney 비용 차감 후 부족) |
| 수익모델 순서 | Redbubble + LINE 스탬프 먼저 → Ko-fi/Patreon은 팔로워 형성 후 |
| 캐릭터 제작 | AI 초안 + 대표 직접 수정 + 이력 보관 (저작권 요건 충족) |
| 감정 코드 | "나른함(Flop)" — MBTI 파생은 본체 확립 후 |
| 시장 순서 | 영미권 6개월 집중 → 일본 확장 |
| 라쿠텐 | 팬덤 후 진입 (월 이용료 감당 불가 + 알고리즘은 관계로 해결 안 됨) |
| 상표 출원 | 캐릭터명 확정 직후 즉시 $250~350/분류 (0원 원칙 유일한 예외) |
| 목표 시점 재조정 | 연 $50K = 36~48개월 (기본) / 연 $300K = 5~8년 (라이선싱 전제) |
| 기회비용 | 24개월 기본 시나리오 기준 -$21,800~-$31,100 (명시됨) |

### 즉시 실행 항목 (미완료)

- [ ] 통신판매업 신고 (판매 전 필수, 과태료 최대 5,000만 원)
- [ ] W-8BEN 제출 (플랫폼 가입 당일)
- [ ] AI 수정 워크플로우 폴더 체계 확립
- [ ] 캐릭터명 확정
- [ ] 개인정보처리방침 작성·게시

---

## 2026-07-13 Google Analytics(GA4) 연결 (✅ 라이브)

- ✅ **GA4 `G-QGXQ391R6J` 연결**: `@next/third-parties`의 `<GoogleAnalytics>`를 `app/layout.tsx`에 배선(App Router 클라이언트 라우팅 페이지뷰 자동추적). **프로덕션(VERCEL_ENV=production)에서만 로드** — 로컬·프리뷰 트래픽 오염 방지, `NEXT_PUBLIC_GA_ID`로 오버라이드 가능(측정 ID는 공개값이라 코드 상수 무방).
- ✅ **개인정보처리방침 반영**(⚠️개인정보 처리방식 변경=배포게이트, 소유자 요청으로 승인): 처리위탁·국외이전 표에 **Google LLC(미국, GA)** 추가, 쿠키 섹션에 GA 옵트아웃(gaoptout) 안내. 기존 "자동수집(IP·쿠키·이용기록)" 고지가 이미 커버.
- ✅ **배포·검증**: commit 1a89040→push→Vercel. 라이브 HTML `gtag/js?id=G-QGXQ391R6J` 로드 확인, /privacy Google LLC 반영 확인.
- 📌 **사용자 후속(GA4 콘솔)**: ①실시간 보고서로 본인 방문 확인 ②데이터 보관 2→**14개월** 변경(관리→데이터설정, 방침 기재값과 일치) ③Search Console 연결(검색어·랜딩 통합, 색인·AEO 작업과 시너지) ④내부트래픽(본인 IP) 제외 필터.

---

## 2026-07-12 콘텐츠 발행 가이드(색인·AEO) 확인·조치 (✅ 라이브)

- 배경: `docs/콘텐츠-발행-가이드.md`(7/12 작성) — 발행 81편 중 색인 15/37 감사분(전수 41%, 엔진기준 7일경과분 63%). 원인=얇은 글 대량발행으로 크롤예산 소진 + **블로그 전 글 본문 내부링크 사실상 0개(L0)**. 인프라(sitemap 제출·robots·JSON-LD·llms.txt)·배선(쿼터 제동·색인게이트·엔진주입) **모두 정상 확인**.
- ✅ **크롤거부 2건 본문 보강**: `상견례-결혼기념일-핸드메이드-선물`(1,092→2,240자)·`집들이-선물-추천-...-한점`(726→2,019자). 실수치·비교표·내부링크 5·FAQ 유지, check-content 게이트 통과. 운영 DB 반영·라이브 200.
- ✅ **미색인 20건 내부링크 삽입**(발견-미크롤 13+구글모름 7): 각 글에 "함께 보면 좋은 글" 같은언어·주제 3링크. 백업 `scripts/_tmp/backup-20260712.json`(가역). IndexNow 93건 재제출.
- ✅ **관련글 로직 코드 개선 — 배포 완료**: `app/(public)/blog/[slug]/page.tsx` 관련글 "최신 3"→"최신 3+오래된 3"(고아 글 인바운드 링크 수신). commit 4133c61 → main push → Vercel 프로덕션 배포. 라이브 검증(미편집 guide글 관련글 3→6). 배포 게이트 비해당(마케팅).
- 📌 **남은 수동(사용자)**: GSC URL검사→색인 요청(보강 2건+미색인 20건). 7일 후 엔진 measure.js 재판정. 색인률 80%↑ 시 쿼터 자동 2편.

---

## 2026-07-07 블로그 발행 — 기회탐지·카피 엔진 배선 점검·복구 (✅ 검증)

- 🔴→✅ **근본원인: authenticart 엔진 가이드가 한 번도 생성된 적 없어 발행에 미반영**. `scripts/run-daily-blog.ps1` 2.2(카피)·2.3(기회탐지)가 `D:\엔진공장\out\{offer,opportunity}\authenticart\*.md`를 `Test-Path`로 읽는데 **파일 부재 시 조용히 스킵**. 가이드 생성 작업 `EngineGuidesDaily`(06시)가 **한 번도 실행 안 됨**(LastRun 1999, 첫 자동실행 예정 7/8 06시)인데 발행 `Osentic-DailyBlog`(09시)는 매일 정상 발행 → 그간 두 엔진이 실제 글에 반영된 적 없음(7/6 로그에 injected 라인 0건으로 확인).
- ✅ **두 엔진 authenticart 정상 작동 직접 검증**: `opportunity screen authenticart`(씨앗5→후보12→pain_guide.md) / `offer screen authenticart`(카피10→daily_copy_guide.md). 러너가 읽는 정확한 경로에 생성 확인.
- ✅ **자동 경로(스케줄러) 복구·검증**: `EngineGuidesDaily` 수동 트리거 → opportunity/authenticart 재생성(7:39) 확인, 워치독 래퍼 정상. 실행순서 06시 생성→09시 발행 3h 간격 정합.

---

## 프로젝트 단계

- **Phase 0**: 완료 (기초 DB, 인증, 기본 UI)
- **Phase 1**: 핵심 기능 개발 중 (강의 예약, 결제, 강사 관리)
- **Phase 2**: 트리거 미도달 (미등록 강사 50명, 미달)

---

## 수정하면 안 되는 고정값

| 항목 | 값 | 이유 |
|------|-----|------|
| 강사 수수료 | PG 3.3% + 플랫폼 10% = **13.3% 공제, 강사 86.7% 수령** | 코드 로직(calcBookingFees) 반영됨 |
| 에이전시 수수료 | 스탠다드 10% / 실버 12% / 골드 15% | 제안서 확정, DB 반영 예정 |
| 브랜드 컬러 | 딥틸 DEEP `#1F4145` / 앰버 AMBER `#FFBF00` | 정본(context/brand). DOCX 스크립트 공통 적용. 옛 `#1A1A2E`/`#F59E0B`는 폐기 |

---

## 완료된 산출물 현황

### outputs/01-reports/
- `20260511-오센틱아트-Phase1-개발지시서.md` + `.docx`

### outputs/02-contracts/
- `20260513-오센틱아트-강사위촉계약서.md` + `.docx`
- `20260513-오센틱아트-B2B출강계약서.md` + `.docx`
- `20260513-오센틱아트-에이전시파트너십협약서.md` + `.docx`

### outputs/03-proposals/
- `20260513-파트너십제안서-공예사업자.md` + `.docx`
- `20260515-오센틱아트-B2B팀빌딩제안서.md` + `.docx` ✅ (14.4KB)
- `20260515-오센틱아트-에이전시파트너제안서.md` + `.docx` ✅ (14.4KB)
- `20260515-오센틱아트-강사모집제안서.md` + `.docx` ✅ (16.6KB)

### sessions/20260717-new-business/
- `proposal-writer-output.md` ✅ (2026-07-17 완료, 대표 검토 대기)

### outputs/05-legal/
- `20260513-개인정보처리방침검토.md` + `.docx`
- `20260513-표시광고법검토.md` + `.docx`
- `20260513-전자상거래법검토.md` + `.docx`

### outputs/08-research/
- `20260513-경쟁분석-공예플랫폼.md` + `.docx`

---

## DOCX 생성 스크립트 현황

| 스크립트 | 대상 | 상태 |
|---------|------|------|
| `scripts/md-to-docx.mjs` | 범용 MD→DOCX 변환 | ✅ 사용 가능 |
| `scripts/make-b2b-proposal-docx.mjs` | B2B 팀빌딩 제안서 | ✅ |
| `scripts/make-agency-proposal-docx.mjs` | 에이전시 파트너 제안서 | ✅ |
| `scripts/make-instructor-proposal-docx.mjs` | 강사 모집 제안서 | ✅ |
