# /ceo-orchestration — CEO 경영 오케스트레이션 워크플로우

대표가 전사 현황을 파악하고 전략적 의사결정을 내리기 위한 종합 경영 브리핑을 수행합니다.

## 실행 순서

### Phase 0: 오케스트레이션 범위 확인
다음 정보를 확인하라.
1. 보고 주기 (일간 / 주간 / 월간 / 분기)
2. 집중 검토 필요 부서 또는 이슈
3. 의사결정이 필요한 보류 사항
4. 이사회 또는 주주 보고 예정 여부

`context/sessions/YYYYMMDD-ceo-orchestration/00-session-meta.md`를 생성하라.

### Phase 1: 전사 KPI 현황 수집 (병렬)
다음 에이전트를 병렬 실행하라:
- **group-kpi-okr-manager**: 전 부서 KPI/OKR 달성 현황, Red 항목 식별
- **risk-control-tower**: 전사 리스크 히트맵 업데이트
- **data-collector**: 영업/마케팅/재무/고객 KPI 통합

### Phase 2: 전략 정합성 점검 (병렬)
다음 에이전트를 병렬 실행하라:
- **strategy-vision-aligner**: 부서별 OKR-전략 정합성 점검
- **analyst**: 전월 대비 변화, 원인, 우선순위 도출
- **interdept-conflict-mediator**: 부서 간 갈등 현황 및 중재 사항 정리

**[HITL 1] 리스크·KPI 검토**
- Red 리스크 및 KPI 항목 대표 직접 검토
- 즉각 조치 또는 에스컬레이션 결정

### Phase 3: 부문별 심층 현황 (요청 시 선택적 실행)
- **재무**: cfo-strategy-agent → financial-reporter
- **법무**: general-counsel (법무 리스크 현황)
- **M&A/투자**: board-ir-filter (투자 파이프라인 현황)
- **프로젝트**: pmo-agent (진행 중 프로젝트 현황)
- **마케팅**: marketing-data-analyst (채널별 성과)

### Phase 4: 의사결정 패킷 작성 (순차)
1. **executive-decision-packet**: 미결 의사결정 사항 1페이지 패킷 작성
2. **executive-briefing-agent**: 주간/월간 경영진 브리핑 패킷 작성

### Phase 5: 최종 경영 보고서
1. **ceo-orchestrator**: 전사 통합 오케스트레이션 보고서
2. **report-writer**: 대표·임원용 최종 경영 보고서

**[HITL 2] 최종 보고서 승인 및 이사회 여부 결정**

### 결과물 저장
`context/sessions/YYYYMMDD-ceo-orchestration/final-report.md`에 경영 종합 보고서를 저장하라.
