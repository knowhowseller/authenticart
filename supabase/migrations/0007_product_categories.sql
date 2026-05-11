create table if not exists public.product_categories (
  id   serial primary key,
  name text not null unique
);

insert into public.product_categories (name) values
  ('레진'),('몰드'),('색소'),('장식재'),('도구'),('패키지'),('기타')
on conflict do nothing;

alter table public.product_categories enable row level security;
create policy "anyone_read_categories" on public.product_categories for select using (true);
create policy "admin_manage_categories" on public.product_categories for all using (public.get_role() = 'admin');
