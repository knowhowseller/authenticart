# 오센틱아트 플랫폼 — 개발 이력 & TODO

> 최종 업데이트: 2026-05-16  
> 커밋 수: 53개 | 마이그레이션: 0001 ~ 0046 | API 라우트: 80+개

---

## 범례

| 기호 | 의미 |
|------|------|
| ✅ | 완료 |
| 🔧 | 완료 (버그픽스) |
| ⚠️ | 주의 필요 / 미검증 |
| 📋 | 미구현 백로그 |
| 🚫 | 보류 |

---

## Phase 0 — 기반 구축

### DB 스키마 (Supabase)
- ✅ `0001_init` — 핵심 테이블: users, classes, class_schedules, bookings, orders, products, instructor_profiles, payouts
- ✅ `0002_seed` — 테스트 시드 (유저 5명, 클래스 4개) / 상품 시드는 비활성화
- ✅ `0004_reviews` — class_reviews (rating, content)
- ✅ `0005` — instructor/student 전화번호 정책, branch_manager 역할
- ✅ `0006` — delete_user_fn (회원탈퇴 RPC)
- ✅ `0007_product_categories` — 상품 카테고리 기본 구조
- ✅ `0008_admin_rls_fixes` — 관리자 RLS 수정
- ✅ `0009_class_images` — 클래스 이미지 다중 업로드
- ✅ `0010_wishlists` — 찜 기능
- ✅ `0011_waitlists` — 대기자 명단
- ✅ `0012_coupons` — 쿠폰 시스템 (% / 정액 할인)
- ✅ `0013_review_replies` — 강사 후기 답변 (reply, replied_at)
- ✅ `0014_notices` — 공지사항
- ✅ `0015_member_role` — member 역할 (일반회원 → 결제 시 student 승격)
- ✅ `0016_notifications` — 인앱 알림
- ✅ `0017_coupon_user_target` — 쿠폰 특정 유저 타겟팅
- ✅ `0018_storage_buckets` — Supabase Storage 버킷 생성 및 RLS
- ✅ `0019_artworks` — 작품 마켓 (artworks, artwork_orders)
- ✅ `0020_board_requests` — 게시판, 클래스 요청, 그룹 모집
- ✅ `0021_instructor_service_area` — 강사 활동 지역
- ✅ `0022_request_images_admin_delete` — 요청 이미지 업로드, 관리자 삭제
- ✅ `0023_instructor_featured` — 강사 메인 노출 (is_featured)
- ✅ `0024_fix_wishlists_rls` — 찜 RLS 수정
- ✅ `0025_fix_artwork_storage` — 작품 이미지 스토리지 정책
- ✅ `0026_artwork_gallery` — 작품 갤러리 노출
- ✅ `0027_decrement_stock_fn` — 재고 차감 RPC (RETURNS jsonb)
- ✅ `0028_board_view_count_fn` — 게시판 조회수 원자적 증가 RPC
- ✅ `0029_classes_branch_id` — 클래스에 지부 연결
- ✅ `0030_craft_categories` — 공예 카테고리 1단계
- ✅ `0031_category_fk` — products.craft_category_id FK
- ✅ `0032_vendors` — 입점사(벤더) 시스템
- ✅ `0033_agencies` — 에이전시 (공방·스튜디오 단위 강사 관리)
- ✅ `0034_branch_payouts` — 지부 정산
- ✅ `0035_seller_artwork_stats` — 작품 판매자 통계
- ✅ `0036_escrow` — 에스크로 (구매 확정 시스템)
- ✅ `0037_disputes` — 분쟁 신청
- ✅ `0038_class_materials` — 클래스 교안 파일
- ✅ `0039_booking_agency_fee` — 예약 에이전시 수수료 필드
- ✅ `0040_payouts_agency_artwork` — 정산에 에이전시·작품 정산 통합
- ✅ `0041_artwork_orders_payout_status` — 작품 주문 정산 상태
- ✅ `0042_vendor_store` — 벤더 스토어 페이지용 slug, logo, banner
- ✅ `0043_product_categories_hierarchy` — 상품 카테고리 계층화
- ✅ `0044_craft_categories_level3` — craft_categories 3단계 확장
- ✅ `0045_delete_all_products` — 기존 중복 상품 전체 삭제
- ✅ `0046_atomic_rpcs` — reserve_seat / increment_stock / decrement_stock RETURNS jsonb

---

## Phase 1 — 핵심 기능 구현

### 인증 & 계정
- ✅ 이메일 회원가입 / 로그인 (Supabase Auth)
- ✅ Google / Kakao 소셜 로그인
- ✅ 비밀번호 찾기 / 재설정
- ✅ 이메일 재발송 (미인증 계정)
- ✅ 회원 탈퇴 (delete_user RPC)
- ✅ 역할 자동 승격: member → student (첫 클래스 결제 시)

### 클래스 시스템
- ✅ 클래스 등록 (강사) — 즉시 확정 / 신청 승인 두 가지 모드
- ✅ 클래스 일정(회차) 관리
- ✅ 클래스 검수 (관리자 승인 → published)
- ✅ 클래스 이미지 다중 업로드
- ✅ 클래스 복제 기능
- ✅ 대기자 명단 (waitlist)
- ✅ 클래스 마감 (close)
- ✅ 교안 파일 업로드 (class_materials)
- ✅ 예약 신청 → 강사 승인 → 결제 → 완료 흐름
- ✅ 예약 만료 cron (24시간 미승인 자동 취소)

### 결제 시스템 (토스페이먼츠)
- ✅ 클래스 예약 결제
- ✅ 상품 단건 결제
- ✅ 장바구니 결제 (여러 상품 동시)
- ✅ 작품 구매 결제
- ✅ 클래스 요청 결제
- ✅ 결제 확인 API (toss-success / webhooks/toss)
- ✅ 쿠폰 할인 적용
- ✅ 환불 처리 (관리자)

### 정산 시스템
- ✅ 강사 정산: PG 3.3% + 플랫폼 10% 공제 후 86.7% 지급
- ✅ 에이전시 수수료 분리 정산
- ✅ 지부 수수료 분리 정산
- ✅ 월간 정산 cron (paid + completed 예약 대상)
- ✅ 작품 판매 정산
- ✅ 벤더 상품 정산

### 재료 쇼핑 (Shop)
- ✅ 상품 목록 (3단계 craft_categories 필터)
- ✅ 강사 도매가 자동 적용
- ✅ 강사 전용 상품 (is_instructor_only)
- ✅ 재고 관리 (decrement_stock RPC)
- ✅ 장바구니
- ✅ 주문 취소 / 배송 상태 관리 (admin)
- ✅ 에스크로 자동 구매 확정 (7일 후)
- ✅ 입점 스토어 페이지 (/shop/stores, /shop/stores/[id])
- ✅ 벤더 상품 대량 등록 (Excel 업로드)

### 작품 마켓
- ✅ 작품 등록 (강사)
- ✅ 작품 갤러리 노출 (관리자 선정)
- ✅ 작품 구매 / 에스크로 확정
- ✅ 작품 판매 정산

### 게시판 & 커뮤니티
- ✅ 게시판 (공지/리뷰/자유/문의 타입)
- ✅ 댓글 / 비밀글
- ✅ 조회수 (원자적 증가 RPC)
- ✅ 클래스 요청 게시판
- ✅ 그룹 모집 게시판
- ✅ 수강 후기 & 강사 답변

### 강사 스튜디오
- ✅ 대시보드 (월매출, 예정 클래스, 신청 대기, 정산 예정, 미답변 후기)
- ✅ 클래스 관리
- ✅ 일정(회차) 관리
- ✅ 예약 신청 승인 / 거부
- ✅ 수강 후기 답변
- ✅ 정산 조회
- ✅ 수입 현황
- ✅ 클래스 요청 관리
- ✅ 에이전시 관리
- ✅ 프로필 & 정산계좌 설정

### 관리자 대시보드 (/admin)
- ✅ 통계 (매출, 예약, 회원 현황)
- ✅ 강사 승인 / 거부 / 메인 노출
- ✅ 클래스 검수 (승인 / 거부)
- ✅ 예약 강제 취소 / 환불
- ✅ 상품 관리 (등록 / 수정 / 삭제 / 대량삭제)
- ✅ 주문 상태 관리 / 운송장 등록
- ✅ 작품 갤러리 선정
- ✅ 정산 처리 (강사 / 에이전시 / 지부 / 벤더)
- ✅ 쿠폰 생성 / 관리
- ✅ 공지사항 CRUD
- ✅ 벤더 승인 관리
- ✅ 에이전시 승인 관리
- ✅ 지부 관리
- ✅ 분쟁 관리
- ✅ 카테고리 관리 (craft_categories 3단계)
- ✅ 감사 로그 (audit_logs) — 주요 관리자 액션 기록

### 헤더 & 네비게이션
- ✅ 역할별 조건부 메뉴 (강사/벤더/에이전시/지부장/관리자)
- ✅ 알림 뱃지 (실시간 미읽음 수)
- ✅ 장바구니 뱃지
- ✅ 검색

### Cron Jobs
- ✅ `expire-bookings` — 만료 예약 처리, paid→completed 전환
- ✅ `monthly-payout` — 월간 강사 정산 (paid + completed 대상)
- ✅ `class-reminder` — 수업 D-1 알림
- ✅ `escrow-auto-confirm` — 7일 후 자동 구매 확정
- ✅ `agency-payouts` — 에이전시 정산
- ✅ `branch-payouts` — 지부 정산
- ✅ `vendor-payouts` — 벤더 정산
- ✅ `artwork-rate-refresh` — 작품 수수료 갱신

---

## Phase 2 — 보안 & 안정성 강화

### P0 — 즉시 수정 완료
- 🔧 예약 서버 측 가격 검증 — 클라이언트 `gross_amount` 제거, DB `classes.price` 사용
- 🔧 좌석 예약 race condition — `reserve_seat()` RPC (atomic 좌석확인+예약+count++)
- 🔧 재고 race condition — `decrement_stock()` RPC (atomic 재고확인+차감)
- 🔧 `/admin/*` 접근 — middleware.ts branch_manager 허용 제거, admin 전용

### P1 — 단기 수정 완료
- 🔧 월간 정산 cron — `status='paid'` → `IN ('paid','completed')` (완료 예약 누락 방지)
- 🔧 헤더 — 승인된 벤더 "입점사 대시보드" 링크 추가
- 🔧 헤더 — 승인된 에이전시 "에이전시 관리" 링크 추가
- 🔧 admin/products/create — audit_log 추가

### P2 — 중기 수정 완료
- 🔧 스튜디오 대시보드 — 미답변 후기 카운트 카드 + 알림 배너
- 🔧 벤더 상품 등록 — wholesale_price 별도 입력, 소비자가 미만 검증
- ⚠️ Playwright E2E 테스트 — 역할별 시나리오 미작성

---

## Phase 3 — 미구현 백로그

### 기능
- 📋 강사 포트폴리오 페이지 공개 URL (현재 /instructors/[id] 존재하나 SEO 보완 필요)
- 📋 클래스 후기 이미지 첨부
- 📋 수강생 수료증 자동 발급
- 📋 강사 인증 배지 시스템
- 📋 다중 강사 협업 클래스
- 📋 실시간 채팅 (강사 ↔ 수강생)
- 📋 클래스 일정 Google Calendar 연동
- 📋 정산 명세서 PDF 자동 생성
- 📋 벤더 상품 리뷰 시스템
- 📋 상품 재입고 알림 (waitlist)

### 운영
- 📋 Playwright E2E 테스트 — 역할별 핵심 플로우
- 📋 API 응답 속도 모니터링 (Vercel Analytics 연동)
- 📋 에러 추적 (Sentry 등)
- 📋 DB 인덱스 최적화 검토
- 📋 이미지 CDN 최적화 (next/image 전환)

### 마케팅
- 📋 SEO 메타데이터 전수 검토
- 📋 sitemap.xml 동적 생성 (클래스/강사 페이지)
- 📋 카카오 알림톡 연동 (현재 이메일만)
- 📋 네이버 검색 노출 최적화

---

## 주요 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| DB / Auth | Supabase (PostgreSQL + RLS) |
| 스타일 | Tailwind CSS (브랜드 디자인 시스템) |
| 결제 | 토스페이먼츠 |
| 이메일 | Resend |
| 배포 | Vercel |
| 언어 | TypeScript |

---

## 역할 계층

```
admin
  └─ branch_manager  (지부 관리, /branch/*)
  └─ instructor      (스튜디오 접근, /studio/*)
       └─ agency     (에이전시 운영 강사)
  └─ student         (클래스 수강 완료 경험)
  └─ member          (가입만 한 일반회원)
  └─ vendor          (입점사, role과 별도 vendors 테이블)
```

---

## 정산 구조

```
수강료 100%
  ├─ PG 수수료    3.3%  (토스페이먼츠)
  ├─ 플랫폼 수수료 10%
  │    ├─ 지부 배분  (지부 소속 강사일 경우)
  │    └─ 에이전시 배분 (에이전시 소속 강사일 경우)
  └─ 강사 지급    86.7% (기본, 에이전시/지부 소속 시 일부 차감)
```

---

## 마이그레이션 실행 체크리스트

Supabase SQL 에디터에서 순서대로 실행:

- [x] 0001 ~ 0026 — 기반 스키마
- [x] 0027 — decrement_stock (RETURNS jsonb)
- [x] 0028 ~ 0044 — 기능 확장
- [x] 0045 — 중복 상품 삭제
- [x] 0046 — atomic RPCs (reserve_seat, increment_stock, decrement_stock)

---

## 알려진 제약사항

| 항목 | 내용 |
|------|------|
| Vercel Hobby Cron | 1일 1회 실행 제한 (Pro 플랜 시 해제) |
| 동시 접속 | Supabase Free Tier connection pool 제한 |
| 이미지 업로드 | Supabase Storage 1GB 제한 (Free) |
| 이메일 | Resend Free Tier 월 3,000건 |
