-- =====================================================================
-- RESPIRA DIGITAL HEALTH PLATFORM - FIX PROFILES, RLS & STORAGE (MIGRATION)
-- Version: 20260828000001
-- Description: Complete fix for profiles upsert, missing columns backfill,
-- safe RLS policies, trigger provisioning and avatars storage bucket.
-- =====================================================================

-- 1. ENSURE PROFILES TABLE & COLUMNS EXIST (NON-DESTRUCTIVE)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Usuário',
  display_name text not null default 'Usuário',
  bio text default '',
  avatar_url text,
  phone text,
  birth_date date,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safely add any missing columns without data loss
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name') then
    alter table public.profiles add column full_name text not null default 'Usuário';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'display_name') then
    alter table public.profiles add column display_name text not null default 'Usuário';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'bio') then
    alter table public.profiles add column bio text default '';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'avatar_url') then
    alter table public.profiles add column avatar_url text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'created_at') then
    alter table public.profiles add column created_at timestamptz not null default now();
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'updated_at') then
    alter table public.profiles add column updated_at timestamptz not null default now();
  end if;
end $$;

-- 2. BACKFILL PROFILES FOR ANY EXISTING AUTH USERS MISSING A ROW
insert into public.profiles (id, full_name, display_name, bio, avatar_url, created_at, updated_at)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data->>'name'), ''), nullif(trim(u.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1), 'Usuário'),
  coalesce(nullif(trim(u.raw_user_meta_data->>'name'), ''), nullif(trim(u.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1), 'Usuário'),
  '',
  nullif(trim(u.raw_user_meta_data->>'avatar_url'), ''),
  u.created_at,
  now()
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

-- 3. ENABLE RLS ON PROFILES & RECREATE POLICIES (SUPPORTS UPSERT)
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own" on public.profiles
  for delete to authenticated
  using (auth.uid() = id);

-- 4. UPDATE USER PROVISIONING TRIGGER FOR NEW SIGNUPS
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  default_name text;
begin
  default_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1),
    'Usuário'
  );

  -- Insert profile
  insert into public.profiles (
    id,
    full_name,
    display_name,
    bio,
    avatar_url,
    onboarding_completed,
    created_at,
    updated_at
  )
  values (
    new.id,
    default_name,
    default_name,
    '',
    nullif(trim(new.raw_user_meta_data->>'avatar_url'), ''),
    false,
    now(),
    now()
  )
  on conflict (id) do update set
    full_name = coalesce(nullif(public.profiles.full_name, 'Usuário'), excluded.full_name),
    display_name = coalesce(nullif(public.profiles.display_name, 'Usuário'), excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  -- Insert preferences
  insert into public.user_preferences (
    user_id,
    theme,
    reduce_motion,
    haptic_feedback,
    guided_voice,
    soundscape_volume,
    voice_volume,
    daily_reminder_enabled,
    daily_reminder_time,
    micro_pauses_enabled,
    created_at,
    updated_at
  )
  values (
    new.id,
    'light',
    false,
    true,
    true,
    70,
    80,
    true,
    '20:30',
    false,
    now(),
    now()
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- 5. STORAGE BUCKET CONFIGURATION FOR AVATARS
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Storage RLS policies for avatars bucket
drop policy if exists "avatars_public_select" on storage.objects;
drop policy if exists "avatars_user_insert" on storage.objects;
drop policy if exists "avatars_user_update" on storage.objects;
drop policy if exists "avatars_user_delete" on storage.objects;

create policy "avatars_public_select" on storage.objects
  for select
  using (bucket_id = 'avatars');

create policy "avatars_user_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_user_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_user_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
