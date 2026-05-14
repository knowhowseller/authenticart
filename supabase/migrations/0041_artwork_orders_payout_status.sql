-- 목적: artwork_orders에 payout_status 컬럼 추가 (강사 정산 집계용)
ALTER TABLE public.artwork_orders
  ADD COLUMN IF NOT EXISTS payout_status text NOT NULL DEFAULT 'pending'
    CHECK (payout_status IN ('pending', 'processing', 'paid'));

CREATE INDEX IF NOT EXISTS idx_artwork_orders_payout_status
  ON public.artwork_orders(payout_status);
