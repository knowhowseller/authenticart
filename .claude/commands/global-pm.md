# /global-pm — 글로벌 PM·건설사업관리 워크플로우

건설, EPC, 인프라, 글로벌 프로젝트의 기획부터 준공까지 관리합니다.

## 실행 순서

### Phase 0: 프로젝트 정보 수집
다음 정보를 확인하라.
1. 프로젝트 유형 (건설 / EPC / 인프라 / 개발사업)
2. 발주자 및 계약 유형 (FIDIC Red/Yellow/Silver/Gold Book)
3. 프로젝트 규모 (계약금액)
4. 공기 (착공일 ~ 준공 목표일)
5. 현재 단계 (기획 / 설계 / 시공 / 시운전)
6. 주요 이슈 또는 요청 사항

`context/sessions/YYYYMMDD-global-pm/00-session-meta.md`를 생성하라.

### Phase 1: 프로젝트 기준선 수립 (순차)
1. **pmo-agent**: 프로젝트 헌장 작성, WBS 기준선 수립
2. **scheduler-agent**: 공정표(Baseline Schedule) 작성, CPM 분석
3. **cost-controller-agent**: 예산 기준선(BAC) 수립, EVM 기준점 설정

### Phase 2: 리스크 및 HSE (병렬)
다음 에이전트를 병렬 실행하라:
- **risk-issue-decision-log**: 리스크 레지스터 초기화, 주요 리스크 식별
- **hse-quality-agent**: HSE 계획 수립, 품질 관리 계획

**[HITL 1] 기준선 승인**
- 공정표, 예산, 리스크 레지스터 승인
- 발주자 기준선 제출 승인

### Phase 3: 정기 모니터링 (병렬)
다음 에이전트를 병렬 실행하라:
- **scheduler-agent**: 공정 현황 및 지연 분석
- **cost-controller-agent**: EVM 분석 (CPI/SPI/EAC)
- **hse-quality-agent**: HSE 이슈 및 NCR 현황

### Phase 4: 이해관계자 보고 (순차)
1. **stakeholder-comms-agent**: 발주자·파트너 보고서 작성
2. **pmo-agent**: 경영진 월간 Executive Report (신호등 보고)

**[HITL 2] 이슈 대응 결정**
- EOT/클레임 제기 여부 결정
- 예비비 사용 결정
- 만회 계획 승인

### Phase 5: 클레임 (필요 시)
- **construction-claim-legal**: EOT/VO/추가비용 클레임 법무 검토
- **negotiation-position-agent**: 협상 포지션 수립

### Phase 6: 준공·인수인계
1. **commissioning-handover-agent**: 시운전 계획, Punch List 관리, PAC/FAC

**[HITL 3] 준공 최종 승인**
- PAC 서명 승인
- DLP 관리 계획 확정

### 결과물 저장
`context/sessions/YYYYMMDD-global-pm/final-report.md`에 프로젝트 완료 보고서를 저장하라.
