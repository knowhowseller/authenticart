# 세션 메타데이터
- 세션 ID: 20260610-marketing-sales
- 시작 시각: 2026-06-10
- 워크플로우: marketing-sales (블로그 홍보 기획 + 타겟별 홍보글 7편)
- 주요 목표: 오센틱아트 공예 매거진 블로그에 게시할, 타겟별 맞춤 홍보글 7편(주 7편) 작성 및 반영
- 사용자 입력값: "홍보팀은 블로그 홍보기획을 하고 타겟별에 맞는 맞춤형 홍보글을 일주일에 7편의 블로그 홍보글을 작성해서 반영해줘"
- 실행 에이전트 순서: content-strategist(기획) → content-writer(7편) → content-editor(광고법·톤 점검, 인라인 반영) → DOCX 변환
- 현재 단계: 콘텐츠 완성 → DB 반영 방식 확인 대기
- 완료된 에이전트: 기획·작성·검토(인라인)
- 사용자 결정 사항:
  - [대기] 운영 DB(blog_posts) 직접 반영 여부 — draft 일괄 INSERT vs /admin/blog 수동 붙여넣기
  - [대기] 발행 상태 — draft(검수 후 발행) vs published(즉시 공개)

## 비즈니스 컨텍스트 확정
- 대상 비즈니스: **오센틱아트**(공예·레진아트 원데이클래스 예약 + 작가 작품 거래 + 강사/지부/에이전시 + B2B 출강/팀빌딩)
- (주의) context/business_profile.md의 "주식회사 서우(AI 에이전시)"는 본 플랫폼과 무관 — 사용 안 함
- 블로그 시스템: blog_posts 테이블 / 카테고리 guide·story·instructor·trend·review·news / 본문 마크다운 / excerpt·faq(AEO) 필드 / status draft|published / is_featured(홈 노출)
- 발행 경로: /admin/blog (AI 생성 마크다운 붙여넣기) 또는 DB INSERT

## 준수 기준 (고정)
- 표시광고법: 성과·효과 보장/단정, 근거 없는 최고·1위 표현 금지
- 허위 후기·출처 불명 수치 금지 (사실 확인된 플랫폼 기능만 서술)
- 강사 정산 86.7%는 고정값(코드 반영) — 강사 모집 글에 한해 사용 가능
