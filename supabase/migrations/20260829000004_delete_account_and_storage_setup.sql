-- =====================================================================
-- RESPIRA DIGITAL HEALTH PLATFORM - MIGRATION 20260829000004
-- Exclusão Segura de Conta (RPC) & Configuração do Supabase Storage Avatars
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. FUNÇÃO RPC PARA EXCLUSÃO DEFINITIVA DA CONTA (SECURITY DEFINER)
-- ---------------------------------------------------------------------

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requesting_user_id uuid;
begin
  -- Identifica o usuário autenticado pela sessão atual do JWT
  requesting_user_id := auth.uid();
  
  if requesting_user_id is null then
    raise exception 'Não autorizado. Faça login primeiro para excluir sua conta.';
  end if;

  -- 1. Excluir registros das tabelas públicas do usuário
  delete from public.mood_entries where user_id = requesting_user_id;
  delete from public.practice_progress where user_id = requesting_user_id;
  delete from public.article_progress where user_id = requesting_user_id;
  delete from public.messages where user_id = requesting_user_id;
  delete from public.conversations where user_id = requesting_user_id;
  delete from public.app_devices where user_id = requesting_user_id;
  delete from public.push_subscriptions where user_id = requesting_user_id;
  delete from public.trusted_contacts where user_id = requesting_user_id;
  delete from public.user_preferences where user_id = requesting_user_id;
  delete from public.audit_logs where user_id = requesting_user_id;
  delete from public.profiles where id = requesting_user_id;

  -- 2. Excluir usuário do auth.users
  delete from auth.users where id = requesting_user_id;
end;
$$;

-- Permitir que usuários autenticados chamem sua própria exclusão
grant execute on function public.delete_user_account() to authenticated;

-- ---------------------------------------------------------------------
-- 2. CRIAÇÃO E CONFIGURAÇÃO DO BUCKET 'avatars' NO STORAGE
-- ---------------------------------------------------------------------

-- Cria o bucket 'avatars' público se ainda não existir
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Políticas de Acesso RLS para o Storage
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
drop policy if exists "Users can upload their own avatar." on storage.objects;
drop policy if exists "Users can update their own avatar." on storage.objects;
drop policy if exists "Users can delete their own avatar." on storage.objects;

-- Leitura pública de avatares
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Upload restrito à pasta do próprio usuário (ex: avatars/{userId}/avatar.jpg)
create policy "Users can upload their own avatar."
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' 
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Atualização da própria foto
create policy "Users can update their own avatar."
  on storage.objects for update
  using (
    bucket_id = 'avatars' 
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Remoção da própria foto
create policy "Users can delete their own avatar."
  on storage.objects for delete
  using (
    bucket_id = 'avatars' 
    and (auth.uid())::text = (storage.foldername(name))[1]
  );
