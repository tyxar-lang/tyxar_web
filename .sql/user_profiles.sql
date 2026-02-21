-- 1) Create table if it doesn't exist (safe to run repeatedly)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  full_name text,
  is_user boolean default true not null,
  is_admin boolean default false not null,
  is_developer boolean default false not null,
  is_tester boolean default false not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Indexes (optional)
create index if not exists idx_profiles_is_admin on public.profiles(is_admin);
create index if not exists idx_profiles_is_developer on public.profiles(is_developer);
create index if not exists idx_profiles_is_tester on public.profiles(is_tester);

-- 3) Enable Row Level Security
alter table public.profiles enable row level security;

-- 4) User policies: allow users to manage their own profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- 5) Admin policies: allow admins to SELECT and UPDATE roles for any profile
-- Drop the problematic circular admin policy
drop policy if exists "Admins can select all profiles" on public.profiles;

-- Simple policy: users can always select their own profile
-- (Admins are also users, so they can select their own profile)
-- For admins to see all profiles, use a SECURITY DEFINER function instead (optional, advanced)

-- For now, keep only basic user policies:
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Drop problematic admin policies for now
drop policy if exists "Admins can update roles" on public.profiles;

-- 6) Function + trigger: ensure new auth users get a profile row
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, is_user, is_admin, is_developer, is_tester, created_at, updated_at)
  values (new.id, (new.raw_user_meta_data->>'full_name')::text, true, false, false, false, now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();