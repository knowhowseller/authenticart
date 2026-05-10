---
description: 월간 매출·비용·KPI·경쟁 현황을 통합하여 대표 보고서를 자동 생성한다
argument-hint: <YYYY년 MM월> (생략 시 전월 자동 설정)
allowed-tools: Read, Write, Glob, Grep
---

# /monthly-report 워크플로우

월간 경영 데이터를 통합하여 대표용 보고서를 원스톱으로 생성하라.

---

## Phase 0: 세션 초기화 및 데이터 준비

**1. 보고 기간 설정**
인자가 제공된 경우: 해당 월로 설정
인자 없는 경우: 전월 자동 설정

`context/business_profile.md`를 읽어라.

**2. 사용자에게 데이터 확인**
"[분석 기간] 경영보고서를 생성합니다.
다음 데이터가 있으시면 파일 또는 내용을 공유해 주세요:
- 매출 데이터 (거래처별, 상품별)
- 비용 지출 내역
- 주요 KPI 수치 (영업, 마케팅 등)

없으신 경우 가능한 범위에서 분석하고 데이터 수집 방법을 안내해 드립니다."

**3. 세션 폴더 생성**
`context/sessions/[YYYYMM]-monthly-report/`
`00-session-meta.md` 작성

---

## Phase 1: 데이터 수집 (병렬 실행)

다음 3개 에이전트를 동시에 호출하라:

**에이전트 1 — revenue-collector**
프롬프트: "세션 ID: [YYYYMM]-monthly-report. [분석기간] 매출 데이터: [데이터 또는 없음]. context/business_profile.md를 읽고 월별 추이, 거래처별, 상품별 매출과 미수금을 분석하여 revenue-collector-output.md에 저장하라."

**에이전트 2 — expense-classifier**
프롬프트: "세션 ID: [YYYYMM]-monthly-report. [분석기간] 비용 데이터: [데이터 또는 없음]. 비용을 계정과목별로 분류하고 고정비/변동비 구분, 이상치를 탐지하여 expense-classifier-output.md에 저장하라."

**에이전트 3 — data-collector**
프롬프트: "세션 ID: [YYYYMM]-monthly-report. [분석기간] KPI/영업/마케팅 데이터: [데이터 또는 없음]. context/business_profile.md를 읽고 가능한 경영 지표를 취합하여 data-collector-output.md에 저장하라."

---

## Phase 2: 재무 분석 (순차 실행)

**에이전트 1 — tax-invoice-organizer**
프롬프트: "세션 ID: [YYYYMM]-monthly-report. revenue-collector-output.md를 읽고 [분석기간] 세금계산서 발행·수취 내역을 정리하여 tax-invoice-organizer-output.md에 저장하라."

tax-invoice-organizer 완료 후:

**에이전트 2 — financial-reporter**
프롬프트: "세션 ID: [YYYYMM]-monthly-report. revenue-collector-output.md, expense-classifier-output.md, tax-invoice-organizer-output.md를 모두 읽고 8섹션 재무보고서를 작성하여 financial-reporter-output.md에 저장하라."

---

## Phase 3: 경영 분석 (병렬 실행)

**에이전트 1 — analyst**
프롬프트: "세션 ID: [YYYYMM]-monthly-report. data-collector-output.md, financial-reporter-output.md를 읽고 전월 대비 변화 분석, 원인 분석, 개선 우선순위 매트릭스를 작성하여 analyst-output.md에 저장하라."

**에이전트 2 — competitor-analyst**
프롬프트: "세션 ID: [YYYYMM]-monthly-report. context/business_profile.md를 읽고 [분석기간] 경쟁사 동향과 시장 변화를 분석하여 competitor-analyst-output.md에 저장하라."

---

## [HITL 게이트] — 추가 과제 입력

사용자에게 분석 결과 요약을 제시하라.

"이번 달 주요 지표 요약입니다:
- 매출: [수치] (전월 대비 [%])
- 주요 이슈: [이슈]

다음 달 중점 관리 과제를 추가하시겠습니까? (없으면 바로 보고서 생성)"

사용자 입력을 세션 메타에 기록하라.

---

## Phase 4: 최종 보고서 (순차 실행)

**에이전트 — report-writer**
프롬프트: "세션 ID: [YYYYMM]-monthly-report. 세션 폴더의 모든 output.md를 읽고 [분석기간] 월간 경영보고서를 작성하라. Executive Summary(1페이지), 매출/비용/손익/KPI/경쟁동향/리스크/다음달 과제를 포함하여 final-report.md에 저장하고, context/decision_log.md에 이번 달 주요 의사결정 사항을 추가하라."

---

## 최종 결과물 안내

- `final-report.md` — 대표용 월간 경영보고서 (출력 즉시 보고 가능)
- `financial-reporter-output.md` — 재무 상세 분석
- `analyst-output.md` — 경영 인사이트
- `context/decision_log.md` — 의사결정 이력 업데이트

모두 `context/sessions/[YYYYMM]-monthly-report/` 폴더에 저장됨.

**⚠️ 재무·세무 관련 내용은 세무사·회계사 검토 후 공식 사용하십시오.**
