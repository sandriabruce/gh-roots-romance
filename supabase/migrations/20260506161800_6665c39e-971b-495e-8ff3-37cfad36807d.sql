
create table public.seed_reply_queue (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null,
  seed_user_id uuid not null,
  recipient_user_id uuid not null,
  trigger_message_id uuid not null,
  trigger_message_content text not null,
  reply_at timestamptz not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index seed_reply_queue_due_idx on public.seed_reply_queue (reply_at) where status = 'pending';

alter table public.seed_reply_queue enable row level security;

create policy "Admins manage seed_reply_queue"
on public.seed_reply_queue for all
to authenticated
using (has_role(auth.uid(), 'admin'::app_role))
with check (has_role(auth.uid(), 'admin'::app_role));

create or replace function public.queue_seed_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
  other_id uuid;
  other_is_seed boolean;
  sender_is_seed boolean;
begin
  select * into m from public.matches where id = NEW.match_id;
  if m is null then return NEW; end if;

  if NEW.sender_id = m.user_a then
    other_id := m.user_b;
  else
    other_id := m.user_a;
  end if;

  select coalesce(is_seed, false) into sender_is_seed from public.profiles where id = NEW.sender_id;
  select coalesce(is_seed, false) into other_is_seed from public.profiles where id = other_id;

  -- Only queue if recipient is seed and sender is real
  if other_is_seed and not sender_is_seed then
    insert into public.seed_reply_queue (
      match_id, seed_user_id, recipient_user_id, trigger_message_id, trigger_message_content, reply_at
    ) values (
      NEW.match_id,
      other_id,
      NEW.sender_id,
      NEW.id,
      NEW.content,
      now() + (interval '2 minutes') + (random() * interval '3 minutes')
    );
  end if;

  return NEW;
end;
$$;

create trigger trg_queue_seed_reply
after insert on public.messages
for each row execute function public.queue_seed_reply();
