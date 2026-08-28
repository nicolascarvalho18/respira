import { pdfReportService, MONTH_NAMES } from '../services/report/pdfReportService';
import { notificationService } from '../services/notifications/notificationService';
import { User, MoodRecord, Practice } from '../types';

describe('PDF Clinical Report & Notification Services Suite', () => {
  const mockUserA: User = {
    id: 'user-demo-1',
    name: 'Ana Silva',
    email: 'ana@exemplo.com',
    role: 'user',
    isEmailVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-23T00:00:00Z',
    consents: {
      termsAccepted: true,
      privacyAccepted: true,
      personalizationAccepted: true,
      analyticsAccepted: true,
      acceptedAt: '2026-01-01T00:00:00Z',
    },
    preferences: {
      theme: 'light',
      reducedMotion: false,
      dailyReminder: true,
      reminderTime: '18:00',
      vibrationEnabled: true,
      soundEnabled: true,
      countryHelpline: 'BR',
    },
  };

  const mockUserB: User = {
    id: 'user-demo-2',
    name: 'Carlos Mendes',
    email: 'carlos@exemplo.com',
    role: 'user',
    isEmailVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-23T00:00:00Z',
    consents: {
      termsAccepted: true,
      privacyAccepted: true,
      personalizationAccepted: true,
      analyticsAccepted: true,
      acceptedAt: '2026-01-01T00:00:00Z',
    },
  };

  const mockRecordsA: MoodRecord[] = [
    {
      id: 'rec-1',
      userId: 'user-demo-1',
      mood: 4,
      anxietyLevel: 2,
      emotions: ['Calmo', 'Esperançoso'],
      activities: ['Descanso'],
      notes: 'Dia tranquilo e produtivo',
      createdAt: '2026-08-15T12:00:00Z',
    },
    {
      id: 'rec-feb-leap',
      userId: 'user-demo-1',
      mood: 5,
      anxietyLevel: 1,
      emotions: ['Alegre'],
      activities: ['Caminhada'],
      notes: 'Dia 29 de fevereiro',
      createdAt: '2024-02-29T15:00:00Z',
    },
  ];

  const mockPracticesA: Practice[] = [
    {
      id: 'p-1',
      title: 'Respiração 4-7-8',
      subtitle: 'Respiração para relaxamento',
      description: 'Exercício de controle da ansiedade',
      category: 'breathing',
      durationMinutes: 4,
      level: 'Iniciante',
      icon: 'wind',
      completedCount: 6,
    },
  ];

  describe('1. Relatório para cada um dos 12 meses', () => {
    it('deve gerar corretamente o HTML para todos os 12 meses do ano', () => {
      for (let m = 0; m < 12; m++) {
        const html = pdfReportService.generateHtmlReport(mockUserA, mockRecordsA, mockPracticesA, {
          month: m,
          year: 2026,
          includeMoodSummary: true,
          includeSymptoms: true,
          includePractices: true,
          includeDiaryNotes: true,
        });

        expect(html).toContain('Ana Silva');
        expect(html).toContain(`${MONTH_NAMES[m]} de 2026`);
        expect(html).toContain('não representa diagnóstico médico ou psicológico');
      }
    });
  });

  describe('2. Teste de Fevereiro em Ano Comum e Bissexto', () => {
    it('deve incluir registros até 29 de fevereiro em ano bissexto (2024)', () => {
      const htmlLeap = pdfReportService.generateHtmlReport(mockUserA, mockRecordsA, mockPracticesA, {
        month: 1, // Fevereiro
        year: 2024,
        includeMoodSummary: true,
        includeSymptoms: true,
        includePractices: true,
        includeDiaryNotes: true,
      });

      expect(htmlLeap).toContain('Fevereiro de 2024');
      expect(htmlLeap).toContain('Dia 29 de fevereiro');
    });

    it('não deve incluir registros inexistentes em fevereiro de ano comum (2025)', () => {
      const htmlCommon = pdfReportService.generateHtmlReport(mockUserA, mockRecordsA, mockPracticesA, {
        month: 1, // Fevereiro
        year: 2025,
        includeMoodSummary: true,
        includeSymptoms: true,
        includePractices: true,
        includeDiaryNotes: true,
      });

      expect(htmlCommon).toContain('Fevereiro de 2025');
      expect(htmlCommon).toContain('Não houve registros neste período.');
    });
  });

  describe('3. Histórico Completo e Períodos sem Registros', () => {
    it('deve gerar histórico completo ordenado cronologicamente', () => {
      const html = pdfReportService.generateHtmlReport(mockUserA, mockRecordsA, mockPracticesA, {
        allMonths: true,
        includeMoodSummary: true,
        includeSymptoms: true,
        includePractices: true,
        includeDiaryNotes: true,
      });

      expect(html).toContain('Ana Silva');
      expect(html).toContain('Fevereiro de 2024');
      expect(html).toContain('Agosto de 2026');
    });

    it('deve exibir mensagem clara quando não houver registros', () => {
      const htmlEmpty = pdfReportService.generateHtmlReport(mockUserA, [], [], {
        month: 5, // Junho
        year: 2026,
        includeMoodSummary: true,
        includeSymptoms: true,
        includePractices: false,
        includeDiaryNotes: false,
      });

      expect(htmlEmpty).toContain('Não houve registros neste período.');
    });
  });

  describe('4. Controle Granular das Seções do Documento', () => {
    it('quando includeMoodSummary for falso, não deve incluir a grade de estatísticas', () => {
      const html = pdfReportService.generateHtmlReport(mockUserA, mockRecordsA, mockPracticesA, {
        month: 7,
        year: 2026,
        includeMoodSummary: false,
        includeSymptoms: true,
        includePractices: true,
        includeDiaryNotes: true,
      });

      expect(html).not.toContain('<div class="stats-grid">');
      expect(html).not.toContain('<div class="stat-number">');
    });

    it('quando includeSymptoms for falso, não deve incluir sintomas e emoções', () => {
      const html = pdfReportService.generateHtmlReport(mockUserA, mockRecordsA, mockPracticesA, {
        month: 7,
        year: 2026,
        includeMoodSummary: true,
        includeSymptoms: false,
        includePractices: true,
        includeDiaryNotes: true,
      });

      expect(html).not.toContain('<th>Sintomas & Emoções</th>');
    });

    it('quando includePractices for falso, não deve incluir a seção de práticas', () => {
      const html = pdfReportService.generateHtmlReport(mockUserA, mockRecordsA, mockPracticesA, {
        month: 7,
        year: 2026,
        includeMoodSummary: true,
        includeSymptoms: true,
        includePractices: false,
        includeDiaryNotes: true,
      });

      expect(html).not.toContain('Práticas de Respiração e Relaxamento Realizadas');
      expect(html).not.toContain('Respiração 4-7-8');
    });

    it('quando includeDiaryNotes for falso, não deve incluir anotações do diário', () => {
      const html = pdfReportService.generateHtmlReport(mockUserA, mockRecordsA, mockPracticesA, {
        month: 7,
        year: 2026,
        includeMoodSummary: true,
        includeSymptoms: true,
        includePractices: true,
        includeDiaryNotes: false,
      });

      expect(html).not.toContain('<th>Anotações do Diário</th>');
      expect(html).not.toContain('Dia tranquilo e produtivo');
    });
  });

  describe('5. Isolamento Entre Usuários Diferentes', () => {
    it('relatório do Usuário B não deve conter dados do Usuário A', () => {
      const htmlB = pdfReportService.generateHtmlReport(mockUserB, [], [], {
        month: 7,
        year: 2026,
        includeMoodSummary: true,
        includeSymptoms: true,
        includePractices: true,
        includeDiaryNotes: true,
      });

      expect(htmlB).toContain('Carlos Mendes');
      expect(htmlB).not.toContain('Ana Silva');
      expect(htmlB).toContain('Não houve registros neste período.');
    });
  });

  describe('6. Persistência e Notificações', () => {
    it('deve salvar e carregar configurações de notificação de forma persistente', async () => {
      const config = {
        dailyReminderEnabled: true,
        reminderTime: '19:30',
        selectedDays: [1, 3, 5],
        microPausesEnabled: true,
        microPausesIntervalHours: 3,
      };

      await notificationService.saveConfig(config, 'user-demo-1');
      const loaded = await notificationService.getSavedConfig('user-demo-1');

      expect(loaded.dailyReminderEnabled).toBe(true);
      expect(loaded.reminderTime).toBe('19:30');
      expect(loaded.selectedDays).toEqual([1, 3, 5]);
      expect(loaded.microPausesIntervalHours).toBe(3);
    });
  });
});
