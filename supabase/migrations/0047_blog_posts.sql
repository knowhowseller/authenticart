-- 목적: 블로그/매거진 기능 — 운영자 및 AI 에이전트(content-writer)가 작성하는 홍보·정보성 콘텐츠 저장.
--       AEO(AI 검색 최적화)·SEO를 위해 excerpt(요약), faq(Q&A 구조화 데이터), seo_* 오버라이드 필드 포함.
-- 변경 이유: 홈페이지 블로그 홍보 섹션 + 공개 블로그(/blog) 신규 기능 도입.

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,                       -- SEO 친화 URL 슬러그
  title text NOT NULL,
  excerpt text,                                    -- 요약 (메타 설명·카드·AI 인용 스니펫용)
  content text NOT NULL,                           -- 본문 (마크다운)
  cover_image text,                                -- 대표 이미지 URL
  category text NOT NULL DEFAULT 'guide',          -- guide|story|instructor|trend|review|news
  tags text[] NOT NULL DEFAULT '{}',
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,          -- [{ "q": "...", "a": "..." }] — FAQPage 구조화 데이터(AEO)
  author_name text NOT NULL DEFAULT '오센틱아트',
  created_by uuid REFERENCES public.users(id),
  status text NOT NULL DEFAULT 'draft',            -- draft | published
  is_featured boolean NOT NULL DEFAULT false,      -- 홈페이지 노출 여부
  view_count integer NOT NULL DEFAULT 0,
  seo_title text,                                  -- 메타 타이틀 오버라이드(미입력 시 title 사용)
  seo_description text,                             -- 메타 설명 오버라이드(미입력 시 excerpt 사용)
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 인덱스: 목록 조회(상태+발행일), 슬러그 단건 조회, 카테고리 필터, FK
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON public.blog_posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts (category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_by ON public.blog_posts (created_by);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON public.blog_posts (is_featured) WHERE is_featured = true;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_public_read" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_admin_all" ON public.blog_posts;

-- 공개: 발행된 글만 누구나 조회
CREATE POLICY "blog_public_read" ON public.blog_posts
  FOR SELECT USING (status = 'published');

-- 운영자: admin·branch_manager는 전체 CRUD (초안 포함)
CREATE POLICY "blog_admin_all" ON public.blog_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
  );

-- 조회수 원자적 증가 (비로그인 방문자도 호출 가능하도록 SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.increment_blog_view(post_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.blog_posts
     SET view_count = view_count + 1
   WHERE slug = post_slug AND status = 'published';
$$;

GRANT EXECUTE ON FUNCTION public.increment_blog_view(text) TO anon, authenticated;

-- updated_at 자동 갱신 트리거 (기존 set_updated_at 함수가 있으면 재사용)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON public.blog_posts;
    CREATE TRIGGER trg_blog_posts_updated_at
      BEFORE UPDATE ON public.blog_posts
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
