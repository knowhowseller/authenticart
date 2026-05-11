-- ============================================================
-- 지부장(branch_manager) 역할 및 branches 테이블 추가
-- ============================================================

-- 1. users.role에 branch_manager 추가
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
    CHECK (role IN ('student', 'instructor', 'admin', 'branch_manager'));

-- 2. branches 테이블 신설
CREATE TABLE IF NOT EXISTS public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  region text NOT NULL UNIQUE,
  manager_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  commission_rate numeric(5,2) NOT NULL DEFAULT 0.00
    CHECK (commission_rate >= 0 AND commission_rate <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. instructor_profiles에 branch_id 추가
ALTER TABLE public.instructor_profiles
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

-- 4. updated_at 트리거
CREATE OR REPLACE FUNCTION set_updated_at_branches()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_updated_branches ON public.branches;
CREATE TRIGGER trg_updated_branches
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_branches();

-- 5. RLS 활성화
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책
DROP POLICY IF EXISTS "branches_public_read" ON public.branches;
CREATE POLICY "branches_public_read" ON public.branches
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "branches_admin_write" ON public.branches;
CREATE POLICY "branches_admin_write" ON public.branches
  FOR ALL USING (public.get_role() = 'admin');

-- 7. get_role 함수 업데이트 (branch_manager 포함)
-- 기존 함수는 변경 불필요 (단순히 role 반환)

-- 8. 인덱스
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_branch ON public.instructor_profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_branches_manager ON public.branches(manager_id);
