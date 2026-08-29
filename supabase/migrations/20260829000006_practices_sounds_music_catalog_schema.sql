-- ============================================================================
-- Migration: 20260829000006_practices_sounds_music_catalog_schema.sql
-- Description: Tabelas e RLS para favoritos e histórico de práticas, sons e músicas
-- ============================================================================

create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  item_type text not null check (item_type in ('practice', 'soundscape', 'music', 'article')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_item_type_unique unique (user_id, item_id, item_type)
);

create index if not exists idx_user_favorites_user_type on public.user_favorites(user_id, item_type, is_active);

create table if not exists public.audio_playback_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  audio_id text not null,
  audio_type text not null check (audio_type in ('soundscape', 'music', 'practice')),
  title text not null,
  duration_seconds integer,
  last_position_seconds integer default 0,
  completed boolean default false,
  played_at timestamptz not null default now()
);

create index if not exists idx_audio_history_user on public.audio_playback_history(user_id, played_at desc);

-- RLS
alter table public.user_favorites enable row level security;
alter table public.audio_playback_history enable row level security;

create policy "Users can manage their own favorites"
  on public.user_favorites
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their playback history"
  on public.audio_playback_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
