# /dev-build — 홈페이지·앱·웹서비스 개발 워크플로우

홈페이지, 앱, 웹서비스, 랜딩페이지, 프로덕트 개발을 기획부터 출시까지 수행합니다.

## 실행 순서

### Phase 0: 사전 정보 수집
다음 정보를 확인하라.
1. 어떤 서비스를 개발하는가? (홈페이지 / 앱 / 웹서비스)
2. 핵심 기능과 MVP 범위는?
3. 타겟 사용자는 누구인가?
4. 기술 스택 제약이 있는가? (기존 시스템, 언어, 클라우드)
5. 예산과 일정은?
6. 브랜드 톤앤매너가 있는가?

`context/sessions/YYYYMMDD-dev-build/00-session-meta.md`를 생성하라.

### Phase 1: 사용자·전략 분석 (병렬)
다음 에이전트를 병렬 실행하라:
- **marketing-strategist**: STP, 포지셔닝, 핵심 메시지 설계
- **customer-insight-researcher**: 타겟 고객 Pain Point, JTBD 분석

### Phase 2: 기획 (순차)
1. **prd-agent**: 기능 요구사항 정의서(PRD) 작성, MVP 범위 확정
2. **ux-ia-architect**: 고객 여정, 정보구조, 화면 흐름, 메뉴 구조 설계

**[HITL 1] PRD·MVP 범위 사용자 확인**
- PRD 내 기능 목록 검토 및 우선순위 조정
- MVP 포함/제외 항목 최종 결정

### Phase 3: 설계 (순차)
1. **fullstack-architect**: 기술스택, 폴더구조, 배포구조, 확장성 설계
2. **brand-ui-designer**: 디자인 시스템, 컬러·타이포·컴포넌트 가이드, 주요 화면 목업

### Phase 4: 개발 (순차 + 병렬)
1. **content-writer**: 서비스 내 텍스트·카피·설명 작성
2. 다음 에이전트를 병렬 실행하라:
   - **frontend-developer**: 웹 UI, 반응형, 관리자 화면
   - **backend-api-developer**: API, 인증, 비즈니스 로직
   - **db-data-modeler**: ERD, 스키마, RLS, 마이그레이션

### Phase 5: 검증 (병렬)
다음 에이전트를 병렬 실행하라:
- **qa-tdd-engineer**: 단위/통합/E2E 테스트, Playwright 자동화
- **security-privacy-engineer**: OWASP 점검, 인증/인가, 개인정보 보안
- **compliance-checker**: 개인정보처리방침, 광고법, 약관 적합성

**[HITL 2] 테스트·보안 결과 사용자 확인**
- Critical 버그 수정 완료 확인
- 보안 취약점 해소 확인

### Phase 6: 출시 (순차)
1. **devops-engineer**: Docker, CI/CD, HTTPS, 배포 환경 구축
2. **documentation-agent**: README, ARCHITECTURE, API 문서 작성
3. **launch-store-manager**: 웹 배포 체크리스트, 앱스토어 출시 준비

**[HITL 3] 출시 최종 승인**
- 대표 최종 확인 후 production 배포 진행

### 결과물 저장
`context/sessions/YYYYMMDD-dev-build/final-report.md`에 개발 완료 보고서를 저장하라.
