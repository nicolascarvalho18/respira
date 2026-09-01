-- ============================================================================
-- Migration: 20260830000003_daily_exercises_and_user_favorites.sql
-- Description: Tabelas, RLS e índices para favoritos de usuários e progresso diário de exercícios
-- ============================================================================

-- 1. Tabela de Favoritos por Usuário
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

create index if not exists idx_user_favorites_lookup on public.user_favorites(user_id, item_type, is_active);

-- 2. Tabela de Progresso da Rotina Diária de Exercícios
create table if not exists public.daily_routine_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_date text not null, -- formato YYYY-MM-DD
  exercise_id text not null,
  exercise_type text not null check (exercise_type in ('breathing', 'mindfulness', 'mood_checkin')),
  status text not null check (status in ('not_started', 'in_progress', 'completed')) default 'not_started',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_daily_routine_unique unique (user_id, routine_date, exercise_id)
);

create index if not exists idx_daily_routine_user_date on public.daily_routine_progress(user_id, routine_date);

-- 3. Habilitar RLS (Row Level Security)
alter table public.user_favorites enable row level security;
alter table public.daily_routine_progress enable row level security;

-- 4. Políticas de Segurança RLS
drop policy if exists "Users can manage their own favorites" on public.user_favorites;
create policy "Users can manage their own favorites"
  on public.user_favorites
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their daily routine progress" on public.daily_routine_progress;
create policy "Users can manage their daily routine progress"
  on public.daily_routine_progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
