-- =====================================================================
-- RESPIRA DIGITAL HEALTH PLATFORM - PRODUCTION DATABASE SCHEMA
-- Migration: 001_initial_schema.sql
-- Description: Complete relational schema with UUIDs, indexes, constraints,
--              LGPD data minimization, foreign keys, and audit logging.
-- =====================================================================

-- 0. Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users Table (Core Auth & Credentials)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  lockout_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;

-- 3. Profiles Table (Separate PII for LGPD Data Minimization)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. User Consents Table (LGPD Audit Trail)
CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  terms_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  privacy_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  personalization_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  analytics_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  chat_retention_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  ip_address_hash VARCHAR(64),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consents_user ON consents(user_id);

-- 5. User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) NOT NULL DEFAULT 'system',
  reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
  daily_reminder BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_time VARCHAR(5) NOT NULL DEFAULT '20:00',
  vibration_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  country_helpline VARCHAR(5) NOT NULL DEFAULT 'BR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Sessions & Refresh Tokens (JWT Rotation & Revocation)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  user_agent TEXT,
  ip_address_masked VARCHAR(45),
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions(user_id) WHERE is_revoked = FALSE;

-- 7. Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Mood Entries (Diário de Humor)
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood_score SMALLINT NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
  anxiety_level SMALLINT NOT NULL CHECK (anxiety_level BETWEEN 0 AND 10),
  emotions JSONB NOT NULL DEFAULT '[]'::jsonb,
  activities JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mood_user_created ON mood_entries(user_id, created_at DESC) WHERE deleted_at IS NULL;

-- 9. Article Categories Table
CREATE TABLE IF NOT EXISTS article_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Articles Table (Conteúdos Psicoeducativos)
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(120) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  summary TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  category_id UUID NOT NULL REFERENCES article_categories(id) ON DELETE RESTRICT,
  reading_time_minutes INT NOT NULL DEFAULT 4,
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_article_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_practice_id UUID,
  reviewed_by VARCHAR(120),
  author VARCHAR(100) NOT NULL DEFAULT 'Equipe Respira',
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status) WHERE deleted_at IS NULL;

-- 11. Article Favorites Table
CREATE TABLE IF NOT EXISTS article_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- 12. Article Progress Table (Progresso de Leitura Persistente)
CREATE TABLE IF NOT EXISTS article_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  progress_percent SMALLINT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- 13. Practice Categories Table
CREATE TABLE IF NOT EXISTS practice_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Practices Table (Exercícios Guiados)
CREATE TABLE IF NOT EXISTS practices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(120) UNIQUE NOT NULL,
  title VARCHAR(150) NOT NULL,
  subtitle VARCHAR(200),
  description TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES practice_categories(id) ON DELETE RESTRICT,
  duration_minutes INT NOT NULL DEFAULT 4,
  level VARCHAR(30) NOT NULL DEFAULT 'Iniciante' CHECK (level IN ('Iniciante', 'Intermediário', 'Avançado')),
  icon VARCHAR(50) NOT NULL DEFAULT 'wind',
  audio_url TEXT,
  breathing_config JSONB,
  instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 15. Practice Favorites Table
CREATE TABLE IF NOT EXISTS practice_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, practice_id)
);

-- 16. Practice Completions Table (Histórico de Execução)
CREATE TABLE IF NOT EXISTS practice_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  duration_seconds INT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_completions_user ON practice_completions(user_id, completed_at DESC);

-- 17. Chat Sessions Table (Conversas do Assistente IA)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL DEFAULT 'Nova conversa',
  is_temporary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
  text TEXT NOT NULL,
  suggestions JSONB,
  is_emergency_alert BOOLEAN NOT NULL DEFAULT FALSE,
  recommended_practice_id UUID,
  recommended_article_id UUID,
  feedback VARCHAR(20) CHECK (feedback IN ('helpful', 'unhelpful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at ASC);

-- 19. Support Contacts Table
CREATE TABLE IF NOT EXISTS support_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  number VARCHAR(30) NOT NULL,
  description TEXT NOT NULL,
  is_free BOOLEAN NOT NULL DEFAULT TRUE,
  available_hours VARCHAR(60) NOT NULL DEFAULT '24 horas',
  is_crisis_emergency BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0
);

-- 20. Audit Logs Table (LGPD & Security Governance)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100),
  result VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
  ip_address_masked VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
