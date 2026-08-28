import { userService } from '../services/user/userService';
import { userAccountService } from '../server/services/userAccountService';
import { supabaseUserService } from '../services/user/supabaseUserService';

describe('Profile Upsert & Persistence Suite — Correção Definitiva', () => {
  const userA = 'user-test-uuid-a';
  const userB = 'user-test-uuid-b';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Alterar Somente o Nome', () => {
    it('deve atualizar e persistir o nome do usuário', async () => {
      const updated = await userService.updateProfile(userA, {
        name: 'Nicolas Carvalho Atualizado',
      });

      expect(updated.name).toBe('Nicolas Carvalho Atualizado');

      const fetched = await userAccountService.getUserById(userA);
      expect(fetched?.name).toBe('Nicolas Carvalho Atualizado');
    });
  });

  describe('2. Adicionar Biografia', () => {
    it('deve salvar e persistir a biografia sem apagar outros campos', async () => {
      const updated = await userService.updateProfile(userA, {
        bio: 'Desenvolvedor de software e pesquisador em saúde digital.',
      });

      expect(updated.bio).toBe('Desenvolvedor de software e pesquisador em saúde digital.');
      expect(updated.name).toBe('Nicolas Carvalho Atualizado');

      const fetched = await userAccountService.getUserById(userA);
      expect(fetched?.bio).toBe('Desenvolvedor de software e pesquisador em saúde digital.');
    });
  });

  describe('3. Adicionar Foto de Perfil', () => {
    it('deve associar e persistir uma nova URL de avatar', async () => {
      const avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';
      const updated = await userService.updateProfile(userA, {
        avatarUrl,
      });

      expect(updated.avatarUrl).toBe(avatarUrl);

      const fetched = await userAccountService.getUserById(userA);
      expect(fetched?.avatarUrl).toBe(avatarUrl);
    });
  });

  describe('4. Alterar Foto de Perfil', () => {
    it('deve substituir a foto anterior pela nova foto', async () => {
      const newAvatarUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300';
      const updated = await userService.updateAvatar(userA, newAvatarUrl);

      expect(updated.avatarUrl).toBe(newAvatarUrl);

      const fetched = await userAccountService.getUserById(userA);
      expect(fetched?.avatarUrl).toBe(newAvatarUrl);
    });
  });

  describe('5. Remover Foto de Perfil', () => {
    it('deve remover a foto e manter nome e biografia intactos', async () => {
      const updated = await userService.updateAvatar(userA, null);

      expect(updated.avatarUrl).toBeUndefined();
      expect(updated.name).toBe('Nicolas Carvalho Atualizado');
      expect(updated.bio).toBe('Desenvolvedor de software e pesquisador em saúde digital.');

      const fetched = await userAccountService.getUserById(userA);
      expect(fetched?.avatarUrl).toBeUndefined();
      expect(fetched?.bio).toBe('Desenvolvedor de software e pesquisador em saúde digital.');
    });
  });

  describe('6. Provisionamento Automático de Perfil Ausente (Sem erro "Usuário não encontrado")', () => {
    it('deve criar automaticamente o perfil de um novo usuário autenticado', async () => {
      const brandNewUser = 'user-uuid-fresh-999';

      // Deve executar sem disparar 'Usuário não encontrado.'
      const created = await userService.updateProfile(brandNewUser, {
        name: 'Mariana Silva',
        bio: 'Psicóloga clínica.',
      });

      expect(created).toBeDefined();
      expect(created.id).toBe(brandNewUser);
      expect(created.name).toBe('Mariana Silva');
      expect(created.bio).toBe('Psicóloga clínica.');

      const fetched = await userAccountService.getUserById(brandNewUser);
      expect(fetched).toBeDefined();
      expect(fetched?.id).toBe(brandNewUser);
      expect(fetched?.name).toBe('Mariana Silva');
    });
  });

  describe('7. Isolamento Entre Múltiplos Usuários', () => {
    it('deve manter dados independentes para usuários diferentes', async () => {
      await userService.updateProfile(userA, {
        name: 'Usuário A',
        bio: 'Bio do Usuário A',
      });

      await userService.updateProfile(userB, {
        name: 'Usuário B',
        bio: 'Bio do Usuário B',
      });

      const userAFetched = await userAccountService.getUserById(userA);
      const userBFetched = await userAccountService.getUserById(userB);

      expect(userAFetched?.name).toBe('Usuário A');
      expect(userAFetched?.bio).toBe('Bio do Usuário A');

      expect(userBFetched?.name).toBe('Usuário B');
      expect(userBFetched?.bio).toBe('Bio do Usuário B');
    });
  });
});
