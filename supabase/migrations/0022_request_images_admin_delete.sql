-- ============================================================
-- 1. request-images 버킷 (클래스 요청 / 단체 출강 참고 사진)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('request-images', 'request-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "request_images_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "request_images_auth_insert"  ON storage.objects;
DROP POLICY IF EXISTS "request_images_auth_update"  ON storage.objects;
DROP POLICY IF EXISTS "request_images_auth_delete"  ON storage.objects;

CREATE POLICY "request_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'request-images');

CREATE POLICY "request_images_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'request-images' AND auth.role() = 'authenticated');

CREATE POLICY "request_images_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'request-images' AND auth.role() = 'authenticated');

CREATE POLICY "request_images_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'request-images' AND auth.role() = 'authenticated');

-- ============================================================
-- 2. reference_images 컬럼 추가
-- ============================================================
ALTER TABLE class_open_requests
  ADD COLUMN IF NOT EXISTS reference_images text[] NOT NULL DEFAULT '{}';

ALTER TABLE group_lesson_requests
  ADD COLUMN IF NOT EXISTS reference_images text[] NOT NULL DEFAULT '{}';

-- ============================================================
-- 3. artworks — 관리자 수정/삭제 RLS 추가
-- ============================================================
DROP POLICY IF EXISTS "artworks_admin_upd" ON artworks;
DROP POLICY IF EXISTS "artworks_admin_del" ON artworks;

CREATE POLICY "artworks_admin_upd" ON artworks
  FOR UPDATE USING (
    auth.uid() = seller_id
    OR EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "artworks_admin_del" ON artworks
  FOR DELETE USING (
    auth.uid() = seller_id
    OR EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 기존 seller 전용 정책 교체 (DROP & recreate with admin 포함)
DROP POLICY IF EXISTS "artworks_seller_upd" ON artworks;
DROP POLICY IF EXISTS "artworks_seller_del" ON artworks;

-- ============================================================
-- 4. board_posts — 관리자 수정/삭제는 이미 존재하므로 확인용
-- ============================================================
-- (0020에서 이미 author_id OR admin 으로 설정됨 — 추가 불필요)

-- ============================================================
-- 5. products — 관리자 삭제 허용 (기존에 없으면 추가)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='products' AND policyname='products_admin_del'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "products_admin_del" ON products
        FOR DELETE USING (
          EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        )
    $pol$;
  END IF;
END$$;
