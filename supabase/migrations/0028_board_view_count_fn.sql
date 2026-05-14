-- 게시글 조회수 원자적 증가 함수
CREATE OR REPLACE FUNCTION increment_board_view_count(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE board_posts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
END;
$$;
