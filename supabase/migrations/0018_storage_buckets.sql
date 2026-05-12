-- ============================================================
-- Storage Buckets & Policies
-- ============================================================

-- 1. 버킷 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('instructor-profiles', 'instructor-profiles', true, 5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('class-images',        'class-images',        true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('product-images',      'product-images',      true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- instructor-profiles 버킷
-- ============================================================
DROP POLICY IF EXISTS "instructor_profiles_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "instructor_profiles_auth_insert"  ON storage.objects;
DROP POLICY IF EXISTS "instructor_profiles_auth_update"  ON storage.objects;
DROP POLICY IF EXISTS "instructor_profiles_auth_delete"  ON storage.objects;

-- 누구나 읽기 가능 (공개 버킷)
CREATE POLICY "instructor_profiles_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'instructor-profiles');

-- 강사·관리자만 업로드 가능
CREATE POLICY "instructor_profiles_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'instructor-profiles'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    )
  );

-- 강사·관리자만 덮어쓰기 가능
CREATE POLICY "instructor_profiles_auth_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'instructor-profiles'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    )
  );

-- 강사·관리자만 삭제 가능
CREATE POLICY "instructor_profiles_auth_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'instructor-profiles'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    )
  );

-- ============================================================
-- class-images 버킷
-- ============================================================
DROP POLICY IF EXISTS "class_images_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "class_images_auth_insert"   ON storage.objects;
DROP POLICY IF EXISTS "class_images_auth_update"   ON storage.objects;
DROP POLICY IF EXISTS "class_images_auth_delete"   ON storage.objects;

CREATE POLICY "class_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'class-images');

CREATE POLICY "class_images_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'class-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    )
  );

CREATE POLICY "class_images_auth_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'class-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    )
  );

CREATE POLICY "class_images_auth_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'class-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    )
  );

-- ============================================================
-- product-images 버킷
-- ============================================================
DROP POLICY IF EXISTS "product_images_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "product_images_auth_insert"  ON storage.objects;
DROP POLICY IF EXISTS "product_images_auth_update"  ON storage.objects;
DROP POLICY IF EXISTS "product_images_auth_delete"  ON storage.objects;

CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "product_images_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "product_images_auth_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "product_images_auth_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
