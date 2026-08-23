import { correlationInsightsService } from '../services/analytics/correlationInsightsService';
import { MoodRecord, Practice } from '../types';

describe('Correlation Insights Engine', () => {
  const samplePractices: Practice[] = [
    {
      id: 'practice-breathing-478',
      title: 'Respiração 4-7-8',
      subtitle: 'Respiração',
      description: 'Desc',
      category: 'breathing',
      durationMinutes: 4,
      level: 'Iniciante',
      icon: 'wind',
      completedCount: 5,
    },
  ];

  const sampleRecords: MoodRecord[] = [
    {
      id: 'rec-1',
      userId: 'user-1',
      mood: 4,
      anxietyLevel: 2,
      emotions: ['Calmo', 'Grato'],
      activities: ['Descanso'],
      createdAt: '2026-08-20T10:00:00Z',
    },
    {
      id: 'rec-2',
      userId: 'user-1',
      mood: 4,
      anxietyLevel: 3,
      emotions: ['Tranquilo'],
      activities: ['Exercício'],
      createdAt: '2026-08-21T10:00:00Z',
    },
    {
      id: 'rec-3',
      userId: 'user-1',
      mood: 2,
      anxietyLevel: 6,
      emotions: ['Preocupado'],
      activities: ['Trabalho'],
      createdAt: '2026-08-22T10:00:00Z',
    },
  ];

  it('should return empty list when insufficient data is provided', () => {
    const emptyResult = correlationInsightsService.calculateInsights([], samplePractices);
    expect(emptyResult).toEqual([]);
  });

  it('should calculate valid correlation insights when sample size is sufficient', () => {
    const insights = correlationInsightsService.calculateInsights(sampleRecords, samplePractices);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].sampleSize).toBe(3);
    expect(insights[0].description).toContain('associação');
  });
});
