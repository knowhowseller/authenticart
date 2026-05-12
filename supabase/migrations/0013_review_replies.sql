ALTER TABLE class_reviews ADD COLUMN IF NOT EXISTS reply text;
ALTER TABLE class_reviews ADD COLUMN IF NOT EXISTS replied_at timestamptz;
