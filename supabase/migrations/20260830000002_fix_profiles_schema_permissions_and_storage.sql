-- ============================================================================
-- Migration: 20260830000002_fix_profiles_schema_permissions_and_storage.sql
-- Description: Correção definitiva da tabela public.profiles, permissões GRANT, RLS e Bucket avatars
-- ============================================================================

-- 1. EXTENSÃO PGCRYPTO
create extension if not exists "pgcrypto";

-- 2. GARANTIR A TABELA PUBLIC.PROFILES E TODAS AS COLUNAS
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text default 'Usuário',
  bio text default '',
  avatar_url text,
  phone text,
  birth_date text,
  onboarding_completed boolean not null default false,
  personalized_suggestions_consent boolean not null default false,
  terms_accepted_at timestamptz default now(),
  privacy_accepted_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Garantir colunas adicionais se a tabela já existia com schema antigo
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists display_name text default 'Usuário';
alter table public.profiles add column if not exists bio text default '';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists birth_date text;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists personalized_suggestions_consent boolean not null default false;
alter table public.profiles add column if not exists terms_accepted_at timestamptz default now();
alter table public.profiles add column if not exists privacy_accepted_at timestamptz default now();
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- 3. PERMISSÕES EXPLÍCITAS (GRANTs) PARA AS ROLES DO SUPABASE (Evita erro PGRST204/PGRST205 de schema cache)
grant usage on schema public to anon, authenticated, service_role;
grant all on table public.profiles to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

-- 4. ROW LEVEL SECURITY (RLS) NA TABELA PROFILES
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- 5. TRIGGER AUTOMÁTICO PARA NOVOS USUÁRIOS EM AUTH.USERS
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_name text;
  raw_bio text;
  raw_avatar text;
begin
  raw_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1),
    'Usuário'
  );

  raw_bio := coalesce(new.raw_user_meta_data->>'bio', '');
  raw_avatar := new.raw_user_meta_data->>'avatar_url';

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
    raw_name,
    raw_name,
    raw_bio,
    raw_avatar,
    false,
    now(),
    now()
  )
  on conflict (id) do update set
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    bio = coalesce(public.profiles.bio, excluded.bio),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- 6. CRIAR OU ATUALIZAR BUCKET 'avatars' NO SUPABASE STORAGE
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- 7. POLÍTICAS RLS DO STORAGE PARA O BUCKET 'avatars'
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
drop policy if exists "Users can upload their own avatar." on storage.objects;
drop policy if exists "Users can update their own avatar." on storage.objects;
drop policy if exists "Users can delete their own avatar." on storage.objects;

-- Leitura pública dos avatares
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Upload / Inserção restrita à própria pasta do usuário: avatars/{auth.uid()}/...
create policy "Users can upload their own avatar."
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (auth.uid())::text
  );

-- Atualização restrita à própria pasta do usuário
create policy "Users can update their own avatar."
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (auth.uid())::text
  );

-- Exclusão restrita à própria pasta do usuário
create policy "Users can delete their own avatar."
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (auth.uid())::text
  );

-- 8. RECARREGAR O SCHEMA CACHE DO POSTGREST
notify pgrst, 'reload schema';
