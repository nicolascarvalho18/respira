import { create } from 'zustand';
import {
  DailyExercise,
  DailyRoutineState,
  DailyExerciseStatus,
} from '../types';
import { dailyRoutineService } from '../services/dailyRoutine/dailyRoutineService';

interface DailyRoutineStoreState {
  routine: DailyRoutineState;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDailyRoutine: (userId?: string, date?: Date) => Promise<void>;
  toggleExerciseCompletion: (exerciseId: string, userId?: string) => Promise<{ status: DailyExerciseStatus; isAllCompleted: boolean }>;
  setExerciseStatus: (exerciseId: string, status: DailyExerciseStatus, userId?: string) => Promise<void>;
  resetRoutine: () => void;
}

const INITIAL_ROUTINE_STATE: DailyRoutineState = {
  routineDate: '',
  exercises: [],
  completedCount: 0,
  totalCount: 3,
  isAllCompleted: false,
};

export const useDailyRoutineStore = create<DailyRoutineStoreState>((set, get) => ({
  routine: INITIAL_ROUTINE_STATE,
  isLoading: false,
  error: null,

  fetchDailyRoutine: async (userId?: string, date?: Date) => {
    try {
      set({ isLoading: true, error: null });
      const routine = await dailyRoutineService.getDailyRoutine(userId, date);
      set({ routine, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao carregar rotina diária' });
    }
  },

  toggleExerciseCompletion: async (exerciseId: string, userId?: string) => {
    const { routine } = get();
    const target = routine.exercises.find((e) => e.id === exerciseId);
    const nextStatus: DailyExerciseStatus =
      target?.status === 'completed' ? 'not_started' : 'completed';

    if (!userId) {
      // Atualização otimista em memória quando não há userId
      const updatedExercises = routine.exercises.map((e) =>
        e.id === exerciseId
          ? { ...e, status: nextStatus, completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined }
          : e
      );
      const completedCount = updatedExercises.filter((e) => e.status === 'completed').length;
      const isAllCompleted = completedCount === updatedExercises.length && updatedExercises.length > 0;

      set({
        routine: {
          ...routine,
          exercises: updatedExercises,
          completedCount,
          isAllCompleted,
        },
      });

      return { status: nextStatus, isAllCompleted };
    }

    const updatedRoutine = await dailyRoutineService.updateExerciseStatus(userId, exerciseId, nextStatus);
    set({ routine: updatedRoutine });
    return { status: nextStatus, isAllCompleted: updatedRoutine.isAllCompleted };
  },

  setExerciseStatus: async (exerciseId: string, status: DailyExerciseStatus, userId?: string) => {
    if (!userId) {
      const { routine } = get();
      const updatedExercises = routine.exercises.map((e) =>
        e.id === exerciseId ? { ...e, status } : e
      );
      const completedCount = updatedExercises.filter((e) => e.status === 'completed').length;
      set({
        routine: {
          ...routine,
          exercises: updatedExercises,
          completedCount,
          isAllCompleted: completedCount === updatedExercises.length && updatedExercises.length > 0,
        },
      });
      return;
    }

    const updatedRoutine = await dailyRoutineService.updateExerciseStatus(userId, exerciseId, status);
    set({ routine: updatedRoutine });
  },

  resetRoutine: () => {
    set({ routine: INITIAL_ROUTINE_STATE, isLoading: false, error: null });
  },
}));
