import { pdfReportService } from '../services/report/pdfReportService';
import { User, MoodRecord, Practice } from '../types';

describe('PDF Clinical Report Service', () => {
  const mockUser: User = {
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
      reminderTime: '20:30',
      vibrationEnabled: true,
      soundEnabled: true,
      countryHelpline: 'BR',
    },
  };

  const mockRecords: MoodRecord[] = [
    {
      id: 'rec-1',
      userId: 'user-demo-1',
      mood: 4,
      anxietyLevel: 2,
      emotions: ['Calmo', 'Esperançoso'],
      activities: ['Descanso'],
      createdAt: '2026-08-15T12:00:00Z',
    },
  ];

  const mockPractices: Practice[] = [
    {
      id: 'p-1',
      title: 'Respiração 4-7-8',
      subtitle: 'Respiração',
      description: 'Exercício',
      category: 'breathing',
      durationMinutes: 4,
      level: 'Iniciante',
      icon: 'wind',
      completedCount: 6,
    },
  ];

  it('should generate clinical HTML report with user data and mandatory disclaimer', () => {
    const html = pdfReportService.generateHtmlReport(mockUser, mockRecords, mockPractices, {
      month: 7, // Agosto (0-indexed)
      year: 2026,
      includeStats: true,
      includeEmotions: true,
      includePractices: true,
      includeNotes: true,
    });

    expect(html).toContain('Ana Silva');
    expect(html).toContain('Agosto de 2026');
    expect(html).toContain('não substitui avaliação, diagnóstico ou acompanhamento profissional');
    expect(html).toContain('Respiração 4-7-8');
  });
});
