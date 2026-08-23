-- =====================================================================
-- RESPIRA DIGITAL HEALTH PLATFORM - SECURITY ADVISOR HARDENING (04)
-- Version: 20260823000004
-- Description: Security hardening for SECURITY DEFINER functions,
-- search_path isolation (SET search_path = ''), permission revocation
-- from public/anon, and performance index optimizations.
-- =====================================================================

-- 1. HARDENED handle_updated_at FUNCTION (Isolated search_path)
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

-- Restrict function execution permissions
revoke all on function public.handle_updated_at() from public, anon;
grant execute on function public.handle_updated_at() to authenticated, service_role, postgres;

-- =====================================================================
-- 2. HARDENED handle_new_user FUNCTION (Zero search_path injection)
-- =====================================================================
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
  -- 1. Sanitize display name safely from raw metadata without trusting dynamic values
  v_default_name := pg_catalog.coalesce(
    pg_catalog.nullif(pg_catalog.trim(new.raw_user_meta_data->>'name'), ''),
    pg_catalog.nullif(pg_catalog.trim(new.raw_user_meta_data->>'full_name'), ''),
    pg_catalog.split_part(new.email, '@', 1),
    'Usuário'
  );

  v_avatar_url := pg_catalog.nullif(pg_catalog.trim(new.raw_user_meta_data->>'avatar_url'), '');
  v_provider := pg_catalog.coalesce(new.raw_app_meta_data->>'provider', 'email');

  -- 2. Insert into public.profiles (Idempotent)
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
    v_default_name,
    v_avatar_url,
    false,
    pg_catalog.now(),
    pg_catalog.now()
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    updated_at = pg_catalog.now();

  -- 3. Insert into public.user_preferences (Idempotent)
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
    pg_catalog.now(),
    pg_catalog.now()
  )
  on conflict (user_id) do nothing;

  -- 4. Record sanitized security audit event
  insert into public.audit_events (
    user_id,
    event_type,
    metadata,
    created_at
  )
  values (
    new.id,
    'user_registered',
    pg_catalog.jsonb_build_object(
      'provider', v_provider,
      'created_at', pg_catalog.now()
    ),
    pg_catalog.now()
  );

  return new;
exception
  when others then
    -- Non-blocking logging to guarantee signup is not rejected on minor metadata anomalies
    raise warning 'Notice in handle_new_user for user %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- Restrict handle_new_user execution exclusively to auth triggers and internal admin
revoke all on function public.handle_new_user() from public, anon;
grant execute on function public.handle_new_user() to supabase_auth_admin, service_role, postgres;

-- =====================================================================
-- 3. HARDENED log_security_audit_event FUNCTION (Isolated search_path)
-- =====================================================================
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
    insert into public.audit_events (
      user_id,
      event_type,
      metadata,
      created_at
    )
    values (
      v_uid,
      p_event_type,
      p_metadata,
      pg_catalog.now()
    );
  end if;
end;
$$;

-- Restrict log_security_audit_event to authenticated users
revoke all on function public.log_security_audit_event(text, jsonb) from public, anon;
grant execute on function public.log_security_audit_event(text, jsonb) to authenticated, service_role, postgres;

-- =====================================================================
-- 4. PERFORMANCE ADVISOR INDEXES
-- =====================================================================
create index if not exists idx_messages_user_id on public.messages(user_id);
create index if not exists idx_practice_progress_practice_id on public.practice_progress(practice_id);
create index if not exists idx_article_progress_article_id on public.article_progress(article_id);
