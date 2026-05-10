# 세션 메타데이터

- 세션 ID: 20260508-dev-build
- 시작 시각: 2026-05-08 23:00 KST
- 워크플로우: dev-build
- 주요 목표: 오센틱아트 통합 플랫폼 Phase 0 완전 구현

## 사용자 입력값
- 프레임워크: Next.js 14 App Router + TypeScript strict
- DB/Auth: Supabase (PostgreSQL 15)
- 결제: 토스페이먼츠
- 메일: Resend
- 스타일: Tailwind CSS (v4) + shadcn/ui
- 사용자 역할: user / instructor / admin

## 비즈니스 규칙
- 강사 승인: admin이 수동 승격
- 수수료: 플랫폼 10% + PG 3.3% → 강사 86.7%
- 예약: instant(바로결제) / request(승인후결제)
- 환불: 7일전 100% / 3~7일전 50% / 3일내 0%

## 실행 에이전트 순서
1. Task 01: 프로젝트 초기화 (완료)
2. Task 02: Supabase 마이그레이션 + RLS
3. Task 03: 인증 흐름
4. Task 04: 브랜드 컴포넌트 (완료)
5. Task 05: 홈 + 클래스 목록
6. Task 06: 클래스 상세 + instant 결제
7. Task 07: request 모드 + Cron
8. Task 08: 쇼핑몰
9. Task 09-11: 마이페이지 + 스튜디오 + 관리자
10. Task 12-13: Edge Functions + 정산 + 메일

## 현재 단계: Task 01 완료, Task 02 진행 중

## 완료된 항목
- [x] Next.js 14 + TypeScript strict 프로젝트 생성
- [x] Tailwind v4 브랜드 컬러 설정 (globals.css @theme)
- [x] Noto Sans KR 폰트 설정
- [x] 폴더 구조 전체 생성
- [x] lib/supabase/{client,server,middleware}.ts
- [x] middleware.ts 권한 매트릭스
- [x] types/database.ts 전체 타입 정의
- [x] lib/utils/{cn,format,fees}.ts
- [x] components/brand/{Logo,Hexagon,FlowLine,MarbleBackground,ClassBadges}.tsx
- [x] components/layout/{Header,Footer}.tsx
- [x] app/layout.tsx
- [x] .env.local 스켈레톤
