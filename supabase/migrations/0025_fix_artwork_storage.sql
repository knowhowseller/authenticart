-- artwork-images 버킷 및 정책 재적용 (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artwork-images',
  'artwork-images',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE
  SET allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/heic','image/heif'],
      file_size_limit = 10485760,
      public = true;

DROP POLICY IF EXISTS "artwork_images_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "artwork_images_auth_insert"  ON storage.objects;
DROP POLICY IF EXISTS "artwork_images_auth_update"  ON storage.objects;
DROP POLICY IF EXISTS "artwork_images_auth_delete"  ON storage.objects;

CREATE POLICY "artwork_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'artwork-images');

CREATE POLICY "artwork_images_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artwork-images' AND auth.role() = 'authenticated');

CREATE POLICY "artwork_images_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'artwork-images' AND auth.role() = 'authenticated');

CREATE POLICY "artwork_images_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'artwork-images' AND auth.role() = 'authenticated');
