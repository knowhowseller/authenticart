# /vc-ma-deal — VC·M&A 딜 소싱 및 투자 검토 워크플로우

스타트업 투자, 벤처 펀드 딜 소싱, 초기 투자 검토를 수행합니다.

## 실행 순서

### Phase 0: 투자 조건 확인
다음 정보를 확인하라.
1. 투자 대상 (특정 회사 / 섹터 스크리닝)
2. 투자 유형 (지분투자 / CB / BW)
3. 투자 규모 범위
4. 투자 테마 또는 선호 섹터
5. 투자 목적 (전략적 / 재무적)

`context/sessions/YYYYMMDD-vc-ma-deal/00-session-meta.md`를 생성하라.

### Phase 1: 딜 소싱 및 스크리닝 (병렬)
다음 에이전트를 병렬 실행하라:
- **deal-sourcing-network**: 딜 파이프라인 업데이트, 소싱 채널별 기회 정리
- **startup-target-screening**: 5개 축 스크리닝 (팀/시장/제품/트랙션/경쟁우위)

**[HITL 1] 스크리닝 결과 확인**
- 진행(Pass) 딜 최종 선택
- 1차 미팅 일정 확정 승인

### Phase 2: 예비 실사 (병렬)
다음 에이전트를 병렬 실행하라:
- **ma-investment-dd**: 기업 기본 실사 (재무/법무/세무 체크리스트)
- **market-researcher**: TAM/SAM/SOM, 시장 성장률, 진입장벽 분석
- **competitor-analyst**: 경쟁사 비교 분석

### Phase 3: 가치 평가 및 구조 설계 (순차)
1. **financial-valuation-agent**: DCF/Comps/Precedent 3가지 방법 Valuation
2. **investment-structure-designer**: 투자 구조 (지분/CB/BW) 설계
3. **cap-table-waterfall**: Cap Table 및 Waterfall 시뮬레이션

**[HITL 2] Valuation 및 투자 구조 확인**
- 적정 투자 가격 범위 승인
- 투자 구조 최종 결정

### Phase 4: IC Memo 및 Term Sheet (순차)
1. **ic-memo-agent**: 투자심의위원회 메모 작성 (Kill Criteria, Bull/Bear Case)
2. **cross-validation-red-team**: 투자 논거 교차 검증
3. **term-sheet-agent**: Term Sheet 초안 작성

**[HITL 3] IC Memo 투자심의위원회 승인**
- 투자심의위원회 전원 검토 및 승인
- Term Sheet 발송 승인

### Phase 5: 법무 실사 및 계약 (병렬 + 순차)
1. 다음 에이전트를 병렬 실행하라:
   - **ma-legal-dd**: M&A 법무 실사
   - **aml-kyc-legal**: AML/KYC 스크리닝
2. **board-ir-filter**: 이사회 투자 안건 패킷 작성

### 결과물 저장
`context/sessions/YYYYMMDD-vc-ma-deal/final-report.md`에 투자 검토 보고서를 저장하라.
