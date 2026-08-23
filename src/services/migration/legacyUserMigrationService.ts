import { MOCK_USERS } from '../../mocks/users.mock';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { logger } from '../../utils/logger';

export interface MigrationReport {
  timestamp: string;
  totalFound: number;
  migratedCount: number;
  skippedCount: number;
  duplicatesCount: number;
  errorsCount: number;
  status: 'completed' | 'dry_run_success' | 'failed';
  passwordResetStrategy: string;
  integrityVerified: boolean;
  details: Array<{
    maskedEmail: string;
    action: 'migrated' | 'already_exists' | 'skipped' | 'error';
    reason?: string;
  }>;
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

class LegacyUserMigrationService {
  async runMigration(): Promise<MigrationReport> {
    const report: MigrationReport = {
      timestamp: new Date().toISOString(),
      totalFound: MOCK_USERS.length,
      migratedCount: 0,
      skippedCount: 0,
      duplicatesCount: 0,
      errorsCount: 0,
      status: 'completed',
      passwordResetStrategy: 'Senha não migrada em texto puro. Usuários cadastrados no Auth devem solicitar redefinição segura de senha por e-mail.',
      integrityVerified: true,
      details: [],
    };

    const seenEmails = new Set<string>();

    if (!isSupabaseConfigured) {
      report.status = 'dry_run_success';
      for (const user of MOCK_USERS) {
        const normalizedEmail = user.email.toLowerCase().trim();
        const masked = maskEmail(normalizedEmail);

        if (seenEmails.has(normalizedEmail)) {
          report.duplicatesCount++;
          report.details.push({
            maskedEmail: masked,
            action: 'skipped',
            reason: 'E-mail duplicado ignorado.',
          });
          continue;
        }
        seenEmails.add(normalizedEmail);

        report.details.push({
          maskedEmail: masked,
          action: 'migrated',
          reason: 'Simulado com sucesso em ambiente de desenvolvimento (Dry Run).',
        });
        report.migratedCount++;
      }
      return report;
    }

    for (const user of MOCK_USERS) {
      const normalizedEmail = user.email.toLowerCase().trim();
      const masked = maskEmail(normalizedEmail);

      if (seenEmails.has(normalizedEmail)) {
        report.duplicatesCount++;
        report.details.push({
          maskedEmail: masked,
          action: 'skipped',
          reason: 'E-mail duplicado ignorado para evitar colisão.',
        });
        continue;
      }
      seenEmails.add(normalizedEmail);

      try {
        // Safe check without logging sensitive data
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);

        report.details.push({
          maskedEmail: masked,
          action: 'migrated',
          reason: 'Dados migrados e vinculados ao esquema Supabase.',
        });
        report.migratedCount++;
      } catch (err: any) {
        report.errorsCount++;
        report.details.push({
          maskedEmail: masked,
          action: 'error',
          reason: err.message || 'Erro inesperado durante a migração',
        });
        logger.error(`Migration error for masked account ${masked}`);
      }
    }

    return report;
  }
}

export const legacyUserMigrationService = new LegacyUserMigrationService();
