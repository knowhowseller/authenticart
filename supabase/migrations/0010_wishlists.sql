-- 찜(위시리스트) 테이블
CREATE TABLE IF NOT EXISTS wishlists (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id    uuid REFERENCES classes(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, class_id)
);

-- RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlists_select_own" ON wishlists;
CREATE POLICY "wishlists_select_own" ON wishlists
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlists_insert_own" ON wishlists;
CREATE POLICY "wishlists_insert_own" ON wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlists_delete_own" ON wishlists;
CREATE POLICY "wishlists_delete_own" ON wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX IF NOT EXISTS wishlists_user_id_idx ON wishlists (user_id);
CREATE INDEX IF NOT EXISTS wishlists_class_id_idx ON wishlists (class_id);
