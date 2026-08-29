import { supabaseUserService } from '../services/user/supabaseUserService';
import { userService } from '../services/user/userService';
import { supabase } from '../services/supabase/client';
import { processAvatarImage } from '../utils/imageProcessor';
import fs from 'fs';
import path from 'path';

describe('Upload e Persistência de Foto de Perfil (Supabase Storage & Profiles RLS)', () => {
  const mockUserId = 'usr-auth-test-uuid-1234';
  const mockUser = {
    id: mockUserId,
    email: 'usuario.teste@exemplo.com',
    user_metadata: { name: 'Usuário Teste' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Fluxo de Autenticação e Resolução de Usuário', () => {
    it('deve utilizar sempre o auth.getUser() e nunca aceitar usuário nulo', async () => {
      // Simular usuário não autenticado
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as any);

      await expect(
        supabaseUserService.uploadAvatar(mockUserId, new Blob(['test'], { type: 'image/jpeg' }), 'jpg')
      ).rejects.toThrow('Sua sessão expirou. Faça login novamente para continuar.');
    });

    it('deve realizar auto-upsert caso a linha em profiles não exista inicialmente', async () => {
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const upsertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: mockUserId, full_name: 'Usuário Teste', avatar_url: null },
            error: null,
          }),
        }),
      });

      jest.spyOn(supabase, 'from').mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        upsert: upsertMock,
      } as any);

      const profile = await supabaseUserService.getProfile(mockUserId);
      expect(profile).toBeDefined();
      expect(profile?.id).toBe(mockUserId);
      expect(upsertMock).toHaveBeenCalled();
    });
  });

  describe('2. Upload no Storage e Caminho Seguro', () => {
    it('deve usar o bucket avatars e o caminho seguro {userId}/avatar.webp', async () => {
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const uploadMock = jest.fn().mockResolvedValue({
        data: { path: `${mockUserId}/avatar.webp` },
        error: null,
      });

      const getPublicUrlMock = jest.fn().mockReturnValue({
        data: { publicUrl: `https://mock.supabase.co/storage/v1/object/public/avatars/${mockUserId}/avatar.webp` },
      });

      jest.spyOn(supabase.storage, 'from').mockReturnValue({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      } as any);

      jest.spyOn(supabase, 'from').mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ data: { id: mockUserId }, error: null }),
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: mockUserId }, error: null }),
        }),
      } as any);

      const mockBlob = new Blob(['image-binary-data'], { type: 'image/webp' });
      const finalUrl = await supabaseUserService.uploadAvatar(mockUserId, mockBlob, 'webp');

      expect(uploadMock).toHaveBeenCalledWith(
        `${mockUserId}/avatar.webp`,
        mockBlob,
        expect.objectContaining({
          upsert: true,
          contentType: 'image/webp',
        })
      );
      expect(finalUrl).toContain(`${mockUserId}/avatar.webp`);
      expect(finalUrl).toContain('?t='); // Cache buster
    });

    it('deve permitir remover a foto e limpar avatar_url', async () => {
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const removeMock = jest.fn().mockResolvedValue({ data: [], error: null });
      jest.spyOn(supabase.storage, 'from').mockReturnValue({
        remove: removeMock,
      } as any);

      const upsertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: mockUserId, avatar_url: null }, error: null }),
        }),
      });

      jest.spyOn(supabase, 'from').mockReturnValue({
        upsert: upsertMock,
      } as any);

      const success = await supabaseUserService.updateAvatar(mockUserId, null);
      expect(success).toBe(true);
      expect(removeMock).toHaveBeenCalledWith([
        `${mockUserId}/avatar.webp`,
        `${mockUserId}/avatar.jpg`,
        `${mockUserId}/avatar.png`,
      ]);
    });
  });

  describe('3. Validação do Utilitário de Processamento de Imagem', () => {
    it('deve processar arquivo e retornar objeto com preview e extensão', async () => {
      const mockFile = new Blob(['sample-image'], { type: 'image/png' });
      const result = await processAvatarImage(mockFile);
      expect(result).toBeDefined();
      expect(result.blob).toBeDefined();
      expect(result.extension).toBeDefined();
    });
  });

  describe('5. Testes da Função Unificada saveProfileAndAvatar', () => {
    it('deve salvar perfil e avatar com sucesso na ordem correta', async () => {
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const upsertMock = jest.fn().mockResolvedValue({ error: null });
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: mockUserId,
              full_name: 'Novo Nome',
              display_name: 'Novo Nome',
              bio: 'Nova Bio',
              avatar_url: `https://mock.supabase.co/storage/v1/object/public/avatars/${mockUserId}/avatar-123.webp`,
            },
            error: null,
          }),
        }),
      });

      jest.spyOn(supabase, 'from').mockReturnValue({
        upsert: upsertMock,
        update: updateMock,
        select: selectMock,
      } as any);

      const uploadMock = jest.fn().mockResolvedValue({
        data: { path: `${mockUserId}/avatar-123.webp` },
        error: null,
      });
      const getPublicUrlMock = jest.fn().mockReturnValue({
        data: { publicUrl: `https://mock.supabase.co/storage/v1/object/public/avatars/${mockUserId}/avatar-123.webp` },
      });

      jest.spyOn(supabase.storage, 'from').mockReturnValue({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      } as any);

      const mockBlob = new Blob(['mock-img'], { type: 'image/webp' });
      const result = await supabaseUserService.saveProfileAndAvatar({
        fullName: 'Novo Nome',
        bio: 'Nova Bio',
        avatarFile: mockBlob,
      });

      expect(result.name).toBe('Novo Nome');
      expect(result.bio).toBe('Nova Bio');
      expect(result.avatarUrl).toContain('avatar-123.webp');
      expect(upsertMock).toHaveBeenCalled();
      expect(uploadMock).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalled();
    });

    it('deve lançar mensagem de erro específica quando a sessão expirar', async () => {
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' } as any,
      });

      await expect(
        supabaseUserService.saveProfileAndAvatar({
          fullName: 'Teste',
          bio: '',
        })
      ).rejects.toThrow('Sua sessão expirou. Faça login novamente para continuar.');
    });

    it('deve lançar mensagem de erro específica quando o upload falhar', async () => {
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      jest.spyOn(supabase, 'from').mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null }),
      } as any);

      jest.spyOn(supabase.storage, 'from').mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: null, error: { message: 'Bucket not found' } }),
      } as any);

      const mockBlob = new Blob(['mock-img'], { type: 'image/webp' });
      await expect(
        supabaseUserService.saveProfileAndAvatar({
          fullName: 'Teste',
          bio: '',
          avatarFile: mockBlob,
        })
      ).rejects.toThrow('Não foi possível enviar a imagem.');
    });
  });
});
