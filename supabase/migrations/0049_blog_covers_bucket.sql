-- 목적: 블로그 커버(썸네일) 이미지 저장용 퍼블릭 Storage 버킷.
--       로컬 FLUX로 생성한 커버를 발행 파이프라인(service role)이 업로드 → blog_posts.cover_image에 public URL 저장.
-- 변경 이유: 블로그 글에 대표 이미지가 없어 CSS 카드로만 노출되던 것을 실제 썸네일로 대체(og:image·SNS 공유 개선).
-- 비고: 업로드는 service role key(RLS 우회)로 수행되므로 쓰기 정책은 관리자 UI 대비 보강용. 읽기는 공개.

-- 1) 버킷 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('blog-covers', 'blog-covers', true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 2) 정책
DROP POLICY IF EXISTS "blog_covers_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "blog_covers_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "blog_covers_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "blog_covers_admin_delete" ON storage.objects;

-- 누구나 읽기 (공개 버킷)
CREATE POLICY "blog_covers_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-covers');

-- 관리자·지부관리자만 업로드/수정/삭제 (service role은 RLS 우회로 별도 허용됨)
CREATE POLICY "blog_covers_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'blog-covers'
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
  );

CREATE POLICY "blog_covers_admin_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'blog-covers'
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
  );

CREATE POLICY "blog_covers_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'blog-covers'
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
  );
