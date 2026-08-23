# 🌿 Respira — Plataforma Digital de Psicoeducação e Bem-Estar Emocional

O **Respira** é uma plataforma digital de saúde preventiva e regulação emocional baseada em evidências, projetada com foco em experiência mobile e desktop de alto refinamento, acessibilidade (WCAG 2.2 AA), inteligência artificial ética e governança rigorosa de dados (LGPD).

---

## 🚀 Arquitetura Geral do Sistema

```mermaid
graph TD
  User["Usuário (Mobile / Web App)"]
  Router["Expo Router (Rotas Dinâmicas & Slugs)"]
  ClientStore["Zustand State & Offline Storage"]
  API["API Segura (Rate Limiting, PII Scrubbing, RBAC)"]
  DB[("PostgreSQL 16 (UUIDs, Índices, Migrations)")]
  AI["Provedor LLM / RAG Engine"]

  User --> Router
  Router --> ClientStore
  ClientStore --> API
  API --> DB
  API --> AI
```

---

## ✨ Funcionalidades Principais

### 1. 📚 Sistema Completo de Artigos & Psicoeducação
- **Navegação Amigável**: Acesso direto por slugs como `/contents/entendendo-a-ansiedade`, `/contents/desacelerar-antes-de-dormir`, `/contents/tecnica-5-4-3-2-1` e `/contents/mitos-sobre-ansiedade`.
- **Busca e Filtros**: Busca com debounce de 300ms por título, resumo, palavras-chave e categorias estruturadas.
- **Leitor Completo**: Barra fina de progresso no topo, auto-salvamento de leitura (marcação de lido aos 90%), favoritos persistentes, avaliação de utilidade (*"Este conteúdo foi útil?"*) e recomendação cruzada de práticas.

### 2. 🤖 Assistente Educativo com Inteligência Artificial
- **Segurança Ética**: Sanitização de PII (remoção automática de CPFs, telefones e e-mails), detecção de emergência clínica (CVV 188 / SAMU 192), rate limiting e consulta via RAG ao acervo aprovado do Respira.
- **Gestão de Conversas**: Modo temporário (sem retenção de dados), consentimento explícito LGPD, feedback útil/não útil e cópia de mensagens.

### 3. 🌬️ 7 Práticas Interativas de Respiração e Atenção
- **Respiração 4-7-8**: Exercício guiado de relaxamento com animação do círculo e contagem de ciclos.
- **Respiração Quadrada (Box)**: 4 tempos iguais para foco e equilíbrio.
- **Coerência Cardíaca (5-5)**: Respiração fluida e cadenciada.
- **Atenção aos Cinco Sentidos (5-4-3-2-1)**: Checklist tátil para ancoragem sensorial.
- **Relaxamento Muscular Progressivo (PMR)**: Fases de contração e soltura muscular com cronômetro ativo.
- **Pausa Consciente de 2 Minutos**: Micro-pausa com temporizador.
- **Meditação Guiada**: Player de áudio com controles completos.

### 4. 📖 Diário de Humor & Gráfico de Evolução
- Check-in diário com escala de humor (1–5), ansiedade (0–10), tags e observações.
- Gráfico responsivo dual-scale com filtros de 7, 30 e 90 dias.
- Histórico em cards compactos expansíveis com opções de edição, exclusão segura e exportação de dados.

### 5. 🛡️ Painel Administrativo Protegido (RBAC)
- Bloqueio em nível de rota e autenticação.
- Gestão de artigos, categorias, práticas, usuários e logs de auditoria com IP mascarado.

---

## 🗄️ Banco de Dados PostgreSQL & Migrations

O schema relacional completo está documentado em [`docs/database.md`](docs/database.md) e implementado no arquivo SQL versionado:
- `src/server/db/migrations/001_initial_schema.sql` (20 tabelas com UUIDs, constraints e índices).
- `src/server/db/seeds.sql` (Carga inicial de categorias, papéis e contatos de apoio).

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` a partir do `.env.example`:

```env
# Banco de Dados
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/respira

# Segurança & Sessões
JWT_SECRET=sua-chave-secreta-jwt-de-producao

# Inteligência Artificial (Backend Apenas)
LLM_API_KEY=sua-chave-aqui
LLM_MODEL=gpt-4o-mini
LLM_BASE_URL=https://api.openai.com/v1
AI_MAX_TOKENS=450
AI_TEMPERATURE=0.6
```

---

## 🧪 Comandos de Validação e Testes

```bash
# Instalação das dependências
npm ci

# Verificação estrita de TypeScript (0 erros)
npm run typecheck

# Linting de código (0 erros)
npm run lint

# Execução da suíte de testes unitários e de integração
npm test

# Build de produção Web SPA para /dist
npm run build
```

---

## 🌐 Deploy em Produção

- **Repositório GitHub**: [github.com/nicolascarvalho18/respira](https://github.com/nicolascarvalho18/respira)
- **Produção Vercel**: [https://respira-one.vercel.app](https://respira-one.vercel.app)
