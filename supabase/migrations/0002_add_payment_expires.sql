-- Add payment expiry for instructor-approved request bookings
alter table public.bookings
  add column if not exists payment_expires_at timestamptz;

-- Index for cron job expiry check
create index if not exists idx_bookings_payment_expires
  on public.bookings(payment_expires_at)
  where status = 'approved';
