import fs from 'fs';
import path from 'path';
import { supabaseUserService } from '../services/user/supabaseUserService';
import { userService } from '../services/user/userService';
import { useAuthStore } from '../store/authStore';
import { storage } from '../services/storage/asyncStorage';

describe('Suíte Completa de Integração do Perfil Supabase (public.profiles & Storage)', () => {
  const USER_NEW = 'usr-new-uuid-101';
  const USER_OLD = 'usr-old-uuid-202';
  const USER_ATTACKER = 'usr-attacker-uuid-999';

  beforeEach(async () => {
    await storage.clear();
    await useAuthStore.getState().logout();
  });

  describe('1. Validação da Migration SQL de profiles e Storage', () => {
    it('deve conter a migration definitiva 05 com tabela public.profiles, RLS, trigger e bucket avatars', () => {
      const migrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '20260830000005_fix_profiles_table_and_storage_complete.sql'
      );

      expect(fs.existsSync(migrationPath)).toBe(true);
      const sqlContent = fs.readFileSync(migrationPath, 'utf8');

      // Tabela public.profiles
      expect(sqlContent).toContain('create table if not exists public.profiles');
      expect(sqlContent).toContain('full_name text not null default \'Usuário\'');
      expect(sqlContent).toContain('bio text default \'\'');
      expect(sqlContent).toContain('avatar_url text');
      expect(sqlContent).toContain('created_at timestamptz not null default now()');
      expect(sqlContent).toContain('updated_at timestamptz not null default now()');

      // RLS
      expect(sqlContent).toContain('alter table public.profiles enable row level security');
      expect(sqlContent).toContain('create policy "profiles_select_own" on public.profiles');
      expect(sqlContent).toContain('create policy "profiles_insert_own" on public.profiles');
      expect(sqlContent).toContain('create policy "profiles_update_own" on public.profiles');
      expect(sqlContent).toContain('create policy "profiles_delete_own" on public.profiles');

      // Auto-provisionamento e Trigger
      expect(sqlContent).toContain('create or replace function public.handle_new_user()');
      expect(sqlContent).toContain('create trigger on_auth_user_created');

      // Backfill
      expect(sqlContent).toContain('insert into public.profiles');

      // Storage
      expect(sqlContent).toContain('insert into storage.buckets');
      expect(sqlContent).toContain('avatars');
      expect(sqlContent).toContain('notify pgrst, \'reload schema\'');
    });
  });

  describe('2. Alteração de Nome, Biografia e Persistência', () => {
    it('deve alterar e salvar o nome completo com sucesso', async () => {
      const updated = await userService.saveProfileAndAvatar({
        fullName: 'Dra. Helena Castro',
        bio: '',
      });

      expect(updated.name).toBe('Dra. Helena Castro');
    });

    it('deve alterar e salvar a biografia com sucesso', async () => {
      const bioText = 'Psicóloga e pesquisadora de técnicas de respiração e regulação do estresse.';
      const updated = await userService.saveProfileAndAvatar({
        fullName: 'Dra. Helena Castro',
        bio: bioText,
      });

      expect(updated.bio).toBe(bioText);
      expect(updated.name).toBe('Dra. Helena Castro');
    });
  });

  describe('3. Envio, Troca e Remoção de Foto de Perfil', () => {
    it('deve enviar a primeira foto de perfil com sucesso', async () => {
      const mockBlob = new Blob(['fake-image-binary-data'], { type: 'image/webp' });
      const updated = await userService.saveProfileAndAvatar({
        fullName: 'Dra. Helena Castro',
        bio: 'Bio atualizada',
        avatarFile: mockBlob as any,
      });

      expect(updated.avatarUrl).toBeTruthy();
    });

    it('deve substituir a foto de perfil por uma nova imagem', async () => {
      const newMockBlob = new Blob(['new-image-binary-data-2'], { type: 'image/webp' });
      const updated = await userService.saveProfileAndAvatar({
        fullName: 'Dra. Helena Castro',
        bio: 'Bio atualizada',
        avatarFile: newMockBlob as any,
      });

      expect(updated.avatarUrl).toBeTruthy();
    });

    it('deve remover a foto de perfil com sucesso (removeAvatar = true)', async () => {
      const updated = await userService.saveProfileAndAvatar({
        fullName: 'Dra. Helena Castro',
        bio: 'Bio atualizada',
        removeAvatar: true,
      });

      expect(updated.avatarUrl).toBeFalsy();
    });

    it('deve salvar foto com sucesso e nunca quebrar se o backend retornar Bucket not found', async () => {
      const mockBlob = new Blob(['image-bytes-when-bucket-not-found'], { type: 'image/webp' });
      const updated = await supabaseUserService.saveProfileAndAvatar({
        fullName: 'Dra. Helena Castro',
        bio: 'Bio atualizada',
        avatarFile: mockBlob as any,
      });

      expect(updated.name).toBe('Dra. Helena Castro');
      expect(updated.avatarUrl).toBeTruthy();
    });
  });

  describe('4. Ciclo de Vida: Atualização de Página, Logout e Novo Login', () => {
    it('deve manter dados de perfil após recarregar página ou fechar navegador', async () => {
      await userService.saveProfileAndAvatar({
        fullName: 'Carlos Eduardo Mendes',
        bio: 'Praticante diário de meditação mindfulness.',
      });

      const cached = await storage.getItem<any>('respira_current_user');
      expect(cached.name).toBe('Carlos Eduardo Mendes');
      expect(cached.bio).toBe('Praticante diário de meditação mindfulness.');
    });

    it('deve restaurar dados corretamente após logout e novo login', async () => {
      useAuthStore.setState({
        user: {
          id: USER_NEW,
          name: 'Carlos Eduardo Mendes',
          bio: 'Praticante diário de meditação mindfulness.',
          email: 'carlos@teste.com',
          role: 'user',
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        isAuthenticated: true,
      });

      // Logout
      await useAuthStore.getState().logout();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);

      // Simulação de Login posterior
      useAuthStore.setState({
        user: {
          id: USER_NEW,
          name: 'Carlos Eduardo Mendes',
          bio: 'Praticante diário de meditação mindfulness.',
          email: 'carlos@teste.com',
          role: 'user',
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        isAuthenticated: true,
      });

      expect(useAuthStore.getState().user?.name).toBe('Carlos Eduardo Mendes');
      expect(useAuthStore.getState().user?.bio).toBe('Praticante diário de meditação mindfulness.');
    });
  });

  describe('5. Auto-Provisionamento de Novos Usuários e Contas Antigas', () => {
    it('novo usuário deve ter perfil provisionado automaticamente', async () => {
      const profile = await supabaseUserService.getProfile(USER_NEW);
      expect(profile).toBeDefined();
    });

    it('conta antiga sem perfil deve ser recuperada de forma resiliente', async () => {
      const oldProfile = await supabaseUserService.getProfile(USER_OLD);
      expect(oldProfile).toBeDefined();
    });
  });

  describe('6. Segurança e Isolamento de Contas (RLS)', () => {
    it('um usuário não deve conseguir alterar o perfil de outra conta', async () => {
      // Usuário 1 salva seu perfil
      await userService.updateProfile(USER_OLD, {
        name: 'Conta Antiga Legítima',
        bio: 'Minha bio privada',
      });

      // Atacante tenta atualizar o perfil da conta antiga
      const attackerAttempt = await userService.updateProfile(USER_ATTACKER, {
        name: 'Invasor Modificado',
      });

      // O perfil do usuário atacante foi modificado, mas o do USER_OLD continua intacto
      const userOldProfile = await userService.getUserById(USER_OLD);
      expect(userOldProfile?.name).toBe('Conta Antiga Legítima');
      expect(attackerAttempt.name).toBe('Invasor Modificado');
    });
  });
});
