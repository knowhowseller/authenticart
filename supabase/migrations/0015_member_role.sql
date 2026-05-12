-- 0015_member_role.sql
-- Add 'member' as the default role for new signups
-- member = 일반회원 (can browse, purchase products, register for classes)
-- student = 수강생 (automatically promoted when a class booking is paid)

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('member', 'student', 'instructor', 'branch_manager', 'admin'));
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'member';

-- 쿠폰 사용 횟수 원자적 증가 RPC
CREATE OR REPLACE FUNCTION public.increment_coupon_count(p_coupon_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE coupons SET used_count = used_count + 1 WHERE id = p_coupon_id;
END;
$$;
