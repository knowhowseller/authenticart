-- ============================================================
-- 오센틱아트 (Authentic Art) — Phase 0 초기 마이그레이션
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. 테이블 생성
-- ─────────────────────────────────────────────

-- users
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  phone text,
  role text not null default 'student'
    check (role in ('student','instructor','admin')),
  region text,
  marketing_agreed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- instructor_profiles
create table if not exists public.instructor_profiles (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null unique references public.users(id) on delete cascade,
  bio text,
  region text,
  profile_image text,
  status text default 'pending'
    check (status in ('pending','approved','rejected')),
  certification_docs jsonb default '[]'::jsonb,
  approved_at timestamptz,
  approved_by uuid references public.users(id),
  payout_account jsonb,
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.users(id),
  title text not null,
  description text,
  region text not null,
  location_address text,
  price integer not null check (price >= 0),
  capacity integer not null check (capacity > 0),
  status text default 'draft'
    check (status in ('draft','published','closed')),
  thumbnail_url text,
  confirmation_mode text default 'instant'
    check (confirmation_mode in ('instant','request')),
  attributes jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_classes_region_status on public.classes(region, status);
create index if not exists idx_classes_instructor on public.classes(instructor_id);

-- class_schedules
create table if not exists public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz,
  max_students integer not null default 8 check (max_students > 0),
  booked_count integer not null default 0 check (booked_count >= 0),
  created_at timestamptz default now()
);

create index if not exists idx_schedules_class_start on public.class_schedules(class_id, start_at);

-- payouts (bookings보다 먼저 — FK 참조)
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.users(id),
  period_year int not null,
  period_month int not null,
  total_gross integer not null default 0,
  total_pg_fee integer not null default 0,
  total_platform_fee integer not null default 0,
  total_payout integer not null default 0,
  booking_count int default 0,
  order_count int default 0,
  status text default 'pending'
    check (status in ('pending','paid','hold')),
  paid_at timestamptz,
  statement_url text,
  created_at timestamptz default now(),
  unique(instructor_id, period_year, period_month)
);

-- bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.class_schedules(id),
  student_id uuid not null references public.users(id),
  status text default 'pending_approval'
    check (status in (
      'pending_payment','pending_approval','approved','paid','rejected',
      'cancelled','completed','expired','refunded'
    )),
  approval_expires_at timestamptz,
  gross_amount integer not null check (gross_amount >= 0),
  pg_fee integer default 0,
  platform_fee integer default 0,
  instructor_payout integer default 0,
  payout_status text default 'pending'
    check (payout_status in ('pending','processing','paid','hold')),
  payout_id uuid references public.payouts(id),
  payment_id text unique,
  receipt_url text,
  refund_amount integer default 0,
  refund_reason text,
  refunded_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_bookings_student_status on public.bookings(student_id, status);
create index if not exists idx_bookings_schedule on public.bookings(schedule_id);

-- products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  retail_price integer not null check (retail_price >= 0),
  wholesale_price integer check (wholesale_price >= 0),
  is_instructor_only boolean default false,
  is_active boolean default true,
  stock_qty integer default 0 check (stock_qty >= 0),
  thumbnail_url text,
  images jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.users(id),
  product_id uuid references public.products(id),
  quantity integer not null default 1 check (quantity > 0),
  total_amount integer not null check (total_amount >= 0),
  status text default 'pending'
    check (status in ('pending','paid','preparing','shipped','delivered','cancelled','refunded')),
  payment_id text unique,
  shipping_name text,
  shipping_phone text,
  shipping_address text,
  tracking_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_orders_buyer on public.orders(buyer_id);

-- audit_logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id),
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 2. updated_at 자동 갱신 트리거
-- ─────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['users','instructor_profiles','classes','bookings','products','orders']
  loop
    execute format(
      'drop trigger if exists trg_updated_%1$s on public.%1$s;
       create trigger trg_updated_%1$s
       before update on public.%1$s
       for each row execute function set_updated_at();',
      t
    );
  end loop;
end;
$$;

-- ─────────────────────────────────────────────
-- 3. 헬퍼 함수
-- ─────────────────────────────────────────────

create or replace function public.get_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

-- decrement_seat: 예약 완료 시 booked_count 증가
create or replace function public.decrement_seat(p_booking_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_schedule_id uuid;
begin
  select schedule_id into v_schedule_id from public.bookings where id = p_booking_id;
  update public.class_schedules
  set booked_count = booked_count + 1
  where id = v_schedule_id
    and booked_count < max_students;
end;
$$;

-- ─────────────────────────────────────────────
-- 4. 회원가입 트리거 (auth.users → public.users)
-- ─────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- 5. RLS 활성화
-- ─────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.instructor_profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_schedules enable row level security;
alter table public.bookings enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.payouts enable row level security;
alter table public.audit_logs enable row level security;

-- ─────────────────────────────────────────────
-- 6. RLS 정책
-- ─────────────────────────────────────────────

-- users
drop policy if exists "users_self_read" on public.users;
create policy "users_self_read" on public.users
  for select using (id = auth.uid() or public.get_role() = 'admin');

drop policy if exists "users_self_update" on public.users;
create policy "users_self_update" on public.users
  for update using (id = auth.uid());

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert with check (id = auth.uid());

-- instructor_profiles
drop policy if exists "instructor_profiles_self" on public.instructor_profiles;
create policy "instructor_profiles_self" on public.instructor_profiles
  for all using (instructor_id = auth.uid() or public.get_role() = 'admin');

drop policy if exists "instructor_profiles_public_read" on public.instructor_profiles;
create policy "instructor_profiles_public_read" on public.instructor_profiles
  for select using (status = 'approved');

-- classes
drop policy if exists "classes_public_read" on public.classes;
create policy "classes_public_read" on public.classes
  for select using (
    status = 'published'
    or instructor_id = auth.uid()
    or public.get_role() = 'admin'
  );

drop policy if exists "classes_instructor_write" on public.classes;
create policy "classes_instructor_write" on public.classes
  for all using (instructor_id = auth.uid() and public.get_role() in ('instructor','admin'));

-- class_schedules
drop policy if exists "schedules_public_read" on public.class_schedules;
create policy "schedules_public_read" on public.class_schedules
  for select using (
    exists (
      select 1 from public.classes c
      where c.id = class_schedules.class_id
        and (c.status = 'published' or c.instructor_id = auth.uid() or public.get_role() = 'admin')
    )
  );

drop policy if exists "schedules_instructor_write" on public.class_schedules;
create policy "schedules_instructor_write" on public.class_schedules
  for all using (
    exists (
      select 1 from public.classes c
      where c.id = class_schedules.class_id
        and (c.instructor_id = auth.uid() or public.get_role() = 'admin')
    )
  );

-- bookings
drop policy if exists "bookings_student_read" on public.bookings;
create policy "bookings_student_read" on public.bookings
  for select using (
    student_id = auth.uid()
    or exists (
      select 1 from public.class_schedules s
      join public.classes c on c.id = s.class_id
      where s.id = bookings.schedule_id and c.instructor_id = auth.uid()
    )
    or public.get_role() = 'admin'
  );

drop policy if exists "bookings_student_insert" on public.bookings;
create policy "bookings_student_insert" on public.bookings
  for insert with check (student_id = auth.uid());

drop policy if exists "bookings_student_update" on public.bookings;
create policy "bookings_student_update" on public.bookings
  for update using (
    student_id = auth.uid()
    or exists (
      select 1 from public.class_schedules s
      join public.classes c on c.id = s.class_id
      where s.id = bookings.schedule_id and c.instructor_id = auth.uid()
    )
    or public.get_role() = 'admin'
  );

-- products
drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products
  for select using (
    is_active = true
    and (not is_instructor_only or public.get_role() in ('instructor','admin'))
  );

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all using (public.get_role() = 'admin');

-- orders
drop policy if exists "orders_own" on public.orders;
create policy "orders_own" on public.orders
  for select using (buyer_id = auth.uid() or public.get_role() = 'admin');

drop policy if exists "orders_insert" on public.orders;
create policy "orders_insert" on public.orders
  for insert with check (buyer_id = auth.uid());

drop policy if exists "orders_update" on public.orders;
create policy "orders_update" on public.orders
  for update using (buyer_id = auth.uid() or public.get_role() = 'admin');

-- payouts
drop policy if exists "payouts_own_read" on public.payouts;
create policy "payouts_own_read" on public.payouts
  for select using (instructor_id = auth.uid() or public.get_role() = 'admin');

drop policy if exists "payouts_admin_write" on public.payouts;
create policy "payouts_admin_write" on public.payouts
  for all using (public.get_role() = 'admin');

-- audit_logs (admin만)
drop policy if exists "audit_logs_admin" on public.audit_logs;
create policy "audit_logs_admin" on public.audit_logs
  for all using (public.get_role() = 'admin');
