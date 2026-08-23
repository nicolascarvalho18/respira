# 🌐 Respira — Especificação da API REST & Endpoints

Esta documentação descreve os endpoints seguros da API do Respira.

---

## 🔐 1. Autenticação & Sessões (`/api/v1/auth`)

### `POST /api/v1/auth/register`
- **Descrição**: Cria uma nova conta de usuário com senha forte (mínimo 10 caracteres) e registro de consentimento LGPD.
- **Body**:
  ```json
  {
    "name": "Ana Silva",
    "email": "ana@exemplo.com",
    "password": "MinhaSenhaForte@2024",
    "termsAccepted": true,
    "personalizationAccepted": true
  }
  ```
- **Resposta (201 Created)**:
  ```json
  {
    "user": { "id": "uuid", "name": "Ana Silva", "email": "ana@exemplo.com", "role": "user" },
    "token": "jwt-access-token",
    "refreshToken": "refresh-token"
  }
  ```

### `POST /api/v1/auth/login`
- **Descrição**: Autentica o usuário com proteção contra força bruta (bloqueio de 15 minutos após 5 tentativas falhas).
- **Body**: `{ "email": "ana@exemplo.com", "password": "..." }`
- **Resposta (200 OK)**: Retorna os dados do usuário, access token (expiração 15 min) e refresh token (expiração 30 dias).

### `POST /api/v1/auth/forgot-password`
- **Descrição**: Solicita recuperação de senha com resposta neutra para prevenir enumeração de contas.
- **Body**: `{ "email": "ana@exemplo.com" }`
- **Resposta (200 OK)**:
  ```json
  {
    "message": "Se existir uma conta associada a esse e-mail, enviaremos as instruções."
  }
  ```

---

## 🤖 2. Assistente IA & Psicoeducação (`/api/v1/chat`)

### `POST /api/v1/chat/message`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "text": "Como posso fazer para desacelerar antes de dormir?",
    "sessionId": "uuid-opcional",
    "isTemporary": false
  }
  ```
- **Pipeline de Execução**:
  1. Verificação de rate limiting (máximo 20 req/min por usuário).
  2. Validação do tamanho (máximo 1000 caracteres).
  3. Detecção de emergência clínica (se detectado ideação suicida ou crise, dispara retorno prioritário com CVV 188 / SAMU 192).
  4. Sanitização LGPD (remoção automática de CPFs, telefones e e-mails do texto).
  5. RAG (busca de artigos e práticas do Respira).
  6. Chamada segura ao provedor LLM via variáveis de ambiente (`LLM_API_KEY`, etc.).
- **Resposta (200 OK)**:
  ```json
  {
    "text": "Pequenos hábitos no fim da tarde e à noite ajudam o corpo a transitar para o repouso...",
    "isEmergencyAlert": false,
    "suggestions": ["Praticar respiração 4-7-8", "Ler artigo sobre o sono"],
    "recommendedPracticeId": "practice-breathing-478",
    "recommendedArticleId": "article-sleep-and-stress"
  }
  ```

---

## 📚 3. Conteúdos & Artigos (`/api/v1/articles`)

### `GET /api/v1/articles`
- **Query params**: `category`, `search`, `page`, `limit`
- **Resposta (200 OK)**: Lista de artigos publicados com status de favorito e progresso do usuário.

### `GET /api/v1/articles/:slug`
- **Descrição**: Retorna o artigo completo estruturado em seções.

### `POST /api/v1/articles/:id/progress`
- **Body**: `{ "progressPercent": 95 }`
- **Descrição**: Atualiza o progresso de leitura (marca como lido se $\ge 90\%$).

---

## 📖 4. Diário de Humor (`/api/v1/mood`)

### `GET /api/v1/mood`
- **Query params**: `days=7|30|90`, `startDate`, `endDate`, `page`
- **Resposta (200 OK)**: Registros de humor ordenados por data decrescente.

### `POST /api/v1/mood`
- **Body**:
  ```json
  {
    "mood": 4,
    "anxietyLevel": 3,
    "emotions": ["Calmo", "Focado"],
    "activities": ["Trabalho", "Caminhada"],
    "notes": "Dia produtivo e tranquilo."
  }
  ```

---

## 🛡️ 5. Painel Administrativo & Auditoria (`/api/v1/admin`)

- **Autenticação**: Requer `role === 'admin'`.
- `GET /api/v1/admin/metrics`: Métricas consolidadas e anonimizadas.
- `GET /api/v1/admin/audit-logs`: Histórico de auditoria com IP mascarado.
- `POST /api/v1/admin/articles`: Criação de novo artigo.
