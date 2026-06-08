# 오센틱아트 현재 상태 (최신)
> 마지막 갱신: 2026-06-08

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
  - ⚠️ **마이그레이션 0047 DB 미적용** — 적용 전까지 블로그 기능 동작 안 함

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
