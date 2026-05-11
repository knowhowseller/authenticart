-- 관리자가 auth.users를 삭제할 수 있는 SECURITY DEFINER 함수
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.users WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
