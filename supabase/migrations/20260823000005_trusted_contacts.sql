-- =====================================================================
-- RESPIRA DIGITAL HEALTH PLATFORM - TRUSTED CONTACTS MIGRATION (05)
-- Version: 20260823000005
-- Description: Trusted contacts table with RLS, encryption support,
-- and cascade deletion on user account removal.
-- =====================================================================

create table if not exists public.trusted_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relationship text not null default 'Outro',
  phone_masked text not null,
  phone_encrypted text not null,
  allow_call boolean not null default true,
  allow_message boolean not null default true,
  contact_is_aware boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Performance index
create index if not exists idx_trusted_contacts_user_id on public.trusted_contacts(user_id);

-- Enable RLS
alter table public.trusted_contacts enable row level security;

-- Strict RLS Policies (auth.uid() = user_id)
create policy "trusted_contacts_select_own" on public.trusted_contacts
  for select to authenticated
  using (auth.uid() = user_id);

create policy "trusted_contacts_insert_own" on public.trusted_contacts
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "trusted_contacts_update_own" on public.trusted_contacts
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "trusted_contacts_delete_own" on public.trusted_contacts
  for delete to authenticated
  using (auth.uid() = user_id);

-- Updated at trigger
create or replace trigger set_trusted_contacts_updated_at
  before update on public.trusted_contacts
  for each row execute function public.handle_updated_at();
