-- 홈 갤러리 노출 컬럼 추가
ALTER TABLE artworks
  ADD COLUMN IF NOT EXISTS is_gallery boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_artworks_gallery ON artworks(is_gallery) WHERE is_gallery = true;
