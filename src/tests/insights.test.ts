import { correlationInsightsService } from '../services/analytics/correlationInsightsService';
import { MoodRecord, Practice } from '../types';

describe('Correlation Insights Engine (QA-011)', () => {
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

  it('deve retornar lista vazia quando houver menos de 3 registros', () => {
    const emptyResult = correlationInsightsService.calculateInsights([], samplePractices);
    expect(emptyResult).toEqual([]);
  });

  it('deve retornar observação inicial com aviso de dados insuficientes quando houver menos de 14 registros', () => {
    const smallRecords: MoodRecord[] = Array.from({ length: 7 }, (_, i) => ({
      id: `rec-${i}`,
      userId: 'user-1',
      mood: 4,
      anxietyLevel: 2,
      emotions: ['Calmo'],
      activities: ['Descanso'],
      createdAt: `2026-08-${(10 + i).toString().padStart(2, '0')}T10:00:00Z`,
    }));

    const insights = correlationInsightsService.calculateInsights(smallRecords, samplePractices);
    expect(insights.length).toBe(1);
    expect(insights[0].confidence).toBe('insufficient_data');
    expect(insights[0].description).toContain('Ainda não há dados suficientes para identificar um padrão');
    expect(insights[0].disclaimer).toContain('não substituem avaliação médica');
  });

  it('deve retornar observação preliminar com ressalva quando houver entre 14 e 29 registros em dias distintos', () => {
    const mediumRecords: MoodRecord[] = Array.from({ length: 16 }, (_, i) => ({
      id: `rec-${i}`,
      userId: 'user-1',
      mood: 4,
      anxietyLevel: i % 2 === 0 ? 2 : 4,
      emotions: ['Calmo', 'Tranquilo'],
      activities: ['Caminhada'],
      createdAt: `2026-08-${(i + 1).toString().padStart(2, '0')}T10:00:00Z`,
    }));

    const insights = correlationInsightsService.calculateInsights(mediumRecords, samplePractices);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].confidence).toBe('preliminary_observation');
    expect(insights[0].isPreliminary).toBe(true);
    expect(insights[0].sampleSize).toBe(16);
    expect(insights[0].distinctDays).toBe(16);
  });

  it('deve identificar tendência consistente (sem afirmar causalidade médica) quando houver 30 ou mais registros', () => {
    const largeRecords: MoodRecord[] = Array.from({ length: 32 }, (_, i) => ({
      id: `rec-${i}`,
      userId: 'user-1',
      mood: 4,
      anxietyLevel: 2,
      emotions: ['Calmo'],
      activities: ['Meditação'],
      createdAt: `2026-08-${((i % 25) + 1).toString().padStart(2, '0')}T10:00:00Z`,
    }));

    const insights = correlationInsightsService.calculateInsights(largeRecords, samplePractices);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].confidence).toBe('consistent_pattern');
    expect(insights[0].isPreliminary).toBe(false);
    expect(insights[0].disclaimer).toBeDefined();
  });
});
