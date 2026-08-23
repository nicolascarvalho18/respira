-- =====================================================================
-- RESPIRA DIGITAL HEALTH PLATFORM - MASTER SUPABASE DATABASE SETUP
-- Description: Complete 1-Click Database Setup containing:
-- 1. All 11 PostgreSQL relational tables
-- 2. Complete Row Level Security (RLS) policies
-- 3. Storage bucket 'avatars' with secure user-folder access rules
-- 4. Hardened triggers (handle_new_user, handle_updated_at, log_security_audit_event)
-- 5. Complete seed of all 40 full articles and all mental health practices
-- =====================================================================

-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. SCHEMAS & TABLES
-- =====================================================================

-- 1.1 PROFILES (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Usuário',
  avatar_url text,
  phone text,
  birth_date date,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.2 USER PREFERENCES
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  reduce_motion boolean not null default false,
  haptic_feedback boolean not null default true,
  guided_voice boolean not null default true,
  soundscape_volume integer not null default 70 check (soundscape_volume between 0 and 100),
  voice_volume integer not null default 80 check (voice_volume between 0 and 100),
  daily_reminder_enabled boolean not null default true,
  daily_reminder_time time not null default '20:30',
  micro_pauses_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.3 MOOD ENTRIES
create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood_score integer not null check (mood_score between 1 and 5),
  anxiety_score integer not null check (anxiety_score between 0 and 10),
  emotions text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.4 PRACTICE PROGRESS
create table if not exists public.practice_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_id text not null,
  status text not null default 'completed' check (status in ('in_progress', 'completed', 'abandoned')),
  progress integer not null default 100 check (progress between 0 and 100),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.5 ARTICLE PROGRESS
create table if not exists public.article_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id text not null,
  progress integer not null default 0 check (progress between 0 and 100),
  last_position integer not null default 0,
  is_read boolean not null default false,
  is_favorite boolean not null default false,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_user_article_progress unique (user_id, article_id)
);

-- 1.6 CONVERSATIONS
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.7 MESSAGES
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- 1.8 APP DEVICES
create table if not exists public.app_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  device_name text not null,
  device_type text not null default 'mobile' check (device_type in ('mobile', 'tablet', 'desktop', 'web')),
  browser text,
  operating_system text,
  user_agent text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  is_current boolean not null default true,
  revoked_at timestamptz,
  constraint unique_user_device unique (user_id, device_id)
);

-- 1.9 AUDIT EVENTS
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 1.10 ARTICLES (Full Educational Library)
create table if not exists public.articles (
  id text primary key,
  slug text not null unique,
  title text not null,
  summary text not null,
  content text not null,
  category text not null,
  category_name text,
  reading_time_minutes integer not null default 5,
  keywords text[] default '{}',
  tags text[] default '{}',
  related_article_ids text[] default '{}',
  author text default 'Equipe de Psicologia Respira',
  reviewed_by text default 'Dra. Camila Nogueira (CRP 06/142980)',
  status text not null default 'published',
  published_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 1.11 PRACTICES (Breathing, Soundscapes & Grounding)
create table if not exists public.practices (
  id text primary key,
  title text not null,
  subtitle text,
  description text not null,
  category text not null,
  duration_minutes integer not null default 5,
  level text not null default 'Iniciante',
  icon text not null default 'wind',
  instructions text[] default '{}',
  breathing_config jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================================
-- 2. INDEXES
-- =====================================================================
create index if not exists idx_profiles_created_at on public.profiles(created_at);
create index if not exists idx_user_preferences_user_id on public.user_preferences(user_id);
create index if not exists idx_mood_entries_user_id_created on public.mood_entries(user_id, created_at desc);
create index if not exists idx_practice_progress_user_id on public.practice_progress(user_id, completed_at desc);
create index if not exists idx_article_progress_user_id on public.article_progress(user_id);
create index if not exists idx_article_progress_fav on public.article_progress(user_id, is_favorite) where is_favorite = true;
create index if not exists idx_conversations_user_id on public.conversations(user_id, updated_at desc);
create index if not exists idx_messages_conv_id on public.messages(conversation_id, created_at asc);
create index if not exists idx_messages_user_id on public.messages(user_id);
create index if not exists idx_app_devices_user_id on public.app_devices(user_id, last_seen_at desc);
create index if not exists idx_audit_events_user_id on public.audit_events(user_id, created_at desc);
create index if not exists idx_articles_category on public.articles(category);
create index if not exists idx_articles_slug on public.articles(slug);

-- =====================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.mood_entries enable row level security;
alter table public.practice_progress enable row level security;
alter table public.article_progress enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.app_devices enable row level security;
alter table public.audit_events enable row level security;
alter table public.articles enable row level security;
alter table public.practices enable row level security;

-- Public content read policies
create policy "articles_public_read" on public.articles for select using (true);
create policy "practices_public_read" on public.practices for select using (true);

-- User-specific private policies
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated using (auth.uid() = id);

create policy "user_preferences_select_own" on public.user_preferences for select to authenticated using (auth.uid() = user_id);
create policy "user_preferences_insert_own" on public.user_preferences for insert to authenticated with check (auth.uid() = user_id);
create policy "user_preferences_update_own" on public.user_preferences for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_preferences_delete_own" on public.user_preferences for delete to authenticated using (auth.uid() = user_id);

create policy "mood_entries_select_own" on public.mood_entries for select to authenticated using (auth.uid() = user_id);
create policy "mood_entries_insert_own" on public.mood_entries for insert to authenticated with check (auth.uid() = user_id);
create policy "mood_entries_update_own" on public.mood_entries for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mood_entries_delete_own" on public.mood_entries for delete to authenticated using (auth.uid() = user_id);

create policy "practice_progress_select_own" on public.practice_progress for select to authenticated using (auth.uid() = user_id);
create policy "practice_progress_insert_own" on public.practice_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "practice_progress_update_own" on public.practice_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "practice_progress_delete_own" on public.practice_progress for delete to authenticated using (auth.uid() = user_id);

create policy "article_progress_select_own" on public.article_progress for select to authenticated using (auth.uid() = user_id);
create policy "article_progress_insert_own" on public.article_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "article_progress_update_own" on public.article_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "article_progress_delete_own" on public.article_progress for delete to authenticated using (auth.uid() = user_id);

create policy "conversations_select_own" on public.conversations for select to authenticated using (auth.uid() = user_id);
create policy "conversations_insert_own" on public.conversations for insert to authenticated with check (auth.uid() = user_id);
create policy "conversations_update_own" on public.conversations for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "conversations_delete_own" on public.conversations for delete to authenticated using (auth.uid() = user_id);

create policy "messages_select_own" on public.messages for select to authenticated using (auth.uid() = user_id);
create policy "messages_insert_own" on public.messages for insert to authenticated with check (auth.uid() = user_id);
create policy "messages_delete_own" on public.messages for delete to authenticated using (auth.uid() = user_id);

create policy "app_devices_select_own" on public.app_devices for select to authenticated using (auth.uid() = user_id);
create policy "app_devices_insert_own" on public.app_devices for insert to authenticated with check (auth.uid() = user_id);
create policy "app_devices_update_own" on public.app_devices for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "app_devices_delete_own" on public.app_devices for delete to authenticated using (auth.uid() = user_id);

create policy "audit_events_select_own" on public.audit_events for select to authenticated using (auth.uid() = user_id);
create policy "audit_events_insert_own" on public.audit_events for insert to authenticated with check (auth.uid() = user_id);

-- =====================================================================
-- 4. STORAGE BUCKET & POLICIES (avatars/{user_id}/*)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  5242880,
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

-- =====================================================================
-- 5. HARDENED FUNCTIONS & TRIGGERS (SECURITY DEFINER with search_path = '')
-- =====================================================================
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

create or replace trigger set_profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
create or replace trigger set_preferences_updated_at before update on public.user_preferences for each row execute function public.handle_updated_at();
create or replace trigger set_mood_updated_at before update on public.mood_entries for each row execute function public.handle_updated_at();
create or replace trigger set_practice_updated_at before update on public.practice_progress for each row execute function public.handle_updated_at();
create or replace trigger set_article_updated_at before update on public.article_progress for each row execute function public.handle_updated_at();
create or replace trigger set_conversations_updated_at before update on public.conversations for each row execute function public.handle_updated_at();

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
  v_default_name := pg_catalog.coalesce(
    pg_catalog.nullif(pg_catalog.trim(new.raw_user_meta_data->>'name'), ''),
    pg_catalog.nullif(pg_catalog.trim(new.raw_user_meta_data->>'full_name'), ''),
    pg_catalog.split_part(new.email, '@', 1),
    'Usuário'
  );

  v_avatar_url := pg_catalog.nullif(pg_catalog.trim(new.raw_user_meta_data->>'avatar_url'), '');
  v_provider := pg_catalog.coalesce(new.raw_app_meta_data->>'provider', 'email');

  insert into public.profiles (id, display_name, avatar_url, onboarding_completed, created_at, updated_at)
  values (new.id, v_default_name, v_avatar_url, false, pg_catalog.now(), pg_catalog.now())
  on conflict (id) do update set display_name = excluded.display_name, updated_at = pg_catalog.now();

  insert into public.user_preferences (user_id, theme, reduce_motion, haptic_feedback, guided_voice, soundscape_volume, voice_volume, daily_reminder_enabled, daily_reminder_time, micro_pauses_enabled, created_at, updated_at)
  values (new.id, 'light', false, true, true, 70, 80, true, '20:30', false, pg_catalog.now(), pg_catalog.now())
  on conflict (user_id) do nothing;

  insert into public.audit_events (user_id, event_type, metadata, created_at)
  values (new.id, 'user_registered', pg_catalog.jsonb_build_object('provider', v_provider, 'created_at', pg_catalog.now()), pg_catalog.now());

  return new;
exception
  when others then
    return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon;
grant execute on function public.handle_new_user() to supabase_auth_admin, service_role, postgres;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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
    insert into public.audit_events (user_id, event_type, metadata, created_at)
    values (v_uid, p_event_type, p_metadata, pg_catalog.now());
  end if;
end;
$$;

revoke all on function public.log_security_audit_event(text, jsonb) from public, anon;
grant execute on function public.log_security_audit_event(text, jsonb) to authenticated, service_role, postgres;

-- =====================================================================
-- 6. FULL SEED DATA: 40 EDUCATIONAL ARTICLES & PRACTICES
-- =====================================================================

-- 6.1 Insert all 40 Full Articles
insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-ansiedade-1',
  'o-que-e-ansiedade-e-como-ela-funciona',
  'O que é ansiedade e como ela funciona',
  'Compreenda os mecanismos biológicos da ansiedade, por que o corpo reage em alerta e como transformar o medo em autoproteção equilibrada.',
  'A ansiedade é uma resposta biológica ancestral desenhada para garantir a sobrevivência humana diante de perigos reais. No entanto, na sociedade moderna repleta de estímulos contínuos, prazos e incertezas, esse alarme interno frequentemente dispara sem que haja uma ameaça física iminente.

Quando o cérebro interpreta uma situação como arriscada, a amígdala cerebral ativa instantaneamente o eixo hipotálamo-hipófise-adrenal, desencadeando a liberação de adrenalina e cortisol. Esse processo acelera os batimentos cardíacos, dilata as pupilas e redireciona o fluxo sanguíneo para os grandes músculos — a clássica resposta de luta ou fuga.

### Por que sentimos ansiedade mesmo quando estamos em segurança?
O cérebro humano tem uma capacidade extraordinária de simular cenários futuros. Essa mesma habilidade que nos permite planejar projetos e antecipar soluções pode, quando desregulada, projetar catástrofes improváveis. O sistema nervoso não distingue perfeitamente entre um predador real e um e-mail de cobrança urgente; a química corporal liberada é surpreendentemente similar.

No cotidiano, isso se manifesta como uma constante sensação de urgência, preocupação com conversas que ainda nem aconteceram ou a sensação persistente de que algo ruim está prestes a ocorrer, mesmo em um dia calmo em casa.

### Os três pilares da resposta ansiosa
Para lidar com a ansiedade com clareza, é fundamental reconhecer como ela se desdobra em três dimensões interligadas:
1. **Dimensão Fisiológica**: Taquicardia, respiração superficial pelo peito, tensão nos ombros e na mandíbula, mãos frias ou suor repentino.
2. **Dimensão Cognitiva**: Pensamentos acelerados em cadeia ("E se der tudo errado?", "Não vou dar conta"), dificuldade de concentração e hipervigilância.
3. **Dimensão Comportamental**: Evitação de tarefas importantes, checagem compulsiva de mensagens, inquietação motora e isolamento social.

### Quando o alarme vira um obstáculo
Sentir ansiedade antes de uma entrevista ou de uma viagem é natural e pode até melhorar o foco temporariamente. O problema surge quando esse estado de prontidão se torna crônico, permanecendo ligado por dias ou semanas sem intervalo de recuperação, desgastando a imunidade, o sono e as relações afetivas.

### Exercício Prático: O Reconhecimento Consciente (3 Minutos)
Quando perceber que o alarme da ansiedade disparou sem motivo real:
1. Coloque uma das mãos sobre o peito e a outra sobre o abdômen.
2. Diga mentalmente com gentileza: *"Meu corpo está tentando me proteger, mas neste exato momento estou em segurança."*
3. Inspire lentamente pelo nariz contando até 4, sentindo o abdômen expandir.
4. Solte o ar suavemente pela boca em 6 tempos, esvaziando os ombros.
5. Repita 5 vezes até que o ritmo cardíaco comece a desacelerar.

### Conclusão e Próximos Passos
A ansiedade não é uma fraqueza de caráter, mas um mecanismo fisiológico que precisa de aprendizado e regulação. Aprender a escutar seus sinais sem pânico é o primeiro passo para retomar o comando da sua rotina.

*Aviso: Este conteúdo é educativo. Se a ansiedade estiver prejudicando suas atividades cotidianas, consulte um psicólogo ou médico de sua confiança.*',
  'Ansiedade',
  'Ansiedade',
  5,
  '"ansiedade","sistema nervoso","alerta","luta ou fuga","biologia"'::text[],
  '"ansiedade","corpo","mente","educacao"'::text[],
  '"como-reconhecer-os-sinais-da-ansiedade","ansiedade-e-estresse-qual-e-a-diferenca","o-que-acontece-no-corpo-durante-uma-crise-de-ansiedade"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-ansiedade-2',
  'como-reconhecer-os-sinais-da-ansiedade',
  'Como reconhecer os sinais da ansiedade',
  'Aprenda a mapear os sintomas físicos, emocionais e comportamentais da ansiedade logo nos estágios iniciais antes que virem sobrecarga.',
  'Reconhecer os primeiros indícios de ansiedade é uma das habilidades mais valiosas para manter a estabilidade emocional. Muitas vezes, a ansiedade não começa com uma crise dramática, mas sim com pequenos sussurros corporais que tendemos a ignorar no meio da pressa diária.

Aprender a escutar esses sinais logo no início permite intervir antes que a sensação de sobrecarga se instale completamente.

### Sinais Físicos Silenciosos
O corpo costuma ser o primeiro a manifestar o acúmulo de tensão:
- **Mandíbula travada**: Apertar os dentes durante o dia ou acordar com dor na articulação têmporo-mandibular (bruxismo).
- **Elevação involuntária dos ombros**: Manter os ombros contraídos perto das orelhas sem perceber.
- **Alterações digestivas**: Sensação de "nó no estômago", digestão lenta ou queimação após pequenos desafios.
- **Respiração curta**: Respirar apenas com o terço superior do tórax, gerando sensação de falta de ar crônica.

### Sinais Emocionais e Psicológicos
Na esfera dos sentimentos, a ansiedade altera o filtro pelo qual enxergamos a realidade:
- **Irritabilidade desproporcional**: Perder a paciência com pequenos ruídos, atrasos ou imprevistos comuns.
- **Sensação constante de urgência**: Sentir que precisa correr mesmo quando não há nenhum prazo pendente.
- **Dificuldade de relaxar**: Sentir culpa ou inquietação ao tentar descansar no final do dia.
- **Pensamento em espiral**: Imaginar repetidamente o pior desfecho para situações banais.

### Sinais Comportamentais no Dia a Dia
No cotidiano prático, a ansiedade molda nossos hábitos:
- **Checagem compulsiva**: Olhar notificações do celular, e-mails ou aplicativos repetidamente sem real necessidade.
- **Procrastinação ansiosa**: Adiar o início de uma tarefa por medo implícito de não conseguir fazê-la com perfeição.
- **Uso excessivo de estimulantes**: Consumir mais café ou açúcar na tentativa de compensar a fadiga causada pela tensão interna.

### Exercício Prático: O Escaneamento dos 4 Pontos
Reserve 2 minutos no meio do seu dia para este mapeamento rápido:
1. **Ponto 1 (Mandíbula)**: Abra ligeiramente a boca, solte a língua do céu da boca e relaxe o maxilar.
2. **Ponto 2 (Ombros)**: Inspire profundamente e, ao expirar, deixe os ombros caírem 2 centímetros para baixo.
3. **Ponto 3 (Abdômen)**: Solte a barriga, permitindo que ela se expanda livremente com o ar.
4. **Ponto 4 (Pés)**: Sinta o contato firme dos pés com o chão e perceba a estabilidade da superfície.

### Conclusão
Identificar os sinais da ansiedade não serve para se julgar, mas para criar momentos intencionais de pausa e acolhimento. Seu corpo está apenas pedindo um instante de respiro.

*Aviso: Este conteúdo é educativo e não substitui diagnóstico clínico.*',
  'Ansiedade',
  'Ansiedade',
  5,
  '"sinais","sintomas","corpo","reconhecimento","autocuidado"'::text[],
  '"ansiedade","sintomas","prevencao"'::text[],
  '"o-que-e-ansiedade-e-como-ela-funciona","o-que-acontece-no-corpo-durante-uma-crise-de-ansiedade","como-acalmar-os-pensamentos-acelerados"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-ansiedade-3',
  'ansiedade-e-estresse-qual-e-a-diferenca',
  'Ansiedade e estresse: qual é a diferença?',
  'Entenda as distinções fundamentais entre a reação a pressões externas e a preocupação persistente interna para direcionar o cuidado certo.',
  'Embora os termos "estresse" e "ansiedade" sejam frequentemente usados como sinônimos na linguagem cotidiana, na psicologia e na neurociência eles representam processos distintos, ainda que intimamente conectados. Compreender a diferença é essencial para saber qual estratégia de autocuidado aplicar em cada momento.

O estresse é tipicamente uma reação a um estímulo externo claro, enquanto a ansiedade é uma resposta interna orientada ao futuro e que pode persistir mesmo na ausência de qualquer provocador imediato.

### O Estresse: A Resposta ao Presente
O estresse ocorre em resposta a uma demanda identificável do ambiente: uma entrega de projeto com prazo apertado, um desentendimento familiar ou uma mudança de residência.
- **Gatilho conhecido**: Você sabe exatamente de onde vem a pressão.
- **Temporalidade**: Tende a diminuir significativamente assim que o problema é resolvido ou o evento estressor passa.
- **Função**: Mobiliza energia e foco para superar um obstáculo concreto no presente.

### A Ansiedade: A Antecipação do Futuro
A ansiedade, por sua vez, é caracterizada por um estado de apreensão constante sobre o que ainda não aconteceu:
- **Gatilho difuso ou imaginário**: Ocorre mesmo quando tudo está aparentemente bem no ambiente.
- **Foco temporal**: Está sempre centrada no futuro ("E se...", "E quando...").
- **Persistência**: Continua ativa mesmo após a resolução dos problemas externos imediatos.

### Como eles interagem no cotidiano
Uma pessoa pode viver um período estressante de trabalho (estressor externo) e, a partir dele, desenvolver um padrão ansioso crônico, no qual passa a temer qualquer nova notificação ou e-mail, mesmo aos fins de semana. O estresse foi o gatilho inicial, mas a ansiedade é o padrão que permaneceu instalado no sistema nervoso.

### Tabela de Comparação Rápida
- **Origem**: Estresse = Externo / Ansiedade = Interno e cognitivo
- **Sensação principal**: Estresse = Sobrecarga e cansaço / Ansiedade = Insegurança e medo difuso
- **Alívio**: Estresse = Descanso e resolução do evento / Ansiedade = Regulação emocional e reestruturação de pensamentos

### Exercício Prático: O Filtro do Gatilho (2 Minutos)
Sempre que sentir aperto no peito, faça a si mesmo duas perguntas simples:
1. *"Existe um problema concreto acontecendo neste momento presente?"*
   - Se a resposta for **sim**: é estresse. Divida a ação em etapas práticas e resolva o próximo passo possível.
   - Se a resposta for **não**: é ansiedade antecipatória.
2. *"Essa preocupação se refere a algo que posso controlar hoje?"*
   - Se não puder controlar agora, anote em um papel e permita-se focar na tarefa que está à sua frente.

### Conclusão
Compreender se você está enfrentando estresse circunstancial ou ansiedade antecipatória evita o gasto desnecessário de energia mental e orienta o cuidado adequado para cada situação.

*Aviso: Este conteúdo é educativo e não substitui consulta profissional.*',
  'Ansiedade',
  'Ansiedade',
  5,
  '"estresse","ansiedade","diferenca","pressao","causas"'::text[],
  '"ansiedade","estresse","autocuidado"'::text[],
  '"o-que-e-ansiedade-e-como-ela-funciona","como-lidar-com-a-preocupacao-excessiva","quando-procurar-ajuda-profissional"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-ansiedade-4',
  'o-que-acontece-no-corpo-durante-uma-crise-de-ansiedade',
  'O que acontece no corpo durante uma crise de ansiedade',
  'Descubra a fisiologia de um pico de ansiedade, por que os sintomas parecem tão intensos e como ancorar o corpo com segurança.',
  'Uma crise de ansiedade ou ataque de pânico pode ser uma experiência assustadora. O coração dispara, o ar parece faltar e uma sensação avassaladora de perda de controle pode tomar conta. No entanto, compreender exatamente o que está ocorrendo do ponto de vista fisiológico é uma das formas mais eficazes de reduzir o medo da própria crise.

Durante um pico de ansiedade, o seu corpo não está quebrado nem em perigo fatal: ele está executando com intensidade máxima um programa de proteção.

### A Cascata de Adrenalina
Em frações de segundo, o sistema nervoso simpático descarrega uma onda de adrenalina na corrente sanguínea. Isso produz efeitos imediatos:
- **Coração acelerado**: O músculo cardíaco bombeia sangue vigorosamente para os membros para permitir corrida ou defesa rápida.
- **Hiperventilação e falta de ar**: A respiração rápida e rasa tenta captar mais oxigênio, mas altera o equilíbrio de gás carbônico, provocando formigamento nas mãos e tontura.
- **Visão em túnel e boca seca**: O sangue é retirado dos órgãos digestivos e da saliva, focando toda a energia na percepção do perigo.
- **Sensação de calor ou calafrios**: A regulação térmica é alterada pela contração dos vasos periféricos.

### Por que a crise sempre atinge um pico e depois passa?
O organismo humano possui um limite biológico para a liberação contínua de adrenalina. Uma crise de ansiedade atinge seu ápice geralmente entre 5 e 15 minutos, após os quais o sistema nervoso parassimpático entra em ação naturalmente para restaurar a homeostase e diminuir o ritmo cardíaco.

A crise nunca dura para sempre; saber que ela tem começo, pico e declínio fisiológico reduz o desespero e ajuda a esperar o corpo se acalmar.

### O que NÃO fazer durante uma crise
- **Não lute contra a sensação**: Tentar forçar o coração a bater devagar gera mais medo e mais adrenalina.
- **Não respire desesperadamente pelo peito**: Respirações rápidas aumentam a hiperventilação.
- **Não se culpe**: A crise é uma reação neuroquímica involuntária, não uma escolha ou sinal de fraqueza.

### Exercício Prático de Aterramento e Respiração Durante a Crise
Quando sentir o início de um pico:
1. **Sente-se com as costas apoiadas** e coloque os dois pés totalmente firmes no chão.
2. **Afirmação segura**: Repita mentalmente: *"Isso é uma descarga de adrenalina. Meu corpo sabe se regular e essa sensação vai passar em poucos minutos."*
3. **Respiração com expiração prolongada**:
   - Puxe o ar pelo nariz em 4 segundos;
   - Solte o ar lentamente pela boca com os lábios semicerrados (como se soprasse uma vela sem apagá-la) em 7 ou 8 segundos.
4. **Ancoragem física**: Toque uma superfície firme (o braço da cadeira, a parede fria) e concentre-se na textura do objeto.

### Conclusão
A crise de ansiedade é desconfortável e desgastante, mas não é fatal. Com acolhimento, respiração com foco na expiração e informação correta, você aprende a atravessá-la com muito mais segurança.

*Aviso: Este conteúdo é educativo. Dores no peito inéditas ou acompanhadas de irradiação para o braço devem ser avaliadas por um serviço médico para descartar causas orgânicas.*',
  'Ansiedade',
  'Ansiedade',
  6,
  '"crise","ataque de panico","taquicardia","fisiologia","seguranca"'::text[],
  '"ansiedade","crise","corpo","acolhimento"'::text[],
  '"o-que-e-ansiedade-e-como-ela-funciona","como-acalmar-os-pensamentos-acelerados","tecnica-5-4-3-2-1-para-voltar-ao-presente"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-ansiedade-5',
  'como-acalmar-os-pensamentos-acelerados',
  'Como acalmar os pensamentos acelerados',
  'Técnicas cognitivas e comportamentais para diminuir a velocidade do fluxo mental e recuperar a clareza quando a cabeça não para.',
  'Você já teve a sensação de que sua mente funciona como um navegador com 40 abas abertas simultaneamente, todas tocando música e exigindo atenção? Os pensamentos acelerados são uma das manifestações mais exaustivas da ansiedade.

Nesse estado, um pensamento puxa o outro em uma velocidade vertiginosa: pendências do trabalho conectam-se a preocupações financeiras, que por sua vez desencadeiam lembranças de erros passados e previsões de fracassos futuros.

### Por que os pensamentos aceleram?
Quando a ansiedade ativa o estado de alerta, o cérebro tenta freneticamente encontrar soluções para todos os perigos possíveis de uma só vez. Trata-se de uma tentativa hiperativa de controle: a mente acredita que, se pensar em tudo agora, conseguirá evitar qualquer dor futura.

O resultado, porém, não é a resolução de problemas, mas a paralisia mental e o esgotamento físico.

### A ilusão de que pensar mais resolve
É crucial distinguir entre **reflexão produtiva** e **ruminação acelerada**:
- A reflexão produtiva gera planos concretos, decisões práticas e termina em ação.
- A ruminação acelerada gira em círculos, gera angústia, não resolve nada e drena sua energia vital.

### Três Estratégias Práticas para Desacelerar
1. **O Despejo Mental no Papel (Brain Dump)**: Escrever à mão tudo o que está passando pela cabeça retira a carga de processamento da memória de trabalho. Ver as ideias escritas diminui o poder assustador que elas têm na imaginação.
2. **Rotulação Cognitiva**: Em vez de se fundir com o pensamento (*"Vou arruinar a apresentação de amanhã"*), pratique o distanciamento linguístico (*"Estou tendo o pensamento de que a apresentação será difícil"*).
3. **Mudança de Foco Sensorial**: O cérebro não consegue processar plenamente sensações físicas intensas e pensamentos abstratos complexos ao mesmo tempo. Lavar o rosto com água fria ou caminhar sentindo o impacto dos passos quebra o ciclo.

### Exercício Prático: A Técnica da "Vaga de Estacionamento" (3 Minutos)
Quando os pensamentos estiverem velozes demais:
1. Pegue um bloco de notas ou papel em branco.
2. Desenhe um quadrado e escreva no centro: *"Estacionamento de Preocupações"*.
3. Liste brevemente as 3 ideias que estão mais pressionando sua mente.
4. Escreva abaixo: *"Estas ideias estão guardadas aqui e serão revisadas hoje às 17h. Agora posso focar no meu próximo passo."*
5. Guarde o papel fora do seu campo visual e volte à sua atividade atual.

### Conclusão
Você não precisa controlar todos os pensamentos que surgem, mas pode escolher como se relacionar com eles. Desacelerar a mente é um treino diário de gentileza e paciência consigo mesmo.

*Aviso: Este conteúdo é educativo e não substitui psicoterapia.*',
  'Ansiedade',
  'Ansiedade',
  5,
  '"pensamentos acelerados","mente","foco","clareza","cognitivo"'::text[],
  '"ansiedade","mente","foco","regulacao"'::text[],
  '"como-lidar-com-a-preocupacao-excessiva","o-que-e-ansiedade-e-como-ela-funciona","como-desacelerar-a-mente-antes-de-dormir"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-ansiedade-6',
  'ansiedade-antes-de-provas-reunioes-e-apresentacoes',
  'Ansiedade antes de provas, reuniões e apresentações',
  'Estratégias validadas para lidar com o nervosismo pré-desempenho, controlar a voz trêmula e transformar o medo em foco.',
  'O coração acelera na sala de espera, a garganta fica seca antes de abrir o microfone em uma videoconferência ou a mente parece dar um "branco" ao receber a folha de prova. A ansiedade de desempenho é uma das experiências humanas mais universais e compreensíveis.

Sentir nervosismo antes de ser avaliado não significa incompetência ou despreparo; é uma prova de que a situação tem valor e significado para você.

### A Curva do Desempenho e o Papel da Ansiedade
Na psicologia, a Lei de Yerkes-Dodson demonstra que um nível moderado de ativação fisiológica melhora a atenção, a velocidade de reação e a retenção de memória. O objetivo nunca deve ser "zerar" a ansiedade antes de uma apresentação, mas sim mantê-la dentro da faixa ideal onde ela funciona como entusiasmo e prontidão, e não como travamento.

### Principais Armadilhas Mentais Pré-Apresentação
- **Catastrofização**: Imaginar que um pequeno gaguejo ou esquecimento de palavra arruinará completamente sua credibilidade profissional ou acadêmica.
- **Leitura mental**: Acreditar que a expressão séria de um avaliador ou colega significa desaprovação e julgamento negativo.
- **Perfeccionismo paralisante**: Achar que a apresentação só terá valor se for executada de forma 100% impecável e sem nenhuma falha humana.

### Preparação Prática: O Que Fazer nas Horas Anteriores
1. **Evite excesso de cafeína**: Café e energéticos nos momentos prévios potencializam tremores nas mãos e taquicardia.
2. **Aquecimento vocal e corporal**: Solte a mandíbula, boceje intencionalmente para relaxar as cordas vocais e alongue a musculatura do pescoço.
3. **Troque a autocrítica pela curiosidade**: Em vez de pensar *"Eles vão me julgar"*, experimente pensar *"Estou aqui para compartilhar uma informação útil com essas pessoas"*.

### Exercício Prático: A Respiração do Suspiro Fisiológico (1 Minuto)
Imediatamente antes de entrar na sala ou iniciar a apresentação:
1. Puxe o ar pelo nariz até encher cerca de 80% dos pulmões.
2. Sem soltar o ar, dê uma segunda puxada rápida pelo nariz completando os 100%.
3. Solte todo o ar pela boca em um longo e relaxante suspiro suave.
4. Repita apenas 3 vezes. Essa técnica ativa rapidamente os receptores parassimpáticos e estabiliza o ritmo cardíaco.

### Conclusão
O público raramente percebe o nervosismo interno na mesma intensidade em que você o sente. Aceitar a presença da ansiedade e focar na mensagem a ser transmitida liberta sua voz e seu potencial.

*Aviso: Este conteúdo é educativo e não substitui orientação clínica.*',
  'Ansiedade',
  'Ansiedade',
  5,
  '"provas","reunioes","apresentacao","desempenho","falar em publico"'::text[],
  '"ansiedade","trabalho","estudos","foco"'::text[],
  '"como-acalmar-os-pensamentos-acelerados","como-lidar-com-a-preocupacao-excessiva","tecnica-5-4-3-2-1-para-voltar-ao-presente"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-ansiedade-7',
  'como-lidar-com-a-preocupacao-excessiva',
  'Como lidar com a preocupação excessiva',
  'Aprenda a desarmar ciclos de ruminação mental, separar problemas solucionáveis de cenários hipotéticos e viver com mais leveza.',
  'Preocupar-se faz parte da capacidade humana de planejar e antecipar perigos. No entanto, quando a preocupação se torna um hábito automático e incontrolável — ocupando horas do dia com cenários improváveis —, ela deixa de proteger e passa a drenar sua vitalidade.

A mente ansiosa acredita secretamente que preocupar-se é uma forma de controle: *"Se eu me preocupar bastante com isso, estarei preparado e nada de ruim vai acontecer."* Essa é uma armadilha cognitiva clássica.

### A Diferença entre Preocupações Reais e Hipotéticas
Para recuperar a serenidade, é fundamental classificar qualquer pensamento que gere aflição:
1. **Problemas Reais e Imediatos**: Situações que estão acontecendo no presente e sobre as quais você pode agir agora (ex: uma conta que vence hoje, um pneu furado).
2. **Cenários Hipotéticos Futuros**: Situações no formato *"E se..."* que dependem de variáveis fora do seu controle ou que sequer aconteceram (ex: *"E se daqui a três anos a empresa fechar?"*).

### O Custo Invisível da Preocupação Crônica
Viver preocupado mantém o corpo em estado constante de alerta submáximo. Isso se traduz em fadiga crônica, tensão muscular, alterações no trânsito intestinal e dificuldade de desfrutar momentos de lazer com pessoas queridas. Você está fisicamente no presente, mas mentalmente exilado em um futuro ameaçador.

### 4 Passos para Interromper o Ciclo de Ruminação
- **Passo 1**: Nomeie o processo: *"Minha mente está preocupando agora."*
- **Passo 2**: Questione a utilidade: *"Ficar remoendo isso pelos próximos 30 minutos vai mudar o resultado prático?"*
- **Passo 3**: Foque na ação mínima viável: se há algo que pode ser feito hoje, execute em 5 minutos.
- **Passo 4**: Aceite a incerteza: a vida é intrinsecamente dinâmica, e nenhuma quantidade de preocupação elimina o imprevisível.

### Exercício Prático: O "Horário da Preocupação" (Técnica TCC)
1. Escolha um horário fixo do dia (por exemplo, das 17h30 às 17h45) e chame-o de *Horário da Preocupação*.
2. Quando uma preocupação hipotética surgir durante o dia, anote-a e diga a si mesmo: *"Vou pensar nisso exclusivamente às 17h30"*.
3. Ao chegar no horário marcado, leia a lista. Você perceberá que mais da metade das aflições já perdeu a urgência ou deixou de fazer sentido.

### Conclusão
Preocupação não é prevenção; é apenas sofrimento antecipado. Ao treinar sua mente para soltar o que não está sob seu controle direto, você abre espaço para a paz no momento presente.

*Aviso: Este conteúdo é educativo e não substitui psicoterapia.*',
  'Ansiedade',
  'Ansiedade',
  6,
  '"preocupacao","ruminacao","controle","pensamento","futuro"'::text[],
  '"ansiedade","cognitivo","habitos"'::text[],
  '"o-que-e-ansiedade-e-como-ela-funciona","como-acalmar-os-pensamentos-acelerados","quando-procurar-ajuda-profissional"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-ansiedade-8',
  'habitos-que-podem-aumentar-a-ansiedade',
  'Hábitos que podem aumentar a ansiedade',
  'Identifique comportamentos cotidianos imperceptíveis na alimentação, rotina e uso de telas que alimentam a hiperativação do sistema nervoso.',
  'Muitas vezes tratamos a ansiedade apenas como um fenômeno estritamente mental, esquecendo que o cérebro faz parte de um ecossistema biológico complexo. Pequenos hábitos diários podem, sem que você perceba, enviar mensagens contínuas de perigo para o seu sistema nervoso.

Ajustar esses comportamentos na rotina cria uma base física estável que torna a mente muito mais resiliente às pressões emocionais.

### 1. Consumo Excessivo ou Tardio de Cafeína
A cafeína bloqueia os receptores de adenosina (substância que induz o sono) e estimula as glândulas adrenais a secretarem adrenalina. Para pessoas com predisposição ansiosa, mais de 2 xícaras de café ao dia ou o consumo após as 14h podem simular fisicamente os sintomas de uma crise: taquicardia, inquietação e respiração acelerada.

### 2. Checagem de Notícias e Notificações ao Acordar
Abrir o celular nos primeiros minutos da manhã inunda o cérebro sonolento com estímulos estressores, demandas de trabalho e notícias alarmantes antes mesmo que o corpo tenha equilibrado seus níveis naturais de cortisol.

### 3. Pular Refeições e Picos Glicêmicos
Ficar muitas horas em jejum ou consumir alimentos ricos em açúcar refinado gera oscilações bruscas na glicose sanguínea. Quando o açúcar no sangue despenca (hipoglicemia reativa), o organismo secreta adrenalina para compensar, gerando tremor e irritabilidade que são facilmente confundidos com ansiedade emocional.

### 4. Sedentarismo e Falta de Descarga Motora
O corpo humano foi feito para se mover. Quando os hormônios do estresse são liberados e ficamos horas sentados diante de uma tela sem qualquer atividade física, essa energia acumulada não encontra vazão, transformando-se em agitação interna e inquietação mental.

### Exercício Prático: O Inventário dos 3 Ajustes Simples
Escolha apenas um destes hábitos para implementar hoje:
1. **Regra dos 30 minutos matinais**: Não olhar redes sociais ou e-mails nos primeiros 30 minutos após acordar.
2. **Corte da cafeína após o almoço**: Substituir o café da tarde por água com gás ou chá de camomila/hortelã.
3. **Pausa de movimento**: Levantar-se a cada 90 minutos de trabalho para beber um copo d''água e esticar as pernas por 2 minutos.

### Conclusão
Cuidar do sistema nervoso começa pelas escolhas simples do dia a dia. Pequenas mudanças de hábitos geram impactos profundos na sua sensação de calma e estabilidade.

*Aviso: Este conteúdo é educativo e não substitui orientação médica ou nutricional.*',
  'Ansiedade',
  'Ansiedade',
  5,
  '"habitos","cafeina","telas","sono","rotina"'::text[],
  '"ansiedade","habitos","estilo de vida"'::text[],
  '"como-as-telas-afetam-a-qualidade-do-sono","como-criar-uma-rotina-emocionalmente-saudavel","o-que-e-ansiedade-e-como-ela-funciona"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-ansiedade-9',
  'como-apoiar-alguem-que-esta-ansioso',
  'Como apoiar alguém que está ansioso',
  'Guia prático e empático sobre como acolher amigos, familiares ou parceiros em momentos de ansiedade sem invalidar seus sentimentos.',
  'Ver uma pessoa querida sofrer com ansiedade intensa ou atravessar uma crise pode gerar uma sensação de impotência. Muitas vezes, na tentativa genuína de ajudar, acabamos usando frases que aumentam ainda mais a angústia da outra pessoa.

Apoiar alguém ansioso não exige soluções mágicas, mas sim uma presença segura, empática e livre de julgamentos.

### O Que Evitar Dizer
Mesmo com boas intenções, evite frases como:
- *"Calma, isso não é nada"* (Invalida a experiência física e real que a pessoa está sentindo).
- *"Você está exagerando, é tudo coisa da sua cabeça"* (Gera vergonha e isolamento).
- *"Basta pensar positivo"* (Ignora a complexidade neurobiológica da resposta ansiosa).
- *"Olha tanta coisa boa que você tem na vida"* (Provoca culpa desnecessária).

### O Que Falar: Frases de Acolhimento e Segurança
Em vez de tentar convencer a pessoa de que o medo é irracional, ofereça estabilidade:
- *"Estou aqui com você. Você não precisa passar por isso sozinho(a)."*
- *"Eu vejo que está difícil agora, mas essa sensação vai passar e estou ao seu lado."*
- *"Quer conversar sobre o que está sentindo ou prefere apenas que eu fique em silêncio ao seu lado?"*
- *"Quer segurar minha mão e respirar devagar comigo?"*

### Como Agir Durante uma Crise
1. **Mantenha seu próprio tom de voz calmo e sereno**: A calma é tão contagiosa quanto o nervosismo.
2. **Reduza os estímulos ao redor**: Diminua luzes fortes, afaste multidões e ofereça um copo de água fresca.
3. **Não pressione por explicações imediatas**: Durante uma crise, a área racional do cérebro está com funcionamento reduzido; não exija que a pessoa justifique o motivo do medo naquele instante.

### Exercício Prático: O Guia de Co-regulação Respiratória
Se a pessoa consentir, sente-se ao lado dela e proponha:
1. *"Vamos respirar juntos no meu ritmo por um instante?"*
2. Respire de forma audível e compassada: inspire em 4 segundos e expire suavemente em 6 segundos.
3. Deixe que o sistema nervoso da outra pessoa espelhe naturalmente o seu ritmo equilibrado.

### Conclusão
O maior presente que você pode oferecer a alguém em sofrimento ansioso não são conselhos imediatos, mas a certeza de que a presença e o afeto de vocês permanecem inabaláveis.

*Aviso: Este conteúdo é educativo e não substitui atendimento profissional especializado.*',
  'Ansiedade',
  'Ansiedade',
  5,
  '"apoio","empatia","escuta","relacionamentos","cuidado"'::text[],
  '"ansiedade","relacoes","empatia"'::text[],
  '"o-que-acontece-no-corpo-durante-uma-crise-de-ansiedade","o-que-e-ansiedade-e-como-ela-funciona","quando-procurar-ajuda-profissional"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-ansiedade-10',
  'quando-procurar-ajuda-profissional',
  'Quando procurar ajuda profissional',
  'Compreenda os critérios clínicos e momentos em que o acompanhamento com psicólogo ou psiquiatra é o caminho mais seguro e libertador.',
  'Buscar apoio profissional para cuidar da saúde mental ainda é, para muitas pessoas, uma decisão cercada de dúvidas e preconceitos infundados. No entanto, assim como consultamos um médico quando temos uma dor física persistente, procurar psicoterapia ou avaliação psiquiátrica é um ato de maturidade, autocuidado e respeito pela própria história.

Saber identificar quando a ansiedade ultrapassou o limite saudável é fundamental para receber o suporte adequado no momento certo.

### Sinais Claros de que é Hora de Buscar Ajuda
Recomenda-se procurar um psicólogo ou médico psiquiatra quando a ansiedade apresentar uma ou mais destas características:
- **Prejuízo funcional**: Dificuldade consistente para trabalhar, estudar, manter relacionamentos ou cuidar da própria rotina básica.
- **Esquiva progressiva**: Deixar de ir a lugares, evitar conversas importantes ou abrir mão de oportunidades por medo constante.
- **Sintomas físicos frequentes**: Crises de pânico recorrentes, insônia persistente há mais de 3 semanas, problemas digestivos crônicos sem causa orgânica identificada.
- **Sensação de esgotamento e desamparo**: Sentir que os próprios recursos de enfrentamento não são mais suficientes para restaurar a calma.

### Como Funciona a Psicoterapia?
A psicoterapia (como a Terapia Cognitivo-Comportamental — TCC, a Terapia de Aceitação e Compromisso — ACT, entre outras abordagens baseadas em evidências) oferece um espaço seguro e confidencial para:
- Mapear os gatilhos e padrões de pensamento que sustentam a ansiedade;
- Desenvolver habilidades práticas de regulação emocional;
- Desconstruir crenças limitantes sobre si mesmo e sobre o mundo;
- Fortalecer a autonomia para lidar com futuras adversidades.

### E Quanto ao Tratamento Medicamentoso?
Em alguns casos de ansiedade moderada a grave, o acompanhamento psiquiátrico pode indicar o uso temporário de medicações reguladoras de neurotransmissores (como inibidores seletivos de recaptação de serotonina). Longe de "mudar a personalidade", essas medicações equilibram a química cerebral, reduzindo o sofrimento agudo para que a pessoa consiga aproveitar plenamente a psicoterapia.

### Exercício Prático: O Roteiro de Autoavaliação Honesta
Responda mentalmente com gentileza:
1. *"Minha ansiedade está limitando minhas escolhas e sonhos nos últimos meses?"*
2. *"Tenho sentido um cansaço profundo por carregar esse peso sozinho(a)?"*
3. *"O que me impede de agendar uma primeira sessão de conversa com um profissional?"*

### Conclusão e Recursos de Apoio
Procurar ajuda profissional não é sinal de incapacidade, mas sim o primeiro passo corajoso em direção a uma vida com mais liberdade, espaço interno e serenidade.

*Aviso Obrigatório: O Respira é uma ferramenta de apoio ao bem-estar e não substitui diagnóstico ou tratamento médico/psicológico. Em momentos de crise severa, ligue para o CVV no número 188 (ligação gratuita em todo o Brasil) ou procure a unidade de saúde mais próxima.*',
  'Ansiedade',
  'Ansiedade',
  5,
  '"ajuda profissional","psicoterapia","psiquiatria","saude mental","diagnostico"'::text[],
  '"ansiedade","saude mental","terapia","cuidado"'::text[],
  '"o-que-e-ansiedade-e-como-ela-funciona","como-reconhecer-os-sinais-da-ansiedade","o-que-acontece-no-corpo-durante-uma-crise-de-ansiedade"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-sono-1',
  'como-desacelerar-a-mente-antes-de-dormir',
  'Como desacelerar a mente antes de dormir',
  'Aprenda rituais práticos e cientificamente embasados para diminuir a rotação dos pensamentos e sinalizar ao corpo que é hora de descansar.',
  'Deitar na cama com o corpo exausto e, no mesmo instante, ver a mente acelerar em um turbilhão de memórias, planos e preocupações é uma das queixas mais comuns da vida contemporânea. Essa transição abrupta entre um dia hiperconectado e o silêncio do travesseiro gera um choque no sistema nervoso.

O sono não é um botão de liga e desliga, mas sim um processo de aterrissagem suave que exige preparação gradual.

### Por que a mente dispara ao apagar a luz?
Durante o dia, estamos ocupados com reuniões, mensagens, sons e estímulos visuais que mantêm o cérebro ocupado. Quando finalmente nos deitamos no escuro e em silêncio, todas as emoções não processadas, pendências e preocupações encontram espaço livre para emergir.

Sem um ritual de desaceleração prévia, a cama se transforma em uma mesa de trabalho mental.

### A Zona de Transição de 60 Minutos
Para permitir que a melatonina (o hormônio do sono) seja secretada adequadamente, o cérebro precisa de uma zona de transição cerca de 1 hora antes de deitar:
- **Redução da iluminação**: Apague luzes de teto brancas e use lâmpadas indiretas de tom amarelado ou abajures.
- **Encerramento de conversas de trabalho**: Evite resolver impasses profissionais ou discutir assuntos delicados no final da noite.
- **Estímulos de baixa dopamina**: Troque séries com suspense ou rolagem de redes sociais por leitura em papel ou música suave.

### Exercício Prático: O Diário de Esvaziamento (Brain Dump Noturno)
Cerca de 30 minutos antes de se deitar:
1. Pegue um caderno de cabeceira e uma caneta.
2. Divida a página em duas colunas: *"O que fiz de bom hoje"* e *"Pendências de amanhã"*.
3. Anote em tópicos simples o que está em aberto para o dia seguinte.
4. Feche o caderno e diga mentalmente: *"O dia de hoje terminou. Tudo o que precisa ser feito já está guardado no papel e será resolvido amanhã no momento certo."*

### Conclusão
Desacelerar a mente antes de dormir é um ato de autocuidado que se constrói com consistência. Trate seus últimos momentos do dia com o mesmo carinho e atenção que você dedica às suas manhãs.

*Aviso: Este conteúdo é educativo e não substitui consulta médica em casos de insônia crônica.*',
  'Sono',
  'Sono',
  5,
  '"sono","mente","desacelerar","noite","insonia"'::text[],
  '"sono","mente","relaxamento","rotina"'::text[],
  '"como-criar-uma-rotina-noturna-saudavel","a-relacao-entre-ansiedade-e-dificuldade-para-dormir","exercicios-de-respiracao-para-o-periodo-noturno"'::text[],
  'Equipe de Psicologia e Medicina do Sono Respira',
  'Dr. Lucas Silveira (CRM 158.420)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-sono-2',
  'como-criar-uma-rotina-noturna-saudavel',
  'Como criar uma rotina noturna saudável',
  'Construa um passo a passo acolhedor para a sua noite que prepare seu organismo para um sono profundo, contínuo e reparador.',
  'Uma rotina noturna saudável — frequentemente chamada na medicina de *Higiene do Sono* — é uma sequência previsível de ações que sinaliza ao organismo que a fase ativa do dia terminou e que é seguro relaxar e descansar.

Assim como as crianças se acalmam quando seguem um ritual conhecido para dormir, o cérebro adulto responde profundamente a pistas ambientais consistentes.

### Os 3 Blocos de uma Rotina Noturna Eficaz
1. **Bloco de Desconexão (60 a 90 minutos antes)**:
   - Desligar computadores e televisores;
   - Diminuir luzes gerais da casa;
   - Realizar o fechamento das pendências do dia.
2. **Bloco de Conforto Físico (30 a 45 minutos antes)**:
   - Tomar um banho morno (que reduz a temperatura corporal central logo após o término, facilitando o início do sono);
   - Vestir roupas confortáveis e respiráveis;
   - Beber um chá de ervas sem cafeína (camomila, erva-cidreira ou mulungu).
3. **Bloco de Indução à Calma (15 minutos antes)**:
   - Praticar respiração consciente ou alongamentos suaves;
   - Ler algumas páginas de um livro leve;
   - Acomodar-se na cama em ambiente escuro e arejado.

### O Que Evitar na Rotina Noturna
- **Refeições pesadas**: Alimentos gordurosos ou ricos em temperos fortes exigem esforço digestivo prolongado e fragmentam o sono.
- **Bebidas alcoólicas**: Embora o álcool cause sedação inicial rápida, ele destrói os estágios de sono profundo e sono REM, causando despertares na madrugada.
- **Treinos intensos imediatamente antes de dormir**: Exercícios extenuantes elevam a temperatura corporal e os batimentos cardíacos, retardando o sono.

### Exercício Prático: O Ritual das 3 Luzes
Hoje à noite, experimente:
1. Às 21h30, apague todas as lâmpadas brancas centrais da sala e dos quartos.
2. Acenda apenas uma luz amarela indireta ou abajur de canto.
3. Observe como seus olhos relaxam e a sensação de sonolência natural começa a se manifestar em 20 minutos.

### Conclusão
Uma rotina noturna não precisa ser rígida ou cheia de regras complicadas. O segredo é a repetição gentil de pequenos gestos que trazem conforto e paz para o seu fim de dia.

*Aviso: Este conteúdo é educativo e não substitui acompanhamento médico.*',
  'Sono',
  'Sono',
  6,
  '"rotina noturna","higiene do sono","habitos","descanso","relaxamento"'::text[],
  '"sono","rotina","habitos","autocuidado"'::text[],
  '"como-desacelerar-a-mente-antes-de-dormir","como-preparar-o-quarto-para-descansar-melhor","habitos-durante-o-dia-que-ajudam-a-dormir-melhor"'::text[],
  'Equipe de Psicologia e Medicina do Sono Respira',
  'Dr. Lucas Silveira (CRM 158.420)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-sono-3',
  'a-relacao-entre-ansiedade-e-dificuldade-para-dormir',
  'A relação entre ansiedade e dificuldade para dormir',
  'Entenda como o estado de hiperalerta sabota a indução do sono e como quebrar o círculo vicioso entre noites em claro e angústia diurna.',
  'A ansiedade e a insônia alimentam-se mutuamente em uma das relações mais desgastantes para a saúde mental. Quando estamos ansiosos, temos dificuldade para dormir; e quando não dormimos o suficiente, nosso cérebro se torna neuroquimicamente muito mais reativo e ansioso no dia seguinte.

Compreender a mecânica desse ciclo é o primeiro passo para desativar o mecanismo que impede o descanso.

### O Estado de Hiperalerta Noturno
Para que o ser humano adormeça, o sistema nervoso precisa receber mensagens inequívocas de que o ambiente é seguro. No entanto, quando a ansiedade está elevada, a amígdala cerebral interpreta que existe um perigo constante no horizonte.

Biologicamente, dormir diante de uma ameaça seria fatal; portanto, o cérebro mantém níveis elevados de cortisol e tensão muscular para "proteger" você da vulnerabilidade do sono.

### A "Ansiedade de Desempenho" ao Dormir
Um dos maiores agravantes da insônia é a preocupação com o próprio ato de dormir:
- Olhar o relógio repetidamente calculando: *"Se eu dormir agora, só terei 4 horas de sono"*.
- Forçar os olhos fechados com raiva por não estar sonolento.
- Transformar a cama em um local de frustração, luta e cobrança interna.

### Como Quebrar o Ciclo Vicioso
1. **Ressignifique o papel da noite**: Se o sono não vier de imediato, lembre-se de que ficar deitado confortavelmente no escuro já proporciona descanso muscular e recuperação parcial.
2. **Esconda o relógio**: Vire o visor do despertador ou afaste o celular do campo de visão para não monitorar os minutos que passam.
3. **Aceite a vigília com acolhimento**: A pressão para adormecer é o maior inibidor biológico do sono.

### Exercício Prático: A Descompressão Paradoxal
Se você estiver na cama há mais de 20 minutos com a mente agitada:
1. Diga a si mesmo com sinceridade: *"Tudo bem se eu não dormir imediatamente esta noite. Meu corpo é sábio e eu posso apenas descansar e relaxar os músculos agora."*
2. Foque apenas na sensação de peso e aconchego do colchão sustentando o seu corpo.
3. Ao retirar a exigência do sono, a tensão diminui e o adormecer acontece de forma natural.

### Conclusão
O sono é um processo biológico involuntário: quanto menos você tentar controlá-lo à força, mais facilmente ele se aproximará de você.

*Aviso: Este conteúdo é educativo e não substitui tratamento médico para distúrbios do sono.*',
  'Sono',
  'Sono',
  5,
  '"ansiedade","sono","insonia","hiperalerta","ciclo"'::text[],
  '"sono","ansiedade","mente"'::text[],
  '"o-que-fazer-quando-o-sono-nao-chega","como-desacelerar-a-mente-antes-de-dormir","exercicios-de-respiracao-para-o-periodo-noturno"'::text[],
  'Equipe de Psicologia e Medicina do Sono Respira',
  'Dr. Lucas Silveira (CRM 158.420)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-sono-4',
  'como-as-telas-afetam-a-qualidade-do-sono',
  'Como as telas afetam a qualidade do sono',
  'Descubra os impactos da luz azul e do estímulo dopaminérgico dos smartphones na produção de melatonina e na profundidade do descanso.',
  'O smartphone tornou-se o último objeto que tocamos antes de dormir e o primeiro que buscamos ao abrir os olhos pela manhã. No entanto, a neurociência moderna já demonstrou de forma inequívoca que a presença de telas nos momentos que antecedem o sono compromete gravemente a arquitetura do descanso.

Esse impacto negativo ocorre por meio de duas frentes simultâneas: a via biológica da luz e a via psicológica do conteúdo.

### 1. A Luz Azul e o Bloqueio da Melatonina
As células ganglionares da retina humana contêm um pigmento sensível chamado melanopsina, cuja função primordial é detectar a luz azul presente na luz solar. Ao receber essa frequência de luz emitida por celulares, tablets e TVs, o cérebro interpreta que ainda é meio-dia, bloqueando imediatamente a produção de melatonina pela glândula pineal.

Mesmo que você consiga adormecer após usar o celular, a quantidade de sono profundo e restaurador cai significativamente.

### 2. O Ciclo Dopaminérgico e a Hiperestimulação
Redes sociais, vídeos curtos e notificações foram desenhados para gerar picos rápidos de dopamina — o neurotransmissor da novidade e da busca. Cada novo deslize na tela mantém o cérebro em modo de caça ativa, exatamente o oposto do estado de entrega passiva exigido pelo sono.

### Estratégias Práticas para Desconectar com Sucesso
- **Crie uma "estação de carregamento" fora do quarto**: Deixe o celular carregando na sala ou na cozinha e use um despertador tradicional.
- **Ative o modo Noturno/Amarelado automático**: Configure seus dispositivos para filtrar tons frios a partir das 19h.
- **Estabeleça o "toque de recolher digital"**: Estabeleça a meta de desligar telas 45 minutos antes de apagar a luz.

### Exercício Prático: A Troca do Smartphone pelo Livro Físico
Por 3 noites consecutivas:
1. Coloque o celular no modo avião 40 minutos antes de dormir e guarde-o em uma gaveta.
2. Deixe um livro físico (com assunto relaxante) sobre o travesseiro.
3. Leia por 15 a 20 minutos sob uma luz suave.
4. Perceba a rapidez com que os olhos pesam quando a luz azul é removida.

### Conclusão
Recuperar a sua noite das telas não significa abrir mão da tecnologia, mas estabelecer limites saudáveis para proteger seu bem mais precioso: a clareza e a vitalidade mental do dia seguinte.

*Aviso: Este conteúdo é informativo e visa a promoção de hábitos saudáveis.*',
  'Sono',
  'Sono',
  5,
  '"telas","luz azul","celular","melatonina","sono profundo"'::text[],
  '"sono","tecnologia","habitos","saude"'::text[],
  '"como-criar-uma-rotina-noturna-saudavel","por-que-acordamos-cansados-mesmo-depois-de-dormir","habitos-durante-o-dia-que-ajudam-a-dormir-melhor"'::text[],
  'Equipe de Psicologia e Medicina do Sono Respira',
  'Dr. Lucas Silveira (CRM 158.420)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-sono-5',
  'como-preparar-o-quarto-para-descansar-melhor',
  'Como preparar o quarto para descansar melhor',
  'Ajustes essenciais de temperatura, iluminação, ruído e organização no seu ambiente para transformá-lo em um verdadeiro santuário do sono.',
  'O ambiente em que dormimos exerce uma influência silenciosa, mas decisiva, na facilidade com que adormecemos e na profundidade dos nossos ciclos de sono. Um quarto barulhento, quente ou desorganizado mantém o sistema nervoso em estado constante de microalerta.

Transformar o quarto em um "santuário do sono" envolve alinhar quatro variáveis fundamentais: luz, temperatura, som e associação psicológica.

### 1. Escuridão Completa
Pequenas luzes de aparelhos eletrônicos, LEDs de carregadores ou frestas de cortinas são suficientes para atravessar as pálpebras fechadas e suprimir a melatonina.
- Use cortinas blackout ou uma máscara de dormir confortável;
- Cubra LEDs brilhantes de roteadores e condicionadores de ar com fita adesiva opaca.

### 2. Temperatura Térmica Adequada
Para iniciar o sono, a temperatura interna do corpo humano precisa cair cerca de 1°C. Quartos excessivamente abafados provocam microdespertares frequentes e suor noturno.
- A faixa térmica ideal para o sono fica geralmente entre 18°C e 21°C;
- Mantenha o quarto bem ventilado durante o dia e use roupas de cama de algodão ou tecidos naturais que permitam a respiração da pele.

### 3. Controle Acústico e Paisagens Sonoras
Ruídos intermitentes da rua ou de vizinhos fragmentam o sono REM.
- O uso de sons contínuos e suaves (como ruído branco, ruído marrom ou som de chuva constante) mascara os picos de barulho externo e acalma o córtex auditivo.

### 4. A Regra da Associação Única: Cama é para Dormir
Evite trabalhar, fazer reuniões ou almoçar na cama. O cérebro aprende por associação: se você trabalha na cama, ele a associa a estresse e resolução de problemas; se você a usa apenas para dormir e momentos íntimos, o ato de deitar desencadeia automaticamente o reflexo de relaxamento.

### Exercício Prático: O Check-up do Ambiente em 5 Minutos
Hoje antes de sair de casa ou antes de dormir:
1. Retire roupas espalhadas e papéis de trabalho de cima da cama.
2. Abra a janela por 10 minutos para renovar o ar do cômodo.
3. Feche as cortinas garantindo o máximo de vedação de luz externa.

### Conclusão
Pequenas alterações físicas no seu quarto eliminam barreiras invisíveis ao descanso e convidam seu corpo a se entregar com tranquilidade à noite.

*Aviso: Este conteúdo é educativo e visa o aprimoramento da higiene do sono.*',
  'Sono',
  'Sono',
  5,
  '"quarto","ambiente","temperatura","escuridao","santuario do sono"'::text[],
  '"sono","ambiente","habitos","bem-estar"'::text[],
  '"como-criar-uma-rotina-noturna-saudavel","por-que-acordamos-cansados-mesmo-depois-de-dormir","como-desacelerar-a-mente-antes-de-dormir"'::text[],
  'Equipe de Psicologia e Medicina do Sono Respira',
  'Dr. Lucas Silveira (CRM 158.420)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-sono-6',
  'o-que-fazer-quando-o-sono-nao-chega',
  'O que fazer quando o sono não chega',
  'Diretrizes comprovadas pela terapia cognitivo-comportamental para insônia sobre o que fazer ao rolar de um lado para o outro na cama.',
  'Rolar de um lado para o outro na cama, virar o travesseiro para o lado frio e olhar para o teto com sensação de impotência é uma experiência frustrante. O maior erro nesses momentos é permanecer na cama lutando contra a própria vigília.

A Terapia Cognitivo-Comportamental para Insônia (TCC-I), considerada padrão ouro pela medicina mundial, oferece diretrizes claras e eficazes sobre exatamente como agir quando o sono se recusa a chegar.

### A Regra dos 20 Minutos (Controle de Estímulos)
Se você se deitou e percebeu que já se passaram aproximadamente 20 a 30 minutos sem que a sonolência tenha aparecido:
1. **Levante-se da cama com calma**: Não fique deitado se revirando e acumulando irritação.
2. **Vá para outro cômodo com luz baixa**: Sente-se em uma poltrona ou sofá confortável na sala.
3. **Faça uma atividade monótona e sem telas**: Leia um livro calmo, ouça uma paisagem sonora suave ou faça um exercício de respiração.
4. **Volte para a cama somente quando os olhos pesarem**: Retorne apenas quando a sonolência física genuína (bocejo, pálpebras pesadas) se manifestar.

### Por que isso funciona?
Quando você fica horas na cama angustiado, o cérebro condiciona a cama a um estado de tortura e vigília nervosa. Ao sair da cama e retornar apenas quando sonolento, você quebra essa associação negativa e preserva a cama como um santuário de descanso.

### O Que NUNCA Fazer Durante a Insônia Noturna
- Não ligue a TV ou o celular para "passar o tempo" (a luz azul reiniciará o ciclo de vigília);
- Não coma lanches pesados ou tome café na madrugada;
- Não acenda a luz forte do teto;
- Não faça contas mentais de quantas horas faltam para o despertador tocar.

### Exercício Prático: O Relaxamento Muscular na Poltrona
Ao se levantar da cama durante uma noite de insônia:
1. Sente-se na sala com luz tênue.
2. Contraia suavemente os pés por 5 segundos e solte, percebendo o alívio.
3. Contraia as mãos por 5 segundos e solte.
4. Inspire pelo nariz e solte um longo suspiro sonoro, desarmando o estresse da frustração.

### Conclusão
Ter uma noite ruim de sono de vez em quando é comum e seu corpo tem plena capacidade de funcionar no dia seguinte. Ao tirar o peso da exigência, você permite que o descanso volte a fluir.

*Aviso: Se a dificuldade para dormir ocorrer mais de 3 vezes por semana por mais de um mês, consulte um médico especialista.*',
  'Sono',
  'Sono',
  5,
  '"insonia","sono nao chega","regras","cama","controle de estimulo"'::text[],
  '"sono","insonia","terapia","habitos"'::text[],
  '"a-relacao-entre-ansiedade-e-dificuldade-para-dormir","exercicios-de-respiracao-para-o-periodo-noturno","como-desacelerar-a-mente-antes-de-dormir"'::text[],
  'Equipe de Psicologia e Medicina do Sono Respira',
  'Dr. Lucas Silveira (CRM 158.420)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-sono-7',
  'por-que-acordamos-cansados-mesmo-depois-de-dormir',
  'Por que acordamos cansados mesmo depois de dormir',
  'Entenda os fatores que fragmentam os ciclos de sono profundo e descubra como recuperar a energia e o despertar revigorado.',
  'Dormir 7 ou 8 horas seguidas e ainda assim despertar com o corpo pesado, dor de cabeça e sensação de exaustão é uma experiência desanimadora. Essa queixa revela uma verdade fundamental da medicina do sono: **quantidade de horas não é sinônimo de qualidade de sono**.

Para acordar verdadeiramente restaurado, o corpo precisa completar ciclos harmoniosos de sono leve, sono profundo (ondas lentas) e sono REM.

### Os Principais Vilões da Qualidade do Sono
1. **Inércia do Sono Prolongada**: Ao acordar abruptamente no meio de um estágio de sono profundo, o cérebro leva até 30 minutos para dissipar a adenosina acumulada.
2. **Apneia Obstrutiva do Sono e Respiração Oral**: Dormir com a boca aberta ou ter microinterrupções respiratórias durante a noite impede que o cérebro atinja o sono profundo, causando cansaço matinal crônico.
3. **Consumo de Álcool ou Sedativos**: Medicamentos indutores sem orientação e álcool geram sedação química, mas suprimem o sono REM — fase essencial para a consolidação da memória e regulação emocional.
4. **Desidratação e Falta de Luz Matinal**: Passar a noite desidratado e acordar em um ambiente escuro sem exposição ao sol atrasa o pico matinal de cortisol, gerando sensação de lentidão.

### Como Melhorar o Despertar e a Energia Matinal
- **Exposição imediata à luz natural**: Abra as cortinas ou saia na varanda por 5 a 10 minutos logo ao levantar. A luz solar nos olhos interrompe a melatonina e ancora o relógio biológico.
- **Hidratação antes do café**: Beba um copo grande de água em temperatura ambiente antes da primeira xícara de café.
- **Movimente o corpo**: Alongue os braços e gire os ombros para estimular a circulação sanguínea.

### Exercício Prático: O Protocolo do Despertar em 3 Passos
Amanhã de manhã ao acordar:
1. **Passo 1 (Água)**: Beba 300 ml de água que você deixou no copo ao lado da cama.
2. **Passo 2 (Luz)**: Olhe em direção à janela aberta (sem olhar diretamente para o sol) por 3 minutos.
3. **Passo 3 (Respiração energizante)**: Faça 5 respirações profundas inflando o peito com vigor.

### Conclusão
Identificar os fatores que roubam a profundidade do seu sono permite fazer ajustes cirúrgicos na sua rotina para que suas manhãs voltem a ser cheias de clareza e vitalidade.

*Aviso: Ronco frequente, engasgos noturnos e sonolência excessiva durante o dia devem ser avaliados por um médico com exame de polissonografia.*',
  'Sono',
  'Sono',
  5,
  '"acordar cansado","sono profundo","qualidade do sono","inércia do sono","energia"'::text[],
  '"sono","energia","saude","habitos"'::text[],
  '"a-importancia-de-manter-horarios-regulares","habitos-durante-o-dia-que-ajudam-a-dormir-melhor","como-as-telas-afetam-a-qualidade-do-sono"'::text[],
  'Equipe de Psicologia e Medicina do Sono Respira',
  'Dr. Lucas Silveira (CRM 158.420)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-sono-8',
  'exercicios-de-respiracao-para-o-periodo-noturno',
  'Exercícios de respiração para o período noturno',
  'Técnicas de respiração cientificamente comprovadas para ativar o nervo vago, desacelerar o coração e induzir o sono.',
  'A respiração é a única função do sistema nervoso autônomo sobre a qual temos controle voluntário direto. Ao alterar conscientemente o ritmo e a proporção entre inspiração e expiração, enviamos um sinal neuroquímico imediato para o coração diminuir os batimentos e para o corpo desligar o estado de alerta.

No período noturno, técnicas respiratórias que prolongam a fase de saída do ar estimulam o nervo vago e pavimentam o caminho para um adormecer sereno.

### Por que a expiração prolongada induz o sono?
Quando inspiramos, o diafragma desce e o coração ganha um leve espaço a mais, acelerando sutilmente o ritmo cardíaco. Quando expiramos longamente, o diafragma sobe, o coração é comprimido de forma mínima e o nó sinoatrial reduz os batimentos cardíacos (arritmia sinusal respiratória).

Portanto, expirar por mais tempo do que se inspira é a chave mestra para induzir o relaxamento parassimpático.

### 3 Técnicas Noturnas Consagradas
1. **A Respiração 4-7-8**: Desenvolvida pelo Dr. Andrew Weil, atua como um tranquilizante natural para o sistema nervoso.
2. **A Respiração Diafragmática Suave**: Focar no movimento do abdômen em vez do peito retira a tensão do pescoço e dos ombros.
3. **A Respiração da Narina Alternada (Nadi Shodhana)**: Equilibra os hemisférios cerebrais e desacelera o fluxo mental antes de deitar.

### Exercício Prático: O Passo a Passo da Respiração 4-7-8 na Cama
Já deitado sob as cobertas na sua posição de dormir:
1. Feche os olhos e encoste a ponta da língua suavemente no céu da boca, logo atrás dos dentes incisivos superiores.
2. Esvazie todo o ar dos pulmões com um suspiro suave pela boca.
3. Feche a boca e inspire silenciosamente pelo nariz contando até **4**.
4. Segure o ar nos pulmões contando até **7**.
5. Solte o ar completamente pela boca com um som suave contando até **8**.
6. Repita o ciclo por 4 vezes consecutivas.

### Conclusão
Praticar exercícios respiratórios à noite não requer equipamentos nem esforço; basta reservar 3 minutos antes de apagar a luz para presentear seu corpo com a tranquilidade que ele merece.

*Aviso: Este conteúdo é educativo e voltado para a promoção do bem-estar.*',
  'Sono',
  'Sono',
  5,
  '"respiracao","4-7-8","nervo vago","sono","inducao"'::text[],
  '"sono","respiracao","praticas","relaxamento"'::text[],
  '"como-desacelerar-a-mente-antes-de-dormir","a-relacao-entre-ansiedade-e-dificuldade-para-dormir","o-que-fazer-quando-o-sono-nao-chega"'::text[],
  'Equipe de Psicologia e Medicina do Sono Respira',
  'Dr. Lucas Silveira (CRM 158.420)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-sono-9',
  'a-importancia-de-manter-horarios-regulares',
  'A importância de manter horários regulares',
  'Descubra o poder do ritmo circadiano e por que dormir e acordar no mesmo horário todos os dias é o maior aliado do seu sono e humor.',
  'O corpo humano é governado por um relógio mestre localizado no hipotálamo (o núcleo supraquiasmático), que orquestra milhares de relógios celulares em todos os nossos órgãos. Esse mecanismo intrínseco — o ritmo circadiano — adora previsibilidade e rotina.

Quando mantemos horários erráticos para dormir e acordar, criamos um estado crônico de descompasso conhecido como "jet lag social".

### O Que Acontece Quando os Horários Oscilam Demais?
Dormir às 23h durante a semana e às 03h no fim de semana confunde profundamente o sistema de regulação hormonal:
- O cérebro não sabe quando deve liberar o pico de melatonina à noite nem quando secretar o cortisol matinal;
- O apetite e o metabolismo ficam desregulados, aumentando a compulsão por doces e carboidratos simples;
- A imunidade diminui e o limiar para reações de ansiedade e irritabilidade cai drasticamente.

### O Poder da Âncora Matinal: Acorde no Mesmo Horário
Se você precisa escolher entre fixar o horário de deitar ou o horário de levantar, **escolha sempre fixar o horário de despertar**.

O horário em que você acorda e vê a luz da manhã define exatamente quando o seu corpo voltará a sentir sono cerca de 14 a 16 horas depois. Mesmo que você tenha dormido mal na noite anterior, levantar no horário habitual mantém o ritmo circadiano nos trilhos.

### Como Fazer Ajustes Graduais
Se você deseja mudar seu horário de sono, não tente antecipar 2 horas de uma só vez:
- Mude em incrementos graduais de 15 a 20 minutos a cada 3 dias;
- Mantenha a mesma janela de sono nos finais de semana, com variação máxima de 1 hora.

### Exercício Prático: A Definição da Sua Âncora de Sono
1. Escolha um horário realista de despertar que você consiga cumprir de segunda a domingo (ex: 07h00).
2. Subtraia 8 horas para encontrar seu horário alvo de deitar (ex: 23h00).
3. Comprometa-se a manter esse horário de despertar por 7 dias seguidos, independentemente de como foi a noite anterior.

### Conclusão
A consistência de horários é a ferramenta mais poderosa e gratuita da medicina do sono. Ao honrar o relógio do seu corpo, suas noites ganham profundidade e seus dias ganham energia.

*Aviso: Este conteúdo é informativo e visa o equilíbrio da rotina.*',
  'Sono',
  'Sono',
  5,
  '"horarios regulares","ritmo circadiano","relogio biologico","sono","rotina"'::text[],
  '"sono","habitos","saude","rotina"'::text[],
  '"por-que-acordamos-cansados-mesmo-depois-de-dormir","habitos-durante-o-dia-que-ajudam-a-dormir-melhor","como-criar-uma-rotina-noturna-saudavel"'::text[],
  'Equipe de Psicologia e Medicina do Sono Respira',
  'Dr. Lucas Silveira (CRM 158.420)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-sono-10',
  'habitos-durante-o-dia-que-ajudam-a-dormir-melhor',
  'Hábitos durante o dia que ajudam a dormir melhor',
  'O sono não começa na hora de deitar, mas sim nas decisões que você toma desde o momento em que abre os olhos pela manhã.',
  'Costumamos nos preocupar com o sono apenas quando apagamos as luzes do quarto e percebemos a dificuldade para adormecer. No entanto, a neurobiologia nos ensina que a qualidade de uma boa noite de sono é construída ao longo de todas as 16 horas de vigília anteriores.

A intensidade da nossa "pressão de sono" (o acúmulo da substância adenosina no cérebro) depende diretamente de como nos alimentamos, nos movemos e nos expomos à luz durante o dia.

### 1. Banho de Luz Solar Matinal
Receber luz natural nos olhos nos primeiros 30 minutos após despertar calibra o relógio biológico e programa o cérebro para secretar melatonina pontualmente no início da noite.
- Caminhe até a janela ou tome o café da manhã na varanda por 10 a 15 minutos.

### 2. Atividade Física e Gasto de Energia Física
O cérebro moderno vive exausto de cansaço mental, mas o corpo muitas vezes permanece sedentário. Essa disparidade gera uma mente acelerada em um corpo que não gastou energia motora suficiente.
- 30 minutos de caminhada, musculação ou natação durante o dia aumentam substancialmente a porcentagem de sono profundo restaurador à noite.

### 3. Gestão Consciente de Cafeína e Estimulantes
A meia-vida da cafeína no organismo humano varia entre 5 e 8 horas. Isso significa que metade do café tomado às 16h ainda estará circulando no cérebro às 23h, bloqueando os receptores de cansaço sem que você perceba.
- Estabeleça como regra beber a última xícara de café até as 14h.

### 4. Pausas de Descompressão ao Longo do Dia
Se você passar o dia inteiro acumulando tensão sem nenhum intervalo de relaxamento, o corpo chegará à noite em estado de alerta máximo.
- Fazer pausas de 3 minutos para respirar ou esticar os braços entre tarefas evita o acúmulo de sobrecarga no fim da tarde.

### Exercício Prático: O Plano Diurno dos 3 Pontos
Hoje durante o seu dia:
1. **Manhã**: Exponha-se a 10 minutos de luz natural.
2. **Tarde**: Pare de consumir café e energéticos a partir das 14h.
3. **Fim da tarde**: Faça 15 minutos de caminhada ou movimento corporal leve.

### Conclusão
Cuidar do sono é uma postura contínua de respeito pelo próprio ritmo biológico. Ao fazer escolhas gentis durante o dia, a noite se transforma naturalmente em um momento de repouso e restauração.

*Aviso: Este conteúdo é educativo e visa à promoção da saúde integral.*',
  'Sono',
  'Sono',
  5,
  '"habitos diurnos","sono","sol","exercicio","pressao de sono"'::text[],
  '"sono","habitos","estilo de vida","bem-estar"'::text[],
  '"a-importancia-de-manter-horarios-regulares","como-as-telas-afetam-a-qualidade-do-sono","como-criar-uma-rotina-noturna-saudavel"'::text[],
  'Equipe de Psicologia e Medicina do Sono Respira',
  'Dr. Lucas Silveira (CRM 158.420)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-bem-estar-1',
  'como-praticar-autocuidado-em-uma-rotina-corrida',
  'Como praticar autocuidado em uma rotina corrida',
  'Desmistifique a ideia de que autocuidado exige horas livres e aprenda a encaixar micropráticas restauradoras nos seus dias mais cheios.',
  'Nas redes sociais, o autocuidado é frequentemente retratado como um dia inteiro em um spa, viagens longas ou rituais matinais de duas horas. Para quem equilibra trabalho, família, estudos e tarefas domésticas, essa imagem parece inalcançável e gera ainda mais frustração.

O verdadeiro autocuidado não é um artigo de luxo, mas uma atitude prática de preservação da sua saúde mental ao longo do dia comum.

### O Conceito de Microautocuidado
O microautocuidado baseia-se na premissa de que intervenções de 1 a 3 minutos realizadas com atenção plena têm um poder cumulativo impressionante de regulação do estresse.

Trata-se de encontrar "ilhas de presença" dentro das atividades que você já precisa realizar obrigatoriamente:
- Sentir o calor da água e o aroma do sabonete durante o banho em vez de planejar reuniões;
- Beber um café ou chá saboreando cada gole sem olhar para as notificações do celular;
- Fazer 3 respirações profundas enquanto o computador inicializa.

### As 4 Dimensões do Autocuidado Real
1. **Físico**: Hidratação regular, postura alinhada na cadeira e alongamento da coluna.
2. **Emocional**: Permitir-se dizer "não" a convites que sobrecarregam seu tempo e aceitar seus sentimentos sem autocrítica.
3. **Mental**: Fazer uma pausa para olhar para a janela e descansar a vista das telas.
4. **Social**: Manter conversas com pessoas que recarregam sua energia em vez de drená-la.

### Exercício Prático: A Pausa dos 60 Segundos de Autocompaixão
Em qualquer momento do seu dia agitado:
1. Pare o que estiver fazendo e apoie as duas mãos suavemente sobre o peito.
2. Reconheça a pressão do momento: *"Este é um momento exigente do meu dia."*
3. Ofereça gentileza a si mesmo: *"Que eu possa ter paciência e cuidar de mim enquanto cumpro o que é necessário."*
4. Respire fundo e retome a tarefa com mais espaço interno.

### Conclusão
Autocuidado não é algo que você faz quando "sobra tempo", mas o que garante que você continue de pé com saúde e dignidade no meio da correria da vida.

*Aviso: Este conteúdo é educativo e visa o desenvolvimento pessoal.*',
  'Bem-estar',
  'Bem-estar',
  5,
  '"autocuidado","rotina","tempo","microhabitos","vida corrida"'::text[],
  '"bem-estar","autocuidado","habitos","rotina"'::text[],
  '"a-importancia-das-pequenas-pausas-durante-o-dia","como-criar-uma-rotina-emocionalmente-saudavel","como-criar-habitos-de-autocuidado-duradouros"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-bem-estar-2',
  'a-importancia-das-pequenas-pausas-durante-o-dia',
  'A importância das pequenas pausas durante o dia',
  'Descubra a neurociência dos ritmos ultradianos e por que intervalos estratégicos de 3 minutos aumentam seu foco e previnem o esgotamento.',
  'Trabalhar por quatro, cinco ou seis horas ininterruptas olhando para uma tela sem levantar da cadeira costuma ser elogiado na cultura da pressa como sinal de foco absoluto. No entanto, a neurofisiologia humana não foi programada para manter a atenção sustentada sem intervalos regulares de recuperação.

Assim como os músculos precisam de pausas entre séries de exercícios para não romper fibras, o cérebro exige momentos de descompressão para consolidar aprendizados e limpar resíduos metabólicos.

### Os Ritmos Ultradianos do Cérebro
A cada 90 a 120 minutos de atividade mental focada, o cérebro atinge o limite superior do seu ciclo ultradiano. A partir desse ponto, os níveis de glicose e neurotransmissores no córtex pré-frontal diminuem, e o corpo emite sinais claros de saturação:
- Queda brusca na capacidade de concentração;
- Dificuldade para tomar decisões simples;
- Bocejos e vontade repentina de comer doces ou cafeína;
- Aumento de erros por desatenção.

Se você insiste em continuar sem pausar, o esforço exigido para realizar a mesma tarefa dobra, gerando exaustão ao final da tarde.

### O Que É uma "Pausa Real"?
Muitas pessoas acreditam que fazer uma pausa é parar de trabalhar no computador e abrir o Instagram no celular. Isso **não é descanso**: as redes sociais mantêm o córtex visual e o sistema de processamento de informações trabalhando em sobrecarga.
- **Pausa restauradora**: Levantar-se, olhar para longe na linha do horizonte (relaxando os músculos oculares), beber água, respirar com calma ou alongar o corpo.

### Exercício Prático: O Protocolo 50/5
Configure um alarme suave para hoje:
1. Trabalhe focado por 50 minutos.
2. Quando o alarme tocar, levante-se por 5 minutos inteiros.
3. Não olhe nenhuma tela durante esses 5 minutos.
4. Gire os ombros para trás 10 vezes e beba 1 copo d''água.
5. Volte para a tarefa e perceba a renovação instantânea do seu foco.

### Conclusão
Pausar não é interrupção do trabalho; é a manutenção essencial que garante que seu cérebro continue funcionando com clareza, criatividade e bem-estar.

*Aviso: Este conteúdo é educativo e focado em produtividade sustentável.*',
  'Bem-estar',
  'Bem-estar',
  5,
  '"pausas","ritmos ultradianos","foco","fadiga","produtividade sustentavel"'::text[],
  '"bem-estar","produtividade","foco","habitos"'::text[],
  '"como-praticar-autocuidado-em-uma-rotina-corrida","descansar-tambem-faz-parte-da-produtividade","como-diminuir-a-sobrecarga-mental"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-bem-estar-3',
  'como-aprender-a-respeitar-os-proprios-limites',
  'Como aprender a respeitar os próprios limites',
  'Aprenda a reconhecer seus sinais de saturação, dizer "não" com firmeza e gentileza e construir barreiras protetoras para sua energia.',
  'Dizer "sim" para todas as demandas de colegas, amigos e familiares enquanto dizemos "não" para as nossas próprias necessidades básicas de descanso e saúde é uma das causas primordiais do esgotamento emocional.

Aprender a estabelecer limites não é egoísmo nem grosseria; é a condição indispensável para que suas relações sejam genuínas, saudáveis e sustentáveis a longo prazo.

### Por que Temos Tanto Medo de Estabelecer Limites?
Na raiz da dificuldade de dizer "não" estão medos psicológicos comuns:
- **Medo da rejeição ou do abandono**: A crença de que só seremos amados se formos constantemente úteis e disponíveis.
- **Medo do conflito**: O impulso de evitar qualquer momento de desconforto imediato, mesmo ao custo do sofrimento a longo prazo.
- **Culpa internalizada**: Achar que descansar ou priorizar a própria saúde é uma atitude indigna.

### O Preço Oculto do Limite Ausente
Quando não dizemos um "não" consciente com a boca, o corpo acaba dizendo um "não" violento por meio de sintomas: enxaquecas, crises de ansiedade, apatia, gastrite e explosões de irritabilidade com quem não tem nada a ver com o problema.

### 3 Fórmulas Gentis para Dizer "Não" com Firmeza
1. *"Agradeço muito pelo convite/proposta, mas no momento estou comprometido(a) com outras prioridades e não conseguirei me dedicar como gostaria."*
2. *"Eu adoraria ajudar, mas hoje estou no meu limite de energia e preciso descansar."*
3. *"Não consigo assumir isso agora, mas posso indicar outra pessoa ou rever isso na semana que vem."*

### Exercício Prático: O Mapeamento do "Sim Cansado"
Pegue um papel e responda:
1. *"A qual demanda recente eu disse ''sim'' por obrigação, enquanto todo o meu corpo gritava ''não''?"*
2. *"Qual o preço que minha saúde pagou por essa escolha?"*
3. *"Qual limite saudável eu preciso comunicar com clareza nos próximos dias?"*

### Conclusão
Respeitar seus próprios limites ensina aos outros como tratar você. Quem ama e valoriza você de verdade respeitará o seu espaço.

*Aviso: Este conteúdo é educativo e visa o fortalecimento da autonomia emocional.*',
  'Bem-estar',
  'Bem-estar',
  5,
  '"limites","dizer nao","autoestima","energia","relacoes"'::text[],
  '"bem-estar","emocional","relacoes","autocuidado"'::text[],
  '"como-criar-uma-rotina-emocionalmente-saudavel","como-ter-uma-relacao-saudavel-com-a-produtividade","como-diminuir-a-sobrecarga-mental"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-bem-estar-4',
  'como-criar-uma-rotina-emocionalmente-saudavel',
  'Como criar uma rotina emocionalmente saudável',
  'Construa um cotidiano equilibrado que combine compromissos, momentos de respiro, afeto e descanso sem cair no perfeccionismo rígido.',
  'Muitas pessoas associam rotina a monotonia, aprisionamento ou tabelas rígidas que causam frustração ao primeiro imprevisto. No entanto, na psicologia, uma rotina bem desenhada funciona como uma rede de proteção emocional: ela poupa sua mente de tomar centenas de decisões triviais e traz previsibilidade e segurança ao seu sistema nervoso.

Uma rotina emocionalmente saudável não busca a perfeição inflexível, mas sim a harmonia entre esforço, prazer e descanso.

### Os 4 Pilares de um Dia Equilibrado
1. **Âncoras de Início e Fim**: Ter rituais claros de abertura da manhã (sem telas nos primeiros minutos) e de encerramento da noite (redução de luzes) define o ritmo biológico.
2. **Blocos de Foco Protegido**: Agrupar tarefas semelhantes em blocos de 60 a 90 minutos evita a dispersão de atenção gerada pela alternância constante de atividades.
3. **Momentos Não Negociáveis de Recuperação**: Reservar pelo menos 30 minutos diários para atividades sem finalidade produtiva (ler por prazer, caminhar, ouvir música, conversar).
4. **Espaço para o Imprevisto (Margem de Segurança)**: Nunca planejar 100% das horas do seu dia; deixe 20% do tempo livre para acomodar emergências sem gerar desespero.

### A Armadilha da Rigidez
A vida é dinâmica. Se você planejou fazer exercícios às 07h e teve uma noite difícil, a maturidade emocional consiste em ajustar gentilmente o plano — talvez fazendo uma caminhada leve de 15 minutos — em vez de abandonar tudo sob a mentalidade de "oito ou oitenta".

### Exercício Prático: O Desenho da Semana com Cores
Divida suas atividades diárias em 3 categorias no papel:
- **Cor Azul (Obrigações e Trabalho)**: Reuniões, tarefas, estudos;
- **Cor Verde (Manutenção e Saúde)**: Refeições calmas, sono, exercícios físicos;
- **Cor Amarela (Prazer e Conexão)**: Conversas com amigos, lazer, silêncio.
Observe se o seu dia está pintado quase que inteiramente de azul e resgate intencionalmente pequenos blocos verdes e amarelos.

### Conclusão
Uma rotina emocionalmente saudável deve servir à sua vida e ao seu bem-estar, e não o contrário. Construa seu dia com gentileza e flexibilidade.

*Aviso: Este conteúdo é educativo e visa apoiar a organização pessoal.*',
  'Bem-estar',
  'Bem-estar',
  6,
  '"rotina saudavel","equilibrio","organizacao","flexibilidade","emocoes"'::text[],
  '"bem-estar","rotina","organizacao","habitos"'::text[],
  '"como-praticar-autocuidado-em-uma-rotina-corrida","descansar-tambem-faz-parte-da-produtividade","como-criar-habitos-de-autocuidado-duradouros"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-bem-estar-5',
  'descansar-tambem-faz-parte-da-produtividade',
  'Descansar também faz parte da produtividade',
  'Desconstrua a culpa pelo repouso e compreenda como o descanso estratégico potencializa a criatividade, a memória e a clareza mental.',
  'Vivemos em uma sociedade que transformou a exaustão em troféu e o descanso em motivo de culpa. Frases como *"trabalhe enquanto eles dormem"* propagam a ilusão perigosa de que o valor de um ser humano é medido exclusivamente pela sua taxa de produção ininterrupta.

No entanto, a neurociência e a biologia comprovam exatamente o oposto: o descanso não é o oposto do trabalho, mas a sua etapa complementar indispensável.

### O Cérebro em Modo Padrão (Default Mode Network)
Quando você para de executar tarefas deliberadas e permite que a mente divague durante um banho, uma caminhada ou um momento de contemplação, uma rede neural específica chamada *Default Mode Network (DMN)* é ativada.

É nessa rede que ocorrem os processos mentais mais sofisticados:
- Consolidação de memórias de longo prazo;
- Associação de ideias aparentemente desconexas (a origem dos famosos *insights* criativos);
- Processamento e regulação de experiências emocionais complexas.

Sem descanso, sua mente perde a profundidade analítica e passa a operar apenas no modo reativo e superficial.

### Os 7 Tipos de Descanso Necessários
Segundo a pesquisadora Dra. Saundra Dalton-Smith, o ser humano necessita de diferentes formas de repouso:
1. **Descanso Físico**: Sono, cochilos, alongamentos e massagens;
2. **Descanso Mental**: Pausas nas decisões e no fluxo de tarefas;
3. **Descanso Sensorial**: Silêncio, luz baixa e ausência de telas;
4. **Descanso Criativo**: Contemplar a natureza, arte ou música sem obrigação de produzir nada;
5. **Descanso Emocional**: Espaço para ser vulnerável e autêntico sem precisar "manter as aparências";
6. **Descanso Social**: Afastar-se de relações tóxicas e estar consigo mesmo ou com quem traz paz;
7. **Descanso Espiritual**: Conectar-se com algo maior, propósito e significado de vida.

### Exercício Prático: O Compromisso da Não Ação (15 Minutos)
Reserve um bloco de 15 minutos hoje:
1. Sente-se confortavelmente perto de uma janela ou de uma planta.
2. Não pegue o celular, não leia livros, não ouça podcasts nem faça planos.
3. Permita-se simplesmente existir e observar o ambiente ao seu redor.
4. Quando a culpa do *"deveria estar produzindo"* surgir, diga a si mesmo: *"Meu descanso agora está nutrindo minha saúde de amanhã."*

### Conclusão
Você não precisa merecer o descanso por ter atingido uma meta; o descanso é um direito biológico fundamental da sua existência.

*Aviso: Este conteúdo é educativo e visa a reflexão sobre autocuidado e saúde.*',
  'Bem-estar',
  'Bem-estar',
  5,
  '"descanso","produtividade","culpa","criatividade","recuperacao"'::text[],
  '"bem-estar","produtividade","descanso","mente"'::text[],
  '"como-ter-uma-relacao-saudavel-com-a-produtividade","a-importancia-das-pequenas-pausas-durante-o-dia","como-diminuir-a-sobrecarga-mental"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-bem-estar-6',
  'como-diminuir-a-sobrecarga-mental',
  'Como diminuir a sobrecarga mental',
  'Aprenda a mapear e descarregar o peso invisível das mil tarefas, prazos e responsabilidades que lotam sua cabeça todos os dias.',
  'Lembrar de pagar a conta de luz, checar se há café na despensa, responder e-mails pendentes, marcar consulta médica, conferir a lição de casa das crianças e planejar a pauta da reunião de amanhã. Esse trabalho constante de gestão e monitoramento mental é conhecido como **carga mental invisível**.

Mesmo quando você está fisicamente sentado sem fazer nada aparente, sua mente continua rodando dezenas de processos em segundo plano, consumindo glicose e gerando uma exaustão profunda.

### As Consequências da Sobrecarga Não Gerenciada
- **Névoa mental (Brain Fog)**: Sensação constante de esquecimento, lentidão no raciocínio e perda de palavras simples;
- **Sensação de irritação e pavio curto**: Reagir com impaciência a perguntas banais de familiares ou colegas;
- **Insônia por hiperatividade mental**: Deitar e começar a listar tudo o que precisa ser feito nos próximos dias.

### 4 Passos para Reduzir a Carga Mental Hoje
1. **Tire tudo da cabeça (Externalização)**: A memória de trabalho humana não foi feita para guardar listas; use aplicativos de notas ou um caderno físico para centralizar todas as pendências.
2. **A Regra dos 2 Minutos**: Se uma tarefa leva menos de 2 minutos para ser resolvida (ex: responder uma mensagem curta, guardar um casaco), faça imediatamente em vez de guardá-la na mente.
3. **Delegue sem microgerenciamento**: Confie tarefas a parceiros, familiares ou colegas e aceite que eles farão do modo deles, e não exatamente do seu.
4. **Pratique o "Suficientemente Bom"**: Abandone o perfeccionismo em tarefas secundárias.

### Exercício Prático: O Esvaziamento em 3 Gavetas
Pegue uma folha e liste todas as pendências que estão na sua cabeça agora. Em seguida, marque cada uma com:
- **Gaveta 1 (Fazer hoje)**: Escolha no máximo 3 prioridades essenciais.
- **Gaveta 2 (Delegar ou adiar)**: O que pode ser passado a outro ou feito na próxima semana.
- **Gaveta 3 (Eliminar)**: O que você pode simplesmente desistir de fazer sem consequências graves.

### Conclusão
Sua mente é um espaço sagrado para pensar, criar e sentir afeto, não um armazém de cobranças acumuladas. Descarregue o peso e respire com leveza.

*Aviso: Este conteúdo é educativo e visa a melhoria da qualidade de vida.*',
  'Bem-estar',
  'Bem-estar',
  5,
  '"sobrecarga mental","trabalho invisivel","organizacao","delegar","clareza"'::text[],
  '"bem-estar","mente","organizacao","autocuidado"'::text[],
  '"descansar-tambem-faz-parte-da-produtividade","como-praticar-autocuidado-em-uma-rotina-corrida","como-aprender-a-respeitar-os-proprios-limites"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-bem-estar-7',
  'movimento-e-atividade-fisica-para-o-bem-estar',
  'Movimento e atividade física para o bem-estar',
  'Compreenda a relação direta entre o movimento do corpo e a regulação do humor, da ansiedade e da neuroquímica cerebral.',
  'Durante muito tempo, o exercício físico foi promovido na sociedade quase exclusivamente por motivos estéticos ou de perda de peso. No entanto, para a neurociência e a psiquiatria contemporâneas, o movimento corporal é a intervenção biológica mais potente e transformadora para o cérebro humano.

Quando movimentamos o corpo, enviamos uma mensagem molecular direta ao sistema nervoso de que não estamos paralisados nem derrotados pelo estresse.

### A Farmácia Natural do Cérebro em Movimento
Apenas 20 minutos de atividade física moderada desencadeiam uma cascata de compostos benéficos:
- **BDNF (Fator Neurotrófico Derivado do Cérebro)**: Estimula o nascimento de novos neurônios e fortalece a plasticidade cerebral no hipocampo (área da memória e do humor).
- **Endorfinas e Endocanabinoides**: Promovem alívio de dores físicas, sensação de bem-estar e relaxamento mental prolongado.
- **Dopamina e Serotonina**: Elevam a motivação, o senso de realização e a estabilidade emocional.
- **Queima do Cortisol Residual**: Utiliza os estoques de energia estressora acumulada nos músculos, dissipando a agitação interna.

### Como Superar a Barreira do Início
Se você está passando por um período de tristeza, ansiedade ou cansaço, a ideia de ir para uma academia lotada pode parecer esmagadora. A solução é redefinir o que conta como movimento:
- Uma caminhada de 15 minutos ouvindo música ao redor da sua quadra;
- Dançar duas músicas favoritas na sala de casa;
- Alongar o corpo sobre um tapete com respiração consciente;
- Subir lances de escada em vez de usar o elevador.

### Exercício Prático: O Teste dos 10 Minutos de Caminhada
Quando a indisposição mental tentar paralisar você:
1. Vista um calçado confortável e faça um pacto consigo mesmo: *"Vou caminhar por apenas 10 minutos. Se ao final dos 10 minutos eu ainda quiser voltar, eu volto."*
2. Quase sempre, a mudança na circulação sanguínea quebra a inércia mental e você se sente motivado a continuar por mais tempo.

### Conclusão
O corpo e a mente são uma unidade inseparável. Ao cuidar do movimento do seu corpo, você oferece à sua mente o melhor ambiente biológico para florescer em equilíbrio e paz.

*Aviso: Consulte um profissional de educação física e médico antes de iniciar programas intensos de exercícios.*',
  'Bem-estar',
  'Bem-estar',
  5,
  '"atividade fisica","movimento","endorfina","saude mental","exercicio"'::text[],
  '"bem-estar","corpo","exercicio","saude"'::text[],
  '"habitos-durante-o-dia-que-ajudam-a-dormir-melhor","como-criar-uma-rotina-emocionalmente-saudavel","gratidao-sem-ignorar-as-emocoes-dificeis"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-bem-estar-8',
  'como-ter-uma-relacao-saudavel-com-a-produtividade',
  'Como ter uma relação saudável com a produtividade',
  'Aprenda a produzir com significado e foco sem vincular seu valor como pessoa à quantidade de tarefas concluídas na lista.',
  'A busca por realização profissional e aprendizado é um desejo legítimo e saudável. O problema surge quando a produtividade se torna **tóxica** — ou seja, quando você passa a condicionar seu valor, dignidade e merecimento de afeto à quantidade de caixas marcadas na lista de afazeres.

Nesse padrão disfuncional, um dia com tarefas pendentes gera uma sensação desproporcional de fracasso, vergonha e inadequação pessoal.

### Sinais de que Sua Relação com a Produtividade Está Tóxica
- **Sensação permanente de débito**: Mesmo após um dia de trabalho intenso, a mente foca exclusivamente no que não deu tempo de fazer.
- **Incapacidade de desfrutar momentos de lazer**: Sentir angústia ao assistir a um filme ou passar tempo com a família pensando que *"deveria estar adiantando trabalho"*.
- **Medo paralisante de errar**: Gastar horas revisando detalhes irrelevantes por medo de qualquer imperfeição mínima.

### Da Produtividade Tóxica à Produtividade Sustentável
1. **Foco no Essencial em vez de Quantidade**: Pergunte-se *"Qual é a única tarefa que, se feita hoje com excelência, tornará o meu dia significativo?"*.
2. **Definição Clara de "Fim de Expediente"**: Estabeleça um horário para fechar o computador e guardar o material de trabalho, marcando uma fronteira nítida entre o trabalhador e a pessoa.
3. **Celebração das Pequenas Conquistas**: Ao final do dia, reconheça o esforço empregado, e não apenas o resultado perfeito.

### Exercício Prático: A Lista do "Já Realizado" (Ta-Da List)
Em vez de focar apenas naquilo que falta fazer:
1. No fim da tarde, pegue uma folha e liste tudo o que você fez hoje (inclusive manter a calma em uma conversa difícil, preparar um almoço ou ajudar um colega).
2. Olhe para a lista e diga com sinceridade: *"Eu fiz o melhor que pude com a energia e os recursos que tinha hoje."*

### Conclusão
Você é um ser humano completo dotado de sentimentos, sonhos e afetos, e não uma máquina de processamento contínuo. Produza com propósito, mas viva com presença e compaixão.

*Aviso: Este conteúdo é educativo e visa à promoção da saúde emocional no trabalho.*',
  'Bem-estar',
  'Bem-estar',
  5,
  '"produtividade toxica","significado","perfeccionismo","autoestima","equilibrio"'::text[],
  '"bem-estar","produtividade","carreira","mente"'::text[],
  '"descansar-tambem-faz-parte-da-produtividade","como-aprender-a-respeitar-os-proprios-limites","como-diminuir-a-sobrecarga-mental"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-bem-estar-9',
  'gratidao-sem-ignorar-as-emocoes-dificeis',
  'Gratidão sem ignorar as emoções difíceis',
  'Descubra a diferença entre a verdadeira gratidão reflexiva e o otimismo tóxico que tenta silenciar a dor e o luto legítimos.',
  'A prática da gratidão ganhou enorme destaque nos últimos anos devido aos seus benefícios comprovados na redução do estresse e no fortalecimento das relações. No entanto, quando mal compreendida, ela pode se transformar em **positividade tóxica** — a imposição forçada de um sorriso constante e a rejeição de emoções legítimas como tristeza, frustração ou medo.

A verdadeira gratidão não exige que você finja que está tudo bem quando não está; ela permite que a dor e a apreciação pelas coisas boas coexistam no mesmo coração.

### O Que É Positividade Tóxica?
- *"Pense positivo e tudo se resolverá"* diante de uma perda real ou doença;
- Sentir culpa por estar triste quando *"tantas pessoas estão em situação pior"*;
- Silenciar o desabafo de amigos com frases feitas e clichês motivacionais.

Negar emoções difíceis não as faz desaparecer; apenas as empurra para o subconsciente, onde fermentam na forma de ansiedade ou queixas físicas.

### A Gratidão Autêntica e Integradora
A gratidão madura não apaga a tempestade, mas reconhece o abrigo que nos protege no meio dela.
Você pode estar legitimamente chateado com um problema no trabalho e, ao mesmo tempo, sentir gratidão pelo abraço caloroso do seu filho ou pelo sabor de uma refeição quente.

### Exercício Prático: O Exercício do "E Também"
Sempre que estiver vivenciando uma situação desafiadora:
1. Nomeie a dor sem atenuar: *"Estou sentindo tristeza e insegurança por causa desse projeto difícil..."*
2. Adicione a conjunção integradora: *"... e também sou grato(a) por ter a saúde e o apoio de amigos para enfrentar esse momento."*
3. Perceba como essa frase honra sua dor sem deixar que ela apague os outros aspectos da sua vida.

### Conclusão
Você não precisa escolher entre ser realista e ser grato. Ao dar espaço para todas as suas cores emocionais, sua vida ganha profundidade, maturidade e beleza autêntica.

*Aviso: Este conteúdo é educativo e voltado para a saúde emocional.*',
  'Bem-estar',
  'Bem-estar',
  5,
  '"gratidao","positividade toxica","emocoes dificeis","autenticidade","acolhimento"'::text[],
  '"bem-estar","emocional","mente","acolhimento"'::text[],
  '"como-acolher-emocoes-desconfortaveis","como-identificar-e-nomear-suas-emocoes","como-criar-uma-rotina-emocionalmente-saudavel"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-bem-estar-10',
  'como-criar-habitos-de-autocuidado-duradouros',
  'Como criar hábitos de autocuidado duradouros',
  'Entenda a ciência da formação de hábitos, o poder das metas pequenas e como manter a consistência sem depender da motivação volátil.',
  'Todo início de ano ou de mês nos enchemos de entusiasmo e planejamos mudanças radicais: meditar 45 minutos todo dia, cortar completamente o açúcar, acordar às 5h da manhã e ler 50 páginas por noite. Duas semanas depois, a rotina atropela esses planos e a frustração toma conta.

Essa quebra não acontece por falta de força de vontade, mas porque tentar mudar tudo de uma vez ativa o alarme de perigo do cérebro, que prefere a segurança dos caminhos neurais conhecidos.

### A Anatomia do Hábito (Gatilho, Rotina e Recompensa)
Todo comportamento automático segue um circuito de 3 etapas no cérebro (especificamente nos gânglios da base):
1. **Gatilho (Deixa)**: O estímulo ambiental que avisa ao cérebro para entrar no piloto automático (ex: colocar o sapato de caminhada ao lado da cama).
2. **Rotina**: O comportamento em si (ex: caminhar por 15 minutos).
3. **Recompensa**: A sensação imediata de alívio, frescor ou satisfação que fixa o circuito neural.

### O Poder dos Mini-Hábitos (Micro-Passos)
Se uma ação for tão pequena que seja impossível falhar, o cérebro não oferece resistência:
- Em vez de meditar 30 minutos: faça **2 minutos de respiração consciente** no Respira;
- Em vez de ler 1 hora: leia **2 páginas** de um livro antes de apagar a luz;
- Em vez de uma hora de treino: faça **5 minutos de alongamento** na sala.

A consistência diária de um hábito pequeno gera raízes neurais infinitamente mais sólidas do que o esforço heróico e esporádico.

### Exercício Prático: O Empilhamento de Hábitos (Habit Stacking)
Conecte seu novo hábito a um comportamento automático que você já realiza todos os dias:
- *"Depois que eu escovar os dentes pela manhã, farei 1 minuto de respiração profunda."*
- *"Depois que eu fechar o computador do trabalho, beberei 1 copo grande de água."*
- *"Depois que eu me deitar na cama, abrirei o Diário do Respira para registrar meu humor."*

### Conclusão
Grandes transformações na sua saúde mental não nascem de revoluções dramáticas, mas da repetição gentil de pequenos gestos diários que dizem a você: *"Eu me importo comigo."*

*Aviso: Este conteúdo é informativo e visa ao aprimoramento dos hábitos de vida.*',
  'Bem-estar',
  'Bem-estar',
  5,
  '"habitos duradouros","consistencia","neurociencia","pequenas mudancas","rotina"'::text[],
  '"bem-estar","habitos","estilo de vida","consistencia"'::text[],
  '"como-praticar-autocuidado-em-uma-rotina-corrida","como-criar-uma-rotina-emocionalmente-saudavel","a-importancia-das-pequenas-pausas-durante-o-dia"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-regulacao-1',
  'o-que-e-regulacao-emocional',
  'O que é regulação emocional?',
  'Compreenda o conceito de regulação emocional, por que ela difere da repressão e como desenvolver flexibilidade diante dos altos e baixos da vida.',
  'Regulação emocional é a capacidade humana de reconhecer, processar e modular a intensidade e a duração das nossas respostas emocionais de forma adaptativa. Longe de significar frieza, insensibilidade ou repressão, regular as emoções é a arte de criar um espaço consciente entre o que você sente e o que você decide fazer a respeito.

Quando estamos bem regulados, as emoções continuam surgindo com toda a sua riqueza e intensidade natural, mas deixam de nos sequestrar em reações impulsivas e autodestrutivas.

### Regulação Não É Repressão
É comum confundir regular com reprimir:
- **Repressão**: Negar o que sente, engolir o choro, fingir que nada aconteceu e acumular mágoa no corpo até explodir.
- **Regulação**: Perceber a emoção no corpo, nomeá-la com clareza, compreender sua mensagem e escolher a melhor forma de expressá-la ou acalmá-la.

### O Modelo de Processo de James Gross
O pesquisador Dr. James Gross, referência mundial no estudo das emoções, divide a regulação em cinco pontos de intervenção:
1. **Seleção da Situação**: Escolher evitar ambientes que sabidamente disparam gatilhos desnecessários.
2. **Modificação da Situação**: Ajustar o ambiente para diminuir a pressão.
3. **Direcionamento da Atenção**: Tirar o foco da ruminação e focar no momento presente.
4. **Reavaliação Cognitiva**: Mudar a interpretação mental sobre o significado do evento.
5. **Modulação da Resposta**: Usar respiração e relaxamento muscular para acalmar o corpo físico.

### A Janela de Tolerância
Cada um de nós possui uma "janela de tolerância" — uma faixa na qual conseguimos lidar com as pressões da vida sem entrar em hiperativação (raiva explosiva, pânico) ou hipoativação (apatia, paralisia e desligamento emocional). Práticas regulares de atenção e respiração ampliam essa janela.

### Exercício Prático: O Espaço de 3 Segundos
Na próxima vez que sentir uma emoção intensa surgir:
1. Pare o corpo físico por 3 segundos.
2. Diga mentalmente: *"Estou sentindo raiva/medo agora. É uma onda emocional e eu posso esperar 3 segundos antes de falar ou agir."*
3. Solte um longo suspiro e observe a clareza retornando à sua mente.

### Conclusão
Regular as emoções é uma habilidade que se aprimora com treino e compaixão. Ao acolher o que você sente, você se torna o condutor seguro da sua própria experiência interna.

*Aviso: Este conteúdo é educativo e visa o aprimoramento da inteligência emocional.*',
  'Regulação',
  'Regulação',
  5,
  '"regulacao emocional","neurociencia","autocontrole","flexibilidade","mente"'::text[],
  '"regulacao","emocoes","psicologia","autocuidado"'::text[],
  '"como-identificar-e-nomear-suas-emocoes","como-responder-sem-agir-por-impulso","como-a-respiracao-ajuda-a-regular-o-corpo"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-regulacao-2',
  'tecnica-5-4-3-2-1-para-voltar-ao-presente',
  'Técnica 5-4-3-2-1 para voltar ao presente',
  'Aprenda o passo a passo da mais consagrada técnica de ancoragem sensorial para interromper crises de ansiedade e sobrecarga mental.',
  'Quando a mente é tomada por uma crise de ansiedade, memórias intrusivas ou pensamentos em espiral, perdemos o contato com a realidade física imediata. O cérebro viaja para um futuro aterrorizante ou para um passado doloroso, esquecendo que o corpo está em segurança no presente.

A técnica de aterramento sensorial **5-4-3-2-1** é uma ferramenta de emergência neurobiológica projetada para forçar o cérebro a reconectar-se com os cinco sentidos físicos, desligando o piloto automático do pânico.

### Por que a Ancoragem Sensorial Funciona?
O córtex pré-frontal e as áreas sensoriais do cérebro competem por recursos neurais com a amígdala (o centro do medo). Ao obrigar sua atenção a buscar detalhes minuciosos no ambiente — como cores, texturas e temperaturas —, você reduz a atividade elétrica nas áreas do medo e reativa as áreas da razão e da presença.

### O Roteiro Passo a Passo do 5-4-3-2-1
Olhe ao seu redor e identifique deliberadamente:
1. **5 coisas que você pode VER**: Procure detalhes pequenos (uma rachadura na parede, o tom exato de verde de uma folha, a sombra projetada pelo copo, uma estampa no tecido).
2. **4 coisas que você pode TOCAR**: Sinta a textura da sua calça jeans, a temperatura fria da mesa de madeira, o peso do celular na mão ou o tecido macio da sua blusa.
3. **3 coisas que você pode OUVIR**: Escute além dos sons óbvios (o zumbido distante da geladeira, o vento nas janelas, o som da própria respiração).
4. **2 coisas que você pode CHEIRAR**: Sinta o aroma do café na xícara, o cheiro do sabonete nas mãos ou o ar fresco do ambiente.
5. **1 coisa que você pode SABOREAR**: Perceba o sabor residual de uma bala, de um gole de água ou passe a língua nos dentes notando a textura interna da boca.

### Finalização com Respiração Consciente
Ao concluir os 5 passos, feche os olhos por 10 segundos, apoie os pés firmemente no chão e solte um longo suspiro, percebendo que você está aqui e agora, seguro no seu espaço.

### Conclusão
A técnica 5-4-3-2-1 é portátil, discreta e pode ser praticada em qualquer lugar: no transporte público, antes de uma reunião ou no silêncio do seu quarto. Ela é sua âncora pessoal para voltar para casa.

*Aviso: Este conteúdo é educativo e pode ser utilizado como ferramenta complementar em momentos de ansiedade.*',
  'Regulação',
  'Regulação',
  5,
  '"5-4-3-2-1","ancoragem","grounding","sentidos","presenca"'::text[],
  '"regulacao","ancoragem","crise","mindfulness"'::text[],
  '"o-que-e-regulacao-emocional","tecnicas-de-aterramento-para-momentos-intensos","estrategias-para-momentos-de-sobrecarga-emocional"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-regulacao-3',
  'como-identificar-e-nomear-suas-emocoes',
  'Como identificar e nomear suas emoções',
  'Aprenda a ciência da "Granularidade Emocional" e descubra por que dar o nome exato ao que você sente acalma imediatamente o cérebro.',
  'Quando alguém nos pergunta como estamos, a resposta quase sempre se resume a *"tudo bem"* ou *"estou mal/estressado"*. Usar termos vagos para descrever o que se passa dentro de nós é como tentar navegar em um oceano usando um mapa sem nomes de cidades.

A neurocientista Dra. Lisa Feldman Barrett demonstrou que quanto maior a sua **granularidade emocional** — ou seja, a capacidade de identificar e nomear sentimentos com precisão cirúrgica —, mais rápido o cérebro consegue construir estratégias eficazes de regulação.

### O Princípio: "Nomeie para Domar" (Name It to Tame It)
Estudos de ressonância magnética funcional comprovam que o simples ato de colocar uma palavra exata em uma emoção desconfortável (como *"estou sentindo desapontamento"* em vez de apenas *"estou com raiva"*) ativa o córtex pré-frontal ventrolateral direito, diminuindo instantaneamente a reatividade da amígdala cerebral.

A linguagem funciona como um freio neural sobre a tempestade emocional.

### Ampliando seu Vocabulário Emocional
Em vez de dizer apenas que está "mal", explore nuances mais ricas:
- Em vez de apenas raiva: é *frustração*, *ressentimento*, *impotência* ou *indignação*?
- Em vez de apenas tristeza: é *solidão*, *luto*, *saudade*, *desânimo* ou *vulnerabilidade*?
- Em vez de apenas medo: é *apreensão*, *insegurança*, *cautela* ou *hesitação*?

### Exercício Prático: O Mapa das 3 Perguntas Emocionais
Sempre que sentir uma agitação interna confusa:
1. *"Onde essa sensação está localizada no meu corpo?"* (Peito apertado, nó na garganta, barriga fria).
2. *"Se essa sensação tivesse um nome exato, qual seria?"* (Consulte a lista de emoções do Respira no seu Diário).
3. *"Qual é a necessidade real que essa emoção está tentando me comunicar?"* (Descanso, limites, acolhimento, diálogo).

### Conclusão
Nomear suas emoções não é frescura intelectual; é um ato de autoconhecimento profundo que transforma o caos interno em clareza e paz de espírito.

*Aviso: Este conteúdo é educativo e visa o desenvolvimento da inteligência emocional.*',
  'Regulação',
  'Regulação',
  5,
  '"granularidade emocional","nomear emocoes","autoconhecimento","linguagem","mente"'::text[],
  '"regulacao","emocoes","autoconhecimento","psicologia"'::text[],
  '"o-que-e-regulacao-emocional","como-acolher-emocoes-desconfortaveis","como-responder-sem-agir-por-impulso"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-regulacao-4',
  'como-responder-sem-agir-por-impulso',
  'Como responder sem agir por impulso',
  'Aprenda a desarmar o sequestro da amígdala e transformar reações automáticas e explosivas em respostas conscientes e maduras.',
  'Quem nunca enviou uma mensagem atravessada no calor da raiva, falou palavras duras que machucaram alguém querido ou tomou uma decisão precipitada e, minutos depois, sentiu um peso enorme de arrependimento?

Esse comportamento impulsivo ocorre devido ao fenômeno neurobiológico conhecido como **sequestro da amígdala**: a parte mais primitiva do cérebro assume o controle antes que o córtex racional tenha tempo de avaliar as consequências do ato.

### A Diferença entre Reagir e Responder
- **Reagir**: É um reflexo instintivo, rápido e inconsciente. É orientado pela defesa do ego e quase sempre gera atrito e desgaste.
- **Responder**: É uma escolha deliberada, consciente e guiada pelos seus valores. Leva em consideração o impacto a longo prazo e busca a melhor resolução.

### O Intervalo de Ouro dos 6 Segundos
Neuroquimicamente, a onda hormonal inicial de um gatilho de raiva ou frustração leva cerca de **6 segundos** para ser metabolizada e permitir que a área racional do cérebro retome a liderança.

Se você conseguir não falar e não agir durante esses primeiros 6 segundos, suas chances de tomar uma decisão sábia aumentam exponencialmente.

### 3 Regras de Ouro para Momentos Tensos
1. **A Regra da Mensagem em Rascunho**: Nunca envie um e-mail ou mensagem de desabafo no mesmo instante. Salve como rascunho e leia novamente após 2 horas.
2. **O Afastamento Físico Estratégico**: Diga com respeito: *"Estou chateado(a) agora e prefiro respirar por 10 minutos antes de conversarmos para não falar nada indelicado."*
3. **A Pergunta do Dia Seguinte**: Pergunte-se mentalmente: *"Como vou me sentir amanhã de manhã em relação a essa resposta que estou prestes a dar?"*

### Exercício Prático: O Passo a Passo da Pausa S.T.O.P.
Quando sentir o sangue subir:
- **S (Stop / Pare)**: Interrompa imediatamente o que estava falando ou digitando.
- **T (Take a breath / Respire)**: Faça 3 respirações profundas soltando o ar devagar.
- **O (Observe / Observe)**: Note a raiva no seu corpo sem julgar.
- **P (Proceed / Prossiga)**: Escolha a melhor resposta com clareza e firmeza.

### Conclusão
Ter autocontrole não significa concordar com injustiças, mas ter o poder de escolher a melhor forma de se defender e se posicionar com dignidade e paz.

*Aviso: Este conteúdo é educativo e visa a melhoria das relações interpessoais.*',
  'Regulação',
  'Regulação',
  5,
  '"impulsividade","reacao vs resposta","autocontrole","comunicacao","paciencia"'::text[],
  '"regulacao","comunicacao","relacoes","autocontrole"'::text[],
  '"como-lidar-com-irritacao-e-frustracao","o-que-e-regulacao-emocional","como-recuperar-o-equilibrio-depois-de-um-dia-dificil"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-regulacao-5',
  'tecnicas-de-aterramento-para-momentos-intensos',
  'Técnicas de aterramento para momentos intensos',
  'Conheça ferramentas somáticas e físicas para reancorar a mente no corpo durante episódios de dissociação, angústia aguda e choque emocional.',
  'Em momentos de grande choque, estresse traumático ou sobrecarga emocional avassaladora, é comum experienciar sensações de dormência, estranhamento da realidade (desrealização) ou a sensação de estar flutuando fora do próprio corpo (despersonalização).

As **técnicas de aterramento somático (Grounding Físico)** utilizam vias neurais do tato, da propriocepção e da temperatura para trazer a mente de volta à segurança concreta da matéria física.

### Por que o Estímulo Físico Direto Funciona?
O cérebro em sofrimento agudo está preso em um circuito fechado de ruminação e alarme. Estímulos somáticos nítidos — como o frio do gelo, a pressão firme sobre a pele ou a força da gravidade nos pés — enviam sinais de alta prioridade pelas fibras nervosas periféricas, interrompendo o ciclo dissociativo.

### 4 Técnicas de Aterramento Rápido
1. **O Mergulho Térmico (Reflexo de Mergulho dos Mamíferos)**:
   - Lave o rosto com água bem gelada ou segure uma pedra de gelo na palma da mão por 30 segundos. O choque térmico estimula imediatamente o nervo vago e desacelera os batimentos cardíacos.
2. **A Postura da Árvore Firme**:
   - Fique em pé descalço, afaste os pés na largura dos quadris, destrave ligeiramente os joelhos e empurre o chão com a sola dos pés como se criasse raízes profundas na terra.
3. **A Autoabraço de Borboleta (EMDR)**:
   - Cruze os braços sobre o peito com as mãos nos ombros opostos e dê toques suaves e alternados (direita, esquerda, direita, esquerda) em ritmo calmo.
4. **A Pressão do Peso Corporal**:
   - Sente-se no chão, encoste as costas com firmeza em uma parede sólida e abrace os joelhos contra o peito.

### Exercício Prático: A Contração Proprioceptiva Isométrica
1. Sente-se em uma cadeira firme.
2. Segure as laterais do assento com as mãos e puxe para cima enquanto empurra os pés firmemente contra o chão com toda a força por 7 segundos.
3. Solte repentinamente a força e sinta a onda de calor e presença se espalhando pelos músculos.
4. Repita 3 vezes.

### Conclusão
O seu corpo é a sua casa mais segura no mundo. Quando o furacão emocional soprar forte, ancore-se na estabilidade física da terra e respire com calma.

*Aviso: Este conteúdo é educativo e não substitui psicoterapia especializada em trauma.*',
  'Regulação',
  'Regulação',
  6,
  '"aterramento","somatico","dissociacao","choque","presenca corporal"'::text[],
  '"regulacao","ancoragem","corpo","terapia"'::text[],
  '"tecnica-5-4-3-2-1-para-voltar-ao-presente","o-que-e-regulacao-emocional","estrategias-para-momentos-de-sobrecarga-emocional"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-regulacao-6',
  'como-acolher-emocoes-desconfortaveis',
  'Como acolher emoções desconfortáveis',
  'Descubra por que lutar contra a tristeza, o medo ou a raiva aumenta o sofrimento e aprenda a postura de aceitação compassiva e abertura.',
  'Na cultura moderna, somos ensinados desde cedo que sentimentos como tristeza, medo, vergonha ou inveja são "erros" que deveriam ser consertados imediatamente com uma dose de distração, compras ou comida. Essa aversão à dor natural gera um paradoxo doloroso: **quanto mais lutamos contra uma emoção, mais forte e duradoura ela se torna**.

Na psicologia baseada em aceitação (como a ACT e a Terapia Focada na Compaixão), aprendemos que a dor emocional faz parte da condição humana; o sofrimento desnecessário nasce da nossa recusa em acolhê-la.

### A Fórmula do Sofrimento: Dor x Resistência
A fórmula clássica da psicologia budista e contemporânea nos ensina:
$$\text{Sofrimento} = \text{Dor} \times \text{Resistência}$$

- A **Dor** é a resposta primária natural a uma perda ou frustração (inevitável).
- A **Resistência** é a luta mental contra o que se sente (*"Eu não deveria estar assim"*, *"Por que comigo?"*).
Quando a resistência cai para zero através do acolhimento, o sofrimento se dissipa e sobra apenas a sensação temporária que o corpo sabe processar.

### A Metáfora da Casa de Hóspedes (Rumi)
Trate suas emoções como visitantes inesperados em uma pousada. Alguns trazem alegria, outros trazem tristeza ou mágoa. Não tranque a porta com violência; receba cada hóspede à porta, ofereça uma cadeira, escute o que ele tem a dizer e permita que ele parta quando o seu tempo terminar.

### Exercício Prático: O Protocolo R.A.I.N. (Tara Brach)
Sempre que uma emoção dolorosa bater à porta:
- **R (Reconhecer)**: Diga a si mesmo: *"Reconheço que a tristeza está presente agora."*
- **A (Aceitar / Permitir)**: Em vez de empurrá-la, diga: *"Eu permito que essa sensação exista neste momento sem tentar mudá-la à força."*
- **I (Investigar com curiosidade gentil)**: *"Onde ela aperta no meu peito? Qual a temperatura dessa dor?"*
- **N (Nutrir com autocompaixão)**: Coloque a mão no coração e diga: *"É difícil sentir isso, mas estou aqui comigo mesmo e vou cuidar de mim."*

### Conclusão
Acolher o que você sente não é resignação passiva, mas a maior demonstração de coragem e amor próprio que você pode oferecer à sua história.

*Aviso: Este conteúdo é educativo e visa o desenvolvimento pessoal.*',
  'Regulação',
  'Regulação',
  5,
  '"acolhimento","aceitacao","autocompaixao","mindfulness","dor emocional"'::text[],
  '"regulacao","emocoes","autocompaixao","mente"'::text[],
  '"como-identificar-e-nomear-suas-emocoes","gratidao-sem-ignorar-as-emocoes-dificeis","o-que-e-regulacao-emocional"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-regulacao-7',
  'como-a-respiracao-ajuda-a-regular-o-corpo',
  'Como a respiração ajuda a regular o corpo',
  'A ponte neurofisiológica entre o diafragma, o nervo vago e a acalmia cerebral explicada com clareza e base científica.',
  'Você já percebeu como a sua respiração muda instantaneamente quando você toma um susto ou fica zangado? Ela se torna curta, rápida e concentrada no peito. A maioria das pessoas sabe que a mente influencia a respiração, mas poucas compreendem o caminho inverso: **a respiração é a via de mão dupla mais potente para controlar a mente**.

Trata-se de um controle remoto biológico embutido no seu tórax para mudar o estado de alerta do cérebro em menos de 90 segundos.

### O Papel do Nervo Vago e a Parassimpaticotonia
O nervo vago é a principal via do sistema nervoso parassimpático (responsável pelo descanso, digestão e restauração celular). Cerca de 80% das fibras do nervo vago são *aferentes*, o que significa que elas viajam **do corpo para o cérebro**, e não o contrário.

Quando respiramos pelo diafragma com expirações prolongadas:
- O diafragma massageia o nervo vago ao redor do esôfago;
- O nervo vago dispara sinais para o tronco encefálico informando que o corpo está seguro;
- O cérebro responde reduzindo a secreção de adrenalina e diminuindo a frequência cardíaca.

### Respiração Torácica vs. Respiração Diafragmática
- **Respiração Torácica (Pelo peito)**: Utiliza os músculos acessórios do pescoço e dos ombros. Sinaliza estresse crônico e perpetua a sensação de falta de ar.
- **Respiração Diafragmática (Pela barriga)**: Movimenta o músculo diafragma para baixo, inflando suavemente o abdômen. Estimula a oxigenação ideal e traz estabilidade postural.

### Exercício Prático: A Respiração Coerente (5 Segundos / 5 Segundos)
1. Sente-se com a coluna ereta, mas sem rigidez.
2. Coloque a mão direita sobre o estômago.
3. Inspire suavemente pelo nariz em **5 segundos**, sentindo a mão ser empurrada para fora.
4. Expire suavemente pelo nariz ou pela boca em **5 segundos**, sentindo a mão voltar para dentro.
5. Mantenha esse ritmo contínuo (6 ciclos por minuto) por 3 minutos. Esse padrão equilibra a variabilidade da frequência cardíaca (VFC) no seu nível ótimo de saúde.

### Conclusão
Você carrega consigo em cada segundo a ferramenta mais avançada de regulação emocional da natureza. Basta lembrar-se de respirar com presença.

*Aviso: Este conteúdo é educativo e visa a promoção da saúde neurofuncional.*',
  'Regulação',
  'Regulação',
  5,
  '"respiracao diafragmatica","nervo vago","fisiologia","sistema nervoso","calma"'::text[],
  '"regulacao","respiracao","corpo","ciencia"'::text[],
  '"o-que-e-ansiedade-e-como-ela-funciona","o-que-e-regulacao-emocional","exercicios-de-respiracao-para-o-periodo-noturno"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-regulacao-8',
  'como-lidar-com-irritacao-e-frustracao',
  'Como lidar com irritação e frustração',
  'Aprenda a decodificar a mensagem por trás da raiva cotidiana e descubra estratégias para canalizar essa energia com assertividade e foco.',
  'O trânsito travado, um arquivo de computador que não salva, uma promessa não cumprida por um colega ou a tampa da pasta de dente deixada aberta. No dia a dia, pequenas frustrações acumulam-se silenciosamente até que nos vemos reagindo com irritação explosiva e desproporcional.

A raiva e a irritação não são emoções "más" que devem ser extirpadas; elas são sinalizadores de que um limite pessoal foi violado ou de que uma expectativa importante não foi atendida.

### A Anatomia da Frustração
A frustração é a distância dolorosa entre **a realidade como ela é** e **a realidade como gostaríamos que ela fosse**.
Quando insistimos mentalmente em exigir que o mundo, o trânsito ou as outras pessoas se comportem exatamente de acordo com os nossos planos perfeitos, a irritação é o resultado garantido.

### As 3 Camadas da Raiva
Na terapia, a raiva é frequentemente comparada a um iceberg:
- A ponta visível fora da água é a explosão, o grito ou a ironia.
- A base submersa e invisível costuma esconder emoções mais vulneráveis: **cansaço acumulado**, **medo de ser passado para trás**, **tristeza por não ser ouvido** ou **sobrecarga de responsabilidades**.

### Como Canalizar a Energia da Raiva com Assertividade
1. **Descarregue a energia motora primeiro**: Caminhe com passos firmes, aperte uma bolinha de tensão ou faça 10 flexões antes de conversar.
2. **Separe o fato da interpretação**: Em vez de pensar *"Ele fez isso de propósito para me desrespeitar"*, pense *"Ele esqueceu de fazer a tarefa. Como posso me posicionar claramente sobre isso?"*.
3. **Use a Comunicação Não-Violenta (CNV)**: Fale sobre os fatos objetivos e como você se sente, sem atacar a identidade da outra pessoa.

### Exercício Prático: O Filtro do Círculo de Controle
Desenhe mentalmente dois círculos:
- **Círculo Maior (Preocupação)**: Ações dos outros, trânsito, economia, clima (fora do seu controle direto).
- **Círculo Menor (Ação)**: Sua resposta, seu tom de voz, suas escolhas práticas (sob seu controle direto).
Coloque 100% da sua energia no círculo menor e solte o círculo maior.

### Conclusão
A irritação bem compreendida é o combustível que nos impulsiona a estabelecer limites justos e resolver pendências com firmeza e respeito.

*Aviso: Este conteúdo é educativo e visa o desenvolvimento interpessoal.*',
  'Regulação',
  'Regulação',
  5,
  '"irritacao","frustracao","raiva","assertividade","paciencia"'::text[],
  '"regulacao","emocoes","comunicacao","relacoes"'::text[],
  '"como-responder-sem-agir-por-impulso","como-acolher-emocoes-desconfortaveis","como-recuperar-o-equilibrio-depois-de-um-dia-dificil"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-regulacao-9',
  'estrategias-para-momentos-de-sobrecarga-emocional',
  'Estratégias para momentos de sobrecarga emocional',
  'O que fazer quando tudo parece demais ao mesmo tempo: um protocolo de primeiros socorros para resgatar a lucidez no olho do furacão.',
  'Há dias em que a vida parece empilhar problemas sem qualquer intervalo: notícias difíceis, cobranças familiares, metas profissionais e cansaço acumulado. De repente, a sensação de que "tudo é demais" e de que você vai desabar toma conta.

Nesses momentos de sobrecarga aguda, a prioridade máxima não é resolver a lista de problemas, mas sim oferecer **primeiros socorros emocionais** ao seu sistema nervoso.

### A Regra do Colapso: Não Tente Consertar Nada Agora
Quando você está no ápice da sobrecarga emocional, seu cérebro executivo está temporariamente fora de serviço. Tentar tomar grandes decisões de vida, discutir relacionamentos ou resolver pendências financeiras nesse estado quase sempre resulta em desastre.

O único objetivo nos próximos 30 minutos é **baixar a temperatura do sistema**.

### O Kit de Primeiros Socorros em 4 Passos (T.I.P.P.)
Desenvolvido na Terapia Comportamental Dialética (DBT) pela Dra. Marsha Linehan:
1. **T (Temperature / Mudança de Temperatura)**: Lave o rosto com água gelada para induzir o relaxamento vago-cardíaco imediato.
2. **I (Intense Exercise / Movimento Breve)**: Faça 60 segundos de polichinelos ou caminhada rápida para queimar a adrenalina excessiva.
3. **P (Paced Breathing / Respiração Compassada)**: Respire no ritmo 4-7-8 ou com expirações em 6 segundos.
4. **P (Paired Muscle Relaxation / Relaxamento Pareado)**: Contraia e relaxe grupos musculares grandes, liberando a couraça corporal.

### Exercício Prático: O Redutor de Escopo (Apenas os Próximos 10 Minutos)
Quando a vida parecer um monstro de mil cabeças:
1. Diga em voz alta com gentileza: *"Eu não preciso resolver o resto do meu ano hoje. Eu só preciso cuidar dos próximos 10 minutos."*
2. Escolha uma única ação física simples: beber um copo d''água, lavar o rosto ou deitar no chão com as pernas apoiadas no sofá.
3. Viva apenas esses 10 minutos. Depois, cuide dos próximos 10.

### Conclusão
Você sobreviveu a 100% dos seus dias difíceis até hoje. Essa sobrecarga também vai passar, um minuto de cada vez.

*Aviso: Se os sentimentos de sobrecarga vierem acompanhados de desespero severo, busque apoio no CVV (188) ou em serviços médicos de emergência.*',
  'Regulação',
  'Regulação',
  5,
  '"sobrecarga emocional","esgotamento","primeiros socorros","crise","reinicio"'::text[],
  '"regulacao","crise","autocuidado","saude mental"'::text[],
  '"tecnica-5-4-3-2-1-para-voltar-ao-presente","tecnicas-de-aterramento-para-momentos-intensos","como-recuperar-o-equilibrio-depois-de-um-dia-dificil"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();

insert into public.articles (id, slug, title, summary, content, category, category_name, reading_time_minutes, keywords, tags, related_article_ids, author, reviewed_by, published_at)
values (
  'art-regulacao-10',
  'como-recuperar-o-equilibrio-depois-de-um-dia-dificil',
  'Como recuperar o equilíbrio depois de um dia difícil',
  'Rituais de encerramento e descompressão para descarregar o cansaço do trabalho e não levar as tensões do dia para a sua casa e suas noites.',
  'Você passou o dia inteiro apagando incêndios, enfrentando reuniões tensas ou lidando com frustrações contínuas. Quando finalmente chega em casa ou fecha o laptop do home office, a sensação é de estar com o corpo exausto e a alma moída.

Se não houver um **ritual deliberado de descompressão**, você passará a noite inteira repassando as brigas do dia na cabeça e acordará tão cansado quanto foi dormir.

### A Fronteira entre o Dia e a Noite
O cérebro humano precisa de rituais simbólicos de encerramento para compreender que o expediente terminou e que o território da casa é um refúgio de paz:
- **A Troca de Roupa Sagrada**: Tirar a roupa de trabalho e vestir uma roupa leve e macia sinaliza ao corpo a mudança de papel.
- **O Banho de Limpeza Simbólica**: Sentir a água lavando não apenas a poeira da rua, mas as tensões e cobranças acumuladas.
- **A Limpeza da Mesa**: Fechar as abas do navegador, guardar o caderno e colocar o laptop fora do alcance visual.

### O Que Fazer nas Primeiras 2 Horas Pós-Trabalho
- **Evite o desabafo repetitivo crônico**: Falar por duas horas sem parar sobre o quanto o chefe ou o colega foi injusto mantém o cérebro vivendo a mesma raiva novamente. Desabafe brevemente com alguém de confiança e mude intencionalmente de assunto.
- **Nutra-se com conforto**: Prepare uma refeição simples, aconchegante e nutritiva, comendo sem pressa.
- **Silêncio sensorial**: Permita-se ficar 15 minutos sem música, sem podcast e sem TV, ouvindo apenas o silêncio restaurador.

### Exercício Prático: O Ritual do Descarte na Porta
Antes de abrir a porta de casa ou sair do quarto de trabalho:
1. Pare diante da porta com as duas mãos na maçaneta.
2. Inspire profundamente e, ao expirar, visualize toda a carga pesada do dia ficando do lado de fora da porta.
3. Diga mentalmente: *"Aqui dentro começa meu espaço de descanso e amor. Eu mereço esse acolhimento."*
4. Entre no ambiente com os ombros relaxados.

### Conclusão
Dias difíceis acontecem e fazem parte da jornada humana. O que faz toda a diferença é o carinho e o respeito com que você cuida de si mesmo ao final de cada tempestade.

*Aviso: Este conteúdo é educativo e visa o autocuidado integral.*',
  'Regulação',
  'Regulação',
  5,
  '"dia dificil","descompressao","reinicio","ritual de fechamento","recuperacao"'::text[],
  '"regulacao","bem-estar","rotina","autocuidado"'::text[],
  '"como-desacelerar-a-mente-antes-de-dormir","como-criar-uma-rotina-emocionalmente-saudavel","estrategias-para-momentos-de-sobrecarga-emocional"'::text[],
  'Equipe de Psicologia Respira',
  'Dra. Camila Nogueira (CRP 06/142980)',
  '2026-08-20T08:00:00Z'
) on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  category = excluded.category,
  updated_at = now();


-- 6.2 Insert all Practices
insert into public.practices (id, title, subtitle, description, category, duration_minutes, level, icon, instructions, breathing_config)
values (
  'practice-breathing-478',
  'Respiração 4-7-8',
  'Exercício guiado de respiração',
  'Respiração compassada para ajudar o corpo e a mente a desacelerar no seu próprio ritmo.',
  'breathing',
  4,
  'Iniciante',
  'wind',
  '"Encontre uma postura confortável, com a coluna apoiada e ombros relaxados.","Solte o ar suavemente.","Inspire pelo nariz contando até 4.","Mantenha o ar nos pulmões com calma contando até 7.","Expire lentamente pela boca contando até 8.","Repita o ciclo por 4 vezes prestando atenção no fluxo do ar."'::text[],
  '{"inhaleSeconds":4,"holdSeconds":7,"exhaleSeconds":8,"cycles":4}'::jsonb
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = now();

insert into public.practices (id, title, subtitle, description, category, duration_minutes, level, icon, instructions, breathing_config)
values (
  'practice-breathing-box',
  'Respiração Quadrada (Box Breathing)',
  'Respiração com tempos iguais',
  'Quatro tempos iguais de inspiração, pausa e expiração para recuperar a concentração.',
  'breathing',
  3,
  'Iniciante',
  'square',
  '"Sente-se confortavelmente com os pés apoiados no chão.","Inspire pelo nariz por 4 segundos.","Segure o ar com calma por 4 segundos.","Expire suavemente por 4 segundos.","Mantenha os pulmões vazios por mais 4 segundos antes do próximo ciclo."'::text[],
  '{"inhaleSeconds":4,"holdSeconds":4,"exhaleSeconds":4,"holdAfterExhaleSeconds":4,"cycles":4}'::jsonb
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = now();

insert into public.practices (id, title, subtitle, description, category, duration_minutes, level, icon, instructions, breathing_config)
values (
  'practice-breathing-cardiac',
  'Coerência Cardíaca (5-5)',
  'Respiração contínua e suave',
  'Seis respirações por minuto para estabilizar o ritmo respiratório e trazer tranquilidade.',
  'breathing',
  5,
  'Iniciante',
  'heart',
  '"Relaxe os ombros e apoie as mãos sobre as pernas.","Inspire suavemente pelo nariz durante 5 segundos contínuos.","Sem prender o ar, expire suavemente por 5 segundos.","Mantenha o fluxo natural e contínuo."'::text[],
  '{"inhaleSeconds":5,"holdSeconds":0,"exhaleSeconds":5,"cycles":6}'::jsonb
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = now();

insert into public.practices (id, title, subtitle, description, category, duration_minutes, level, icon, instructions, breathing_config)
values (
  'practice-grounding-54321',
  'Ancoragem 5-4-3-2-1',
  'Prática de atenção ao momento',
  'Percepção consciente dos cinco sentidos para trazer o foco de volta ao presente.',
  'mindfulness',
  6,
  'Iniciante',
  'compass',
  '"Observe 5 coisas ao seu redor que você pode ver agora.","Perceba 4 sensações táteis que você pode sentir no corpo.","Identifique 3 sons no ambiente.","Note 2 cheiros presentes ou lembranças suaves.","Diga uma frase amigável para si mesmo(a)."'::text[],
  null
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = now();

insert into public.practices (id, title, subtitle, description, category, duration_minutes, level, icon, instructions, breathing_config)
values (
  'practice-pmr-relaxation',
  'Relaxamento Muscular Progressivo',
  'Relaxamento guiado do corpo',
  'Contrair e soltar suavemente os grupos musculares para aliviar o peso e a rigidez.',
  'relaxation',
  8,
  'Intermediário',
  'activity',
  '"Deite-se ou recoste-se de forma confortável.","Tensione suavemente os pés e dedos por 5 segundos, depois solte.","Faça o mesmo com pernas, abdômen, ombros e rosto.","Permaneça respirando suavemente percebendo a musculatura solta."'::text[],
  null
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = now();

insert into public.practices (id, title, subtitle, description, category, duration_minutes, level, icon, instructions, breathing_config)
values (
  'practice-quick-pause',
  'Pausa Consciente de 2 Minutos',
  'Pausa breve para desacelerar',
  'Um momento de silêncio e respiração calma entre as tarefas da sua rotina.',
  'quick_routine',
  2,
  'Iniciante',
  'clock',
  '"Afaste os olhos das telas por um instante.","Faça 3 respirações lentas e profundas.","Beba um gole de água ou alongue suavemente o pescoço."'::text[],
  null
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = now();

