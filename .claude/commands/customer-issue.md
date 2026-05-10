---
description: 고객 문의·불만을 즉시 분류하고 에스컬레이션 판단, 답변 작성, VOC 분석, 개선 보고서까지 진행한다
argument-hint: <고객 문의 내용 또는 VOC 데이터 파일 경로>
allowed-tools: Read, Write, Glob, Grep
---

# /customer-issue 워크플로우

고객 이슈 접수부터 개선 보고서까지 원스톱으로 진행하라.

---

## Phase 0: 세션 초기화 및 데이터 수집

`context/business_profile.md`를 읽어라.

**수집할 정보:**
- 고객 문의 내용 (전문 또는 요약)
- VOC/리뷰 데이터가 있다면 파일 경로 또는 내용
- 발생 시각
- 고객 정보 (가능한 범위에서)

세션 폴더 생성: `context/sessions/[YYYYMMDD]-customer-issue/`
세션 메타 작성: `00-session-meta.md`

---

## Phase 1: 긴급 분류 (병렬 실행 — 즉시)

다음 2개 에이전트를 동시에 호출하라. 이 단계는 지연 없이 즉시 실행해야 한다.

**에이전트 1 — inquiry-classifier**
프롬프트: "세션 ID: [YYYYMMDD]-customer-issue. 다음 고객 문의를 분류하라: [문의 내용]. context/business_profile.md를 읽고 유형·긴급도·담당부서를 판정하여 inquiry-classifier-output.md에 저장하라."

**에이전트 2 — escalation-judge**
프롬프트: "세션 ID: [YYYYMMDD]-customer-issue. 다음 고객 문의에 대해 6개 에스컬레이션 기준을 체크하라: [문의 내용]. 즉시 대응 스크립트를 포함하여 escalation-judge-output.md에 저장하라."

---

## [에스컬레이션 자동 게이트]

escalation-judge-output.md를 읽어라.

**에스컬레이션 YES인 경우:**
사용자에게 즉시 알림:

"🚨 **에스컬레이션 필요** 🚨

[에스컬레이션 기준 해당 항목]에 해당합니다.

**즉시 조치:**
- 보고 대상: [대상]
- 대응 스크립트: [스크립트]
- 24시간 체크리스트: [목록]

법무·재무 에이전트를 추가로 호출하시겠습니까?"

사용자 확인 후 compliance-checker 또는 legal-researcher를 추가 호출하라.

**에스컬레이션 NO인 경우:**
Phase 2로 자동 진행하라.

---

## Phase 2: 답변 작성 (순차 실행)

**에이전트 1 — faq-answerer**
프롬프트: "세션 ID: [YYYYMMDD]-customer-issue. inquiry-classifier-output.md를 읽고 이 문의에 대한 전화·이메일·채팅 채널별 답변을 작성하여 faq-answerer-output.md에 저장하라."

faq-answerer 완료 후:

**에이전트 2 — compliance-checker**
프롬프트: "세션 ID: [YYYYMMDD]-customer-issue. faq-answerer-output.md의 답변 문구에 법적 리스크가 없는지 확인하여 compliance-checker-output.md에 저장하라. 특히 환불 정책, 손해배상 관련 표현을 점검하라."

---

## Phase 3: VOC 분석 (순차 실행 — VOC 데이터가 있는 경우)

사용자에게 VOC 데이터(리뷰, 설문 등)가 있는지 확인하라. 있으면 진행, 없으면 Phase 4로 건너뛰어라.

**에이전트 1 — satisfaction-analyzer**
프롬프트: "세션 ID: [YYYYMMDD]-customer-issue. [VOC 데이터]를 분석하여 불만 유형 TOP 5, 칭찬 요소 TOP 5, 즉시 개선 과제를 satisfaction-analyzer-output.md에 저장하라."

satisfaction-analyzer 완료 후:

**에이전트 2 — analyst**
프롬프트: "세션 ID: [YYYYMMDD]-customer-issue. satisfaction-analyzer-output.md를 읽고 반복 이슈의 근본 원인과 개선 우선순위 매트릭스를 작성하여 analyst-output.md에 저장하라."

---

## Phase 4: 개선 보고서

**에이전트 — report-writer**
프롬프트: "세션 ID: [YYYYMMDD]-customer-issue. 세션 폴더의 모든 output.md를 읽고 고객 이슈 현황 및 개선 방향 보고서를 작성하라. 즉시 조치 사항, VOC 분석 결과, 개선 과제 우선순위를 포함하여 final-report.md에 저장하라."

---

## 최종 결과물 안내

- 즉시 사용 가능한 고객 응대 답변 (전화/이메일/채팅)
- 에스컬레이션 대응 스크립트 (해당 시)
- VOC 분석 보고서 (해당 시)
- 개선 과제 우선순위 보고서

모두 `context/sessions/[YYYYMMDD]-customer-issue/` 폴더에 저장됨.
