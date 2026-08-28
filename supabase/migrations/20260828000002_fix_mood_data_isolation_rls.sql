-- =====================================================================
-- RESPIRA DIGITAL HEALTH PLATFORM - SUPABASE RLS HARDENING MIGRATION
-- Version: 20260828000002
-- Description: Strict RLS policies for mood_entries and push_subscriptions
-- =====================================================================

-- 1. MOOD ENTRIES RLS HARDENING
alter table public.mood_entries enable row level security;

drop policy if exists "select_own_entries" on public.mood_entries;
drop policy if exists "insert_own_entries" on public.mood_entries;
drop policy if exists "update_own_entries" on public.mood_entries;
drop policy if exists "delete_own_entries" on public.mood_entries;
drop policy if exists "mood_entries_select_own" on public.mood_entries;
drop policy if exists "mood_entries_insert_own" on public.mood_entries;
drop policy if exists "mood_entries_update_own" on public.mood_entries;
drop policy if exists "mood_entries_delete_own" on public.mood_entries;

create policy "select_own_entries"
on public.mood_entries for select
using (auth.uid() = user_id);

create policy "insert_own_entries"
on public.mood_entries for insert
with check (auth.uid() = user_id);

create policy "update_own_entries"
on public.mood_entries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "delete_own_entries"
on public.mood_entries for delete
using (auth.uid() = user_id);

-- 2. PUSH SUBSCRIPTIONS TABLE & RLS
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  reminder_time text default '18:00',
  selected_days integer[] default array[1,2,3,4,5,6,0],
  daily_reminder_enabled boolean default true,
  micro_pauses_enabled boolean default false,
  micro_pauses_interval_hours integer default 4,
  timezone text default 'America/Sao_Paulo',
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subs_select_own" on public.push_subscriptions;
drop policy if exists "push_subs_insert_own" on public.push_subscriptions;
drop policy if exists "push_subs_update_own" on public.push_subscriptions;
drop policy if exists "push_subs_delete_own" on public.push_subscriptions;

create policy "push_subs_select_own"
on public.push_subscriptions for select
using (auth.uid() = user_id);

create policy "push_subs_insert_own"
on public.push_subscriptions for insert
with check (auth.uid() = user_id);

create policy "push_subs_update_own"
on public.push_subscriptions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "push_subs_delete_own"
on public.push_subscriptions for delete
using (auth.uid() = user_id);

-- Index for fast user lookup
create index if not exists idx_mood_entries_user_date on public.mood_entries(user_id, created_at desc);
create index if not exists idx_push_subs_user on public.push_subscriptions(user_id);
