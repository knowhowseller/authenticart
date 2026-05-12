ALTER TABLE instructor_profiles
  ADD COLUMN IF NOT EXISTS service_regions         text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS group_lesson_available  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_lesson_min        integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS group_lesson_max        integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS group_lesson_base_price integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS group_lesson_note       text;
