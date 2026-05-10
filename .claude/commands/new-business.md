---
description: 신사업 아이디어를 시장분석·경쟁분석·수익모델·리스크검토·사업계획서까지 원스톱으로 진행한다
argument-hint: <업종 또는 사업 아이디어>
allowed-tools: Read, Write, Glob, Grep, Bash
---

# /new-business 워크플로우

사용자가 신사업 아이디어나 업종을 제공하면 다음 순서로 진행하라.

---

## Phase 0: 세션 초기화 및 컨텍스트 수집

**1. 비즈니스 프로필 확인**
`context/business_profile.md`를 읽어라.
핵심 항목(업종, 상품, 타겟)이 비어 있으면 다음 5개 질문을 먼저 수집하라:
1. 어떤 업종 또는 사업 아이디어인가?
2. 주요 타겟 고객은 누구인가?
3. 예상 가격 범위 또는 수익 방식은?
4. 보유한 강점이나 자원이 있는가?
5. 목표 오픈/런칭 시기가 있는가?

**2. 세션 폴더 생성**
`context/sessions/[YYYYMMDD]-new-business/` 폴더를 생성하라.

**3. 세션 메타 파일 작성**
`context/sessions/[YYYYMMDD]-new-business/00-session-meta.md`에 다음을 기록하라:
```
# 세션 메타데이터
- 세션 ID: [YYYYMMDD]-new-business
- 시작 시각: [현재 시각]
- 워크플로우: new-business
- 주요 목표: [사업 아이디어 한 줄 요약]
- 사용자 입력값: [수집한 정보]
- 실행 에이전트 순서: market-researcher + competitor-analyst + keyword-researcher → analyst → financial-reporter → compliance-checker + legal-researcher → proposal-writer → report-writer
- 현재 단계: Phase 1 시작
```

---

## Phase 1: 시장 환경 분석 (병렬 실행)

다음 3개 에이전트를 동시에 호출하라:

**에이전트 1 — market-researcher**
프롬프트: "신사업 아이디어: [사업 아이디어]. 세션 ID: [YYYYMMDD]-new-business. context/business_profile.md와 세션 메타를 읽고 시장규모(TAM/SAM/SOM), 트렌드, 고객 세그먼트, 진입장벽, 성공요인을 분석하여 market-researcher-output.md에 저장하라."

**에이전트 2 — competitor-analyst**
프롬프트: "신사업 아이디어: [사업 아이디어]. 세션 ID: [YYYYMMDD]-new-business. context/business_profile.md를 읽고 주요 경쟁사 3~5개를 분석하여 차별화 전략 3가지를 포함한 competitor-analyst-output.md에 저장하라."

**에이전트 3 — keyword-researcher**
프롬프트: "신사업 아이디어: [사업 아이디어]. 세션 ID: [YYYYMMDD]-new-business. 이 사업의 핵심 키워드, 롱테일 키워드, 구매전환 키워드와 콘텐츠 주제 10개를 발굴하여 keyword-researcher-output.md에 저장하라."

모든 3개 에이전트 완료 후 결과를 읽고 사용자에게 요약을 제시하라.

---

## [HITL 게이트 1] — 방향 확인

사용자에게 다음을 제시하라:
- 시장 기회 요약 (3줄)
- 주요 경쟁사와 우리의 차별화 포인트
- 타겟 고객 추천

"이 방향으로 진행하시겠습니까? 수정하실 사항이 있으시면 말씀해 주세요."

사용자 피드백을 반영하여 세션 메타에 기록하라.

---

## Phase 2: 비즈니스 모델 설계 (순차 실행)

**에이전트 1 — analyst**
프롬프트: "세션 ID: [YYYYMMDD]-new-business. market-researcher-output.md, competitor-analyst-output.md를 읽고 이 사업에 적합한 수익모델 옵션 3가지를 각각의 장단점과 초기 투자 수준을 포함하여 analyst-output.md에 저장하라."

analyst 완료 후:

**에이전트 2 — financial-reporter**
프롬프트: "세션 ID: [YYYYMMDD]-new-business. analyst-output.md를 읽고 3가지 수익모델 각각에 대해 월별 손익분기점 예상 도달 시기, 초기 투자 비용 범위, 6개월 예상 현금흐름을 추정하여 financial-reporter-output.md에 저장하라."

---

## [HITL 게이트 2] — 수익모델 선택

사용자에게 수익모델 3가지 옵션을 제시하라:
| 모델 | 특징 | 초기 투자 | BEP 예상 |
|------|------|---------|---------|

"어느 수익모델로 계속 진행할까요?"

선택된 모델을 세션 메타에 기록하라.

---

## Phase 3: 리스크 검토 (병렬 실행)

다음 2개 에이전트를 동시에 호출하라:

**에이전트 1 — compliance-checker**
프롬프트: "세션 ID: [YYYYMMDD]-new-business. [선택된 수익모델과 업종]에 대해 개인정보보호, 표시광고법, 업종별 특수 규제를 점검하여 compliance-checker-output.md에 저장하라."

**에이전트 2 — legal-researcher**
프롬프트: "세션 ID: [YYYYMMDD]-new-business. [업종과 수익모델]에 필요한 인허가, 관련 법령, 법적 쟁점을 조사하여 legal-researcher-output.md에 저장하라."

---

## Phase 4: 사업계획서 작성 (순차 실행)

**에이전트 1 — proposal-writer**
프롬프트: "세션 ID: [YYYYMMDD]-new-business. 세션 폴더의 모든 output.md 파일을 읽고 [선택된 수익모델] 기반의 완성형 사업계획서를 9섹션 구조로 작성하여 proposal-writer-output.md에 저장하라."

proposal-writer 완료 후:

**에이전트 2 — report-writer**
프롬프트: "세션 ID: [YYYYMMDD]-new-business. 세션 폴더의 모든 output.md 파일을 읽고 대표/투자자용 신사업 기획 최종 보고서를 작성하라. 사업개요/시장분석/경쟁분석/수익모델/실행전략/리스크/30-60-90일 로드맵을 포함하여 final-report.md에 저장하고, context/decision_log.md에 주요 결정사항을 추가하라."

---

## 최종 결과물 안내

사용자에게 다음을 알려라:
- `context/sessions/[YYYYMMDD]-new-business/final-report.md` — 최종 사업계획서
- 세션 폴더 내 각 에이전트 출력 파일 — 부서별 상세 분석
- `context/decision_log.md` — 의사결정 이력
