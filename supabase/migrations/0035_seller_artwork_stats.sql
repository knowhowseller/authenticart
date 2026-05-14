-- 판매자별 월간 작품 수수료 통계
-- 수수료율: 기본 10% / 100건 이상 8% / 200건 이상 5% / 50만원 이상 작품 5%
-- 등급 하락 시 1개월 유예 적용

CREATE TABLE IF NOT EXISTS public.seller_artwork_stats (
  seller_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year           int  NOT NULL,
  month          int  NOT NULL,
  order_count    int  NOT NULL DEFAULT 0,
  total_gmv      integer NOT NULL DEFAULT 0,
  applied_rate   numeric(5,2) NOT NULL DEFAULT 10.00,
  earned_rate    numeric(5,2) NOT NULL DEFAULT 10.00,
  is_grace       boolean NOT NULL DEFAULT false,
  updated_at     timestamptz DEFAULT now(),
  PRIMARY KEY (seller_id, year, month)
);

ALTER TABLE public.seller_artwork_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seller_artwork_stats_own_read"    ON public.seller_artwork_stats;
DROP POLICY IF EXISTS "seller_artwork_stats_admin_write" ON public.seller_artwork_stats;
CREATE POLICY "seller_artwork_stats_own_read" ON public.seller_artwork_stats
  FOR SELECT USING (auth.uid() = seller_id OR public.get_role() = 'admin');
CREATE POLICY "seller_artwork_stats_admin_write" ON public.seller_artwork_stats
  FOR ALL USING (public.get_role() = 'admin');

CREATE INDEX IF NOT EXISTS idx_seller_artwork_stats_seller ON public.seller_artwork_stats(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_artwork_stats_period ON public.seller_artwork_stats(year, month);

-- artwork_orders에 수수료 추적 컬럼 추가
ALTER TABLE public.artwork_orders
  ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS commission_amount integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seller_payout integer DEFAULT 0;
