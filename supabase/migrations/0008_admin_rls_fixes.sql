-- Allow admin to update any user's role
drop policy if exists "users_admin_update" on public.users;
create policy "users_admin_update" on public.users
  for update using (public.get_role() = 'admin');

-- Allow admin and branch_manager to update any class
drop policy if exists "classes_instructor_write" on public.classes;
create policy "classes_instructor_write" on public.classes
  for all using (
    instructor_id = auth.uid()
    or public.get_role() in ('admin', 'branch_manager')
  );

-- Allow admin to delete any user from public.users (needed for deleteUser action)
drop policy if exists "users_admin_delete" on public.users;
create policy "users_admin_delete" on public.users
  for delete using (public.get_role() = 'admin');
