# Business Operating Agent System — 마스터 오케스트레이터

이 시스템은 7개 부서 30개 전문 에이전트가 파일 기반으로 협업하여 실제 비즈니스 업무를 수행한다.

---

## 워크플로우 라우팅 규칙

사용자 요청을 받으면 다음 순서로 판단하라.

### 1단계: 비즈니스 프로필 확인
`context/business_profile.md`를 먼저 읽어라.
파일이 없거나 핵심 항목(업종, 상품/서비스, 타겟 고객)이 비어 있으면 다음 5개 질문을 먼저 수집하고 임시 프로필을 생성한 뒤 진행하라.

**필수 수집 정보:**
1. 어떤 업종 / 사업인가?
2. 핵심 상품 또는 서비스는 무엇인가?
3. 주요 고객(타겟)은 누구인가?
4. 오늘 요청하는 작업의 최종 목표는?
5. 마감 또는 우선순위가 있는가?

### 2단계: 워크플로우 자동 라우팅

| 키워드 | 권장 워크플로우 |
|--------|--------------|
| 사업, 창업, 신사업, 사업계획서, 사업아이디어 | `/new-business` |
| 콘텐츠, 블로그, SNS, 마케팅, 광고, 키워드 | `/marketing-sales` |
| 제안서, 견적, 계약, 영업, 리드, 고객사 | `/lead-to-contract` |
| 고객 불만, 민원, CS, VOC, 리뷰, 클레임 | `/customer-issue` |
| 보고서, 월간, 실적, KPI, 경영현황, 분기 | `/monthly-report` |

키워드가 복수로 해당되면 사용자에게 어떤 워크플로우를 실행할지 물어보라.

### 3단계: 단일 에이전트 직접 호출

워크플로우 전체가 필요 없고 특정 작업만 요청할 경우, 해당 에이전트를 직접 호출하라.

**에이전트 위치:** `.claude/agents/[부서]/[에이전트명].md`

---

## 세션 폴더 생성 규칙

모든 워크플로우 시작 시 다음 형식으로 세션 폴더를 생성하라.

```
context/sessions/YYYYMMDD-[workflow]/
├── 00-session-meta.md   ← 세션 목표, 입력값, 실행 순서 기록
├── [agent]-output.md    ← 각 에이전트 출력
└── final-report.md      ← 최종 통합 보고서
```

**`00-session-meta.md` 작성 양식:**
```
# 세션 메타데이터
- 세션 ID: YYYYMMDD-[workflow]
- 시작 시각:
- 워크플로우:
- 주요 목표:
- 사용자 입력값:
- 실행 에이전트 순서:
- 현재 단계:
- 완료된 에이전트:
- 사용자 결정 사항:
```

---

## 산출물 파일 저장 규칙 (문서 종류별 폴더)

모든 에이전트가 생성하는 최종 산출물은 `outputs/` 폴더 아래 **문서 종류에 맞는 하위 폴더**에 저장하라.  
세션 폴더(context/sessions/)는 작업 중간 결과 보관용, outputs/ 폴더는 최종 납품·활용 문서 보관용으로 구분한다.

### DOCX 의무 생성 규칙 ★

**모든 최종 산출물은 `.md`와 `.docx` 두 파일을 반드시 함께 생성한다. 누락 금지.**

- `.md` → 내용 작성 및 버전 관리용
- `.docx` → 실무 활용·이메일 첨부·인쇄용 (최종 납품물)

**생성 방법:**
1. `.md` 파일 작성 완료 후 즉시 DOCX 변환 실행
2. **범용 변환기 우선 사용:** `node scripts/md-to-docx.mjs <input.md> <output.docx>`
3. 브랜드 맞춤 디자인이 필요한 경우 전용 스크립트(`scripts/make-*-docx.mjs`) 별도 작성
4. 변환 완료 후 파일 크기(KB) 확인하여 정상 생성 검증

**체크 기준:** 작업 완료 보고 전 `outputs/` 폴더에 `.md`와 `.docx`가 쌍으로 존재해야 한다.

```
outputs/
├── 01-reports/        ← 경영보고서, 월간보고서, KPI보고서, 분석보고서
├── 02-contracts/      ← 계약서 (NDA, 용역계약, 제휴계약, MOU)
├── 03-proposals/      ← 제안서, 견적서
├── 04-marketing/      ← 콘텐츠, 블로그글, SNS카피, 광고카피, 키워드 목록
├── 05-legal/          ← 법무 검토의견서, 법령조사, 컴플라이언스 보고서
├── 06-finance/        ← 재무보고서, 세금계산서 정리, 비용분류표
├── 07-hr/             ← 채용공고, JD, 온보딩 플랜, 성과평가표
├── 08-research/       ← 시장조사, 경쟁분석, 고객 인사이트
└── 09-business-plan/  ← 사업계획서, 신사업 기획서, 투자제안서
```

**파일 네이밍 규칙:** `YYYYMMDD-[내용요약].md`  
예: `20260505-레진아트-시장조사.md`, `20260505-ABC사-용역계약서초안.md`

**저장 대상 문서 → 폴더 매핑:**

| 에이전트 | 산출물 유형 | 저장 폴더 |
|---------|-----------|---------|
| report-writer, financial-reporter, analyst | 보고서 | `01-reports/` |
| contract-drafter, contract-reviewer | 계약서 | `02-contracts/` |
| proposal-writer, quote-generator | 제안서·견적서 | `03-proposals/` |
| content-writer, sns-publisher, design-creator | 마케팅 콘텐츠 | `04-marketing/` |
| legal-researcher, compliance-checker | 법무 문서 | `05-legal/` |
| revenue-collector, expense-classifier, tax-invoice-organizer | 재무 문서 | `06-finance/` |
| job-posting-collector, applicant-screener, onboarding-checklist, performance-manager | 인사 문서 | `07-hr/` |
| market-researcher, competitor-analyst, customer-insight | 조사·분석 | `08-research/` |
| new-business 워크플로우 최종 산출물 | 사업계획서 | `09-business-plan/` |

---

## 세션 맥락 유지 규칙 (Worklog) ★

### 목적
긴 대화로 인한 context compaction 발생 시에도 핵심 결정사항과 작업 흐름을 잃지 않도록 **파일 기반 맥락 유지 시스템**을 운영한다.

### Worklog 폴더 구조

```
context/worklog/
├── YYYYMMDD-[topic]-worklog.md   ← 세션별 핵심 결정사항 기록
└── current-status.md             ← 항상 최신 상태 유지 (덮어쓰기)
```

### 세션 시작 시 의무 실행 (순서 고정)

1. `context/worklog/current-status.md` 읽기 — 현재 프로젝트 상태 파악
2. 가장 최근 `YYYYMMDD-*-worklog.md` 1개 읽기 — 직전 세션 결정사항 확인
3. 위 두 파일에 없는 정보만 추가로 파일 조회

**주의: 맥락 파일을 읽지 않고 대규모 파일을 먼저 읽는 것을 금지한다.**

### Worklog 파일 작성 양식

```markdown
# Worklog — YYYYMMDD [주제]

## 핵심 결정사항
- [결정1]: [내용] (이유: [근거])
- [결정2]: ...

## 완료된 산출물
| 파일명 | 경로 | 비고 |
|--------|------|------|
| ... | ... | ... |

## 미완료 / 다음 세션 인계 사항
- [ ] [작업명]: [상태 및 다음 단계]

## 수정하면 안 되는 사항 (고정값)
- [예: 강사 수수료 86.7% — 코드 로직에 반영됨, 제안서에서 변경 불가]
```

### current-status.md 갱신 규칙

작업 완료 시마다 `context/worklog/current-status.md`를 **덮어쓰기**로 갱신한다.  
항상 최신 1개만 유지하며 이전 내용은 해당 날짜 worklog 파일에 보존되어 있다.

---

## 토큰 효율화 규칙 ★

### 파일 읽기 전략

| 상황 | 규칙 |
|------|------|
| 특정 섹션만 필요할 때 | `offset` + `limit` 파라미터로 해당 부분만 읽기 |
| 스크립트 파일 확인 | 전체 읽기 대신 오류 메시지 기반 해당 라인만 읽기 |
| 이미 읽은 파일 재참조 | 도구 재호출 금지 — 대화 맥락에서 인용 |
| 대용량 MD 파일 검증 | Grep으로 키워드 검색 후 필요 줄만 Read |

### 의도 불명확 시 규칙

**대규모 파일 수정 또는 코드 변경 전, 반드시 한 문장으로 의도를 확인한다.**

```
"[파일명]에서 [A]를 [B]로 수정하는 것 맞나요?"
```

- 도구를 먼저 호출하고 나중에 질문하는 패턴 금지
- 특히 `grep`, `Edit`, `Write` 사용 전 의도 모호 시 먼저 질문

### 반복 작업 패턴 금지

- 동일 파일을 2회 이상 전체 읽기 금지 (세션 내)
- 생성 완료된 DOCX 파일 재생성 요청 시, 파일 존재 확인 먼저 → 재생성 필요 여부 사용자 확인 후 진행
- 에러 발생 시 전체 파일 재작성 대신 오류 줄만 Edit으로 수정

---

## 에이전트 출력 파일 표준 헤더

모든 에이전트는 출력 파일 최상단에 다음 헤더를 포함해야 한다.

```
---
agent: [에이전트명]
session: [세션ID]
timestamp: [작성시각]
inputs-read:
  - [읽은 파일1]
  - [읽은 파일2]
next-agents:
  - [다음에 호출될 에이전트명]
status: completed | requires-review | escalated
---
```

---

## 부서별 에이전트 목록

### 마케팅부
- keyword-researcher: 키워드/롱테일/구매전환 키워드 발굴
- content-writer: 블로그/SNS/상세페이지/광고카피 작성
- content-editor: 품질 검토, 광고법 체크, 톤앤매너 통일
- sns-publisher: 채널별 캡션/해시태그/30일 캘린더
- design-creator: 이미지 프롬프트/카드뉴스/영상 콘티

### 영업부
- lead-researcher: 잠재고객 발굴·A/B/C 등급 평가
- proposal-writer: 9섹션 맞춤 제안서
- quote-generator: 패키지별 견적서
- followup-emailer: 5단계 팔로업 메일 시퀀스

### 재무부
- revenue-collector: 매출 집계/미수금/거래처별 분석
- tax-invoice-organizer: 세금계산서 발행·수취 매칭
- expense-classifier: 계정과목 분류/비정상 지출 탐지
- financial-reporter: 8섹션 재무보고서

### 인사부
- job-posting-collector: 채용공고 분석/연봉기준/JD 초안
- applicant-screener: 5개 축 평가/면접질문 15개
- onboarding-checklist: D-7~3개월 온보딩 프로세스
- performance-manager: KPI/근태/성과평가표

### 고객지원부
- inquiry-classifier: 유형·긴급도 분류
- faq-answerer: 채널별 표준 답변 템플릿
- escalation-judge: 6개 기준 에스컬레이션 자동 판단
- satisfaction-analyzer: VOC/리뷰 분석/개선과제 도출

### 법무부
- contract-reviewer: 12개 항목 계약 리스크 검토
- contract-drafter: NDA/용역/제휴계약서 초안
- compliance-checker: 개인정보/광고법/노동법 준수 체크
- legal-researcher: 법령·행정기준·쟁점 조사

### 경영지원부
- market-researcher: TAM/SAM/SOM/트렌드/진입장벽
- competitor-analyst: 경쟁사 상품·가격·마케팅 비교
- data-collector: 영업/마케팅/재무/고객 KPI 통합
- analyst: 전월대비 변화·원인·우선순위 도출
- report-writer: 대표/임원용 최종 보고서

### 개발부
- prd-agent: 기능 요구사항(PRD) 정의, MVP 범위 결정
- fullstack-architect: 기술스택·폴더구조·ARCHITECTURE 설계
- ux-ia-architect: 사이트맵·화면흐름·와이어프레임 설계
- db-data-modeler: ERD·스키마·RLS·마이그레이션 설계
- backend-api-developer: API·인증·결제·비즈니스 로직 구현
- frontend-developer: 웹UI·반응형·컴포넌트 구현
- qa-tdd-engineer: 테스트 계획·단위/E2E 테스트 작성
- security-privacy-engineer: OWASP 보안·개인정보·취약점 점검
- devops-engineer: Docker·CI/CD·배포 환경 구성
- code-review-agent: 코드 품질·버그·리팩토링 검토
- documentation-agent: README·API 문서·운영매뉴얼 작성

---

## 개발 완료 후 스크리닝 규칙

**모든 개발 작업 완료 시 아래 체크리스트를 반드시 수행하고 결과를 보고하라.**  
체크 결과는 각 항목 옆에 `✅ 통과` / `⚠️ 주의` / `❌ 실패` 로 표기하고, 실패 항목은 즉시 수정 후 재확인한다.

---

### [체크리스트 A] 빌드 & 타입 안전성

| # | 항목 | 확인 방법 |
|---|------|---------|
| A-1 | `pnpm build` 오류 0건 통과 | `pnpm build` 실행 후 에러 없음 확인 |
| A-2 | TypeScript 타입 에러 0건 | `pnpm tsc --noEmit` 실행 |
| A-3 | `as any` 신규 사용 없음 | 변경 파일에서 `as any` 검색 — 불가피 시 주석으로 사유 명시 |
| A-4 | 미사용 import 없음 | ESLint 경고 확인 |

---

### [체크리스트 B] 역할별 접근 권한 (RBAC)

오센틱아트 역할 계층: `admin > branch_manager > instructor > student > member`

| # | 항목 | 확인 방법 |
|---|------|---------|
| B-1 | `/admin/*` 라우트 — admin·branch_manager 외 차단 | 각 역할로 직접 접근 테스트 |
| B-2 | `/studio/*` 라우트 — instructor 이상만 접근 | member 계정으로 접근 시 리디렉션 확인 |
| B-3 | `/my/*` 라우트 — 로그인 필수, 미로그인 시 `/login?redirect=` 이동 | 비로그인 상태로 접근 테스트 |
| B-4 | API 라우트(`/api/admin/*`) — 서버 측 role 재검증 | Postman 또는 curl로 토큰 없이 호출 시 401/403 확인 |
| B-5 | branch_manager는 자신의 지부 데이터만 조회·수정 | 타 지부 ID로 API 호출 시 거부 확인 |
| B-6 | Supabase RLS 정책 — 신규 테이블 생성 시 반드시 RLS 활성화 | `SELECT * FROM pg_policies WHERE tablename = '테이블명'` |

---

### [체크리스트 C] 데이터베이스 & 마이그레이션

| # | 항목 | 확인 방법 |
|---|------|---------|
| C-1 | 마이그레이션 파일 번호 연속성 확인 | `supabase/migrations/` 폴더 파일명 순서 확인 |
| C-2 | 멱등성(Idempotent) 보장 — `IF NOT EXISTS` / `OR REPLACE` 사용 | 마이그레이션 파일 내용 검토 |
| C-3 | 신규 FK(외래키)에 인덱스 생성 여부 | `CREATE INDEX IF NOT EXISTS idx_...` 포함 확인 |
| C-4 | 대량 데이터 테이블 변경 시 LOCK 고려 여부 | ALTER TABLE 대신 단계적 컬럼 추가 검토 |
| C-5 | 민감 데이터 필드(개인정보·결제) 암호화 또는 마스킹 여부 | 이메일·전화번호·계좌번호 평문 저장 금지 확인 |

---

### [체크리스트 D] 결제 & 정산 로직

| # | 항목 | 확인 방법 |
|---|------|---------|
| D-1 | 토스페이먼츠 성공 콜백에서 금액 서버 재검증 | `amount` 파라미터를 DB 저장 금액과 대조 |
| D-2 | 결제 완료 후 재고 차감 / 예약 상태 변경 원자적 처리 | 중복 결제 시나리오 시뮬레이션 |
| D-3 | 환불 처리 시 `payout_status` 업데이트 여부 | 환불 API 호출 후 DB 상태 확인 |
| D-4 | 강사 정산 계산 — PG 3.3% + 플랫폼 10% 공제 후 86.7% 지급 | `calcBookingFees()` 함수 단위 테스트 |
| D-5 | 지부·에이전시 수수료 계산 로직 적용 여부 | 해당 강사 예약 생성 후 fee 필드 값 확인 |

---

### [체크리스트 E] UI / UX & 반응형

| # | 항목 | 확인 방법 |
|---|------|---------|
| E-1 | 모바일(375px) · 태블릿(768px) · 데스크톱(1280px) 레이아웃 정상 | 브라우저 DevTools 반응형 모드 확인 |
| E-2 | 로딩 상태(Skeleton / Spinner) 표시 여부 | 네트워크 쓰로틀링 후 확인 |
| E-3 | 빈 상태(Empty State) UI 존재 여부 | 데이터 0건일 때 화면 확인 |
| E-4 | 폼 유효성 검사 — 필수 항목 미입력 시 에러 메시지 | 각 필드 비워두고 제출 테스트 |
| E-5 | 성공/실패 토스트 메시지 (`sonner`) 동작 여부 | 액션 실행 후 토스트 확인 |
| E-6 | 한글 깨짐 없음 (인코딩 이슈) | 한글 포함 데이터 입력·조회 테스트 |

---

### [체크리스트 F] 보안

| # | 항목 | 확인 방법 |
|---|------|---------|
| F-1 | 환경변수 하드코딩 없음 | 변경 파일에서 `sk_`, `secret`, `password` 문자열 검색 |
| F-2 | `.env.local` 파일 `.gitignore` 포함 여부 | `git status`에서 env 파일 미추적 확인 |
| F-3 | 사용자 입력값 서버 측 재검증 (클라이언트 검증만 믿지 않음) | API 라우트에서 Zod 또는 수동 검증 확인 |
| F-4 | SQL Injection 방어 — Supabase 클라이언트 파라미터화 사용 | 원시 SQL 직접 삽입 없음 확인 |
| F-5 | XSS 방어 — `dangerouslySetInnerHTML` 미사용 또는 sanitize 처리 | 검색 결과 확인 |
| F-6 | 관리자 API에서 `createAdminClient()` 사용, 일반 API에서 `createClient()` 사용 구분 | 각 API 라우트 상단 client 종류 확인 |

---

### [체크리스트 G] 성능

| # | 항목 | 확인 방법 |
|---|------|---------|
| G-1 | N+1 쿼리 없음 — 루프 안에서 개별 DB 쿼리 금지 | 코드 리뷰에서 반복문 내 await supabase 확인 |
| G-2 | 이미지 `next/image` 사용 여부 | `<img>` 태그 직접 사용 여부 검색 |
| G-3 | 불필요한 `'use client'` 제거 — 서버 컴포넌트 우선 | 변경 파일에서 use client 사용 필요성 검토 |
| G-4 | 큰 리스트에 페이지네이션 또는 무한 스크롤 적용 여부 | `.limit()` 또는 페이지 파라미터 확인 |

---

### [체크리스트 H] 문서화 & 인수인계

| # | 항목 | 확인 방법 |
|---|------|---------|
| H-1 | 신규 마이그레이션 파일에 주석(목적·변경 이유) 포함 | 마이그레이션 파일 상단 `-- 목적:` 주석 확인 |
| H-2 | 신규 API 라우트 — HTTP 메서드·파라미터·응답 형식 주석 | route.ts 파일 상단 설명 확인 |
| H-3 | 복잡한 비즈니스 로직에 인라인 주석 (WHY 중심) | 수수료 계산, 정산 로직 등 핵심 부분 확인 |
| H-4 | `PROGRESS.md` 또는 세션 메타에 완료 내용 기록 | 작업 완료 후 진행 상황 업데이트 |

---

### 스크리닝 보고 양식

개발 작업 완료 후 다음 형식으로 결과를 보고한다.

```
## 개발 스크리닝 결과

**작업 내용:** [구현한 기능 한 줄 요약]
**변경 파일:** [수정/생성된 파일 목록]
**마이그레이션:** [적용된 마이그레이션 파일명]

### 체크리스트 결과

| 카테고리 | 통과 | 주의 | 실패 |
|---------|:---:|:---:|:---:|
| A. 빌드 & 타입 | | | |
| B. 권한 (RBAC) | | | |
| C. DB & 마이그레이션 | | | |
| D. 결제 & 정산 | | | |
| E. UI/UX & 반응형 | | | |
| F. 보안 | | | |
| G. 성능 | | | |
| H. 문서화 | | | |

### 실패/주의 항목 상세
- [ ] [항목번호] [문제 내용] → [조치 계획]

### 다음 단계
- [배포 준비 완료 / 추가 수정 필요 / 대표 확인 요청]
```

---

### 배포 전 최종 게이트 (대표 승인 필요)

아래 항목 중 하나라도 해당되면 **즉시 대표에게 보고하고 승인 후 배포**한다.

1. 결제·환불 로직 변경
2. 강사 정산 계산 로직 변경
3. 사용자 역할(role) 체계 변경
4. 개인정보 처리 방식 변경
5. 외부 API 키 추가 또는 교체
6. DB 스키마 삭제·컬럼 드롭
7. RLS 정책 비활성화 또는 완화

---

## 산출물 품질 기준

모든 에이전트의 출력은 다음 기준을 만족해야 한다.

- **실무성**: 담당자가 복사해서 바로 사용 가능한 수준
- **경영자 관점**: 결론 먼저, 숫자·리스크·의사결정 포인트 포함
- **협업성**: 다음 에이전트가 이어받을 수 있도록 입출력 명확
- **리스크 관리**: 법률·세무·노무·개인정보 리스크와 대응방안 함께 제시

## 금지 사항

- 사실 확인 없이 확정적으로 말하지 않는다
- 법률·세무·노무 판단을 최종 자문처럼 단정하지 않는다
- 과장 광고 문구를 제안하지 않는다
- 출처 불명 수치를 확정 자료처럼 사용하지 않는다
- 개인정보는 노출되지 않도록 한다.
