-- 지부 수수료 정산 테이블
-- 플랫폼 수수료의 30%를 지부에 배분

CREATE TABLE IF NOT EXISTS public.branch_payouts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id       uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  period_year     int NOT NULL,
  period_month    int NOT NULL,
  total_platform_fee integer NOT NULL DEFAULT 0,
  branch_share    integer NOT NULL DEFAULT 0,
  hq_share        integer NOT NULL DEFAULT 0,
  booking_count   int DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','hold')),
  paid_at         timestamptz,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (branch_id, period_year, period_month)
);

ALTER TABLE public.branch_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "branch_payouts_manager_read" ON public.branch_payouts;
DROP POLICY IF EXISTS "branch_payouts_admin_write"  ON public.branch_payouts;
CREATE POLICY "branch_payouts_manager_read" ON public.branch_payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.branches b WHERE b.id = branch_id AND b.manager_id = auth.uid())
    OR public.get_role() = 'admin'
  );
CREATE POLICY "branch_payouts_admin_write" ON public.branch_payouts
  FOR ALL USING (public.get_role() = 'admin');

CREATE INDEX IF NOT EXISTS idx_branch_payouts_branch ON public.branch_payouts(branch_id);

-- bookings에 지부 수수료 분리 필드 추가
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS branch_commission integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hq_revenue integer DEFAULT 0;
