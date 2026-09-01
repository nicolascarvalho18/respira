import {
  DailyExercise,
  DailyRoutineState,
  DailyExerciseStatus,
} from '../../types';
import { storage } from '../storage/asyncStorage';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { logger } from '../../utils/logger';

// Pool de Práticas de Respiração Diárias
const BREATHING_EXERCISES_POOL = [
  {
    type: 'breathing' as const,
    title: 'Respiração 4–7–8',
    description: 'Quatro segundos para inspirar, sete para reter e oito para expirar suavemente.',
    durationMinutes: 4,
    durationLabel: '4 min',
    difficulty: 'Suave' as const,
    actionUrl: '/practices/player/practice-breathing-478',
    targetPracticeId: 'practice-breathing-478',
  },
  {
    type: 'breathing' as const,
    title: 'Respiração quadrada',
    description: 'Tempos iguais de inspiração, pausa com ar, expiração e pausa sem ar para centramento.',
    durationMinutes: 4,
    durationLabel: '4 min',
    difficulty: 'Suave' as const,
    actionUrl: '/practices/player/practice-breathing-box',
    targetPracticeId: 'practice-breathing-box',
  },
  {
    type: 'breathing' as const,
    title: 'Respiração equilibrada 4–4',
    description: 'Ritmo suave e harmônico para estabilizar a frequência cardíaca.',
    durationMinutes: 3,
    durationLabel: '3 min',
    difficulty: 'Suave' as const,
    actionUrl: '/practices/player/practice-breathing-44',
    targetPracticeId: 'practice-breathing-44',
  },
  {
    type: 'breathing' as const,
    title: 'Respiração diafragmática guiada',
    description: 'Condução com voz e som de água para expandir a capacidade pulmonar sem esforço.',
    durationMinutes: 5,
    durationLabel: '5 min',
    difficulty: 'Leve' as const,
    actionUrl: '/practices/player/practice-breathing-guided',
    targetPracticeId: 'practice-breathing-guided',
  },
];

// Pool de Exercícios de Relaxamento / Atenção Plena
const MINDFULNESS_EXERCISES_POOL = [
  {
    type: 'mindfulness' as const,
    title: 'Ancoragem no presente',
    description: 'Foque a atenção nas sensações do corpo e nos sons do ambiente imediato.',
    durationMinutes: 5,
    durationLabel: '5 min',
    difficulty: 'Suave' as const,
    actionUrl: '/practices/player/practice-mindfulness-anchoring',
    targetPracticeId: 'practice-mindfulness-anchoring',
  },
  {
    type: 'mindfulness' as const,
    title: 'Relaxamento muscular progressivo',
    description: 'Tensão e relaxamento alternados para soltar nós e peso acumulado no corpo.',
    durationMinutes: 6,
    durationLabel: '6 min',
    difficulty: 'Leve' as const,
    actionUrl: '/practices/player/practice-pmr-relaxation',
    targetPracticeId: 'practice-pmr-relaxation',
  },
  {
    type: 'mindfulness' as const,
    title: 'Técnica 5–4–3–2–1 dos sentidos',
    description: 'Reconheça estímulos reais ao seu redor para interromper ciclos de preocupação.',
    durationMinutes: 4,
    durationLabel: '4 min',
    difficulty: 'Suave' as const,
    actionUrl: '/practices/player/practice-grounding-54321',
    targetPracticeId: 'practice-grounding-54321',
  },
  {
    type: 'mindfulness' as const,
    title: 'Pausa consciente',
    description: 'Breve intervalo meditativo para desacelerar pensamentos durante o dia.',
    durationMinutes: 4,
    durationLabel: '4 min',
    difficulty: 'Suave' as const,
    actionUrl: '/practices/player/practice-mindfulness-pause',
    targetPracticeId: 'practice-mindfulness-pause',
  },
];

// Pool de Registros de Humor e Reflexão
const MOOD_EXERCISES_POOL = [
  {
    type: 'mood_checkin' as const,
    title: 'Check-in de humor e bem-estar',
    description: 'Registre como você está se sentindo agora e identifique possíveis gatilhos.',
    durationMinutes: 2,
    durationLabel: '2 min',
    difficulty: 'Suave' as const,
    actionUrl: '/mood/new',
  },
  {
    type: 'mood_checkin' as const,
    title: 'Reflexão e gratidão do dia',
    description: 'Dedique dois minutos para reconhecer um ponto positivo ou aprendizado de hoje.',
    durationMinutes: 2,
    durationLabel: '2 min',
    difficulty: 'Suave' as const,
    actionUrl: '/mood/new',
  },
  {
    type: 'mood_checkin' as const,
    title: 'Autoavaliação de ritmo e energia',
    description: 'Observe o seu nível de cansaço e estabeleça uma intenção gentil para o seu descanso.',
    durationMinutes: 3,
    durationLabel: '3 min',
    difficulty: 'Suave' as const,
    actionUrl: '/mood/new',
  },
];

class DailyRoutineService {
  /**
   * Converte uma data em string YYYY-MM-DD segura
   */
  formatDateKey(date: Date | string = new Date()): string {
    if (typeof date === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      date = new Date(date);
    }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Gera um seed numérico estável para o dia
   */
  private getDaySeed(dateKey: string): number {
    let hash = 0;
    for (let i = 0; i < dateKey.length; i++) {
      hash = (hash << 5) - hash + dateKey.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * Obtém a rotina diária configurada para o dia e usuário
   */
  async getDailyRoutine(userId?: string, targetDate: Date | string = new Date()): Promise<DailyRoutineState> {
    const dateKey = this.formatDateKey(targetDate);
    const seed = this.getDaySeed(dateKey);

    const breathingIndex = seed % BREATHING_EXERCISES_POOL.length;
    const mindfulnessIndex = (seed + 1) % MINDFULNESS_EXERCISES_POOL.length;
    const moodIndex = (seed + 2) % MOOD_EXERCISES_POOL.length;

    const baseExercises: DailyExercise[] = [
      {
        id: `daily-breathing-${dateKey}`,
        ...BREATHING_EXERCISES_POOL[breathingIndex],
        status: 'not_started',
      },
      {
        id: `daily-mindfulness-${dateKey}`,
        ...MINDFULNESS_EXERCISES_POOL[mindfulnessIndex],
        status: 'not_started',
      },
      {
        id: `daily-mood-${dateKey}`,
        ...MOOD_EXERCISES_POOL[moodIndex],
        status: 'not_started',
      },
    ];

    if (!userId) {
      return {
        routineDate: dateKey,
        exercises: baseExercises,
        completedCount: 0,
        totalCount: baseExercises.length,
        isAllCompleted: false,
      };
    }

    const storageKey = `respira_daily_routine_${userId}_${dateKey}`;
    const localProgress = (await storage.getItem<Record<string, { status: DailyExerciseStatus; completedAt?: string }>>(storageKey)) || {};

    // Sincronizar com Supabase se disponível
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('daily_routine_progress')
          .select('exercise_id, status, completed_at')
          .eq('user_id', userId)
          .eq('routine_date', dateKey);

        if (!error && data) {
          data.forEach((row: any) => {
            localProgress[row.exercise_id] = {
              status: row.status as DailyExerciseStatus,
              completedAt: row.completed_at,
            };
          });
        }
      } catch (err) {
        logger.warn('Could not fetch daily routine progress from Supabase:', err);
      }
    }

    const mergedExercises: DailyExercise[] = baseExercises.map((ex) => {
      const saved = localProgress[ex.id];
      return {
        ...ex,
        status: saved?.status || 'not_started',
        completedAt: saved?.completedAt,
      };
    });

    const completedCount = mergedExercises.filter((e) => e.status === 'completed').length;

    return {
      routineDate: dateKey,
      exercises: mergedExercises,
      completedCount,
      totalCount: mergedExercises.length,
      isAllCompleted: completedCount === mergedExercises.length && mergedExercises.length > 0,
    };
  }

  /**
   * Atualiza o status de um exercício diário para o usuário
   */
  async updateExerciseStatus(
    userId: string,
    exerciseId: string,
    nextStatus: DailyExerciseStatus,
    targetDate: Date | string = new Date()
  ): Promise<DailyRoutineState> {
    const dateKey = this.formatDateKey(targetDate);
    const storageKey = `respira_daily_routine_${userId}_${dateKey}`;

    const localProgress = (await storage.getItem<Record<string, { status: DailyExerciseStatus; completedAt?: string }>>(storageKey)) || {};
    const completedAt = nextStatus === 'completed' ? new Date().toISOString() : undefined;

    localProgress[exerciseId] = {
      status: nextStatus,
      completedAt,
    };

    await storage.setItem(storageKey, localProgress);

    // Sincronizar no Supabase
    if (isSupabaseConfigured) {
      try {
        const exerciseType = exerciseId.includes('breathing')
          ? 'breathing'
          : exerciseId.includes('mindfulness')
          ? 'mindfulness'
          : 'mood_checkin';

        await supabase.from('daily_routine_progress').upsert(
          {
            user_id: userId,
            routine_date: dateKey,
            exercise_id: exerciseId,
            exercise_type: exerciseType,
            status: nextStatus,
            completed_at: completedAt || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,routine_date,exercise_id' }
        );
      } catch (err) {
        logger.warn('Error syncing daily exercise progress to Supabase:', err);
      }
    }

    return this.getDailyRoutine(userId, targetDate);
  }
}

export const dailyRoutineService = new DailyRoutineService();
