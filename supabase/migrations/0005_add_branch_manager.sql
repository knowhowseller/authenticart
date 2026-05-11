-- users.role 체크 제약에 branch_manager 추가
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('student','instructor','branch_manager','admin'));

-- branch_manager도 instructor_profiles 읽기 가능
DROP POLICY IF EXISTS "instructor_profiles_select" ON public.instructor_profiles;
CREATE POLICY "instructor_profiles_select" ON public.instructor_profiles
  FOR SELECT USING (
    instructor_id = auth.uid()
    OR public.get_role() IN ('admin','branch_manager')
  );
