-- 목적: 시드 데이터로 중복 생성된 상품 전체 삭제
-- class_materials는 ON DELETE CASCADE이므로 자동 삭제됨
-- orders.product_id는 NULL 허용 컬럼이므로 먼저 NULL 처리 후 상품 삭제

-- 1. orders의 product_id 참조를 NULL로 해제 (주문 이력은 보존)
UPDATE public.orders SET product_id = NULL WHERE product_id IS NOT NULL;

-- 2. 상품 전체 삭제 (class_materials는 CASCADE로 자동 삭제)
DELETE FROM public.products;
