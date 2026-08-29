-- =====================================================================
-- RESPIRA DIGITAL HEALTH PLATFORM - SCRIPT MESTRE SQL (SUPABASE)
-- Version: 20260829000003
-- Execução: Copie e cole no SQL Editor do Supabase e clique em "Run".
-- =====================================================================

-- =====================================================================
-- 1. TABELAS PRINCIPAIS
-- =====================================================================

-- 1.1 PROFILES (Perfil do Usuário vinculado ao auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Usuário',
  display_name text default 'Usuário',
  avatar_url text,
  phone text,
  birth_date date,
  personalized_suggestions_consent boolean not null default false,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Garantir colunas se já existirem
alter table public.profiles add column if not exists full_name text default 'Usuário';
alter table public.profiles add column if not exists display_name text default 'Usuário';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists personalized_suggestions_consent boolean default false;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists privacy_accepted_at timestamptz;
alter table public.profiles add column if not exists onboarding_completed boolean default false;
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- 1.2 USER PREFERENCES (Preferências e configurações)
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  reduced_motion boolean not null default false,
  reduce_motion boolean not null default false,
  haptic_feedback boolean not null default true,
  sound_enabled boolean not null default true,
  vibration_enabled boolean not null default true,
  guided_voice boolean not null default true,
  soundscape_volume integer not null default 70 check (soundscape_volume between 0 and 100),
  voice_volume integer not null default 80 check (voice_volume between 0 and 100),
  daily_reminder boolean not null default true,
  daily_reminder_enabled boolean not null default true,
  reminder_time text not null default '20:30',
  daily_reminder_time time not null default '20:30',
  country_helpline text default 'BR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_user_preferences unique (user_id)
);

-- 1.3 MOOD ENTRIES (Diário de Humor e Ansiedade)
create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood_score integer not null check (mood_score between 1 and 5),
  anxiety_score integer not null check (anxiety_score between 0 and 10),
  emotions text[] not null default '{}',
  activities text[] not null default '{}',
  planned_exercises jsonb default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mood_entries add column if not exists activities text[] default '{}';
alter table public.mood_entries add column if not exists planned_exercises jsonb default '[]'::jsonb;
alter table public.mood_entries add column if not exists notes text;

-- 1.4 PRACTICE PROGRESS (Exercícios de respiração e relaxamento)
create table if not exists public.practice_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_id text not null,
  status text not null default 'completed' check (status in ('in_progress', 'completed', 'abandoned')),
  progress integer not null default 100 check (progress between 0 and 100),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.5 ARTICLE PROGRESS (Leitura e favoritos de artigos educativos)
create table if not exists public.article_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id text not null,
  progress integer not null default 0 check (progress between 0 and 100),
  last_position integer not null default 0,
  is_read boolean not null default false,
  is_favorite boolean not null default false,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_user_article_progress unique (user_id, article_id)
);

-- 1.6 CONVERSATIONS & MESSAGES (Assistente Educacional Respira)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- 1.7 APP DEVICES (Dispositivos conectados)
create table if not exists public.app_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  device_name text not null,
  device_type text not null default 'mobile' check (device_type in ('mobile', 'tablet', 'desktop', 'web')),
  ip_address text,
  last_active timestamptz not null default now(),
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  constraint unique_user_device unique (user_id, device_id)
);

-- 1.8 PUSH SUBSCRIPTIONS (Lembretes e notificações Web Push)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  timezone text not null default 'America/Sao_Paulo',
  preferred_time text not null default '20:30',
  frequency text not null default 'daily',
  days_of_week text[] not null default '{"domingo","segunda","terca","quarta","quinta","sexta","sabado"}',
  is_active boolean not null default true,
  device_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_user_push_endpoint unique (user_id, endpoint)
);

-- 1.9 TRUSTED CONTACTS (Contatos de emergência e suporte de confiança)
create table if not exists public.trusted_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  relationship text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.10 AUDIT LOGS (Auditoria de ações com IP mascarado)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  resource text not null,
  details jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 2. TRIGGERS AUTOMÁTICOS
-- =====================================================================

-- 2.1 Trigger para criar Perfil e Preferências automaticamente ao cadastrar em auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Inserir Perfil
  insert into public.profiles (
    id,
    full_name,
    display_name,
    personalized_suggestions_consent,
    terms_accepted_at,
    privacy_accepted_at,
    onboarding_completed,
    created_at,
    updated_at
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'personalized_suggestions_consent')::boolean, false),
    coalesce((new.raw_user_meta_data->>'terms_accepted_at')::timestamptz, now()),
    coalesce((new.raw_user_meta_data->>'privacy_accepted_at')::timestamptz, now()),
    false,
    now(),
    now()
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    display_name = coalesce(excluded.display_name, profiles.display_name),
    updated_at = now();

  -- Inserir Preferências padrão
  insert into public.user_preferences (
    user_id,
    theme,
    daily_reminder,
    reminder_time,
    sound_enabled,
    vibration_enabled,
    created_at,
    updated_at
  ) values (
    new.id,
    'light',
    true,
    '20:30',
    true,
    true,
    now(),
    now()
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================================
-- 3. HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.mood_entries enable row level security;
alter table public.practice_progress enable row level security;
alter table public.article_progress enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.app_devices enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.trusted_contacts enable row level security;
alter table public.audit_logs enable row level security;

-- =====================================================================
-- 4. POLÍTICAS RLS ESTRITAS (ISOLAMENTO TOTAL POR USUÁRIO)
-- =====================================================================

-- 4.1 PROFILES
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- 4.2 USER PREFERENCES
drop policy if exists "preferences_select_own" on public.user_preferences;
drop policy if exists "preferences_insert_own" on public.user_preferences;
drop policy if exists "preferences_update_own" on public.user_preferences;
drop policy if exists "preferences_delete_own" on public.user_preferences;

create policy "preferences_select_own" on public.user_preferences for select using (auth.uid() = user_id);
create policy "preferences_insert_own" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "preferences_update_own" on public.user_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "preferences_delete_own" on public.user_preferences for delete using (auth.uid() = user_id);

-- 4.3 MOOD ENTRIES
drop policy if exists "mood_select_own" on public.mood_entries;
drop policy if exists "mood_insert_own" on public.mood_entries;
drop policy if exists "mood_update_own" on public.mood_entries;
drop policy if exists "mood_delete_own" on public.mood_entries;
drop policy if exists "mood_entries_select_own" on public.mood_entries;
drop policy if exists "mood_entries_insert_own" on public.mood_entries;
drop policy if exists "mood_entries_update_own" on public.mood_entries;
drop policy if exists "mood_entries_delete_own" on public.mood_entries;

create policy "mood_entries_select_own" on public.mood_entries for select using (auth.uid() = user_id);
create policy "mood_entries_insert_own" on public.mood_entries for insert with check (auth.uid() = user_id);
create policy "mood_entries_update_own" on public.mood_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mood_entries_delete_own" on public.mood_entries for delete using (auth.uid() = user_id);

-- 4.4 PRACTICE PROGRESS
drop policy if exists "practice_select_own" on public.practice_progress;
drop policy if exists "practice_insert_own" on public.practice_progress;
drop policy if exists "practice_update_own" on public.practice_progress;
drop policy if exists "practice_delete_own" on public.practice_progress;

create policy "practice_select_own" on public.practice_progress for select using (auth.uid() = user_id);
create policy "practice_insert_own" on public.practice_progress for insert with check (auth.uid() = user_id);
create policy "practice_update_own" on public.practice_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "practice_delete_own" on public.practice_progress for delete using (auth.uid() = user_id);

-- 4.5 ARTICLE PROGRESS
drop policy if exists "article_select_own" on public.article_progress;
drop policy if exists "article_insert_own" on public.article_progress;
drop policy if exists "article_update_own" on public.article_progress;
drop policy if exists "article_delete_own" on public.article_progress;

create policy "article_select_own" on public.article_progress for select using (auth.uid() = user_id);
create policy "article_insert_own" on public.article_progress for insert with check (auth.uid() = user_id);
create policy "article_update_own" on public.article_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "article_delete_own" on public.article_progress for delete using (auth.uid() = user_id);

-- 4.6 CONVERSATIONS & MESSAGES
drop policy if exists "conversations_select_own" on public.conversations;
drop policy if exists "conversations_insert_own" on public.conversations;
drop policy if exists "conversations_update_own" on public.conversations;
drop policy if exists "conversations_delete_own" on public.conversations;

create policy "conversations_select_own" on public.conversations for select using (auth.uid() = user_id);
create policy "conversations_insert_own" on public.conversations for insert with check (auth.uid() = user_id);
create policy "conversations_update_own" on public.conversations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "conversations_delete_own" on public.conversations for delete using (auth.uid() = user_id);

drop policy if exists "messages_select_own" on public.messages;
drop policy if exists "messages_insert_own" on public.messages;
drop policy if exists "messages_delete_own" on public.messages;

create policy "messages_select_own" on public.messages for select using (auth.uid() = user_id);
create policy "messages_insert_own" on public.messages for insert with check (auth.uid() = user_id);
create policy "messages_delete_own" on public.messages for delete using (auth.uid() = user_id);

-- 4.7 APP DEVICES
drop policy if exists "devices_select_own" on public.app_devices;
drop policy if exists "devices_insert_own" on public.app_devices;
drop policy if exists "devices_update_own" on public.app_devices;
drop policy if exists "devices_delete_own" on public.app_devices;

create policy "devices_select_own" on public.app_devices for select using (auth.uid() = user_id);
create policy "devices_insert_own" on public.app_devices for insert with check (auth.uid() = user_id);
create policy "devices_update_own" on public.app_devices for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "devices_delete_own" on public.app_devices for delete using (auth.uid() = user_id);

-- 4.8 PUSH SUBSCRIPTIONS
drop policy if exists "push_select_own" on public.push_subscriptions;
drop policy if exists "push_insert_own" on public.push_subscriptions;
drop policy if exists "push_update_own" on public.push_subscriptions;
drop policy if exists "push_delete_own" on public.push_subscriptions;

create policy "push_select_own" on public.push_subscriptions for select using (auth.uid() = user_id);
create policy "push_insert_own" on public.push_subscriptions for insert with check (auth.uid() = user_id);
create policy "push_update_own" on public.push_subscriptions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "push_delete_own" on public.push_subscriptions for delete using (auth.uid() = user_id);

-- 4.9 TRUSTED CONTACTS
drop policy if exists "contacts_select_own" on public.trusted_contacts;
drop policy if exists "contacts_insert_own" on public.trusted_contacts;
drop policy if exists "contacts_update_own" on public.trusted_contacts;
drop policy if exists "contacts_delete_own" on public.trusted_contacts;

create policy "contacts_select_own" on public.trusted_contacts for select using (auth.uid() = user_id);
create policy "contacts_insert_own" on public.trusted_contacts for insert with check (auth.uid() = user_id);
create policy "contacts_update_own" on public.trusted_contacts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "contacts_delete_own" on public.trusted_contacts for delete using (auth.uid() = user_id);

-- 4.10 AUDIT LOGS
drop policy if exists "audit_select_own" on public.audit_logs;
drop policy if exists "audit_insert_own" on public.audit_logs;

create policy "audit_select_own" on public.audit_logs for select using (auth.uid() = user_id);
create policy "audit_insert_own" on public.audit_logs for insert with check (auth.uid() = user_id);

-- =====================================================================
-- 5. ÍNDICES DE ALTA PERFORMANCE
-- =====================================================================
create index if not exists idx_profiles_updated_at on public.profiles(updated_at desc);
create index if not exists idx_mood_entries_user_created_at on public.mood_entries(user_id, created_at desc);
create index if not exists idx_practice_progress_user_completed on public.practice_progress(user_id, completed_at desc);
create index if not exists idx_article_progress_user on public.article_progress(user_id, is_favorite, is_read);
create index if not exists idx_conversations_user_created on public.conversations(user_id, created_at desc);
create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at asc);
create index if not exists idx_push_user on public.push_subscriptions(user_id, is_active);
create index if not exists idx_audit_user_created on public.audit_logs(user_id, created_at desc);
