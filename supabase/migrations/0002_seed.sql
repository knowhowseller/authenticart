-- ============================================================
-- 오센틱아트 — 테스트 시드 데이터
-- Supabase SQL 에디터에서 실행 (Service Role 권한 필요)
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. auth.users 생성 (고정 UUID)
-- ─────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, is_super_admin, role
)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000000',
   'admin@authenticart.kr',
   crypt('Test1234!', gen_salt('bf')),
   now(), now(), now(),
   '{"name":"관리자"}'::jsonb,
   false, 'authenticated'),

  ('00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000000',
   'instructor1@test.kr',
   crypt('Test1234!', gen_salt('bf')),
   now(), now(), now(),
   '{"name":"김레진 강사"}'::jsonb,
   false, 'authenticated'),

  ('00000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000000',
   'instructor2@test.kr',
   crypt('Test1234!', gen_salt('bf')),
   now(), now(), now(),
   '{"name":"박아트 강사"}'::jsonb,
   false, 'authenticated'),

  ('00000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000000',
   'user1@test.kr',
   crypt('Test1234!', gen_salt('bf')),
   now(), now(), now(),
   '{"name":"이수강"}'::jsonb,
   false, 'authenticated'),

  ('00000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000000',
   'user2@test.kr',
   crypt('Test1234!', gen_salt('bf')),
   now(), now(), now(),
   '{"name":"최예술"}'::jsonb,
   false, 'authenticated')

ON CONFLICT (id) DO NOTHING;

-- auth.identities (이메일 로그인용)
INSERT INTO auth.identities (
  id, user_id, provider_id, provider,
  identity_data, created_at, updated_at, last_sign_in_at
)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'admin@authenticart.kr', 'email',
   '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@authenticart.kr"}'::jsonb,
   now(), now(), now()),

  ('00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000002',
   'instructor1@test.kr', 'email',
   '{"sub":"00000000-0000-0000-0000-000000000002","email":"instructor1@test.kr"}'::jsonb,
   now(), now(), now()),

  ('00000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000003',
   'instructor2@test.kr', 'email',
   '{"sub":"00000000-0000-0000-0000-000000000003","email":"instructor2@test.kr"}'::jsonb,
   now(), now(), now()),

  ('00000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000004',
   'user1@test.kr', 'email',
   '{"sub":"00000000-0000-0000-0000-000000000004","email":"user1@test.kr"}'::jsonb,
   now(), now(), now()),

  ('00000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000005',
   'user2@test.kr', 'email',
   '{"sub":"00000000-0000-0000-0000-000000000005","email":"user2@test.kr"}'::jsonb,
   now(), now(), now())

ON CONFLICT (provider, provider_id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 2. public.users
-- ─────────────────────────────────────────────
INSERT INTO public.users (id, email, name, role, region) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@authenticart.kr', '관리자',      'admin',      '서울'),
  ('00000000-0000-0000-0000-000000000002', 'instructor1@test.kr',   '김레진 강사', 'instructor', '인천'),
  ('00000000-0000-0000-0000-000000000003', 'instructor2@test.kr',   '박아트 강사', 'instructor', '강릉'),
  ('00000000-0000-0000-0000-000000000004', 'user1@test.kr',         '이수강',      'student',    '서울'),
  ('00000000-0000-0000-0000-000000000005', 'user2@test.kr',         '최예술',      'student',    '부산')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 3. instructor_profiles
-- ─────────────────────────────────────────────
INSERT INTO public.instructor_profiles (instructor_id, bio, status, approved_at) VALUES
  ('00000000-0000-0000-0000-000000000002',
   '레진아트 전문 강사. 5년 경력. 인천·서울 수업 진행.',
   'approved', now()),
  ('00000000-0000-0000-0000-000000000003',
   '강릉에서 바다를 담은 레진 아트. 초보자 환영!',
   'approved', now())
ON CONFLICT (instructor_id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 4. classes
-- ─────────────────────────────────────────────
INSERT INTO public.classes (id, instructor_id, title, description, region, price, capacity, status, confirmation_mode, attributes) VALUES
  ('c0000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000002',
   '입문자를 위한 레진 코스터 클래스',
   '처음 레진을 접하는 분들을 위한 기초 클래스입니다. 코스터 2개를 직접 만들어가세요.',
   '인천', 45000, 8, 'published', 'instant',
   '{"craft_type":"resin","difficulty":"beginner","duration_active":90,"duration_curing":1440,"pickup_method":"pickup","required_items":["편한 옷"],"provided_items":["레진","몰드","피그먼트","장갑"],"cautions":["임산부 불가","에폭시 알레르기 확인"],"min_age":14}'::jsonb),

  ('c0000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000002',
   '레진 반지·귀걸이 주얼리 클래스',
   '나만의 레진 주얼리를 만들어보는 중급 클래스. 반지 2개 + 귀걸이 1쌍 제작.',
   '인천', 65000, 6, 'published', 'request',
   '{"craft_type":"resin","difficulty":"intermediate","duration_active":120,"duration_curing":2880,"pickup_method":"shipping","required_items":[],"provided_items":["레진","금속 부자재","글리터","UV램프"],"cautions":["UV 조사 주의"],"min_age":16}'::jsonb),

  ('c0000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000003',
   '강릉 바다 담은 오션 레진 클래스',
   '파도와 모래를 표현한 오션아트 레진 클래스. 소품 1개 제작.',
   '강릉', 55000, 5, 'published', 'instant',
   '{"craft_type":"resin","difficulty":"beginner","duration_active":100,"duration_curing":1440,"pickup_method":"shipping","required_items":[],"provided_items":["레진","색소","파우더","트레이"],"cautions":[],"min_age":12}'::jsonb),

  ('c0000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000003',
   '레진 양말 인형 클래스',
   '귀여운 양말 인형과 레진을 결합한 독특한 클래스.',
   '강릉', 70000, 4, 'draft', 'instant',
   '{"craft_type":"resin","difficulty":"advanced","duration_active":150,"duration_curing":2880,"pickup_method":"pickup","required_items":["가위"],"provided_items":["양말","레진","금형"],"cautions":[],"min_age":18}'::jsonb)

ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 5. class_schedules
-- ─────────────────────────────────────────────
INSERT INTO public.class_schedules (class_id, start_at, end_at, max_students, booked_count) VALUES
  ('c0000000-0000-0000-0000-000000000001', now() + interval '7 days'  + interval '10 hours', now() + interval '7 days'  + interval '12 hours', 8, 0),
  ('c0000000-0000-0000-0000-000000000001', now() + interval '14 days' + interval '10 hours', now() + interval '14 days' + interval '12 hours', 8, 0),
  ('c0000000-0000-0000-0000-000000000001', now() + interval '21 days' + interval '14 hours', now() + interval '21 days' + interval '16 hours', 8, 0),

  ('c0000000-0000-0000-0000-000000000002', now() + interval '10 days' + interval '13 hours', now() + interval '10 days' + interval '15 hours', 6, 0),
  ('c0000000-0000-0000-0000-000000000002', now() + interval '17 days' + interval '13 hours', now() + interval '17 days' + interval '15 hours', 6, 0),
  ('c0000000-0000-0000-0000-000000000002', now() + interval '24 days' + interval '13 hours', now() + interval '24 days' + interval '15 hours', 6, 0),

  ('c0000000-0000-0000-0000-000000000003', now() + interval '5 days'  + interval '11 hours', now() + interval '5 days'  + interval '13 hours', 5, 0),
  ('c0000000-0000-0000-0000-000000000003', now() + interval '12 days' + interval '11 hours', now() + interval '12 days' + interval '13 hours', 5, 0),
  ('c0000000-0000-0000-0000-000000000003', now() + interval '19 days' + interval '11 hours', now() + interval '19 days' + interval '13 hours', 5, 0);

-- ─────────────────────────────────────────────
-- 6. products
-- ─────────────────────────────────────────────
INSERT INTO public.products (name, description, category, retail_price, wholesale_price, is_instructor_only, stock_qty, images, is_active) VALUES
  ('UV 레진 500g (하드)',       '고강도 UV 경화 레진. 투명도 높음.',              '레진',   28000,  18000, false, 50,  '[]'::jsonb, true),
  ('AB형 레진 세트 1kg',        '에폭시 AB형 레진 1:1 혼합 세트. 48h 경화.',     '레진',   45000,  30000, false, 30,  '[]'::jsonb, true),
  ('레진 피그먼트 12색 세트',   '불투명 펄 피그먼트 12색. 10g×12개입.',          '색소',   22000,  14000, false, 80,  '[]'::jsonb, true),
  ('레진용 글리터 믹스 10종',   '홀로그램+유니콘+별자리 글리터 10종 세트.',       '장식재', 15000,   9500, false, 100, '[]'::jsonb, true),
  ('실리콘 몰드 코스터 4구',    '4구 원형 코스터 몰드. 재사용 가능.',             '몰드',   12000,   7500, false, 60,  '[]'::jsonb, true),
  ('실리콘 몰드 귀걸이 세트',   '다양한 형태의 귀걸이 몰드 20종 세트.',           '몰드',   18000,  11000, false, 45,  '[]'::jsonb, true),
  ('강사 전용 UV램프 36W (프로)', '전문 강사용 고출력 UV 경화기. 36W.',           '장비',   89000,  55000, true,  15,  '[]'::jsonb, true),
  ('레진 색소 마스터팩 30색',   '강사 전용 30색 대용량 색소 세트. 20g×30.',      '색소',  120000,  75000, true,  20,  '[]'::jsonb, true)
ON CONFLICT DO NOTHING;
