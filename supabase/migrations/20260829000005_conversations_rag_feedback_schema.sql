-- =====================================================================
-- RESPIRA DIGITAL HEALTH PLATFORM - MIGRATION 20260829000005
-- Tabelas de Conversas com IA, Mensagens, Preferências, Resumos e Feedback
-- =====================================================================

-- 1. TABELA DE CONVERSAS (SESSÕES DO CHAT)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nova conversa',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. TABELA DE MENSAGENS
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  action_text text,
  action_type text,
  action_payload text,
  is_emergency_alert boolean not null default false,
  feedback text check (feedback in ('helpful', 'unhelpful', null)),
  created_at timestamptz not null default now()
);

-- 3. TABELA DE RESUMOS DE CONVERSAS (MEMÓRIA RESUMIDA)
create table if not exists public.conversation_summaries (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  summary text not null,
  created_at timestamptz not null default now()
);

-- 4. TABELA DE PREFERÊNCIAS DE IA DO USUÁRIO
create table if not exists public.user_ai_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  memory_enabled boolean not null default true,
  retention_days integer not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. TABELA DE FEEDBACK DETALHADO DE RESPOSTAS
create table if not exists public.message_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating text not null check (rating in ('helpful', 'unhelpful')),
  feedback_text text,
  created_at timestamptz not null default now()
);

-- HABILITAR RLS EM TODAS AS TABELAS
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_summaries enable row level security;
alter table public.user_ai_preferences enable row level security;
alter table public.message_feedback enable row level security;

-- POLÍTICAS RLS (ACESSO RESTRITO AO PRÓPRIO USUÁRIO)
drop policy if exists "Users can manage their own conversations" on public.conversations;
create policy "Users can manage their own conversations"
  on public.conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own messages" on public.messages;
create policy "Users can manage their own messages"
  on public.messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own summaries" on public.conversation_summaries;
create policy "Users can manage their own summaries"
  on public.conversation_summaries for all
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can manage their AI preferences" on public.user_ai_preferences;
create policy "Users can manage their AI preferences"
  on public.user_ai_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can submit message feedback" on public.message_feedback;
create policy "Users can submit message feedback"
  on public.message_feedback for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
