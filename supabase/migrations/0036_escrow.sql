-- 에스크로: 구매확정 추적 컬럼
-- products 주문: 7일 자동확정 / artwork_orders: 배송완료 후 3일 자동확정

-- orders (products 주문)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS escrow_status    text NOT NULL DEFAULT 'holding'
    CHECK (escrow_status IN ('holding','confirmed','disputed','refunded')),
  ADD COLUMN IF NOT EXISTS delivered_at     timestamptz,
  ADD COLUMN IF NOT EXISTS auto_confirm_at  timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at     timestamptz;

-- artwork_orders
ALTER TABLE public.artwork_orders
  ADD COLUMN IF NOT EXISTS escrow_status    text NOT NULL DEFAULT 'holding'
    CHECK (escrow_status IN ('holding','confirmed','disputed','refunded')),
  ADD COLUMN IF NOT EXISTS delivered_at     timestamptz,
  ADD COLUMN IF NOT EXISTS auto_confirm_at  timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at     timestamptz,
  ADD COLUMN IF NOT EXISTS tracking_carrier text,
  ADD COLUMN IF NOT EXISTS tracking_number  text;

-- orders에 배송추적 컬럼도 동일하게 추가
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_carrier text,
  ADD COLUMN IF NOT EXISTS tracking_number  text;

CREATE INDEX IF NOT EXISTS idx_orders_auto_confirm     ON public.orders(auto_confirm_at)        WHERE confirmed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_artwork_orders_auto_confirm ON public.artwork_orders(auto_confirm_at) WHERE confirmed_at IS NULL;
