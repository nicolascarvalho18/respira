-- Migration: 20260830000004_music_sounds_mixer_and_catalog.sql
-- Catálogo de Músicas & Sons Ambientes e Misturas de Sons por Usuário com RLS

-- 1. Tabela do Catálogo de Áudio (Músicas e Paisagens Sonoras)
CREATE TABLE IF NOT EXISTS public.audio_catalog (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('music', 'soundscape')),
    title TEXT NOT NULL,
    artist_or_author TEXT NOT NULL DEFAULT 'Respira',
    category TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 180,
    description TEXT NOT NULL DEFAULT '',
    audio_url TEXT,
    thumbnail_url TEXT,
    accent_color TEXT DEFAULT '#2F7F7C',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de busca e ordenação
CREATE INDEX IF NOT EXISTS idx_audio_catalog_type ON public.audio_catalog (type);
CREATE INDEX IF NOT EXISTS idx_audio_catalog_category ON public.audio_catalog (category);
CREATE INDEX IF NOT EXISTS idx_audio_catalog_status ON public.audio_catalog (status);
CREATE INDEX IF NOT EXISTS idx_audio_catalog_order ON public.audio_catalog (display_order ASC);

-- 2. Tabela de Combinações de Sons Personalizadas por Usuário (Sound Mixes)
CREATE TABLE IF NOT EXISTS public.user_sound_mixes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    layers JSONB NOT NULL DEFAULT '[]'::jsonb,
    master_volume NUMERIC(3,2) NOT NULL DEFAULT 0.80,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_sound_mixes_user_id ON public.user_sound_mixes (user_id);

-- 3. Habilitação de RLS
ALTER TABLE public.audio_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sound_mixes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para audio_catalog:
-- Qualquer usuário pode ler itens publicados
DROP POLICY IF EXISTS "Qualquer usuário pode ler catálogo publicado" ON public.audio_catalog;
CREATE POLICY "Qualquer usuário pode ler catálogo publicado"
    ON public.audio_catalog
    FOR SELECT
    USING (status = 'published' OR (auth.jwt() ->> 'role') = 'admin');

-- Apenas admins podem inserir, atualizar e deletar faixas no catálogo
DROP POLICY IF EXISTS "Admins podem inserir no catálogo" ON public.audio_catalog;
CREATE POLICY "Admins podem inserir no catálogo"
    ON public.audio_catalog
    FOR INSERT
    WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins podem atualizar catálogo" ON public.audio_catalog;
CREATE POLICY "Admins podem atualizar catálogo"
    ON public.audio_catalog
    FOR UPDATE
    USING ((auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins podem deletar do catálogo" ON public.audio_catalog;
CREATE POLICY "Admins podem deletar do catálogo"
    ON public.audio_catalog
    FOR DELETE
    USING ((auth.jwt() ->> 'role') = 'admin');

-- Políticas de RLS para user_sound_mixes:
-- Usuário só acessa e manipula as próprias combinações
DROP POLICY IF EXISTS "Usuários gerenciam suas próprias misturas de som" ON public.user_sound_mixes;
CREATE POLICY "Usuários gerenciam suas próprias misturas de som"
    ON public.user_sound_mixes
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
