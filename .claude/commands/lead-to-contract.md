---
description: 잠재고객 발굴부터 제안서·견적서·계약서 작성, 팔로업까지 영업 전 사이클을 진행한다
argument-hint: <고객사명 또는 고객 정보>
allowed-tools: Read, Write, Glob, Grep
---

# /lead-to-contract 워크플로우

영업 기회 발굴부터 계약 체결까지 원스톱으로 진행하라.

---

## Phase 0: 고객 정보 수집

`context/business_profile.md`를 읽어라.

사용자에게 다음 정보를 수집하라 (없는 항목만):
1. 고객사명 또는 고객 유형
2. 고객의 예상 문제 또는 니즈
3. 제안할 서비스/상품
4. 예상 계약 규모 (대략적 범위)
5. 의사결정자 정보 (알고 있다면)
6. 제안 마감 시기

세션 폴더 생성: `context/sessions/[YYYYMMDD]-lead-to-contract/`
세션 메타 작성: `00-session-meta.md`

---

## Phase 1: 고객 분석 (순차 실행)

**에이전트 1 — lead-researcher**
프롬프트: "세션 ID: [YYYYMMDD]-lead-to-contract. 고객 정보: [수집된 고객 정보]. context/business_profile.md를 읽고 이 고객에 대한 상세 분석, A/B/C 등급 평가, 접근 전략을 lead-researcher-output.md에 저장하라."

lead-researcher 완료 후:

**에이전트 2 — competitor-analyst**
프롬프트: "세션 ID: [YYYYMMDD]-lead-to-contract. lead-researcher-output.md를 읽고 이 고객이 비교할 수 있는 경쟁사와 우리의 차별화 포인트를 분석하여 competitor-analyst-output.md에 저장하라."

---

## Phase 2: 제안 패키지 작성 (순차 실행)

**에이전트 1 — proposal-writer**
프롬프트: "세션 ID: [YYYYMMDD]-lead-to-contract. lead-researcher-output.md, competitor-analyst-output.md, context/business_profile.md를 읽고 이 고객을 위한 9섹션 완성형 제안서를 proposal-writer-output.md에 저장하라."

proposal-writer 완료 후:

**에이전트 2 — quote-generator**
프롬프트: "세션 ID: [YYYYMMDD]-lead-to-contract. proposal-writer-output.md를 읽고 기본/스탠다드/프리미엄 패키지 견적서를 지급조건과 유효기간 포함하여 quote-generator-output.md에 저장하라."

---

## [HITL 게이트 1] — 제안서/견적 검토

사용자에게 제안서와 견적서 요약을 제시하라.

"제안서와 견적서 초안입니다. 조정하실 항목이 있으신가요?
(예: 가격 범위, 서비스 범위, 강조점 변경 등)"

수정 사항을 반영하여 해당 에이전트를 재호출하라.

---

## Phase 3: 계약 준비 (병렬 실행)

**에이전트 1 — contract-drafter**
프롬프트: "세션 ID: [YYYYMMDD]-lead-to-contract. proposal-writer-output.md와 quote-generator-output.md를 읽고 이 거래에 맞는 계약서 초안(용역계약서)을 작성하여 contract-drafter-output.md에 저장하라."

**에이전트 2 — contract-reviewer**
프롬프트: "세션 ID: [YYYYMMDD]-lead-to-contract. contract-drafter-output.md를 읽고 12개 항목 체크리스트로 리스크를 검토하여 수정 권고사항을 contract-reviewer-output.md에 저장하라."

---

## [HITL 게이트 2] — 계약서 최종 확인

사용자에게 계약서 초안과 리스크 검토 결과를 제시하라.

"계약서 초안과 리스크 검토 결과입니다.
[🔴 즉시 수정 권고 사항: N개]
[🟡 협상 권고 사항: N개]

실제 계약 전 변호사 검토를 권장합니다.
계속 진행하시겠습니까?"

---

## Phase 4: 후속 커뮤니케이션

**에이전트 — followup-emailer**
프롬프트: "세션 ID: [YYYYMMDD]-lead-to-contract. lead-researcher-output.md를 읽고 이 고객을 위한 5단계 팔로업 메일 시퀀스를 작성하여 followup-emailer-output.md에 저장하라. 단계: 제안서 송부 → 1주 확인 → 계약 유도 → 리마인드 → 장기 재접촉."

---

## 최종 결과물 안내

- 고객 맞춤 제안서 (9섹션)
- 3개 패키지 견적서
- 계약서 초안 + 리스크 검토 보고서
- 5단계 팔로업 메일 시퀀스

모두 `context/sessions/[YYYYMMDD]-lead-to-contract/` 폴더에 저장됨.

**⚠️ 계약서는 변호사 최종 검토 후 사용하십시오.**
