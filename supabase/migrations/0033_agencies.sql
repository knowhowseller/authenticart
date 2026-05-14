-- 강사 에이전시 시스템
-- 플랫폼이 강사·에이전시 양쪽 직접 분리 지급 (미지급 분쟁 차단)
-- 에이전시 수수료율: 0~15%, 강사-에이전시 겸업 불허로 시작

CREATE TABLE IF NOT EXISTS public.agencies (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agency_name       text NOT NULL,
  business_no       text,
  contact_email     text NOT NULL,
  contact_phone     text,
  description       text,
  commission_rate   numeric(5,2) NOT NULL DEFAULT 10.00,
  status            text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','suspended')),
  payout_account    jsonb,
  approved_at       timestamptz,
  approved_by       uuid REFERENCES public.users(id),
  rejection_reason  text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- 에이전시 월별 정산
CREATE TABLE IF NOT EXISTS public.agency_payouts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  period_year     int NOT NULL,
  period_month    int NOT NULL,
  total_gross     integer NOT NULL DEFAULT 0,
  agency_fee      integer NOT NULL DEFAULT 0,
  instructor_count int DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','hold')),
  paid_at         timestamptz,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (agency_id, period_year, period_month)
);

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agencies_own_read"   ON public.agencies;
DROP POLICY IF EXISTS "agencies_insert"     ON public.agencies;
DROP POLICY IF EXISTS "agencies_own_update" ON public.agencies;
DROP POLICY IF EXISTS "agencies_admin_all"  ON public.agencies;
CREATE POLICY "agencies_own_read" ON public.agencies
  FOR SELECT USING (user_id = auth.uid() OR public.get_role() = 'admin');
CREATE POLICY "agencies_insert" ON public.agencies
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "agencies_own_update" ON public.agencies
  FOR UPDATE USING (user_id = auth.uid() OR public.get_role() = 'admin');
CREATE POLICY "agencies_admin_all" ON public.agencies
  FOR ALL USING (public.get_role() = 'admin');

DROP POLICY IF EXISTS "agency_payouts_own"          ON public.agency_payouts;
DROP POLICY IF EXISTS "agency_payouts_admin_write"  ON public.agency_payouts;
CREATE POLICY "agency_payouts_own" ON public.agency_payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = agency_id AND a.user_id = auth.uid())
    OR public.get_role() = 'admin'
  );
CREATE POLICY "agency_payouts_admin_write" ON public.agency_payouts
  FOR ALL USING (public.get_role() = 'admin');

-- instructor_profiles에 agency_id 추가
ALTER TABLE public.instructor_profiles
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL;

-- 에이전시 초대 링크 (invite_token으로 강사 소속 연결)
CREATE TABLE IF NOT EXISTS public.agency_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  token       text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  expires_at  timestamptz DEFAULT now() + interval '7 days',
  used_by     uuid REFERENCES public.users(id),
  used_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.agency_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency_invites_agency_read"   ON public.agency_invites;
DROP POLICY IF EXISTS "agency_invites_agency_insert" ON public.agency_invites;
DROP POLICY IF EXISTS "agency_invites_token_select"  ON public.agency_invites;
CREATE POLICY "agency_invites_agency_read" ON public.agency_invites
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = agency_id AND a.user_id = auth.uid())
    OR public.get_role() = 'admin'
  );
CREATE POLICY "agency_invites_agency_insert" ON public.agency_invites
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = agency_id AND a.user_id = auth.uid() AND a.status = 'approved')
  );
-- 초대 토큰으로 에이전시 조회 (공개 접근 허용 — 토큰이 비밀키 역할)
CREATE POLICY "agency_invites_token_select" ON public.agency_invites
  FOR SELECT USING (true);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_agencies_user ON public.agencies(user_id);
CREATE INDEX IF NOT EXISTS idx_agencies_status ON public.agencies(status);
CREATE INDEX IF NOT EXISTS idx_agency_payouts_agency ON public.agency_payouts(agency_id);
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_agency ON public.instructor_profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_invites_token ON public.agency_invites(token);

-- updated_at 트리거
DO $$
BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS trg_updated_agencies ON public.agencies;
           CREATE TRIGGER trg_updated_agencies
           BEFORE UPDATE ON public.agencies
           FOR EACH ROW EXECUTE FUNCTION set_updated_at();';
END;
$$;
