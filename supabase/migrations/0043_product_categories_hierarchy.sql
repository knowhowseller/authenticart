-- 목적: product_categories에 대카테고리/소카테고리 2계층 구조 추가

ALTER TABLE public.product_categories
  ADD COLUMN IF NOT EXISTS parent_id  integer REFERENCES public.product_categories(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id
  ON public.product_categories(parent_id);

-- 기존 대카테고리 정렬 순서
UPDATE public.product_categories SET sort_order = CASE name
  WHEN '레진'     THEN 1
  WHEN '몰드'     THEN 2
  WHEN '색소'     THEN 3
  WHEN '장식재'   THEN 4
  WHEN '도구'     THEN 5
  WHEN '패키지'   THEN 6
  WHEN '양말인형' THEN 7
  WHEN '미니어처' THEN 8
  WHEN '기타'     THEN 9
  ELSE sort_order
END
WHERE parent_id IS NULL;

-- 소카테고리 삽입
DO $$
DECLARE
  pid integer;
BEGIN
  -- 레진
  SELECT id INTO pid FROM public.product_categories WHERE name = '레진' AND parent_id IS NULL;
  IF pid IS NOT NULL THEN
    INSERT INTO public.product_categories (name, parent_id, sort_order) VALUES
      ('UV레진',      pid, 1),
      ('에폭시레진',  pid, 2),
      ('레진 경화제', pid, 3),
      ('레진 희석제', pid, 4)
    ON CONFLICT (name) DO NOTHING;
  END IF;

  -- 몰드
  SELECT id INTO pid FROM public.product_categories WHERE name = '몰드' AND parent_id IS NULL;
  IF pid IS NOT NULL THEN
    INSERT INTO public.product_categories (name, parent_id, sort_order) VALUES
      ('실리콘 몰드',   pid, 1),
      ('아크릴 몰드',   pid, 2),
      ('오너먼트 몰드', pid, 3),
      ('3D 몰드',       pid, 4)
    ON CONFLICT (name) DO NOTHING;
  END IF;

  -- 색소
  SELECT id INTO pid FROM public.product_categories WHERE name = '색소' AND parent_id IS NULL;
  IF pid IS NOT NULL THEN
    INSERT INTO public.product_categories (name, parent_id, sort_order) VALUES
      ('레진 전용 색소', pid, 1),
      ('펄 파우더',      pid, 2),
      ('글리터',         pid, 3),
      ('형광 색소',      pid, 4)
    ON CONFLICT (name) DO NOTHING;
  END IF;

  -- 장식재
  SELECT id INTO pid FROM public.product_categories WHERE name = '장식재' AND parent_id IS NULL;
  IF pid IS NOT NULL THEN
    INSERT INTO public.product_categories (name, parent_id, sort_order) VALUES
      ('압화·드라이플라워', pid, 1),
      ('조개·크리스탈',     pid, 2),
      ('금박·은박',         pid, 3),
      ('미니어처 파츠',     pid, 4)
    ON CONFLICT (name) DO NOTHING;
  END IF;

  -- 도구
  SELECT id INTO pid FROM public.product_categories WHERE name = '도구' AND parent_id IS NULL;
  IF pid IS NOT NULL THEN
    INSERT INTO public.product_categories (name, parent_id, sort_order) VALUES
      ('UV 라이트',  pid, 1),
      ('믹싱 도구',  pid, 2),
      ('측정 도구',  pid, 3),
      ('마감 도구',  pid, 4)
    ON CONFLICT (name) DO NOTHING;
  END IF;

  -- 패키지
  SELECT id INTO pid FROM public.product_categories WHERE name = '패키지' AND parent_id IS NULL;
  IF pid IS NOT NULL THEN
    INSERT INTO public.product_categories (name, parent_id, sort_order) VALUES
      ('선물 박스',   pid, 1),
      ('포장지·리본', pid, 2),
      ('쇼핑백',      pid, 3)
    ON CONFLICT (name) DO NOTHING;
  END IF;

  -- 양말인형
  SELECT id INTO pid FROM public.product_categories WHERE name = '양말인형' AND parent_id IS NULL;
  IF pid IS NOT NULL THEN
    INSERT INTO public.product_categories (name, parent_id, sort_order) VALUES
      ('양말 원단',   pid, 1),
      ('인형 눈·코',  pid, 2),
      ('솜·심재',     pid, 3),
      ('인형 도구',   pid, 4)
    ON CONFLICT (name) DO NOTHING;
  END IF;

  -- 미니어처
  SELECT id INTO pid FROM public.product_categories WHERE name = '미니어처' AND parent_id IS NULL;
  IF pid IS NOT NULL THEN
    INSERT INTO public.product_categories (name, parent_id, sort_order) VALUES
      ('미니어처 가구', pid, 1),
      ('미니어처 소품', pid, 2),
      ('미니어처 재료', pid, 3)
    ON CONFLICT (name) DO NOTHING;
  END IF;

  -- 기타
  SELECT id INTO pid FROM public.product_categories WHERE name = '기타' AND parent_id IS NULL;
  IF pid IS NOT NULL THEN
    INSERT INTO public.product_categories (name, parent_id, sort_order) VALUES
      ('서적·교재',        pid, 1),
      ('작업 매트·보호재', pid, 2)
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;
