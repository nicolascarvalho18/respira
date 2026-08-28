-- =====================================================================
-- RESPIRA DIGITAL HEALTH PLATFORM - SUPABASE SCHEMA MIGRATION (01)
-- Version: 20260823000001
-- Description: Core tables, constraints, foreign keys, and indexes.
-- =====================================================================

-- 1. PROFILES (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Nicolas Carvalho',
  display_name text not null default 'Nicolas Carvalho',
  bio text,
  avatar_url text,
  phone text,
  birth_date date,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. USER PREFERENCES
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  reduce_motion boolean not null default false,
  haptic_feedback boolean not null default true,
  guided_voice boolean not null default true,
  soundscape_volume integer not null default 70 check (soundscape_volume between 0 and 100),
  voice_volume integer not null default 80 check (voice_volume between 0 and 100),
  daily_reminder_enabled boolean not null default true,
  daily_reminder_time time not null default '20:30',
  micro_pauses_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. MOOD ENTRIES (Humor e Ansiedade diários)
create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood_score integer not null check (mood_score between 1 and 5),
  anxiety_score integer not null check (anxiety_score between 0 and 10),
  emotions text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. PRACTICE PROGRESS (Exercícios de respiração, sons e ancoragem)
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

-- 5. ARTICLE PROGRESS (Leitura e favoritos de artigos educativos)
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

-- 6. CONVERSATIONS (Diálogo com assistente educacional de acolhimento)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. MESSAGES (Mensagens da conversa)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- 8. APP DEVICES (Registro de dispositivos do usuário)
create table if not exists public.app_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  device_name text not null,
  device_type text not null default 'mobile' check (device_type in ('mobile', 'tablet', 'desktop', 'web')),
  browser text,
  operating_system text,
  user_agent text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  is_current boolean not null default true,
  revoked_at timestamptz,
  constraint unique_user_device unique (user_id, device_id)
);

-- 9. AUDIT EVENTS (Eventos de segurança sem senhas ou tokens)
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- PERFORMANCE & INTEGRITY INDEXES
-- =====================================================================
create index if not exists idx_profiles_created_at on public.profiles(created_at);
create index if not exists idx_user_preferences_user_id on public.user_preferences(user_id);
create index if not exists idx_mood_entries_user_id_created on public.mood_entries(user_id, created_at desc);
create index if not exists idx_practice_progress_user_id on public.practice_progress(user_id, completed_at desc);
create index if not exists idx_article_progress_user_id on public.article_progress(user_id);
create index if not exists idx_article_progress_fav on public.article_progress(user_id, is_favorite) where is_favorite = true;
create index if not exists idx_conversations_user_id on public.conversations(user_id, updated_at desc);
create index if not exists idx_messages_conv_id on public.messages(conversation_id, created_at asc);
create index if not exists idx_app_devices_user_id on public.app_devices(user_id, last_seen_at desc);
create index if not exists idx_audit_events_user_id on public.audit_events(user_id, created_at desc);
