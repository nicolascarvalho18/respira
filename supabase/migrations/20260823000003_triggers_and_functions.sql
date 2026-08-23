-- =====================================================================
-- RESPIRA DIGITAL HEALTH PLATFORM - TRIGGERS & FUNCTIONS MIGRATION (03)
-- Version: 20260823000003
-- Description: Automatic user provisioning trigger, updated_at handlers,
-- and secure account deletion procedures.
-- =====================================================================

-- 1. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach updated_at triggers
create or replace trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create or replace trigger set_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.handle_updated_at();

create or replace trigger set_mood_updated_at
  before update on public.mood_entries
  for each row execute function public.handle_updated_at();

create or replace trigger set_practice_updated_at
  before update on public.practice_progress
  for each row execute function public.handle_updated_at();

create or replace trigger set_article_updated_at
  before update on public.article_progress
  for each row execute function public.handle_updated_at();

create or replace trigger set_conversations_updated_at
  before update on public.conversations
  for each row execute function public.handle_updated_at();

-- =====================================================================
-- 2. AUTOMATIC USER PROVISIONING TRIGGER (auth.users -> profiles + user_preferences)
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  default_name text;
begin
  -- Sanitize and extract display name
  default_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1),
    'Usuário'
  );

  -- Create profile record
  insert into public.profiles (
    id,
    display_name,
    avatar_url,
    onboarding_completed,
    created_at,
    updated_at
  )
  values (
    new.id,
    default_name,
    nullif(trim(new.raw_user_meta_data->>'avatar_url'), ''),
    false,
    now(),
    now()
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    updated_at = now();

  -- Create user preferences
  insert into public.user_preferences (
    user_id,
    theme,
    reduce_motion,
    haptic_feedback,
    guided_voice,
    soundscape_volume,
    voice_volume,
    daily_reminder_enabled,
    daily_reminder_time,
    micro_pauses_enabled,
    created_at,
    updated_at
  )
  values (
    new.id,
    'light',
    false,
    true,
    true,
    70,
    80,
    true,
    '20:30',
    false,
    now(),
    now()
  )
  on conflict (user_id) do nothing;

  -- Record audit event
  insert into public.audit_events (
    user_id,
    event_type,
    metadata,
    created_at
  )
  values (
    new.id,
    'user_registered',
    jsonb_build_object(
      'provider', coalesce(new.raw_app_meta_data->>'provider', 'email'),
      'created_at', now()
    ),
    now()
  );

  return new;
exception
  when others then
    -- Never block signup on auxiliary errors, but log
    raise warning 'Error in handle_new_user for %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- Bind trigger to auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 3. AUDIT LOGGING HELPER FUNCTION
-- =====================================================================
create or replace function public.log_security_audit_event(
  p_event_type text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is not null then
    insert into public.audit_events (
      user_id,
      event_type,
      metadata,
      created_at
    )
    values (
      auth.uid(),
      p_event_type,
      p_metadata,
      now()
    );
  end if;
end;
$$;
