import fs from 'fs';
import path from 'path';
import { ALL_ARTICLES } from '../src/data/articles';
import { MOCK_PRACTICES } from '../src/mocks/practices.mock';

function escapeSqlString(str: string): string {
  if (!str) return "''";
  return `'${str.replace(/'/g, "''")}'`;
}

function escapeSqlArray(arr?: string[]): string {
  if (!arr || arr.length === 0) return "'{}'::text[]";
  const escapedItems = arr.map((item) => `"${item.replace(/"/g, '\\"')}"`).join(',');
  return `'${escapedItems}'::text[]`;
}

let sql = `-- =====================================================================
-- RESPIRA DIGITAL HEALTH PLATFORM - MASTER SUPABASE DATABASE SETUP
-- Description: Complete 1-Click Database Setup containing:
-- 1. All 11 PostgreSQL relational tables
-- 2. Complete Row Level Security (RLS) policies
-- 3. Storage bucket 'avatars' with secure user-folder access rules
-- 4. Hardened triggers (handle_new_user, handle_updated_at, log_security_audit_event)
-- 5. Complete seed of all 40 full articles and all mental health practices
-- =====================================================================

-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. SCHEMAS & TABLES
-- =====================================================================

-- 1.1 PROFILES (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Usuário',
  avatar_url text,
  phone text,
  birth_date date,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.2 USER PREFERENCES
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

-- 1.3 MOOD ENTRIES
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

-- 1.4 PRACTICE PROGRESS
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

-- 1.5 ARTICLE PROGRESS
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

-- 1.6 CONVERSATIONS
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.7 MESSAGES
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- 1.8 APP DEVICES
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

-- 1.9 AUDIT EVENTS
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 1.10 ARTICLES (Full Educational Library)
create table if not exists public.articles (
  id text primary key,
  slug text not null unique,
  title text not null,
  summary text not null,
  content text not null,
  category text not null,
  category_name text,
  reading_time_minutes integer not null default 5,
  keywords text[] default '{}',
  tags text[] default '{}',
  related_article_ids text[] default '{}',
  author text default 'Equipe de Psicologia Respira',
  reviewed_by text default 'Dra. Camila Nogueira (CRP 06/142980)',
  status text not null default 'published',
  published_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 1.11 PRACTICES (Breathing, Soundscapes & Grounding)
create table if not exists public.practices (
  id text primary key,
  title text not null,
  subtitle text,
  description text not null,
  category text not null,
  duration_minutes integer not null default 5,
  level text not null default 'Iniciante',
  icon text not null default 'wind',
  instructions text[] default '{}',
  breathing_config jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================================
-- 2. INDEXES
-- =====================================================================
create index if not exists idx_profiles_created_at on public.profiles(created_at);
create index if not exists idx_user_preferences_user_id on public.user_preferences(user_id);
create index if not exists idx_mood_entries_user_id_created on public.mood_entries(user_id, created_at desc);
create index if not exists idx_practice_progress_user_id on public.practice_progress(user_id, completed_at desc);
create index if not exists idx_article_progress_user_id on public.article_progress(user_id);
create index if not exists idx_article_progress_fav on public.article_progress(user_id, is_favorite) where is_favorite = true;
create index if not exists idx_conversations_user_id on public.conversations(user_id, updated_at desc);
create index if not exists idx_messages_conv_id on public.messages(conversation_id, created_at asc);
create index if not exists idx_messages_user_id on public.messages(user_id);
create index if not exists idx_app_devices_user_id on public.app_devices(user_id, last_seen_at desc);
create index if not exists idx_audit_events_user_id on public.audit_events(user_id, created_at desc);
create index if not exists idx_articles_category on public.articles(category);
create index if not exists idx_articles_slug on public.articles(slug);

-- =====================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.mood_entries enable row level security;
alter table public.practice_progress enable row level security;
alter table public.article_progress enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.app_devices enable row level security;
alter table public.audit_events enable row level security;
alter table public.articles enable row level security;
alter table public.practices enable row level security;

-- Public content read policies
create policy "articles_public_read" on public.articles for select using (true);
create policy "practices_public_read" on public.practices for select using (true);

-- User-specific private policies
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated using (auth.uid() = id);

create policy "user_preferences_select_own" on public.user_preferences for select to authenticated using (auth.uid() = user_id);
create policy "user_preferences_insert_own" on public.user_preferences for insert to authenticated with check (auth.uid() = user_id);
create policy "user_preferences_update_own" on public.user_preferences for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_preferences_delete_own" on public.user_preferences for delete to authenticated using (auth.uid() = user_id);

create policy "mood_entries_select_own" on public.mood_entries for select to authenticated using (auth.uid() = user_id);
create policy "mood_entries_insert_own" on public.mood_entries for insert to authenticated with check (auth.uid() = user_id);
create policy "mood_entries_update_own" on public.mood_entries for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mood_entries_delete_own" on public.mood_entries for delete to authenticated using (auth.uid() = user_id);

create policy "practice_progress_select_own" on public.practice_progress for select to authenticated using (auth.uid() = user_id);
create policy "practice_progress_insert_own" on public.practice_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "practice_progress_update_own" on public.practice_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "practice_progress_delete_own" on public.practice_progress for delete to authenticated using (auth.uid() = user_id);

create policy "article_progress_select_own" on public.article_progress for select to authenticated using (auth.uid() = user_id);
create policy "article_progress_insert_own" on public.article_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "article_progress_update_own" on public.article_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "article_progress_delete_own" on public.article_progress for delete to authenticated using (auth.uid() = user_id);

create policy "conversations_select_own" on public.conversations for select to authenticated using (auth.uid() = user_id);
create policy "conversations_insert_own" on public.conversations for insert to authenticated with check (auth.uid() = user_id);
create policy "conversations_update_own" on public.conversations for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "conversations_delete_own" on public.conversations for delete to authenticated using (auth.uid() = user_id);

create policy "messages_select_own" on public.messages for select to authenticated using (auth.uid() = user_id);
create policy "messages_insert_own" on public.messages for insert to authenticated with check (auth.uid() = user_id);
create policy "messages_delete_own" on public.messages for delete to authenticated using (auth.uid() = user_id);

create policy "app_devices_select_own" on public.app_devices for select to authenticated using (auth.uid() = user_id);
create policy "app_devices_insert_own" on public.app_devices for insert to authenticated with check (auth.uid() = user_id);
create policy "app_devices_update_own" on public.app_devices for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "app_devices_delete_own" on public.app_devices for delete to authenticated using (auth.uid() = user_id);

create policy "audit_events_select_own" on public.audit_events for select to authenticated using (auth.uid() = user_id);
create policy "audit_events_insert_own" on public.audit_events for insert to authenticated with check (auth.uid() = user_id);

-- =====================================================================
-- 4. STORAGE BUCKET & POLICIES (avatars/{user_id}/*)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

create policy "avatars_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
-- 5. HARDENED FUNCTIONS & TRIGGERS (SECURITY DEFINER with search_path = '')
-- =====================================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create or replace trigger set_profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
create or replace trigger set_preferences_updated_at before update on public.user_preferences for each row execute function public.handle_updated_at();
create or replace trigger set_mood_updated_at before update on public.mood_entries for each row execute function public.handle_updated_at();
create or replace trigger set_practice_updated_at before update on public.practice_progress for each row execute function public.handle_updated_at();
create or replace trigger set_article_updated_at before update on public.article_progress for each row execute function public.handle_updated_at();
create or replace trigger set_conversations_updated_at before update on public.conversations for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_default_name text;
  v_avatar_url text;
  v_provider text;
begin
  v_default_name := pg_catalog.coalesce(
    pg_catalog.nullif(pg_catalog.trim(new.raw_user_meta_data->>'name'), ''),
    pg_catalog.nullif(pg_catalog.trim(new.raw_user_meta_data->>'full_name'), ''),
    pg_catalog.split_part(new.email, '@', 1),
    'Usuário'
  );

  v_avatar_url := pg_catalog.nullif(pg_catalog.trim(new.raw_user_meta_data->>'avatar_url'), '');
  v_provider := pg_catalog.coalesce(new.raw_app_meta_data->>'provider', 'email');

  insert into public.profiles (id, display_name, avatar_url, onboarding_completed, created_at, updated_at)
  values (new.id, v_default_name, v_avatar_url, false, pg_catalog.now(), pg_catalog.now())
  on conflict (id) do update set display_name = excluded.display_name, updated_at = pg_catalog.now();

  insert into public.user_preferences (user_id, theme, reduce_motion, haptic_feedback, guided_voice, soundscape_volume, voice_volume, daily_reminder_enabled, daily_reminder_time, micro_pauses_enabled, created_at, updated_at)
  values (new.id, 'light', false, true, true, 70, 80, true, '20:30', false, pg_catalog.now(), pg_catalog.now())
  on conflict (user_id) do nothing;

  insert into public.audit_events (user_id, event_type, metadata, created_at)
  values (new.id, 'user_registered', pg_catalog.jsonb_build_object('provider', v_provider, 'created_at', pg_catalog.now()), pg_catalog.now());

  return new;
exception
  when others then
    return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon;
grant execute on function public.handle_new_user() to supabase_auth_admin, service_role, postgres;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.log_security_audit_event(
  p_event_type text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is not null then
    insert into public.audit_events (user_id, event_type, metadata, created_at)
    values (v_uid, p_event_type, p_metadata, pg_catalog.now());
  end if;
end;
$$;

revoke all on function public.log_security_audit_event(text, jsonb) from public, anon;
grant execute on function public.log_security_audit_event(text, jsonb) to authenticated, service_role, postgres;

-- =====================================================================
-- 6. FULL SEED DATA: 40 EDUCATIONAL ARTICLES & PRACTICES
-- =====================================================================
`;

// Add 40 articles SQL
sql += `\n-- 6.1 Insert all 40 Full Articles\n`;
for (const art of ALL_ARTICLES) {
  sql += `insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  ${escapeSqlString(art.id)},
  ${escapeSqlString(art.slug)},
  ${escapeSqlString(art.title)},
  ${escapeSqlString(art.summary)},
  ${escapeSqlString(art.content || '')},
  ${escapeSqlString(art.category)},
  ${escapeSqlString(art.categoryName || art.category)},
  ${art.readingTimeMinutes || 5},
  ${escapeSqlArray(art.keywords)},
  ${escapeSqlArray(art.tags)},
  ${escapeSqlArray(art.relatedArticleIds)},
  ${escapeSqlString(art.author || 'Equipe de Psicologia Respira')},
  ${escapeSqlString(art.reviewedBy || 'Dra. Camila Nogueira (CRP 06/142980)')},
  ${escapeSqlString(art.publishedAt || '2026-08-20T08:00:00Z')}
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();\n\n`;
}

// Add practices SQL
sql += `\n-- 6.2 Insert all Practices\n`;
for (const prac of MOCK_PRACTICES) {
  const breathingJson = prac.breathingConfig ? `'${JSON.stringify(prac.breathingConfig)}'::jsonb` : 'null';
  sql += `insert into public.practices (id, title, subtitle, description, category, duration_minutes, level, icon, instructions, breathing_config)
values (
  ${escapeSqlString(prac.id)},
  ${escapeSqlString(prac.title)},
  ${escapeSqlString(prac.subtitle || '')},
  ${escapeSqlString(prac.description)},
  ${escapeSqlString(prac.category)},
  ${prac.durationMinutes},
  ${escapeSqlString(prac.level)},
  ${escapeSqlString(prac.icon || 'wind')},
  ${escapeSqlArray(prac.instructions)},
  ${breathingJson}
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = now();\n\n`;
}

const targetPath = path.join(__dirname, '../supabase/full_database_setup.sql');
fs.writeFileSync(targetPath, sql, 'utf-8');
console.log(`Successfully generated master Supabase setup script at: ${targetPath}`);
