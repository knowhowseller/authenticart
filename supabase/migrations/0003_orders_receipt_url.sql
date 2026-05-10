-- Add receipt URL to orders for payment confirmation
alter table public.orders
  add column if not exists receipt_url text;
