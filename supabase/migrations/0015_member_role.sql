-- 0015_member_role.sql
-- Add 'member' as the default role for new signups
-- member = 일반회원 (can browse, purchase products, register for classes)
-- student = 수강생 (automatically promoted when a class booking is paid)

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('member', 'student', 'instructor', 'branch_manager', 'admin'));
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'member';
