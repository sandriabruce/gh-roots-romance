create table if not exists public.payment_events (
  id uuid not null default gen_random_uuid() primary key,
  provider text not null default 'paystack',
  event_id text not null,
  reference text,
  event_type text,
  payload jsonb,
  created_at timestamp with time zone not null default now(),
  unique(provider, event_id)
);

alter table public.payment_events enable row level security;

create policy "Admins read payment_events"
  on public.payment_events for select
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

create index if not exists payment_events_reference_idx on public.payment_events(reference);