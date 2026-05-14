-- 목적: 입점사 스토어 구조 추가
-- vendors 테이블에 로고·배너 이미지 및 슬러그 추가
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS logo_url    text,
  ADD COLUMN IF NOT EXISTS banner_url  text,
  ADD COLUMN IF NOT EXISTS slug        text UNIQUE,
  ADD COLUMN IF NOT EXISTS website_url text;

-- products 테이블에 vendor_id 추가 (null = 직영)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);
