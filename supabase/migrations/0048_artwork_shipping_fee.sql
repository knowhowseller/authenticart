-- 목적: 작가가 작품별 배송비를 선택 설정(무료배송=0). 작품 결제액 = price + shipping_fee.
-- 변경 이유: 작품 판매에 배송비 옵션 도입. 결제금액 서버 검증(D-1)과 일관성 유지.

ALTER TABLE public.artworks
  ADD COLUMN IF NOT EXISTS shipping_fee integer NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0);

ALTER TABLE public.artwork_orders
  ADD COLUMN IF NOT EXISTS shipping_fee integer NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0);

COMMENT ON COLUMN public.artworks.shipping_fee IS '작가 설정 배송비(원). 0 = 무료배송';
COMMENT ON COLUMN public.artwork_orders.shipping_fee IS '주문 시점 배송비(원). 결제액 amount = 작품가 + shipping_fee';
