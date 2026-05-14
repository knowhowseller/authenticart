-- classes, products, artworks, instructor_profiles에 craft_categories FK 추가
-- 기존 text category 필드는 유지하고 category_id를 신규 컬럼으로 추가

-- classes
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.craft_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_classes_category ON public.classes(category_id);

-- products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.craft_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);

-- artworks
ALTER TABLE public.artworks
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.craft_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_artworks_category ON public.artworks(category_id);

-- instructor_profiles
ALTER TABLE public.instructor_profiles
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.craft_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_instructor_profiles_category ON public.instructor_profiles(category_id);
