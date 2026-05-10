---
description: 콘텐츠 기획부터 SNS 배포, 영업 제안, 팔로업 메일까지 마케팅-영업 전 사이클을 진행한다
argument-hint: <콘텐츠 주제 또는 타겟 고객>
allowed-tools: Read, Write, Glob, Grep
---

# /marketing-sales 워크플로우

마케팅 콘텐츠 제작부터 영업 연계까지 원스톱으로 진행하라.

---

## Phase 0: 세션 초기화

**1. 비즈니스 프로필 확인**
`context/business_profile.md`를 읽어라.
없으면 업종, 상품/서비스, 타겟 고객, 브랜드 톤을 먼저 수집하라.

**2. 세션 폴더 생성 및 메타 작성**
`context/sessions/[YYYYMMDD]-marketing-sales/00-session-meta.md`에 기록:
- 목표: [콘텐츠 주제 또는 캠페인 목적]
- 타겟: [타겟 고객]
- 결과물: [원하는 콘텐츠 유형]

---

## Phase 1: 기반 리서치 (병렬 실행)

**에이전트 1 — keyword-researcher**
프롬프트: "세션 ID: [YYYYMMDD]-marketing-sales. [콘텐츠 주제/타겟]에 맞는 핵심 키워드, 롱테일 키워드, 구매전환 키워드와 콘텐츠 주제 10개를 발굴하여 keyword-researcher-output.md에 저장하라."

**에이전트 2 — lead-researcher**
프롬프트: "세션 ID: [YYYYMMDD]-marketing-sales. [타겟 고객] 기반으로 잠재 리드 리스트와 A/B/C 등급 평가를 수행하여 lead-researcher-output.md에 저장하라. 이 결과는 콘텐츠 영업 연계에 활용된다."

---

## Phase 2: 콘텐츠 제작 (순차 실행)

**에이전트 1 — content-writer**
프롬프트: "세션 ID: [YYYYMMDD]-marketing-sales. keyword-researcher-output.md를 읽고 [콘텐츠 유형: 블로그/SNS/상세페이지]를 작성하여 content-writer-output.md에 저장하라."

content-writer 완료 후 — 아래 2개 에이전트를 병렬 실행하라:

**에이전트 2a — content-editor**
프롬프트: "세션 ID: [YYYYMMDD]-marketing-sales. content-writer-output.md를 검토하고 7개 체크리스트를 적용하여 최종 완성 원고를 content-editor-output.md에 저장하라."

**에이전트 2b — compliance-checker**
프롬프트: "세션 ID: [YYYYMMDD]-marketing-sales. content-writer-output.md의 광고·마케팅 문구에 대해 표시광고법 리스크를 점검하여 compliance-checker-output.md에 저장하라."

---

## [HITL 게이트] — 콘텐츠 확인

사용자에게 완성된 콘텐츠와 법적 리스크 점검 결과를 제시하라.

"콘텐츠 검토 결과입니다. 수정하시겠습니까, 배포 준비로 진행할까요?"

수정이 있으면 content-editor를 재호출하라.

---

## Phase 3: 배포 준비 (병렬 실행)

**에이전트 1 — sns-publisher**
프롬프트: "세션 ID: [YYYYMMDD]-marketing-sales. content-editor-output.md와 keyword-researcher-output.md를 읽고 채널별 캡션, 해시태그 30개, 30일 콘텐츠 캘린더를 sns-publisher-output.md에 저장하라."

**에이전트 2 — design-creator**
프롬프트: "세션 ID: [YYYYMMDD]-marketing-sales. content-editor-output.md를 읽고 AI 이미지 생성 프롬프트, 카드뉴스 구성, 썸네일 문구를 design-creator-output.md에 저장하라."

---

## Phase 4: 영업 연계 (순차 실행)

**에이전트 1 — proposal-writer**
프롬프트: "세션 ID: [YYYYMMDD]-marketing-sales. lead-researcher-output.md의 A등급 리드에 맞는 콘텐츠 마케팅 기반 제안서를 작성하여 proposal-writer-output.md에 저장하라."

proposal-writer 완료 후:

**에이전트 2 — followup-emailer**
프롬프트: "세션 ID: [YYYYMMDD]-marketing-sales. lead-researcher-output.md의 A등급 리드를 대상으로 5단계 팔로업 메일 시퀀스를 작성하여 followup-emailer-output.md에 저장하라."

---

## 최종 결과물 안내

- 완성 콘텐츠 (블로그/SNS 원고)
- 30일 콘텐츠 캘린더
- 채널별 해시태그 패키지
- AI 이미지 프롬프트 및 카드뉴스 기획
- 리드 기반 제안서
- 5단계 팔로업 메일 시퀀스

모두 `context/sessions/[YYYYMMDD]-marketing-sales/` 폴더에 저장됨.
