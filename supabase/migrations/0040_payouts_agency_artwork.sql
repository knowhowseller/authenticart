-- payouts 테이블에 에이전시 수수료 및 작품 수익 컬럼 추가
ALTER TABLE public.payouts
  ADD COLUMN IF NOT EXISTS total_agency_fee      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_artwork_payout  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS artwork_order_count   integer NOT NULL DEFAULT 0;
