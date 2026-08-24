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
      expect(html).toContain('Nenhum registro disponível para este período.');
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

      expect(html).not.toContain('<div class="stats-row">');
      expect(html).not.toContain('Check-ins Totais');
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
});
