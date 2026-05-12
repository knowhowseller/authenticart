-- 쿠폰 특정 회원 지정 필드 추가
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS target_user_id uuid REFERENCES users(id) ON DELETE SET NULL;

-- 강사 포트폴리오 이미지
ALTER TABLE instructor_profiles ADD COLUMN IF NOT EXISTS portfolio_images text[] NOT NULL DEFAULT '{}';
