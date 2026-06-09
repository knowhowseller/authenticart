# 오센틱아트 현재 상태 (최신)
> 마지막 갱신: 2026-06-08

---

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
| 브랜드 컬러 | DEEP `#1A1A2E` / AMBER `#F59E0B` | DOCX 스크립트 공통 적용 |

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
