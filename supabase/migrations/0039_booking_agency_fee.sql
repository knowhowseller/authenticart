-- 예약에 에이전시 수수료 필드 추가
-- 강사가 에이전시 소속인 경우 agency_fee를 instructor_payout에서 분리해 별도 정산

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS agency_id            uuid REFERENCES public.agencies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agency_fee           integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS agency_rate          numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS agency_payout_status text NOT NULL DEFAULT 'pending'
    CHECK (agency_payout_status IN ('pending','processing','paid','hold')),
  ADD COLUMN IF NOT EXISTS branch_payout_status text NOT NULL DEFAULT 'pending'
    CHECK (branch_payout_status IN ('pending','processing','paid','hold'));

-- orders에 벤더 정산 추적 필드 추가
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payout_status text NOT NULL DEFAULT 'pending'
    CHECK (payout_status IN ('pending','processing','paid','hold')),
  ADD COLUMN IF NOT EXISTS receipt_url   text;

CREATE INDEX IF NOT EXISTS idx_bookings_agency ON public.bookings(agency_id) WHERE agency_id IS NOT NULL;
