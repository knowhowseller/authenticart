-- ============================================================
-- 리뷰/별점 시스템
-- ============================================================

create table if not exists public.class_reviews (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references public.classes(id) on delete cascade,
  student_id    uuid not null references public.users(id) on delete cascade,
  booking_id    uuid references public.bookings(id) on delete set null,
  rating        smallint not null check (rating between 1 and 5),
  content       text,
  created_at    timestamptz default now(),
  unique (class_id, student_id)
);

-- 클래스별 평균 별점 빠른 집계용 인덱스
create index if not exists idx_reviews_class on public.class_reviews(class_id);

-- RLS
alter table public.class_reviews enable row level security;

-- 누구나 읽기
drop policy if exists "reviews_select" on public.class_reviews;
create policy "reviews_select" on public.class_reviews
  for select using (true);

-- 본인만 작성 (booking_id 있는 수강 완료 건만)
drop policy if exists "reviews_insert" on public.class_reviews;
create policy "reviews_insert" on public.class_reviews
  for insert with check (
    auth.uid() = student_id
  );

-- 본인만 수정
drop policy if exists "reviews_update" on public.class_reviews;
create policy "reviews_update" on public.class_reviews
  for update using (auth.uid() = student_id);

-- 본인만 삭제
drop policy if exists "reviews_delete" on public.class_reviews;
create policy "reviews_delete" on public.class_reviews
  for delete using (auth.uid() = student_id);
