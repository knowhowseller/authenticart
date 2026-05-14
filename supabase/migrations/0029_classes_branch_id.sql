-- classes 테이블에 branch_id 추가
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_classes_branch ON public.classes(branch_id);

-- 클래스 등록 시 강사의 branch_id를 자동으로 복사하는 트리거
CREATE OR REPLACE FUNCTION set_class_branch_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  SELECT branch_id INTO NEW.branch_id
  FROM public.instructor_profiles
  WHERE instructor_id = NEW.instructor_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_class_branch_id ON public.classes;
CREATE TRIGGER trg_class_branch_id
  BEFORE INSERT ON public.classes
  FOR EACH ROW EXECUTE FUNCTION set_class_branch_id();

-- 기존 클래스에도 branch_id 소급 적용
UPDATE public.classes c
SET branch_id = ip.branch_id
FROM public.instructor_profiles ip
WHERE c.instructor_id = ip.instructor_id
  AND ip.branch_id IS NOT NULL
  AND c.branch_id IS NULL;
