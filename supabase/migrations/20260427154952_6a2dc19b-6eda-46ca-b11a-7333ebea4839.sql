
-- 1. Set search_path on set_updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end $$;

-- 2. Revoke EXECUTE on security definer helpers from anon + authenticated;
--    they are called by RLS policies via the postgres role, no client needs to call them.
revoke execute on function public.has_role(uuid, app_role) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- 3. Tighten storage bucket: replace broad public select policy with one that
-- only allows authenticated users to read photos (photos are still served via signed/public URL when shared).
drop policy if exists "Public read profile photos" on storage.objects;
create policy "Authenticated read profile photos" on storage.objects
  for select to authenticated using (bucket_id = 'profile-photos');
