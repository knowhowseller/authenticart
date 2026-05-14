-- 클래스-재료 연결 테이블
-- 강사가 클래스에 필요한 재료(products)를 연결하면 수강생이 예약 후 원스톱 구매 가능

CREATE TABLE IF NOT EXISTS public.class_materials (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  note        text,
  sort_order  int DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (class_id, product_id)
);

ALTER TABLE public.class_materials ENABLE ROW LEVEL SECURITY;

-- 전체 조회 허용 (예약 완료 후 준비물 안내에 사용)
DROP POLICY IF EXISTS "class_materials_select_all" ON public.class_materials;
CREATE POLICY "class_materials_select_all" ON public.class_materials
  FOR SELECT USING (true);

-- 강사 본인 클래스만 관리 가능
DROP POLICY IF EXISTS "class_materials_instructor_write" ON public.class_materials;
CREATE POLICY "class_materials_instructor_write" ON public.class_materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_id AND c.instructor_id = auth.uid()
    )
    OR public.get_role() = 'admin'
  );

CREATE INDEX IF NOT EXISTS idx_class_materials_class   ON public.class_materials(class_id);
CREATE INDEX IF NOT EXISTS idx_class_materials_product ON public.class_materials(product_id);
