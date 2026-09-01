-- =========================================================================
-- MIGRATION: 20260830000005_fix_profiles_table_and_storage_complete.sql
-- Description: Criação e garantia completa da tabela public.profiles,
-- auto-provisionamento de perfis, permissões, RLS, bucket avatars e reload de cache.
-- =========================================================================

-- 1. Criar a tabela public.profiles se não existir
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Usuário',
  display_name text not null default 'Usuário',
  bio text default '',
  avatar_url text,
  phone text,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Garantir colunas caso a tabela já existisse previamente
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name') then
    alter table public.profiles add column full_name text not null default 'Usuário';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'display_name') then
    alter table public.profiles add column display_name text not null default 'Usuário';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'bio') then
    alter table public.profiles add column bio text default '';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'avatar_url') then
    alter table public.profiles add column avatar_url text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'phone') then
    alter table public.profiles add column if not exists phone text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'birth_date') then
    alter table public.profiles add column if not exists birth_date date;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'created_at') then
    alter table public.profiles add column created_at timestamptz not null default now();
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'updated_at') then
    alter table public.profiles add column updated_at timestamptz not null default now();
  end if;
end $$;

-- 3. Índices para performance
create index if not exists idx_profiles_created_at on public.profiles(created_at);
create index if not exists idx_profiles_updated_at on public.profiles(updated_at);

-- 4. Conceder permissões explícitas às roles da API PostgREST
grant usage on schema public to anon, authenticated, service_role;
grant all on table public.profiles to authenticated, service_role;
grant select on table public.profiles to anon;

-- 5. Habilitar Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Limpar policies anteriores
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;

-- Políticas RLS estritas: cada usuário acessa e altera apenas o próprio perfil
create policy "profiles_select_own" on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own" on public.profiles
  for delete
  to authenticated
  using (auth.uid() = id);

-- 6. Trigger para atualizar updated_at automaticamente
create or replace function public.handle_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_profiles_updated_at();

-- 7. Função e Trigger para Auto-Provisionamento de Perfis em auth.users
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_name text;
  user_bio text;
  user_avatar text;
begin
  user_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1),
    'Usuário'
  );

  user_bio := coalesce(new.raw_user_meta_data->>'bio', '');
  user_avatar := new.raw_user_meta_data->>'avatar_url';

  insert into public.profiles (
    id,
    full_name,
    display_name,
    bio,
    avatar_url,
    created_at,
    updated_at
  )
  values (
    new.id,
    user_name,
    user_name,
    user_bio,
    user_avatar,
    now(),
    now()
  )
  on conflict (id) do update set
    full_name = coalesce(nullif(public.profiles.full_name, 'Usuário'), excluded.full_name),
    display_name = coalesce(nullif(public.profiles.display_name, 'Usuário'), excluded.display_name),
    bio = coalesce(nullif(public.profiles.bio, ''), excluded.bio),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

-- Associar trigger ao auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 8. Backfill para contas existentes que ainda não possuem perfil criado
insert into public.profiles (
  id,
  full_name,
  display_name,
  bio,
  avatar_url,
  created_at,
  updated_at
)
select
  u.id,
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    u.raw_user_meta_data->>'display_name',
    split_part(u.email, '@', 1),
    'Usuário'
  ),
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    u.raw_user_meta_data->>'display_name',
    split_part(u.email, '@', 1),
    'Usuário'
  ),
  coalesce(u.raw_user_meta_data->>'bio', ''),
  u.raw_user_meta_data->>'avatar_url',
  coalesce(u.created_at, now()),
  coalesce(u.updated_at, now())
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

-- 9. Configuração e Políticas do Supabase Storage (Bucket 'avatars')
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Habilitar RLS em storage.objects
alter table storage.objects enable row level security;

-- Limpar policies de avatar em storage.objects
drop policy if exists "Avatar Public Access" on storage.objects;
drop policy if exists "Avatar Upload Own" on storage.objects;
drop policy if exists "Avatar Update Own" on storage.objects;
drop policy if exists "Avatar Delete Own" on storage.objects;
drop policy if exists "avatars_public_select" on storage.objects;
drop policy if exists "avatars_user_insert" on storage.objects;
drop policy if exists "avatars_user_update" on storage.objects;
drop policy if exists "avatars_user_delete" on storage.objects;

-- Leitura pública de fotos de perfil
create policy "avatars_public_select" on storage.objects
  for select
  using (bucket_id = 'avatars');

-- Inserção de foto no próprio diretório do usuário
create policy "avatars_user_insert" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (
      auth.uid() = (storage.foldername(name))[1]::uuid
      or (storage.foldername(name))[1] = auth.uid()::text
      or name like auth.uid() || '/%'
      or name like auth.uid() || '-%'
    )
  );

-- Atualização de foto do próprio usuário
create policy "avatars_user_update" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (
      auth.uid() = (storage.foldername(name))[1]::uuid
      or (storage.foldername(name))[1] = auth.uid()::text
      or name like auth.uid() || '/%'
      or name like auth.uid() || '-%'
    )
  );

-- Exclusão de foto do próprio usuário
create policy "avatars_user_delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (
      auth.uid() = (storage.foldername(name))[1]::uuid
      or (storage.foldername(name))[1] = auth.uid()::text
      or name like auth.uid() || '/%'
      or name like auth.uid() || '-%'
    )
  );

-- 10. Forçar recarregamento do schema cache do PostgREST
notify pgrst, 'reload schema';
