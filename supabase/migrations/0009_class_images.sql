-- Add images jsonb array to classes table
alter table public.classes
  add column if not exists images jsonb default '[]'::jsonb;
