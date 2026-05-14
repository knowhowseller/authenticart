-- 벤더(상품 입점사) 시스템
-- 수수료: 판매가 100% = 플랫폼 15% + 벤더 정산 85%

CREATE TABLE IF NOT EXISTS public.vendors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_name   text NOT NULL,
  business_no     text,
  contact_email   text NOT NULL,
  contact_phone   text,
  description     text,
  commission_rate numeric(5,2) NOT NULL DEFAULT 15.00,
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','suspended')),
  payout_account  jsonb,
  approved_at     timestamptz,
  approved_by     uuid REFERENCES public.users(id),
  rejection_reason text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- 벤더 월별 정산
CREATE TABLE IF NOT EXISTS public.vendor_payouts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  period_year     int NOT NULL,
  period_month    int NOT NULL,
  total_gross     integer NOT NULL DEFAULT 0,
  platform_fee    integer NOT NULL DEFAULT 0,
  payout_amount   integer NOT NULL DEFAULT 0,
  order_count     int DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','hold')),
  paid_at         timestamptz,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (vendor_id, period_year, period_month)
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;

-- 벤더: 본인 조회 + 관리자 전체
DROP POLICY IF EXISTS "vendors_own_read"  ON public.vendors;
DROP POLICY IF EXISTS "vendors_own_update" ON public.vendors;
DROP POLICY IF EXISTS "vendors_insert"    ON public.vendors;
DROP POLICY IF EXISTS "vendors_admin_all" ON public.vendors;
CREATE POLICY "vendors_own_read" ON public.vendors
  FOR SELECT USING (user_id = auth.uid() OR public.get_role() = 'admin');
CREATE POLICY "vendors_own_update" ON public.vendors
  FOR UPDATE USING (user_id = auth.uid() OR public.get_role() = 'admin');
CREATE POLICY "vendors_insert" ON public.vendors
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "vendors_admin_all" ON public.vendors
  FOR ALL USING (public.get_role() = 'admin');

-- vendor_payouts: 벤더 본인 + 관리자
DROP POLICY IF EXISTS "vendor_payouts_own"          ON public.vendor_payouts;
DROP POLICY IF EXISTS "vendor_payouts_admin_write"  ON public.vendor_payouts;
CREATE POLICY "vendor_payouts_own" ON public.vendor_payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
    OR public.get_role() = 'admin'
  );
CREATE POLICY "vendor_payouts_admin_write" ON public.vendor_payouts
  FOR ALL USING (public.get_role() = 'admin');

-- products에 vendor_id 추가
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vendors_user ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor ON public.vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON public.products(vendor_id);

-- updated_at 트리거
DO $$
BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS trg_updated_vendors ON public.vendors;
           CREATE TRIGGER trg_updated_vendors
           BEFORE UPDATE ON public.vendors
           FOR EACH ROW EXECUTE FUNCTION set_updated_at();';
END;
$$;
