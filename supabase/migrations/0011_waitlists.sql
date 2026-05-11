-- 클래스 대기 신청 테이블
CREATE TABLE IF NOT EXISTS class_waitlists (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id   uuid NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'waiting'
                  CHECK (status IN ('waiting', 'notified', 'expired', 'booked')),
  notified_at   timestamptz,
  expires_at    timestamptz,
  created_at    timestamptz DEFAULT now() NOT NULL,
  UNIQUE (schedule_id, user_id)
);

-- RLS
ALTER TABLE class_waitlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlist_select_own" ON class_waitlists;
CREATE POLICY "waitlist_select_own" ON class_waitlists
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "waitlist_insert_own" ON class_waitlists;
CREATE POLICY "waitlist_insert_own" ON class_waitlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "waitlist_update_own" ON class_waitlists;
CREATE POLICY "waitlist_update_own" ON class_waitlists
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "waitlist_delete_own" ON class_waitlists;
CREATE POLICY "waitlist_delete_own" ON class_waitlists
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX IF NOT EXISTS class_waitlists_schedule_idx ON class_waitlists (schedule_id, status, created_at);
CREATE INDEX IF NOT EXISTS class_waitlists_user_idx    ON class_waitlists (user_id);

-- 좌석 반환 RPC (환불/취소 시 호출)
CREATE OR REPLACE FUNCTION public.release_seat(p_booking_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedule_id uuid;
BEGIN
  SELECT schedule_id INTO v_schedule_id FROM bookings WHERE id = p_booking_id;
  UPDATE class_schedules
    SET booked_count = GREATEST(booked_count - 1, 0)
    WHERE id = v_schedule_id;
  RETURN v_schedule_id;
END;
$$;
