
-- ============== ENUMS ==============
create type public.app_role as enum ('admin', 'user');
create type public.app_mode as enum ('romance', 'spark');
create type public.plan_tier as enum ('explorer', 'verified', 'premium', 'diamond');
create type public.match_status as enum ('pending', 'active', 'closed');
create type public.report_status as enum ('open', 'reviewed', 'dismissed');
create type public.subscription_status as enum ('trial', 'active', 'expired', 'cancelled');

-- ============== USER ROLES ==============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users see own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);
create policy "Admins see all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============== PROFILES ==============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  age int,
  gender text,
  interested_in text,
  location text,
  ethnicity text,
  religion text,
  values_text text,
  mode app_mode not null default 'romance',
  plan plan_tier not null default 'explorer',
  verified boolean not null default false,
  banned boolean not null default false,
  flagged boolean not null default false,
  trial_start timestamptz default now(),
  bio text,
  prompts jsonb default '[]'::jsonb,
  interests jsonb default '[]'::jsonb,
  photos jsonb default '[]'::jsonb,
  notifications_enabled boolean default true,
  privacy_strict boolean default false,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Authenticated can read profiles" on public.profiles
  for select to authenticated using (true);
create policy "Users insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);
create policy "Admins update any profile" on public.profiles
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- auto-create profile + role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============== MATCHES ==============
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references auth.users(id) on delete cascade not null,
  user_b uuid references auth.users(id) on delete cascade not null,
  score int not null default 0,
  manual boolean not null default false,
  admin_note text,
  status match_status not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.matches enable row level security;
create policy "Users see own matches" on public.matches
  for select to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b or public.has_role(auth.uid(), 'admin'));
create policy "Users create matches involving self" on public.matches
  for insert to authenticated
  with check (auth.uid() = user_a or public.has_role(auth.uid(), 'admin'));
create policy "Users update own matches" on public.matches
  for update to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b or public.has_role(auth.uid(), 'admin'));

-- ============== MESSAGES ==============
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  flagged boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "Users see messages in own matches" on public.messages
  for select to authenticated using (
    exists(select 1 from public.matches m where m.id = match_id and (m.user_a = auth.uid() or m.user_b = auth.uid()))
    or public.has_role(auth.uid(), 'admin')
  );
create policy "Users send to own matches" on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid() and
    exists(select 1 from public.matches m where m.id = match_id and (m.user_a = auth.uid() or m.user_b = auth.uid()))
  );

-- ============== REPORTS ==============
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete cascade not null,
  reported_id uuid references auth.users(id) on delete cascade not null,
  reason text not null,
  detail text,
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "Users file reports" on public.reports
  for insert to authenticated with check (auth.uid() = reporter_id);
create policy "Reporter reads own reports" on public.reports
  for select to authenticated using (auth.uid() = reporter_id or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage reports" on public.reports
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ============== SUBSCRIPTIONS ==============
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan plan_tier not null,
  currency text not null default 'GHS',
  amount numeric not null,
  provider text not null default 'paystack',
  paystack_reference text,
  status subscription_status not null default 'trial',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "Users read own subs" on public.subscriptions
  for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Users insert own subs" on public.subscriptions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Admins update subs" on public.subscriptions
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ============== ADMIN MATCHES ==============
create table public.admin_matches (
  id uuid primary key default gen_random_uuid(),
  member_a uuid references auth.users(id) on delete cascade not null,
  member_b uuid references auth.users(id) on delete cascade not null,
  score int not null default 0,
  reason text,
  admin_id uuid references auth.users(id) on delete set null,
  status match_status not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.admin_matches enable row level security;
create policy "Admins manage admin_matches" on public.admin_matches
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Members see admin matches involving them" on public.admin_matches
  for select to authenticated using (auth.uid() = member_a or auth.uid() = member_b);

-- ============== STORAGE BUCKET ==============
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "Public read profile photos" on storage.objects
  for select using (bucket_id = 'profile-photos');
create policy "Authenticated upload own photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Authenticated update own photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Authenticated delete own photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
