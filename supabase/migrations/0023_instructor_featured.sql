-- 강사 소개 노출 여부 관리
ALTER TABLE instructor_profiles
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_instructor_featured
  ON instructor_profiles(is_featured, status);
