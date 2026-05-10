# /ma-dd — M&A 인수합병 실사 워크플로우

기업 인수합병, 지분투자, JV를 위한 종합 실사(Due Diligence)를 수행합니다.

## 실행 순서

### Phase 0: 실사 준비
다음 정보를 확인하라.
1. 대상 기업명 및 거래 유형 (M&A/지분투자/JV)
2. 거래 규모 (예상 인수가)
3. 전략적 목적 (사업 확장 / 기술 확보 / 시장 진입)
4. 실사 기간 및 NDA 체결 여부
5. 이미 확보한 자료 목록

**[HITL 0] 실사 착수 승인**
- 대표 + NDA 체결 확인 후 실사 착수

`context/sessions/YYYYMMDD-ma-dd/00-session-meta.md`를 생성하라.

### Phase 1: 종합 실사 (병렬)
다음 에이전트를 병렬 실행하라:
- **ma-investment-dd**: 재무/계약/법무/세무 종합 DD
- **ma-legal-dd**: 법무 집중 실사 (계약 리스크, 소송, IP, 규제)
- **market-researcher**: 대상 기업 시장 포지션 분석
- **competitor-analyst**: 경쟁사 대비 포지션

### Phase 2: 가치 평가 및 시너지 (순차)
1. **financial-valuation-agent**: 기업 가치 평가 (Football Field)
2. **synergy-analysis-agent**: 수익/비용/전략 시너지 정량화
3. **investment-structure-designer**: 최적 인수 구조 설계
4. **cap-table-waterfall**: 지분 구조 및 Waterfall 시뮬레이션

**[HITL 1] 실사 결과 및 Valuation 확인**
- 핵심 리스크 항목 검토
- 인수 가격 범위 승인

### Phase 3: 리스크 교차 검증 (병렬)
다음 에이전트를 병렬 실행하라:
- **cross-validation-red-team**: 투자 논거 공격적 검증
- **legal-red-team**: 법무 취약점 레드팀 검토
- **aml-kyc-legal**: AML/KYC 스크리닝

### Phase 4: 의사결정 패킷 작성 (순차)
1. **ic-memo-agent**: 투자심의위원회 메모 (Kill Criteria 포함)
2. **board-ir-filter**: 이사회 안건 패킷 작성
3. **executive-decision-packet**: 대표 결재용 1페이지 의사결정 패킷

**[HITL 2] 이사회 최종 승인**
- 대표 + 이사회 + 법무법인 최종 검토
- 인수 실행 결정

### Phase 5: PMI 계획 (실행 결정 후)
- **pmi-integration-plan**: PMI 100일 플레이북 수립

### 결과물 저장
`context/sessions/YYYYMMDD-ma-dd/final-report.md`에 M&A 실사 종합 보고서를 저장하라.
