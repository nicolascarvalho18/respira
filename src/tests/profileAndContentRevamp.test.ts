import { pdfReportService } from '../services/report/pdfReportService';
import { useContentStore } from '../store/contentStore';
import { ALL_ARTICLES, normalizeText } from '../data/articles';
import { User, MoodRecord, Practice } from '../types';

describe('Perfil e Conteúdos — Validação e Testes Obrigatórios', () => {
  const mockUser: User = {
    id: 'user-test-1',
    name: 'Ana Carolina',
    email: 'ana@exemplo.com',
    role: 'user',
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preferences: {
      theme: 'light',
      soundEnabled: true,
      vibrationEnabled: true,
      dailyReminder: true,
      reminderTime: '20:30',
      reducedMotion: false,
      countryHelpline: 'BR',
    },
  };

  const mockPractices: Practice[] = [
    {
      id: 'practice-breathing-478',
      title: 'Respiração 4-7-8',
      subtitle: 'Exercício compassado',
      description: 'Desc',
      category: 'breathing',
      durationMinutes: 4,
      level: 'Iniciante',
      icon: 'wind',
      completedCount: 5,
    },
  ];

  describe('1. Relatório Mensal em PDF', () => {
    it('deve gerar relatório com múltiplos meses em ordem cronológica', () => {
      const records: MoodRecord[] = [
        {
          id: 'rec-1',
          userId: 'user-test-1',
          mood: 4,
          anxietyLevel: 3,
          emotions: ['Calmo', 'Focado'],
          activities: ['Respiração'],
          createdAt: '2026-03-10T10:00:00Z',
          updatedAt: '2026-03-10T10:00:00Z',
        },
        {
          id: 'rec-2',
          userId: 'user-test-1',
          mood: 3,
          anxietyLevel: 5,
          emotions: ['Cansado'],
          activities: ['Descanso'],
          createdAt: '2026-04-15T14:00:00Z',
          updatedAt: '2026-04-15T14:00:00Z',
        },
      ];

      const html = pdfReportService.generateHtmlReport(mockUser, records, mockPractices, {
        allMonths: true,
        includeStats: true,
        includeEmotions: true,
        includePractices: true,
        includeNotes: true,
      });

      expect(html).toContain('Ana Carolina');
      expect(html).toContain('Março de 2026');
      expect(html).toContain('Abril de 2026');
      expect(html).toContain('2 registros');
      expect(html).toContain('Calmo, Focado');
    });

    it('deve exibir mensagem clara para mês sem registros sem quebrar ou omitir', () => {
      const html = pdfReportService.generateHtmlReport(mockUser, [], mockPractices, {
        month: 1, // Fevereiro
        year: 2026,
        allMonths: false,
        includeStats: true,
        includeEmotions: true,
        includePractices: true,
        includeNotes: true,
      });

      expect(html).toContain('Fevereiro de 2026');
      expect(html).toContain('Não houve registros neste período.');
    });

    it('deve respeitar as opções do usuário ao desativar estatísticas e práticas', () => {
      const html = pdfReportService.generateHtmlReport(mockUser, [], mockPractices, {
        month: 0,
        year: 2026,
        allMonths: false,
        includeStats: false,
        includeEmotions: false,
        includePractices: false,
        includeNotes: false,
      });

      expect(html).not.toContain('<div class="stats-grid">');
      expect(html).not.toContain('<div class="stat-number">');
      expect(html).not.toContain('Práticas de Respiração e Relaxamento Realizadas');
    });
  });

  describe('2. Filtros e Busca em Conteúdos', () => {
    beforeEach(() => {
      useContentStore.setState({
        articles: ALL_ARTICLES,
        selectedCategory: 'all',
        searchQuery: '',
        selectedFilter: 'all',
        pageLimit: 10,
      });
    });

    it('deve normalizar buscas ignorando acentos, maiúsculas e espaços', () => {
      expect(normalizeText('Respiração')).toBe('respiracao');
      expect(normalizeText('ATENÇÃO PLENA')).toBe('atencao plena');
      expect(normalizeText('  Saúde Mental  ')).toBe('saude mental');
    });

    it('deve filtrar artigos por busca de texto com e sem acento', () => {
      useContentStore.getState().setSearchQuery('ansiedade');
      const filtered = useContentStore.getState().getFilteredArticles();
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((a) => {
        const textToSearch = normalizeText(
          `${a.title} ${a.summary} ${a.category} ${(a.tags || []).join(' ')} ${a.content || ''}`
        );
        expect(textToSearch).toContain('ansiedade');
      });
    });

    it('deve combinar filtros de categoria e favoritos simultaneamente', () => {
      const arts = [...ALL_ARTICLES];
      arts[0] = { ...arts[0], isFavorite: true, category: 'ansiedade' };
      useContentStore.setState({ articles: arts });

      const store = useContentStore.getState();
      store.setSelectedCategory('ansiedade');
      store.setSelectedFilter('favorites');

      const filtered = store.getFilteredArticles();
      filtered.forEach((a) => {
        expect(a.isFavorite).toBe(true);
        expect(normalizeText(a.category)).toContain('ansiedade');
      });
    });

    it('deve limpar todos os filtros ao chamar clearFilters', () => {
      const store = useContentStore.getState();
      store.setSelectedCategory('sono');
      store.setSearchQuery('insonia');
      store.setSelectedFilter('in_progress');

      store.clearFilters();

      const state = useContentStore.getState();
      expect(state.selectedCategory).toBe('all');
      expect(state.searchQuery).toBe('');
      expect(state.selectedFilter).toBe('all');
    });
  });

  describe('3. Funcionalidades do Perfil — Validação e Regras de Negócio', () => {
    const testUserId = 'user-test-profile-1';

    beforeEach(async () => {
      // Mock inicial
      const { userAccountService } = require('../server/services/userAccountService');
      const { storage } = require('../services/storage/asyncStorage');
      await storage.setItem('respira_users_db', [
        {
          id: testUserId,
          name: 'Nicolas Carvalho',
          email: 'nicolas@exemplo.com',
          role: 'user',
          isEmailVerified: true,
          bio: 'Praticante de meditação',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    });

    it('deve atualizar nome completo removendo espaços duplicados', async () => {
      const { userAccountService } = require('../server/services/userAccountService');
      const updated = await userAccountService.updateProfileDetails(testUserId, {
        name: '  Nicolas    Silva   Carvalho  ',
      });

      expect(updated.name).toBe('Nicolas Silva Carvalho');
    });

    it('deve rejeitar nome com menos de 2 caracteres ou mais de 80 caracteres', async () => {
      const { userAccountService } = require('../server/services/userAccountService');
      await expect(
        userAccountService.updateProfileDetails(testUserId, { name: 'A' })
      ).rejects.toThrow('pelo menos 2 caracteres');

      await expect(
        userAccountService.updateProfileDetails(testUserId, { name: 'A'.repeat(81) })
      ).rejects.toThrow('não pode exceder 80 caracteres');
    });

    it('deve salvar e sanitizar biografia com limite de 180 caracteres', async () => {
      const { userAccountService } = require('../server/services/userAccountService');
      const updated = await userAccountService.updateProfileDetails(testUserId, {
        bio: '<script>alert("xss")</script>Amante de caminhadas ao ar livre e respiração consciente.',
      });

      expect(updated.bio).not.toContain('<script>');
      expect(updated.bio).toBe('alert("xss")Amante de caminhadas ao ar livre e respiração consciente.');

      // Rejeita biografia maior que 180 chars
      await expect(
        userAccountService.updateProfileDetails(testUserId, { bio: 'A'.repeat(181) })
      ).rejects.toThrow('não pode exceder 180 caracteres');
    });

    it('deve permitir atualizar e remover a foto de perfil', async () => {
      const { userAccountService } = require('../server/services/userAccountService');
      const withPhoto = await userAccountService.updateProfileDetails(testUserId, {
        avatarUrl: 'https://exemplo.com/foto.jpg',
      });
      expect(withPhoto.avatarUrl).toBe('https://exemplo.com/foto.jpg');

      const withoutPhoto = await userAccountService.updateProfileDetails(testUserId, {
        avatarUrl: null,
      });
      expect(withoutPhoto.avatarUrl).toBeUndefined();
    });

    it('deve validar e alterar senha com sucesso', async () => {
      const { userAccountService } = require('../server/services/userAccountService');
      const res = await userAccountService.changePassword(
        testUserId,
        'SenhaAtual@123',
        'NovaSenhaForte@2026'
      );
      expect(res.message).toContain('sucesso');

      // Rejeita senha fraca
      await expect(
        userAccountService.changePassword(testUserId, 'SenhaAtual@123', '123')
      ).rejects.toThrow();
    });

    it('deve listar sessões reais e permitir revogar sessões', async () => {
      const { userAccountService } = require('../server/services/userAccountService');
      const sessions = await userAccountService.getActiveSessions(testUserId);
      expect(sessions.length).toBeGreaterThanOrEqual(1);

      const afterRevoke = await userAccountService.revokeSession(testUserId, 'non-existent-session');
      expect(afterRevoke).toBeDefined();
    });

    it('deve exigir confirmação exata "EXCLUIR MINHA CONTA" para exclusão', async () => {
      const { userAccountService } = require('../server/services/userAccountService');
      await expect(
        userAccountService.requestAccountDeletion(testUserId, 'excluir')
      ).rejects.toThrow('EXCLUIR MINHA CONTA');

      const res = await userAccountService.requestAccountDeletion(testUserId, 'EXCLUIR MINHA CONTA');
      expect(res.success).toBe(true);
    });
  });
});
