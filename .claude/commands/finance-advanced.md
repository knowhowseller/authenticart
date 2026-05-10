# /finance-advanced — 재무·CFO 종합 대응 워크플로우

월마감, 재무 전략, 세무, 자금 관리, PF, 내부통제 등 복잡한 재무 업무를 수행합니다.

## 실행 순서

### Phase 0: 재무 요청 확인
다음 정보를 확인하라.
1. 재무 요청 유형 (월마감 / 세무 / 자금관리 / PF / 내부통제 / CFO전략)
2. 기준 기간 또는 보고 대상
3. 사용 가능한 데이터 (재무제표, ERP 자료 등)
4. 긴급도 및 마감 기한

`context/sessions/YYYYMMDD-finance-advanced/00-session-meta.md`를 생성하라.

### Phase 1: 재무 현황 집계 (병렬)
다음 에이전트를 병렬 실행하라:
- **monthly-close-manager**: 월마감 체크리스트 이행 현황
- **treasury-cash-agent**: 13주 현금흐름 예측, 유동성 현황
- **fpa-budget-agent**: 예산 vs 실적 분석

### Phase 2: 세무 및 통제 (병렬)
다음 에이전트를 병렬 실행하라:
- **tax-agent**: 세무 신고 일정 및 리스크 점검
- **internal-control-agent**: 내부통제 취약점 점검

**[HITL 1] 재무 현황 CFO 보고**
- Red 항목 즉각 조치 결정
- 자금 부족 시 조달 방안 승인

### Phase 3: 전략 재무 (순차)
1. **cfo-strategy-agent**: CFO 전략 보고서 작성 (Cash Runway, DSCR, FCF)
2. **financial-reporter**: 8섹션 재무보고서 작성

### Phase 4: PF/프로젝트 재무 (필요 시)
- **project-finance-agent**: PF 약정 준수, DSCR, 대주단 보고

**[HITL 2] 최종 재무 보고서 승인**
- CFO + 대표 검토
- 이사회 보고 여부 결정

### Phase 5: 경영진 보고
- **report-writer**: 대표·이사회용 최종 재무 보고서 작성

### 결과물 저장
`context/sessions/YYYYMMDD-finance-advanced/final-report.md`에 재무 종합 보고서를 저장하라.
