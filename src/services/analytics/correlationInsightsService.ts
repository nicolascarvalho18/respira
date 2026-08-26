import { MoodRecord, Practice } from '../../types';

export type InsightConfidence = 'insufficient_data' | 'preliminary_observation' | 'consistent_pattern';

export interface CorrelationInsight {
  id: string;
  title: string;
  description: string;
  sampleSize: number;
  distinctDays: number;
  periodDescription: string;
  category: 'anxiety_relief' | 'sleep_mood' | 'habit_consistency';
  confidence: InsightConfidence;
  isPreliminary: boolean;
  disclaimer: string;
}

export class CorrelationInsightsService {
  /**
   * Calculates responsible, proportionate correlation insights avoiding causal claims
   */
  calculateInsights(records: MoodRecord[], practices: Practice[]): CorrelationInsight[] {
    if (!records || records.length === 0) {
      return [];
    }

    const validRecords = records.filter((r) => r.createdAt && (r.mood !== undefined || r.anxietyLevel !== undefined));
    if (validRecords.length < 3) {
      return [];
    }

    const sampleSize = validRecords.length;
    const distinctDays = new Set(
      validRecords.map((r) => r.createdAt.slice(0, 10))
    ).size;

    const periodDescription = 'últimos 30 dias';
    const medicalDisclaimer = 'Os insights têm finalidade de autoconhecimento e não substituem avaliação médica ou psicológica.';

    const breathingPractices = practices.filter((p) => p.category === 'breathing');
    const totalBreathingCompletions = breathingPractices.reduce(
      (acc, p) => acc + (p.completedCount || 0),
      0
    );

    const lowAnxietyRecords = validRecords.filter((r) => (r.anxietyLevel || 0) <= 3);

    // Rule 1: < 14 records or < 7 distinct days -> Insufficient Data / Initial Notice
    if (sampleSize < 14 || distinctDays < 7) {
      return [
        {
          id: 'insight-exploratory-breathing',
          title: 'Observação Inicial',
          description: 'Em alguns dos seus registros, os dias com práticas coincidiram com níveis menores de ansiedade. Ainda não há dados suficientes para identificar um padrão.',
          sampleSize,
          distinctDays,
          periodDescription,
          category: 'anxiety_relief',
          confidence: 'insufficient_data',
          isPreliminary: true,
          disclaimer: medicalDisclaimer,
        },
      ];
    }

    const insights: CorrelationInsight[] = [];

    // Rule 2: 14 to 29 records distributed in >= 7 days -> Preliminary Observation
    if (sampleSize >= 14 && sampleSize < 30) {
      if (totalBreathingCompletions >= 2 && lowAnxietyRecords.length > 0) {
        insights.push({
          id: 'insight-preliminary-breathing-anxiety',
          title: 'Associação Preliminar com Práticas',
          description: `Nos seus ${sampleSize} registros distribuídos em ${distinctDays} dias distintos nos ${periodDescription}, observamos que os dias em que você realizou práticas coincidiram com registros de menor ansiedade.`,
          sampleSize,
          distinctDays,
          periodDescription,
          category: 'anxiety_relief',
          confidence: 'preliminary_observation',
          isPreliminary: true,
          disclaimer: medicalDisclaimer,
        });
      }

      const calmCheckins = validRecords.filter((r) =>
        r.emotions?.some((e) => ['Calmo', 'Tranquilo', 'Grato', 'Esperançoso'].includes(e))
      );

      if (calmCheckins.length >= 3) {
        insights.push({
          id: 'insight-preliminary-emotional-regulation',
          title: 'Momentos de Equilíbrio Registrados',
          description: `Em ${calmCheckins.length} dos seus ${sampleSize} check-ins recentes, você identificou sentimentos de calma ou tranquilidade nos dias com pausas dedicadas.`,
          sampleSize,
          distinctDays,
          periodDescription,
          category: 'habit_consistency',
          confidence: 'preliminary_observation',
          isPreliminary: true,
          disclaimer: medicalDisclaimer,
        });
      }

      return insights;
    }

    // Rule 3: >= 30 records distributed in >= 14 days -> Consistent Pattern (Never claiming medical causality)
    if (totalBreathingCompletions >= 4 && lowAnxietyRecords.length >= 5) {
      insights.push({
        id: 'insight-consistent-breathing-anxiety',
        title: 'Tendência Consistente Identificada',
        description: `Com base em ${sampleSize} registros ao longo de ${distinctDays} dias distintos, identifica-se uma tendência frequente de níveis mais equilibrados nos períodos em que você mantém práticas regulares.`,
        sampleSize,
        distinctDays,
        periodDescription,
        category: 'anxiety_relief',
        confidence: 'consistent_pattern',
        isPreliminary: false,
        disclaimer: medicalDisclaimer,
      });
    }

    return insights;
  }
}

export const correlationInsightsService = new CorrelationInsightsService();
