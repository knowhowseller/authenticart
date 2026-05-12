-- 쿠폰 테이블
CREATE TABLE IF NOT EXISTS coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('fixed', 'percent')),
  value integer NOT NULL CHECK (value > 0),
  min_amount integer NOT NULL DEFAULT 0,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 쿠폰 사용 내역
CREATE TABLE IF NOT EXISTS coupon_uses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  discount_amount integer NOT NULL,
  used_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (coupon_id, user_id)
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES coupons(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount integer NOT NULL DEFAULT 0;

-- RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_uses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_coupons" ON coupons;
DROP POLICY IF EXISTS "public_read_active_coupons" ON coupons;
DROP POLICY IF EXISTS "user_own_coupon_uses" ON coupon_uses;
DROP POLICY IF EXISTS "user_insert_coupon_uses" ON coupon_uses;
DROP POLICY IF EXISTS "admin_all_coupon_uses" ON coupon_uses;

CREATE POLICY "admin_all_coupons" ON coupons FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "public_read_active_coupons" ON coupons FOR SELECT
  USING (is_active = true);

CREATE POLICY "user_own_coupon_uses" ON coupon_uses FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "user_insert_coupon_uses" ON coupon_uses FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_all_coupon_uses" ON coupon_uses FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon ON coupon_uses(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_user ON coupon_uses(user_id);
