-- 1) Create a SECURITY DEFINER function to safely check if user is admin
-- (This runs with elevated privileges, bypassing RLS for the check)
drop function if exists public.is_admin(uuid);

create or replace function public.is_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = user_id and coalesce(is_admin, false) = true
  );
end;
$$ language plpgsql security definer;

-- 2) Admin SELECT policy: admins can view all profiles
drop policy if exists "Admins can select all profiles" on public.profiles;

create policy "Admins can select all profiles" on public.profiles
  for select using (
    public.is_admin(auth.uid())
  );

-- 3) Admin UPDATE policy: admins can update any profile's roles
drop policy if exists "Admins can update roles" on public.profiles;

create policy "Admins can update roles" on public.profiles
  for update using (
    public.is_admin(auth.uid())
  )
  with check (
    public.is_admin(auth.uid())
  );

-- 4) Keep user self-access policies intact
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