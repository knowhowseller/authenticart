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
