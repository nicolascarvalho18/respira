-- =====================================================================
-- RESPIRA DIGITAL HEALTH PLATFORM - SUPABASE RLS POLICIES MIGRATION (02)
-- Version: 20260823000002
-- Description: Row Level Security (RLS) policies and Storage bucket setup.
-- =====================================================================

-- 1. ENABLE RLS ON ALL PUBLIC USER TABLES
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.mood_entries enable row level security;
alter table public.practice_progress enable row level security;
alter table public.article_progress enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.app_devices enable row level security;
alter table public.audit_events enable row level security;

-- =====================================================================
-- 2. RLS POLICIES FOR PROFILES (auth.uid() = id)
-- =====================================================================
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own" on public.profiles
  for delete to authenticated
  using (auth.uid() = id);

-- =====================================================================
-- 3. RLS POLICIES FOR USER PREFERENCES (auth.uid() = user_id)
-- =====================================================================
create policy "user_preferences_select_own" on public.user_preferences
  for select to authenticated
  using (auth.uid() = user_id);

create policy "user_preferences_insert_own" on public.user_preferences
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_preferences_update_own" on public.user_preferences
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_preferences_delete_own" on public.user_preferences
  for delete to authenticated
  using (auth.uid() = user_id);

-- =====================================================================
-- 4. RLS POLICIES FOR MOOD ENTRIES (auth.uid() = user_id)
-- =====================================================================
create policy "mood_entries_select_own" on public.mood_entries
  for select to authenticated
  using (auth.uid() = user_id);

create policy "mood_entries_insert_own" on public.mood_entries
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "mood_entries_update_own" on public.mood_entries
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "mood_entries_delete_own" on public.mood_entries
  for delete to authenticated
  using (auth.uid() = user_id);

-- =====================================================================
-- 5. RLS POLICIES FOR PRACTICE PROGRESS (auth.uid() = user_id)
-- =====================================================================
create policy "practice_progress_select_own" on public.practice_progress
  for select to authenticated
  using (auth.uid() = user_id);

create policy "practice_progress_insert_own" on public.practice_progress
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "practice_progress_update_own" on public.practice_progress
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "practice_progress_delete_own" on public.practice_progress
  for delete to authenticated
  using (auth.uid() = user_id);

-- =====================================================================
-- 6. RLS POLICIES FOR ARTICLE PROGRESS (auth.uid() = user_id)
-- =====================================================================
create policy "article_progress_select_own" on public.article_progress
  for select to authenticated
  using (auth.uid() = user_id);

create policy "article_progress_insert_own" on public.article_progress
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "article_progress_update_own" on public.article_progress
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "article_progress_delete_own" on public.article_progress
  for delete to authenticated
  using (auth.uid() = user_id);

-- =====================================================================
-- 7. RLS POLICIES FOR CONVERSATIONS & MESSAGES (auth.uid() = user_id)
-- =====================================================================
create policy "conversations_select_own" on public.conversations
  for select to authenticated
  using (auth.uid() = user_id);

create policy "conversations_insert_own" on public.conversations
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "conversations_update_own" on public.conversations
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "conversations_delete_own" on public.conversations
  for delete to authenticated
  using (auth.uid() = user_id);

create policy "messages_select_own" on public.messages
  for select to authenticated
  using (auth.uid() = user_id);

create policy "messages_insert_own" on public.messages
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "messages_delete_own" on public.messages
  for delete to authenticated
  using (auth.uid() = user_id);

-- =====================================================================
-- 8. RLS POLICIES FOR APP DEVICES & AUDIT EVENTS
-- =====================================================================
create policy "app_devices_select_own" on public.app_devices
  for select to authenticated
  using (auth.uid() = user_id);

create policy "app_devices_insert_own" on public.app_devices
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "app_devices_update_own" on public.app_devices
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "app_devices_delete_own" on public.app_devices
  for delete to authenticated
  using (auth.uid() = user_id);

create policy "audit_events_select_own" on public.audit_events
  for select to authenticated
  using (auth.uid() = user_id);

create policy "audit_events_insert_own" on public.audit_events
  for insert to authenticated
  with check (auth.uid() = user_id);

-- =====================================================================
-- 9. SUPABASE STORAGE BUCKET & POLICIES (avatars/{user_id}/*)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  5242880, -- 5 MB limit
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
