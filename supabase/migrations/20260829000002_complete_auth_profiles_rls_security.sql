-- =====================================================================
-- RESPIRA DIGITAL HEALTH PLATFORM - PROFILES, AUTH TRIGGER & STRICT RLS
-- Version: 20260829000002
-- Description: Complete schema for profiles, auto-profile trigger, and strict RLS
-- =====================================================================

-- 1. TABELA PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  personalized_suggestions_consent boolean not null default false,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Garantir colunas
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists personalized_suggestions_consent boolean default false;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists privacy_accepted_at timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- 2. TRIGGER PARA GERAR PERFIL AUTOMATICAMENTE APÓS CADASTRO NO AUTH.USERS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    full_name,
    personalized_suggestions_consent,
    terms_accepted_at,
    privacy_accepted_at,
    created_at,
    updated_at
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'personalized_suggestions_consent')::boolean, false),
    coalesce((new.raw_user_meta_data->>'terms_accepted_at')::timestamptz, now()),
    coalesce((new.raw_user_meta_data->>'privacy_accepted_at')::timestamptz, now()),
    now(),
    now()
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. HABILITAR RLS EM TODAS AS TABELAS PRIVADAS
alter table public.profiles enable row level security;

-- 4. POLÍTICAS RLS ESTRITAS PARA PROFILES
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_delete_own"
on public.profiles for delete
using (auth.uid() = id);

-- 5. POLÍTICAS RLS PARA USER_PREFERENCES
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme text default 'light',
  reduced_motion boolean default false,
  daily_reminder boolean default true,
  reminder_time text default '20:30',
  sound_enabled boolean default true,
  vibration_enabled boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_user_preferences unique (user_id)
);

alter table public.user_preferences enable row level security;

drop policy if exists "preferences_select_own" on public.user_preferences;
drop policy if exists "preferences_insert_own" on public.user_preferences;
drop policy if exists "preferences_update_own" on public.user_preferences;
drop policy if exists "preferences_delete_own" on public.user_preferences;

create policy "preferences_select_own"
on public.user_preferences for select
using (auth.uid() = user_id);

create policy "preferences_insert_own"
on public.user_preferences for insert
with check (auth.uid() = user_id);

create policy "preferences_update_own"
on public.user_preferences for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "preferences_delete_own"
on public.user_preferences for delete
using (auth.uid() = user_id);
