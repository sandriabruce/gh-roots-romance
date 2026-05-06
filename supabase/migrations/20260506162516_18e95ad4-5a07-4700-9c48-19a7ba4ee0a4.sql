create index if not exists messages_match_sender_created_idx
  on public.messages (match_id, sender_id, created_at desc);