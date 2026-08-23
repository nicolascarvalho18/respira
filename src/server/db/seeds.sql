-- =====================================================================
-- RESPIRA DIGITAL HEALTH PLATFORM - DEVELOPMENT SEEDS
-- Seed data for roles, admin/demo users, categories, articles, practices,
-- and support contacts.
-- =====================================================================

-- 1. Insert Default Roles
INSERT INTO roles (id, name, description)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'user', 'Usuário padrão do aplicativo'),
  ('00000000-0000-0000-0000-000000000002', 'admin', 'Administrador do sistema')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Support Contacts (Brasil)
INSERT INTO support_contacts (id, name, number, description, is_free, available_hours, is_crisis_emergency, display_order)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'CVV - Centro de Valorização da Vida', '188', 'Apoio emocional e prevenção ao suicídio com escuta acolhedora, confidencial e anônima.', TRUE, '24 horas', TRUE, 1),
  ('10000000-0000-0000-0000-000000000002', 'SAMU - Emergências em Saúde', '192', 'Serviço de Atendimento Móvel de Urgência para situações clínicas agudas.', TRUE, '24 horas', TRUE, 2),
  ('10000000-0000-0000-0000-000000000003', 'Disque 100 - Direitos Humanos', '100', 'Canal para denúncias de violações e apoio a populações vulneráveis.', TRUE, '24 horas', FALSE, 3)
ON CONFLICT DO NOTHING;

-- 3. Insert Article Categories
INSERT INTO article_categories (id, slug, name, description, display_order)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'entendendo-a-ansiedade', 'Entendendo a ansiedade', 'Conceitos claros sobre o que é a ansiedade e como ela atua.', 1),
  ('20000000-0000-0000-0000-000000000002', 'bem-estar-emocional', 'Bem-estar emocional', 'Estratégias saudáveis para o autocuidado e regulação.', 2),
  ('20000000-0000-0000-0000-000000000003', 'sono', 'Sono', 'Hábitos noturnos para descanso reparador e desaceleração.', 3),
  ('20000000-0000-0000-0000-000000000004', 'rotina', 'Rotina', 'Organização de hábitos sustentáveis no dia a dia.', 4),
  ('20000000-0000-0000-0000-000000000005', 'mitos-e-verdades', 'Mitos e verdades', 'Esclarecimento de crenças comuns sobre saúde mental.', 5)
ON CONFLICT (slug) DO NOTHING;

-- 4. Insert Practice Categories
INSERT INTO practice_categories (id, slug, name, description)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'breathing', 'Respiração', 'Exercícios guiados com foco no controle do ritmo do ar.'),
  ('30000000-0000-0000-0000-000000000002', 'relaxation', 'Relaxamento', 'Técnicas de relaxamento físico e muscular.'),
  ('30000000-0000-0000-0000-000000000003', 'mindfulness', 'Atenção Plena', 'Práticas de foco no momento presente e ancoragem.'),
  ('30000000-0000-0000-0000-000000000004', 'quick_routine', 'Rotinas Rápidas', 'Pausas conscientes breves para o cotidiano.')
ON CONFLICT (slug) DO NOTHING;
