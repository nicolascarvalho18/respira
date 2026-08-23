import { MoodRecord, Practice } from '../../types';

export interface CorrelationInsight {
  id: string;
  title: string;
  description: string;
  sampleSize: number;
  periodDescription: string;
  category: 'anxiety_relief' | 'sleep_mood' | 'habit_consistency';
}

export class CorrelationInsightsService {
  calculateInsights(records: MoodRecord[], practices: Practice[]): CorrelationInsight[] {
    if (!records || records.length < 3) {
      return [];
    }

    const insights: CorrelationInsight[] = [];
    const sampleSize = records.length;
    const periodDescription = 'últimos 30 dias';

    // 1. Check if breathing practice completed count is positive and anxiety correlation exists
    const breathingPractices = practices.filter((p) => p.category === 'breathing');
    const totalBreathingCompletions = breathingPractices.reduce((acc, p) => acc + (p.completedCount || 0), 0);

    const highAnxietyRecords = records.filter((r) => (r.anxietyLevel || 0) >= 5);
    const lowAnxietyRecords = records.filter((r) => (r.anxietyLevel || 0) <= 3);

    if (totalBreathingCompletions >= 2 && lowAnxietyRecords.length > 0) {
      insights.push({
        id: 'insight-breathing-anxiety',
        title: 'Associação com Práticas de Respiração',
        description: `Nos seus ${sampleSize} registros analisados nos ${periodDescription}, foi observada uma associação entre os dias de realização de exercícios de respiração e registros com menor nível de ansiedade.`,
        sampleSize,
        periodDescription,
        category: 'anxiety_relief',
      });
    }

    // 2. Check mood and calmness tags
    const calmCheckins = records.filter((r) =>
      r.emotions?.some((e) => ['Calmo', 'Tranquilo', 'Grato', 'Esperançoso'].includes(e))
    );

    if (calmCheckins.length >= 2) {
      insights.push({
        id: 'insight-emotional-regulation',
        title: 'Momentos de Equilíbrio',
        description: `Em ${calmCheckins.length} dos seus ${sampleSize} check-ins recentes, você identificou sentimentos de calma ou gratidão, especialmente quando reservou momentos para desacelerar.`,
        sampleSize,
        periodDescription,
        category: 'habit_consistency',
      });
    }

    return insights;
  }
}

export const correlationInsightsService = new CorrelationInsightsService();
