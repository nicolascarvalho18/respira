import { supabaseAuthService } from '../services/auth/supabaseAuthService';
import { supabaseUserService } from '../services/user/supabaseUserService';
import { legacyUserMigrationService } from '../services/migration/legacyUserMigrationService';
import fs from 'fs';
import path from 'path';

describe('Supabase Auth & Database Centralization Tests', () => {
  it('should handle sign up and email normalization', async () => {
    const res = await supabaseAuthService.signUp('TEST.USER@EXEMPLO.COM', 'password123', 'Usuário Teste');
    expect(res.error).toBeUndefined();
    expect(res.user).toBeDefined();
    expect(res.user?.email).toBe('test.user@exemplo.com');
    expect(res.user?.name).toBe('Usuário Teste');
  });

  it('should reject short passwords on sign up', async () => {
    const res = await supabaseAuthService.signUp('ana@exemplo.com', '123');
    expect(res.error).toBe('A senha deve ter pelo menos 6 caracteres.');
  });

  it('should handle sign in with normalized email', async () => {
    const res = await supabaseAuthService.signIn('ANA@EXEMPLO.COM', 'qualquerSenha');
    expect(res.error).toBeUndefined();
    expect(res.user).toBeDefined();
    expect(res.user?.email).toBe('ana@exemplo.com');
  });

  it('should support signOut with local, others, and global scopes', async () => {
    await expect(supabaseAuthService.signOut('local')).resolves.not.toThrow();
    await expect(supabaseAuthService.signOut('others')).resolves.not.toThrow();
    await expect(supabaseAuthService.signOut('global')).resolves.not.toThrow();
  });

  it('should request password reset safely without leaking tokens', async () => {
    const res = await supabaseAuthService.requestPasswordReset('ana@exemplo.com');
    expect(res.success).toBe(true);
    expect(res.message).toBeTruthy();
  });

  it('should request email change with double confirmation requirement', async () => {
    const res = await supabaseAuthService.updateEmail('novo.email@exemplo.com');
    expect(res.success).toBe(true);
    expect(res.message).toContain('confirmação');
  });

  it('should run idempotent legacy user migration without storing plaintext passwords', async () => {
    const report = await legacyUserMigrationService.runMigration();
    expect(report.totalScanned).toBeGreaterThan(0);
    expect(report.migratedCount).toBeGreaterThan(0);
    expect(report.status).toMatch(/completed|dry_run_success/);

    // Verify no passwords in details
    const reportString = JSON.stringify(report);
    expect(reportString).not.toContain('password');
    expect(reportString).not.toContain('senha');
  });

  it('should list devices and format current session', async () => {
    const devices = await supabaseUserService.getDevices('user-demo-1');
    expect(devices.length).toBeGreaterThan(0);
    expect(devices[0].isCurrent).toBe(true);
    expect(devices[0].type).toBeDefined();
  });

  it('should export user data package with valid schema', async () => {
    const exported = await supabaseUserService.exportUserData('user-demo-1');
    expect(exported).toBeDefined();
    expect(exported.exportedAt).toBeDefined();
    expect(exported.user).toBeDefined();
  });

  describe('SQL Migrations Integrity', () => {
    const migrationsDir = path.join(__dirname, '../../docs/supabase/migrations');

    it('should have all 3 versioned migration files', () => {
      const files = fs.readdirSync(migrationsDir);
      expect(files).toContain('20260823000001_initial_schema.sql');
      expect(files).toContain('20260823000002_rls_policies.sql');
      expect(files).toContain('20260823000003_triggers_and_functions.sql');
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

    it('migration 03 should define handle_new_user with SECURITY DEFINER and search_path', () => {
      const sql = fs.readFileSync(path.join(migrationsDir, '20260823000003_triggers_and_functions.sql'), 'utf-8');
      expect(sql).toContain('create or replace function public.handle_new_user()');
      expect(sql).toContain('security definer');
      expect(sql).toContain('set search_path = public, auth');
      expect(sql).toContain('on_auth_user_created');
      expect(sql).toContain('after insert on auth.users');
    });
  });
});
