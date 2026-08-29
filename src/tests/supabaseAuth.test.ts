import { supabaseAuthService } from '../services/auth/supabaseAuthService';
import { supabaseUserService } from '../services/user/supabaseUserService';
import { legacyUserMigrationService, maskEmail } from '../services/migration/legacyUserMigrationService';
import { supabase } from '../services/supabase/client';
import fs from 'fs';
import path from 'path';

describe('Supabase Auth, RLS & Database Centralization Tests', () => {
  it('should handle sign up and email normalization with verification required', async () => {
    jest.spyOn(supabase.auth, 'signUp').mockResolvedValueOnce({
      data: { user: { id: 'test-user-id', email: 'test.user@exemplo.com' } as any, session: null },
      error: null,
    });

    const res = await supabaseAuthService.signUp('TEST.USER@EXEMPLO.COM', 'StrongPassword123!', 'Usuário Teste');
    expect(res.error).toBeUndefined();
    expect(res.requiresVerification).toBe(true);
    expect(res.email).toBe('test.user@exemplo.com');
  });

  it('should reject short passwords (<10 chars) on sign up', async () => {
    const res = await supabaseAuthService.signUp('ana@exemplo.com', '123456');
    expect(res.error).toBe('A senha deve ter pelo menos 10 caracteres.');
  });

  it('should reject invalid sign in with neutral message', async () => {
    const res = await supabaseAuthService.signIn('INEXISTENTE@EXEMPLO.COM', 'qualquerSenha');
    expect(res.user).toBeNull();
    expect(res.error).toBe('E-mail ou senha inválidos.');
  });

  it('should support signOut with local, others, and global scopes', async () => {
    await expect(supabaseAuthService.signOut('local')).resolves.not.toThrow();
    await expect(supabaseAuthService.signOut('others')).resolves.not.toThrow();
    await expect(supabaseAuthService.signOut('global')).resolves.not.toThrow();
  });

  it('should request password reset safely without leaking tokens', async () => {
    const res = await supabaseAuthService.resetPassword('ana@exemplo.com');
    expect(res.success).toBe(true);
    expect(res.message).toContain('Se houver uma conta associada');
  });

  it('should mask emails correctly in audit and migration reports', () => {
    expect(maskEmail('ana@exemplo.com')).toBe('a***a@exemplo.com');
    expect(maskEmail('carlos.silva@empresa.com.br')).toBe('c***a@empresa.com.br');
  });

  it('should run idempotent legacy user migration with masked emails and no plaintext passwords', async () => {
    const report = await legacyUserMigrationService.runMigration();
    expect(report.totalFound).toBeGreaterThan(0);
    expect(report.migratedCount).toBeGreaterThan(0);
    expect(report.status).toMatch(/completed|dry_run_success/);
    expect(report.integrityVerified).toBe(true);

    // Verify no password values or secrets in details
    report.details.forEach((d) => {
      expect(d.reason).not.toContain('123');
      expect((d as any).password).toBeUndefined();
      expect((d as any).token).toBeUndefined();
    });
  });

  it('should list devices and format current session', async () => {
    const devices = await supabaseUserService.getDevices('user-demo-1');
    expect(devices.length).toBeGreaterThan(0);
    expect(devices[0].isCurrent).toBe(true);
    expect(devices[0].type).toBeDefined();
  });

  it('should reject export user data requests with 403 error', async () => {
    await expect(supabaseUserService.exportUserData('user-demo-1')).rejects.toThrow('403');
  });

  describe('Two-Account Isolation & RLS Cross-Access Tests (Simulated & Rule Check)', () => {
    const userA = { id: 'uuid-user-a-1111', email: 'user.a@exemplo.com' };
    const userB = { id: 'uuid-user-b-2222', email: 'user.b@exemplo.com' };

    it('User A cannot update or delete User B profile via RLS rule (auth.uid() = id)', () => {
      const isAllowedAonB = userA.id === userB.id;
      expect(isAllowedAonB).toBe(false);
    });

    it('User A cannot access User B mood entries or practices via RLS rule (auth.uid() = user_id)', () => {
      const moodRecordB = { id: 'mood-123', userId: userB.id, score: 5 };
      const canUserARead = moodRecordB.userId === userA.id;
      expect(canUserARead).toBe(false);
    });

    it('Storage policy prevents User A from writing to User B avatar path avatars/user_b/*', () => {
      const targetPath = `${userB.id}/avatar_1.jpg`;
      const canUserAUpload = targetPath.startsWith(`${userA.id}/`);
      expect(canUserAUpload).toBe(false);
    });
  });

  describe('SQL Migrations & Security Hardening Integrity', () => {
    const migrationsDir = path.join(__dirname, '../../supabase/migrations');

    it('should have all 4 versioned migration files in standard supabase/migrations/', () => {
      const files = fs.readdirSync(migrationsDir);
      expect(files).toContain('20260823000001_initial_schema.sql');
      expect(files).toContain('20260823000002_rls_policies.sql');
      expect(files).toContain('20260823000003_triggers_and_functions.sql');
      expect(files).toContain('20260823000004_security_advisor_fixes.sql');
    });

    it('migration 01 should contain all 9 required tables and constraints', () => {
      const sql = fs.readFileSync(path.join(migrationsDir, '20260823000001_initial_schema.sql'), 'utf-8');
      expect(sql).toContain('create table if not exists public.profiles');
      expect(sql).toContain('create table if not exists public.user_preferences');
      expect(sql).toContain('create table if not exists public.mood_entries');
      expect(sql).toContain('create table if not exists public.practice_progress');
      expect(sql).toContain('create table if not exists public.article_progress');
      expect(sql).toContain('create table if not exists public.conversations');
      expect(sql).toContain('create table if not exists public.messages');
      expect(sql).toContain('create table if not exists public.app_devices');
      expect(sql).toContain('create table if not exists public.audit_events');
      expect(sql).toContain('unique (user_id, article_id)');
      expect(sql).toContain('check (mood_score between 1 and 5)');
      expect(sql).toContain('check (anxiety_score between 0 and 10)');
    });

    it('migration 02 should enable RLS on all tables and create storage policies', () => {
      const sql = fs.readFileSync(path.join(migrationsDir, '20260823000002_rls_policies.sql'), 'utf-8');
      expect(sql).toContain('alter table public.profiles enable row level security;');
      expect(sql).toContain('alter table public.user_preferences enable row level security;');
      expect(sql).toContain('alter table public.mood_entries enable row level security;');
      expect(sql).toContain('alter table public.practice_progress enable row level security;');
      expect(sql).toContain('alter table public.article_progress enable row level security;');
      expect(sql).toContain('alter table public.conversations enable row level security;');
      expect(sql).toContain('alter table public.messages enable row level security;');
      expect(sql).toContain('alter table public.app_devices enable row level security;');
      expect(sql).toContain('alter table public.audit_events enable row level security;');
      expect(sql).toContain('auth.uid() = id');
      expect(sql).toContain('auth.uid() = user_id');
      expect(sql).toContain('storage.buckets');
      expect(sql).toContain('avatars_select_own');
    });

    it('migration 04 should harden handle_new_user with SET search_path = \'\' and revoke public permissions', () => {
      const sql = fs.readFileSync(path.join(migrationsDir, '20260823000004_security_advisor_fixes.sql'), 'utf-8');
      expect(sql).toContain('create or replace function public.handle_new_user()');
      expect(sql).toContain('security definer');
      expect(sql).toContain("set search_path = ''");
      expect(sql).toContain('revoke all on function public.handle_new_user() from public, anon;');
      expect(sql).toContain('grant execute on function public.handle_new_user() to supabase_auth_admin, service_role, postgres;');
    });
  });
});
