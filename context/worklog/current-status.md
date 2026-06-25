# 오센틱아트 현재 상태 (최신)
> 마지막 갱신: 2026-06-25

---

## 2026-06-25 블로그 홍보글 4주차 7편 작성 + 발행 완료 (✅ 라이브 검증)

- ✅ **4주차 7편 작성 완료**: 1·2·3주차 7타겟 로테이션 유지·앵글 차별화. 7월 초 한여름 시즌 훅(더위·휴가철·사내행사). AEO 3종·광고법 안전 동일. slug 21편과 전부 다름. `outputs/04-marketing/20260702-오센틱아트-블로그홍보글7편-4주차.md(+.docx 21.7KB)`
- ✅ **운영 DB 발행 완료**: 대시보드 SQL 에디터에서 `20260702-블로그4주차-발행SQL.sql` 실행. published 43→**50편**. featured 4주차 Day1·4·7 ON / 3주차 Day1·4·7 OFF.
- ✅ **라이브 검증**: 신규 7편 전부 HTTP 200 + H1 + FAQPage 렌더링 확인. 강사글(Day3) 정산 86.7% 정상. (www.authenticart.co.kr) ※한글 slug는 percent-encoding 후 200(raw=500은 curl 인코딩 이슈).
- ✅ **IndexNow 일괄 색인**: sitemap 69건(신규 7편 포함) 200 OK 제출. 상세 `20260625-블로그홍보4주차-worklog.md`
- 4주차 목록: ①(월/guide,featured) 처음 클래스 예약·당일준비 ②(화/guide) 여름 사내행사 워크숍 ③(수/instructor) 강사 부업 현실(정산86.7%) ④(목/trend,featured) 여름 테이블 코스터·트레이 ⑤(금/story) 멀리 안 가는 여름 데이트 ⑥(토/guide) 더운날 실내 공예체험 ⑦(일/story,featured) 상황별 선물(집들이·승진·감사)

## 2026-06-25 블로그 홍보글 3주차 7편 작성 + 발행 완료 (✅ 라이브 검증)

- ✅ **3주차 7편 작성 완료**: 1·2주차 7타겟 로테이션 유지·주제 교체(여름 휴가철·방학 시즌 훅). AEO 3종·광고법 안전 동일. slug 1·2주차와 전부 다름. `outputs/04-marketing/20260625-오센틱아트-블로그홍보글7편-3주차.md(+.docx 22.1KB)`
- ✅ **운영 DB 발행 완료**: 사용자가 대시보드 SQL 에디터에서 `20260625-블로그3주차-발행SQL.sql` 실행(BEGIN/COMMIT). published 36 → **43편**. 확인 SELECT 7행 전부 published, featured Day1·4·7 ON.
- ✅ **featured 로테이션**: 3주차 Day1·4·7 ON, 2주차 Day1·4·7 OFF.
- ✅ **라이브 검증**: `/blog` 목록 + 신규 6글 상세 HTTP 200·H1·본문·FAQ 렌더링 확인. 강사글 정산 86.7% 문구 정상. (www.authenticart.co.kr)
- ✅ **IndexNow 일괄 색인**: `scripts/indexnow-submit-all.mjs` 실행 — sitemap 62건(신규 7편 포함) 200 OK 제출. (SQL 직접 INSERT는 자동 ping 안 돼 수동 실행)
- 📌 **이번 세션 특이사항**: execute_sql MCP가 **다른 Supabase 계정(vision-suite, ref axucxnfmbkhlunpiifce)으로 연결**돼 authenticart(coabfjizufovypfappco) 접근 불가 → 대시보드 SQL로 발행. 다음에 MCP 직접 발행하려면 오센틱아트 계정으로 재연결 필요. 상세 `20260625-블로그홍보3주차-worklog.md`

## 2026-06-20~21 검색 노출 강화: 빙 등록 + IndexNow + RSS (배포 완료)

- ✅ **빙 웹마스터 메타 태그**: `app/layout.tsx` verification.other에 `msvalidate.01` 추가. 구글·네이버에 이어 빙 소유확인 준비. (commit cfb6f7b)
- ✅ **IndexNow 자동 색인** (commit fb92a63): 빙·네이버·Yandex 등 참여 엔진에 즉시 색인 요청.
  - 키 파일 `public/9d0817bd5e9a59d21ab9bfb876612795.txt` (라이브 200 확인) + `lib/indexnow.ts` 제출 유틸
  - 블로그 발행/수정(create·update route)에서 발행 상태 시 자동 ping (fire-and-forget, 발행 안 막음)
  - `scripts/indexnow-submit-all.mjs`: sitemap 전체 일괄 제출 1회성
- ✅ **RSS 2.0 피드 `/rss.xml`**: 최신 발행글 50건, 30분 캐시. layout alternate 링크 노출. (라이브 200 확인)
- ✅ **사이트맵 55건 IndexNow 일괄 제출 완료**: 응답 202 Accepted.
- 📌 **사용자 수동 작업(웹마스터 UI)**: 빙/네이버/구글 콘솔에서 `sitemap.xml`·`rss.xml` 제출 + 빙 소유확인 버튼 클릭.
- 📌 **IndexNow 키는 비밀 아님**: 공개 검증 토큰. 키 변경 시 public 파일명·lib/indexnow.ts·스크립트 3곳 동시 변경 필요.

## 프로젝트 단계

- **Phase 0**: 완료 (기초 DB, 인증, 기본 UI)
- **Phase 1**: 핵심 기능 개발 중 (강의 예약, 결제, 강사 관리)
- **Phase 2**: 트리거 미도달 (미등록 강사 50명, 미달)

---

## 2026-06-09 보안·결제 수정 + 배송비 기능 (배포 완료)

- 🔴→✅ **D-1 과소결제 취약점 수정**: toss-success가 URL amount를 DB 실제금액과 대조 없이 paid 처리하던 문제 → 5개 결제 타입(booking·order·cart·artwork·class_request) 전부 서버 금액 검증 + 불일치 시 토스 결제 취소. (commit 5fe2f90)
- ✅ **D-2 멱등성**: 이미 paid인 주문 재호출 시 중복 정산·알림 방지.
- ✅ **C-1**: supabase/migrations/README.md — 중복 번호(0002/0005/0006) 문서화. 재번호 금지 규칙.
- ✅ **작가 배송비 기능**: migration 0048(artworks/artwork_orders.shipping_fee) 적용 완료. 결제액=작품가+배송비. (commit c6605ad)
- ⚠️ **배포 후 권장 테스트**: 실제 결제로 정상금액 통과/조작금액 차단 확인 (booking·쿠폰·작품). webhooks/toss 동일 검증 별도 검토.

## 2026-06-10 블로그 홍보 기획 + 타겟별 홍보글 7편 (✅ 운영 DB 발행 완료)

- ✅ **블로그 홍보 기획서 + 홍보글 7편 작성**: 타겟 7세그먼트(입문/B2B/강사/작품/커플/학부모/선물) 맞춤, AEO 3종(excerpt·FAQ·소제목) 적용, 광고법 안전. `outputs/04-marketing/20260610-오센틱아트-블로그홍보{기획,글7편}.md(+.docx)`
- ✅ **CTA 실제 라우트 반영**: `/classes`·`/artworks`·`/group-request`·`/signup/instructor`
- ✅ **운영 DB(blog_posts) 7건 published INSERT 완료** (사용자 승인, execute_sql): blog_posts 22편 → 29편. 홈 노출(is_featured) Day1·4·7=true. 라이브 검증: `/blog` 목록·3개 글 HTTP 200 + 본문 렌더링 확인 (www.authenticart.co.kr).
- 📌 후속(선택): 글별 cover_image(대표 이미지) URL 입력 — 현재 미입력(카드 이미지 없음). 상세 `20260610-블로그홍보7편-worklog.md`

## 2026-06-13 블로그 홍보글 2주차 7편 작성 + 운영 DB 발행 완료 (✅)

- ✅ **2주차 7편 작성 완료**: 기획서 로드맵대로 1주차 7타겟 로테이션 유지·주제만 교체. 여름·장마·여름방학 시즌 훅 반영. AEO 3종·광고법 안전 동일 기준. slug 1주차와 전부 다르게 생성. `outputs/04-marketing/20260613-오센틱아트-블로그홍보글7편-2주차.md(+.docx 21.9KB)`
- ✅ **운영 DB(blog_posts) 7건 published INSERT 완료** (사용자 승인 "즉시 published 일괄", execute_sql): published 29편 → **36편**. Day1·4·7=is_featured true.
- ✅ **홈 featured 로테이션**: 1주차 Day1·4·7(6/10) featured 내림 → 2주차 Day1·4·7 올림. 6/8 상록 가이드 2편(강사되는법·수수료비교)은 유지. **featured 총 5편**.
- ✅ **라이브 검증**: 새 글 3건 + `/blog` 목록 HTTP 200, 본문 렌더링 확인(www.authenticart.co.kr).
- 📌 후속(선택): 글별 cover_image URL 미입력(카드 이미지 없음). 상세 `20260613-블로그홍보2주차-worklog.md`

## 2026-06-10 CS 자동응답 봇 검증·정리 (커밋 완료, 푸시 대기)

- ✅ **CS봇 mini 모델 라이브 검증**: `/api/ai/cs` — 수수료(86.7%)·환불 단계 등 KB 질문 정상 답변, KB 밖(날씨 등) 질문은 채널톡 안내로 정확히 거부. 모델 `gpt-4o-mini-2024-07-18`, finish=stop, 키 정상.
- 📌 **어제 "과도 거부" 원인 확정**: 모델 문제 아님 → 터미널 테스트 시 **한글 인코딩 깨짐**이 원인이었음. (UTF-8 JSON 파일로 재검증해 확인) → 모델 gpt-4o 상향 불필요, mini 유지.
- ✅ **임시 진단 로깅 `?debug=1` 제거** (키 prefix·에러 노출 위험 제거) + catch 폴백 메시지 폐지된 게시판(/board) → 채널톡으로 통일. tsc --noEmit 통과. (commit 2a9fcd5)
- ⚠️ **미푸시**: 2a9fcd5 아직 origin 미반영 → push 시 Vercel 자동 배포.

## 2026-06-09 1인 운영 자동화 (배포 완료)

- **1순위**: class-reminder cron 활성화+윈도우 수정 / operator-digest(매일 09시 미처리 8종 요약) / weekly-kpi(매주 월) — admin 4명 발송
- **2순위**: 정산 지급 완료(mark-paid 단건·일괄) 시 강사 정산 명세 자동 발송 (monthlyPayoutHtml 연결, 계산 로직 불변)
- **3순위**: B2B 단체문의 자동 1차 응답(접수확인+절차) + admin 즉시 이메일·인앱 알림
- 미적용/판단대기: 강사신청 실시간 알림(signup 클라이언트 insert라 서버라우트화 필요, 다이제스트가 일단위 커버), 4순위(CS봇·블로그 파이프라인·후기 자동요청), 5순위(운영 대시보드)
- ⚠️ cron은 vercel.json 등록됨 — CRON_SECRET 환경변수 설정 전제(기존 7개 cron과 동일)

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

### outputs/05-legal/
- `20260513-개인정보처리방침검토.md` + `.docx`
- `20260513-표시광고법검토.md` + `.docx`
- `20260513-전자상거래법검토.md` + `.docx`

### outputs/08-research/
- `20260513-경쟁분석-공예플랫폼.md` + `.docx`

---

## 최근 추가 기능 (2026-06-08)

- **블로그(공예 매거진) + AI 검색 최적화(AEO)** 신규 구축
  - 공개: `/blog`(목록), `/blog/[slug]`(상세) — JSON-LD(BlogPosting·FAQPage·BreadcrumbList)
  - 관리자: `/admin/blog` CRUD (admin·branch_manager) + AI 생성 마크다운 붙여넣기 지원
  - AEO 인프라: `/llms.txt`, robots AI 크롤러 허용, sitemap·홈 Organization/WebSite 구조화 데이터
  - 빌드/타입체크 통과, `as any` 0건 — 상세는 `20260608-블로그-AEO-worklog.md`
  - ✅ **마이그레이션 0047 운영 DB 적용 완료** (대시보드 SQL 에디터)
  - ✅ **배포 완료** (commit caea87a → main push → Vercel): `/blog`, `/llms.txt`, 홈 JSON-LD, robots AI 크롤러 라이브 검증
  - ⚠️ 같은 커밋에 **검토 안 된 결제·주문 변경분 8개**(toss/orders/bookings/cron)가 함께 배포됨 → 결제 흐름 정상 여부 확인 필요

## 미완료 / 다음 세션 인계 사항

- [ ] **migrations 0041~0047 운영 DB 적용**: `npx supabase db push` 실행 필요 (0047=블로그)
- [ ] **Vercel 환경변수 OPENAI_API_KEY 추가**: Vercel 대시보드에서 직접 추가
- [ ] **OpenAI API 키 폐기 및 재발급**: 이전 세션에서 노출된 키 → platform.openai.com에서 폐기
- [ ] **크론 설정 (사용자 승인 대기)**:
  - 주간 KPI 리포트 (매주 월 09:00)
  - 미처리 강사 신청 알림 (매일)
  - Phase 2 트리거 감지 (매일)
- [ ] **홈페이지 메인 콘텐츠 기획**: 이해관계자 대상 감성+CTA 설계 (중단됨)

---

## DOCX 생성 스크립트 현황

| 스크립트 | 대상 | 상태 |
|---------|------|------|
| `scripts/md-to-docx.mjs` | 범용 MD→DOCX 변환 | ✅ 사용 가능 |
| `scripts/make-b2b-proposal-docx.mjs` | B2B 팀빌딩 제안서 | ✅ |
| `scripts/make-agency-proposal-docx.mjs` | 에이전시 파트너 제안서 | ✅ |
| `scripts/make-instructor-proposal-docx.mjs` | 강사 모집 제안서 | ✅ |
