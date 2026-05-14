-- 분쟁·소비자보호 테이블
-- 주문(products) 또는 작품주문(artworks) 대상 클레임 처리

CREATE TABLE IF NOT EXISTS public.disputes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id        uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  artwork_order_id uuid REFERENCES public.artwork_orders(id) ON DELETE SET NULL,
  booking_id      uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  category        text NOT NULL
    CHECK (category IN ('non_delivery','item_mismatch','defective','refund_dispute','other')),
  title           text NOT NULL,
  description     text NOT NULL,
  evidence_urls   text[] DEFAULT '{}',
  status          text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','under_review','resolved','rejected','escalated')),
  resolution      text,
  resolved_by     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at     timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  CONSTRAINT disputes_target_check CHECK (
    (order_id IS NOT NULL) OR
    (artwork_order_id IS NOT NULL) OR
    (booking_id IS NOT NULL)
  )
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "disputes_own_read"    ON public.disputes;
DROP POLICY IF EXISTS "disputes_own_insert"  ON public.disputes;
DROP POLICY IF EXISTS "disputes_admin_update" ON public.disputes;
CREATE POLICY "disputes_own_read" ON public.disputes
  FOR SELECT USING (auth.uid() = reporter_id OR public.get_role() = 'admin');
CREATE POLICY "disputes_own_insert" ON public.disputes
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "disputes_admin_update" ON public.disputes
  FOR UPDATE USING (public.get_role() = 'admin');

CREATE INDEX IF NOT EXISTS idx_disputes_reporter ON public.disputes(reporter_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status   ON public.disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_order    ON public.disputes(order_id)         WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_disputes_artwork  ON public.disputes(artwork_order_id) WHERE artwork_order_id IS NOT NULL;

DROP TRIGGER IF EXISTS disputes_updated_at ON public.disputes;
CREATE TRIGGER disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
