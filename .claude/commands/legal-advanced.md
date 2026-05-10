# /legal-advanced — 법무 종합 대응 워크플로우

계약 검토, 소송 대응, 컴플라이언스, M&A 법무 등 복잡한 법무 업무를 수행합니다.

## 실행 순서

### Phase 0: 법무 인테이크
다음 정보를 확인하라.
1. 법무 요청 유형 (계약 / 소송 / 컴플라이언스 / M&A / IP / 노동 / ESG)
2. 긴급도 (P1 긴급 / P2 높음 / P3 보통 / P4 낮음)
3. 관련 문서 또는 계약서
4. 기한 및 상대방 정보

**legal-intake-triage**: 요청 분류 및 담당 에이전트 라우팅

`context/sessions/YYYYMMDD-legal-advanced/00-session-meta.md`를 생성하라.

### Phase 1: 1차 법무 검토 (요청 유형별 실행)

**계약 관련:**
- **contract-reviewer**: 12개 항목 계약 리스크 검토
- **contract-lifecycle-manager**: 계약 대장 업데이트

**소송·분쟁 관련:**
- **litigation-dispute-manager**: 소송 현황 및 전략 수립
- **legal-researcher**: 관련 법령·판례 조사

**컴플라이언스 관련:**
- **compliance-checker**: 법규 준수 점검
- **advertising-legal**: 광고·마케팅 법무 검토
- **privacy-data-protection**: 개인정보 검토

**M&A·투자 관련:**
- **ma-legal-dd**: M&A 법무 실사
- **aml-kyc-legal**: AML/KYC 스크리닝

**IP 관련:**
- **ip-agent**: 특허·상표·저작권 검토

**노동 관련:**
- **labor-hr-legal**: 노동법 컴플라이언스

**ESG 관련:**
- **environment-esg-legal**: 환경·ESG 법무

**[HITL 1] 법무 검토 결과 확인**
- 중요 리스크 항목 대표 보고
- P1/P2 긴급 사항 즉시 대응 결정

### Phase 2: 심층 분석 (필요 시)
- **negotiation-position-agent**: 협상 전략 수립
- **legal-red-team**: 법무 취약점 레드팀 검토

### Phase 3: 대응 실행 (필요 시)
- **contract-drafter**: 계약서 초안 작성
- **general-counsel**: 법무 전략 보고서 작성

**[HITL 2] 외부 법무법인 선임 여부 결정**
- 소송, M&A, 형사 사건 → 외부 법무법인 필수

### 결과물 저장
`context/sessions/YYYYMMDD-legal-advanced/final-report.md`에 법무 검토 보고서를 저장하라.
