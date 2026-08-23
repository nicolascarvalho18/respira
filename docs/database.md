# 🗄️ Respira — Arquitetura de Banco de Dados PostgreSQL & Governança

Este documento descreve a modelagem relacional, política de backups e conformidade com a LGPD.

---

## 🏛️ 1. Entidades Principais

| Tabela | Chave Primária | Descrição |
| :--- | :--- | :--- |
| `users` | UUID (`v4`) | Credenciais e hash de senha (sem dados de saúde) |
| `profiles` | UUID (`v4`) | Nome e avatar (separado dos registros clínicos) |
| `consents` | UUID (`v4`) | Histórico versionado de consentimento LGPD |
| `user_preferences` | UUID (`v4`) | Tema, redução de movimento e horários de lembrete |
| `sessions` | UUID (`v4`) | Tokens de sessão com expiração e revogação |
| `mood_entries` | UUID (`v4`) | Registros de humor e ansiedade com soft delete |
| `articles` | UUID (`v4`) | Conteúdos psicoeducativos em seções JSONB |
| `article_categories` | UUID (`v4`) | Categorias estruturadas com slug |
| `article_progress` | UUID (`v4`) | Percentual de leitura persistente por usuário |
| `practices` | UUID (`v4`) | Exercícios guiados de respiração e relaxamento |
| `practice_completions` | UUID (`v4`) | Histórico de conclusão e tempo praticado |
| `chat_sessions` & `messages` | UUID (`v4`) | Conversas com IA (apenas sob consentimento) |
| `audit_logs` | UUID (`v4`) | Rastreabilidade de ações administrativas com IP mascarado |

---

## 🔒 2. Conformidade LGPD & Minimização de Dados

1. **Separação de Dados**:
   - Dados de identificação (nome, email) ficam isolados das tabelas de saúde mental (`mood_entries`).
2. **Direito ao Esquecimento**:
   - Exclusão em duas etapas com expurgo definitivo de registros e histórico.
3. **Portabilidade (JSON Export)**:
   - Exportação completa e estruturada de todos os dados do usuário.
4. **Mascaramento em Auditoria**:
   - Endereços IP são mascarados (`192.168.***.***`) antes de serem gravados nos logs de auditoria.

---

## 💾 3. Política de Backups & Retenção

- **Backups Automáticos**:
  - Snapshot diário com retenção de 30 dias.
  - Backup contínuo WAL (Write-Ahead Logging) para Point-in-Time Recovery (PITR).
- **Criptografia**:
  - Dados em repouso criptografados com AES-256 no storage.
  - Conexões de banco exigem SSL/TLS 1.3.
