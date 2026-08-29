-- =====================================================================
-- RESPIRA DIGITAL HEALTH PLATFORM - MOOD ENTRIES SCHEMA & RLS MIGRATION
-- Version: 20260829000001
-- Description: Ensure all columns, indexes and strict RLS on mood_entries
-- =====================================================================

-- 1. Ensure table and columns exist
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

-- Add columns if table already existed without them
alter table public.mood_entries add column if not exists activities text[] default '{}';
alter table public.mood_entries add column if not exists planned_exercises jsonb default '[]'::jsonb;
alter table public.mood_entries add column if not exists notes text;

-- 2. Enable RLS
alter table public.mood_entries enable row level security;

-- 3. Reset policies to ensure strict auth.uid() isolation
drop policy if exists "select_own_entries" on public.mood_entries;
drop policy if exists "insert_own_entries" on public.mood_entries;
drop policy if exists "update_own_entries" on public.mood_entries;
drop policy if exists "delete_own_entries" on public.mood_entries;
drop policy if exists "mood_entries_select_own" on public.mood_entries;
drop policy if exists "mood_entries_insert_own" on public.mood_entries;
drop policy if exists "mood_entries_update_own" on public.mood_entries;
drop policy if exists "mood_entries_delete_own" on public.mood_entries;

create policy "mood_entries_select_own"
on public.mood_entries for select
using (auth.uid() = user_id);

create policy "mood_entries_insert_own"
on public.mood_entries for insert
with check (auth.uid() = user_id);

create policy "mood_entries_update_own"
on public.mood_entries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "mood_entries_delete_own"
on public.mood_entries for delete
using (auth.uid() = user_id);

-- 4. Index for fast queries
create index if not exists idx_mood_entries_user_created_at
on public.mood_entries(user_id, created_at desc);
