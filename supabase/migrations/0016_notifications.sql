-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text NOT NULL,
  body       text,
  link       text,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_own_notifs" ON notifications;
DROP POLICY IF EXISTS "admin_all_notifs" ON notifications;

-- 사용자는 자신의 알림만 조회·수정 가능
CREATE POLICY "user_own_notifs" ON notifications
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifs_unread ON notifications(user_id, is_read) WHERE is_read = false;
