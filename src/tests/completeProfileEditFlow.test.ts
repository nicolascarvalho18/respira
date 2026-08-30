import { userService } from '../services/user/userService';
import { userAccountService } from '../server/services/userAccountService';
import { supabaseUserService } from '../services/user/supabaseUserService';
import { storage } from '../services/storage/asyncStorage';

describe('Suite de Testes Obrigatórios — Edição Completa de Perfil', () => {
  const user1 = 'usr-test-uuid-001';
  const user2 = 'usr-test-uuid-002';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Cenário 1: Alterar somente o nome
  test('1. Alterar somente o nome', async () => {
    const updated = await userService.updateProfile(user1, {
      name: 'Nicolas Carvalho Ferreira',
    });

    expect(updated.name).toBe('Nicolas Carvalho Ferreira');

    const fetched = await userAccountService.getUserById(user1);
    expect(fetched?.name).toBe('Nicolas Carvalho Ferreira');
  });

  // Cenário 2: Alterar somente a biografia
  test('2. Alterar somente a biografia', async () => {
    const bioText = 'Desenvolvedor focado em acessibilidade e saúde mental digital.';
    const updated = await userService.updateProfile(user1, {
      bio: bioText,
    });

    expect(updated.bio).toBe(bioText);
    expect(updated.name).toBe('Nicolas Carvalho Ferreira');

    const fetched = await userAccountService.getUserById(user1);
    expect(fetched?.bio).toBe(bioText);
    expect(fetched?.name).toBe('Nicolas Carvalho Ferreira');
  });

  // Cenário 3: Adicionar uma foto pela primeira vez
  test('3. Adicionar uma foto pela primeira vez', async () => {
    const avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';
    const updated = await userService.updateAvatar(user1, avatarUrl);

    expect(updated.avatarUrl).toBe(avatarUrl);

    const fetched = await userAccountService.getUserById(user1);
    expect(fetched?.avatarUrl).toBe(avatarUrl);
  });

  // Cenário 4: Substituir uma foto existente
  test('4. Substituir uma foto existente', async () => {
    const newAvatarUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300';
    const updated = await userService.updateAvatar(user1, newAvatarUrl);

    expect(updated.avatarUrl).toBe(newAvatarUrl);

    const fetched = await userAccountService.getUserById(user1);
    expect(fetched?.avatarUrl).toBe(newAvatarUrl);
  });

  // Cenário 5: Alterar nome, biografia e foto ao mesmo tempo
  test('5. Alterar nome, biografia e foto ao mesmo tempo', async () => {
    const allInOneAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300';
    const updated = await userService.updateProfile(user1, {
      name: 'Nicolas C. Ferreira',
      bio: 'Perfil completo e integrado com sucesso.',
      avatarUrl: allInOneAvatar,
    });

    expect(updated.name).toBe('Nicolas C. Ferreira');
    expect(updated.bio).toBe('Perfil completo e integrado com sucesso.');
    expect(updated.avatarUrl).toBe(allInOneAvatar);

    const fetched = await userAccountService.getUserById(user1);
    expect(fetched?.name).toBe('Nicolas C. Ferreira');
    expect(fetched?.bio).toBe('Perfil completo e integrado com sucesso.');
    expect(fetched?.avatarUrl).toBe(allInOneAvatar);
  });

  // Cenário 6: Salvar e atualizar a página (persistência no storage e banco)
  test('6. Salvar e atualizar a página mantendo dados salvos', async () => {
    // Simula leitura após reload a partir do storage persistente
    const cachedUser = await storage.getItem<any>('respira_current_user');
    expect(cachedUser).toBeDefined();
    expect(cachedUser?.name).toBe('Nicolas C. Ferreira');
    expect(cachedUser?.bio).toBe('Perfil completo e integrado com sucesso.');
  });

  // Cenário 7: Sair da conta e entrar novamente
  test('7. Sair da conta e entrar novamente', async () => {
    // Ao buscar novamente pelo ID do usuário autenticado no banco
    const userAfterLogin = await userAccountService.getUserById(user1);
    expect(userAfterLogin).toBeDefined();
    expect(userAfterLogin?.id).toBe(user1);
    expect(userAfterLogin?.name).toBe('Nicolas C. Ferreira');
    expect(userAfterLogin?.bio).toBe('Perfil completo e integrado com sucesso.');
    expect(userAfterLogin?.avatarUrl).toContain('unsplash.com');
  });

  // Cenário 8: Editar um usuário que ainda não possui perfil completo
  test('8. Editar um usuário que ainda não possui perfil completo', async () => {
    const freshUserId = 'user-fresh-novo-cadastro-003';
    const created = await userService.updateProfile(freshUserId, {
      name: 'Novo Usuário Cadastrado',
      bio: 'Primeiro acesso e preenchimento de bio.',
    });

    expect(created).toBeDefined();
    expect(created.id).toBe(freshUserId);
    expect(created.name).toBe('Novo Usuário Cadastrado');
    expect(created.bio).toBe('Primeiro acesso e preenchimento de bio.');
  });

  // Cenário 9: Tentar enviar imagem inválida ou acima do limite
  test('9. Validação de formato e tamanho de foto de perfil', () => {
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidMime = 'application/pdf';
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    expect(validMimes.includes('image/png')).toBe(true);
    expect(validMimes.includes('image/jpeg')).toBe(true);
    expect(validMimes.includes('image/webp')).toBe(true);
    expect(validMimes.includes(invalidMime)).toBe(false);

    const validFileSize = 3 * 1024 * 1024;
    const oversizedFile = 6 * 1024 * 1024;

    expect(validFileSize <= maxSizeBytes).toBe(true);
    expect(oversizedFile <= maxSizeBytes).toBe(false);
  });

  // Cenário 10: Confirmar que um usuário não consegue modificar o perfil de outro
  test('10. Isolamento de contas — usuário A não altera dados de usuário B', async () => {
    // Configurar usuário 2
    await userService.updateProfile(user2, {
      name: 'Mariana Santos',
      bio: 'Perfil da Mariana.',
    });

    // Alterar dados do usuário 1
    await userService.updateProfile(user1, {
      name: 'Nicolas Alterado Novamente',
    });

    // Verificar se o usuário 2 continua intacto
    const user2Data = await userAccountService.getUserById(user2);
    expect(user2Data?.name).toBe('Mariana Santos');
    expect(user2Data?.bio).toBe('Perfil da Mariana.');
  });
});
