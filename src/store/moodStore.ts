import { create } from 'zustand';
import { MoodRecord, MoodStats, PlannedExercise } from '../types';
import { moodService } from '../services/mood/moodService';
import { calculateMoodStats } from '../utils/stats';

interface MoodState {
  records: MoodRecord[];
  stats: MoodStats;
  selectedTimeRange: '7d' | '30d' | 'all';
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRecords: (userId?: string) => Promise<void>;
  clearRecords: () => void;
  addRecord: (record: Omit<MoodRecord, 'id' | 'createdAt'>) => Promise<MoodRecord>;
  updateRecord: (id: string, partial: Partial<MoodRecord>) => Promise<MoodRecord>;
  updateExerciseStatus: (
    recordId: string,
    exerciseId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'ignored',
    notes?: string
  ) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  setTimeRange: (range: '7d' | '30d' | 'all') => void;
  getFilteredRecords: () => MoodRecord[];
}

export const useMoodStore = create<MoodState>((set, get) => ({
  records: [],
  stats: {
    averageMood: 0,
    averageAnxiety: 0,
    totalCheckins: 0,
    topEmotions: [],
    weeklyData: [],
  },
  selectedTimeRange: '7d',
  isLoading: false,
  error: null,

  clearRecords: () => {
    set({
      records: [],
      stats: {
        averageMood: 0,
        averageAnxiety: 0,
        totalCheckins: 0,
        topEmotions: [],
        weeklyData: [],
      },
      isLoading: false,
      error: null,
    });
  },

  fetchRecords: async (userId?: string) => {
    try {
      set({ isLoading: true, error: null });
      const records = await moodService.getRecords(userId);
      const stats = calculateMoodStats(records);
      set({ records, stats, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao carregar registros' });
    }
  },

  addRecord: async (recordData) => {
    try {
      set({ isLoading: true, error: null });
      const newRecord = await moodService.createRecord(recordData);
      const updatedRecords = [newRecord, ...get().records];
      const stats = calculateMoodStats(updatedRecords);
      set({ records: updatedRecords, stats, isLoading: false });
      return newRecord;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao salvar registro' });
      throw err;
    }
  },

  updateRecord: async (id, partial) => {
    try {
      set({ isLoading: true, error: null });
      const updatedRecord = await moodService.updateRecord(id, partial);
      const updatedRecords = get().records.map((r) => (r.id === id ? updatedRecord : r));
      const stats = calculateMoodStats(updatedRecords);
      set({ records: updatedRecords, stats, isLoading: false });
      return updatedRecord;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao atualizar registro' });
      throw err;
    }
  },

  updateExerciseStatus: async (recordId, exerciseId, status, notes) => {
    const record = get().records.find((r) => r.id === recordId);
    if (!record || !record.plannedExercises) return;

    const updatedExercises = record.plannedExercises.map((e) =>
      e.id === exerciseId
        ? {
            ...e,
            status,
            notes: notes !== undefined ? notes : e.notes,
            completedAt: status === 'completed' ? new Date().toISOString() : e.completedAt,
          }
        : e
    );

    await get().updateRecord(recordId, { plannedExercises: updatedExercises });
  },

  deleteRecord: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await moodService.deleteRecord(id);
      const filtered = get().records.filter((r) => r.id !== id);
      const stats = calculateMoodStats(filtered);
      set({ records: filtered, stats, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao excluir registro' });
      throw err;
    }
  },

  setTimeRange: (range) => {
    set({ selectedTimeRange: range });
  },

  getFilteredRecords: () => {
    const { records, selectedTimeRange } = get();
    if (selectedTimeRange === 'all') return records;

    const days = selectedTimeRange === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return records.filter((r) => new Date(r.createdAt) >= cutoff);
  },
}));
