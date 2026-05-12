-- 게시판
CREATE TABLE board_posts (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type        text NOT NULL CHECK (type IN ('notice','free','inquiry','class_request','group_request')),
  title       text NOT NULL,
  content     text NOT NULL,
  author_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  author_email text,
  is_private  boolean NOT NULL DEFAULT false,
  is_pinned   boolean NOT NULL DEFAULT false,
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','closed')),
  view_count  integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE board_replies (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     uuid NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  author_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  content     text NOT NULL,
  is_admin    boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "board_read" ON board_posts FOR SELECT USING (
  NOT is_private
  OR auth.uid() = author_id
  OR EXISTS(SELECT 1 FROM users WHERE id=auth.uid() AND role IN ('admin','branch_manager'))
);
CREATE POLICY "board_insert_all"  ON board_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "board_update"      ON board_posts FOR UPDATE USING (
  auth.uid() = author_id
  OR EXISTS(SELECT 1 FROM users WHERE id=auth.uid() AND role='admin')
);
CREATE POLICY "board_delete"      ON board_posts FOR DELETE USING (
  auth.uid() = author_id
  OR EXISTS(SELECT 1 FROM users WHERE id=auth.uid() AND role='admin')
);

ALTER TABLE board_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reply_read" ON board_replies FOR SELECT USING (
  EXISTS(SELECT 1 FROM board_posts p WHERE p.id=post_id AND (
    NOT p.is_private
    OR auth.uid() = p.author_id
    OR EXISTS(SELECT 1 FROM users WHERE id=auth.uid() AND role IN ('admin','branch_manager'))
  ))
);
CREATE POLICY "reply_insert" ON board_replies FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "reply_delete" ON board_replies FOR DELETE USING (
  auth.uid() = author_id
  OR EXISTS(SELECT 1 FROM users WHERE id=auth.uid() AND role='admin')
);

CREATE INDEX idx_board_type ON board_posts(type, created_at DESC);
CREATE INDEX idx_board_replies ON board_replies(post_id);

-- 단체 출강 요청
CREATE TABLE group_lesson_requests (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_name                text NOT NULL,
  contact_name            text NOT NULL,
  contact_email           text NOT NULL,
  contact_phone           text NOT NULL,
  region                  text NOT NULL,
  lesson_theme            text,
  preferred_date          text,
  participant_count       integer NOT NULL,
  message                 text,
  status                  text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','assigned','completed','cancelled')),
  assigned_instructor_id  uuid REFERENCES users(id),
  admin_memo              text,
  created_at              timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE group_lesson_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "glr_insert_all"    ON group_lesson_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "glr_admin_read"    ON group_lesson_requests FOR SELECT USING (EXISTS(SELECT 1 FROM users WHERE id=auth.uid() AND role IN ('admin','branch_manager')));
CREATE POLICY "glr_admin_update"  ON group_lesson_requests FOR UPDATE USING (EXISTS(SELECT 1 FROM users WHERE id=auth.uid() AND role IN ('admin','branch_manager')));

-- 클래스 오픈 요청
CREATE TABLE class_open_requests (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            text NOT NULL,
  preferred_region text NOT NULL,
  preferred_date   text,
  message          text,
  status           text NOT NULL DEFAULT 'open' CHECK (status IN ('open','accepted','recruiting','payment_pending','confirmed','cancelled')),
  instructor_id    uuid REFERENCES users(id),
  target_capacity  integer,
  current_count    integer NOT NULL DEFAULT 0,
  schedule_date    timestamptz,
  price_per_person integer,
  created_at       timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE class_open_request_participants (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id  uuid NOT NULL REFERENCES class_open_requests(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'joined' CHECK (status IN ('joined','payment_requested','paid','cancelled')),
  booking_id  uuid,
  joined_at   timestamptz DEFAULT now() NOT NULL,
  UNIQUE(request_id, user_id)
);

ALTER TABLE class_open_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cor_read"   ON class_open_requests FOR SELECT USING (
  status IN ('open','accepted','recruiting')
  OR auth.uid() = requester_id
  OR auth.uid() = instructor_id
  OR EXISTS(SELECT 1 FROM users WHERE id=auth.uid() AND role IN ('admin','instructor'))
);
CREATE POLICY "cor_insert" ON class_open_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "cor_update" ON class_open_requests FOR UPDATE USING (
  auth.uid() = requester_id
  OR auth.uid() = instructor_id
  OR EXISTS(SELECT 1 FROM users WHERE id=auth.uid() AND role='admin')
);

ALTER TABLE class_open_request_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "corp_read"   ON class_open_request_participants FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS(SELECT 1 FROM class_open_requests WHERE id=request_id AND instructor_id=auth.uid())
  OR EXISTS(SELECT 1 FROM users WHERE id=auth.uid() AND role='admin')
);
CREATE POLICY "corp_insert" ON class_open_request_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "corp_update" ON class_open_request_participants FOR UPDATE USING (
  auth.uid() = user_id
  OR EXISTS(SELECT 1 FROM class_open_requests WHERE id=request_id AND instructor_id=auth.uid())
);

CREATE INDEX idx_cor_status     ON class_open_requests(status, created_at DESC);
CREATE INDEX idx_corp_request   ON class_open_request_participants(request_id);
CREATE INDEX idx_corp_user      ON class_open_request_participants(user_id);
