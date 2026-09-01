import { create } from 'zustand';
import {
  Practice,
  PracticeCategory,
  PracticeObjective,
  PracticeFormat,
  UserPracticeProgress,
} from '../types';
import { practiceService } from '../services/practice/practiceService';

export type DurationFilter =
  | 'all'
  | '1_min'
  | '5_min'
  | '10_min'
  | '15_min'
  | 'up_to_5'
  | '5_to_10'
  | '10_to_20'
  | 'more_than_20';
export type LevelFilter = 'all' | 'Iniciante' | 'Intermediário' | 'Avançado';
export type FormatFilter = 'all' | PracticeFormat;
export type ObjectiveFilter = 'all' | PracticeObjective;

interface PracticeState {
  practices: Practice[];
  userProgress: Record<string, UserPracticeProgress>;
  downloadedIds: string[];
  selectedCategory: PracticeCategory | 'all' | 'favorites';
  selectedDuration: DurationFilter;
  selectedLevel: LevelFilter;
  selectedFormat: FormatFilter;
  selectedObjective: ObjectiveFilter;
  searchQuery: string;
  activePractice: Practice | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPractices: (userId?: string) => Promise<void>;
  fetchUserProgress: (userId: string) => Promise<void>;
  setSelectedCategory: (category: PracticeCategory | 'all' | 'favorites') => void;
  setSelectedDuration: (duration: DurationFilter) => void;
  setSelectedLevel: (level: LevelFilter) => void;
  setSelectedFormat: (format: FormatFilter) => void;
  setSelectedObjective: (objective: ObjectiveFilter) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  setActivePractice: (practice: Practice | null) => void;
  toggleFavorite: (practiceId: string, userId?: string) => Promise<{ isFavorite: boolean; message: string; }>;
  toggleOfflineDownload: (practiceId: string) => Promise<boolean>;
  recordCompletion: (practiceId: string) => Promise<void>;
  saveProgress: (
    userId: string,
    practiceId: string,
    positionSeconds: number,
    totalSeconds: number,
    isCompleted?: boolean
  ) => Promise<UserPracticeProgress>;
  recordPostFeeling: (
    userId: string,
    practiceId: string,
    feeling: 'calmer' | 'same' | 'uncomfortable',
    notes?: string
  ) => Promise<void>;

  // Admin Actions
  createPractice: (practice: Omit<Practice, 'id'>) => Promise<Practice>;
  updatePractice: (id: string, partial: Partial<Practice>) => Promise<Practice>;
  deletePractice: (id: string) => Promise<void>;

  // Selectors
  getFilteredPractices: () => Practice[];
  getRecommendedPractices: () => Practice[];
  getInProgressPractices: () => Practice[];
  getQuickPractices: () => Practice[];
  getNewPractices: () => Practice[];
  getMostCompletedPractices: () => Practice[];
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  practices: [],
  userProgress: {},
  downloadedIds: [],
  selectedCategory: 'all',
  selectedDuration: 'all',
  selectedLevel: 'all',
  selectedFormat: 'all',
  selectedObjective: 'all',
  searchQuery: '',
  activePractice: null,
  isLoading: false,
  error: null,

  fetchPractices: async (userId?: string) => {
    try {
      set({ isLoading: true, error: null });
      const practices = await practiceService.getPractices(userId);
      set({ practices, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao carregar práticas' });
    }
  },

  fetchUserProgress: async (userId: string) => {
    try {
      const userProgress = await practiceService.getAllUserProgress(userId);
      set({ userProgress });
    } catch (err) {
      console.warn('Could not fetch user progress:', err);
    }
  },

  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedDuration: (duration) => set({ selectedDuration: duration }),
  setSelectedLevel: (level) => set({ selectedLevel: level }),
  setSelectedFormat: (format) => set({ selectedFormat: format }),
  setSelectedObjective: (objective) => set({ selectedObjective: objective }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  resetFilters: () =>
    set({
      selectedCategory: 'all',
      selectedDuration: 'all',
      selectedLevel: 'all',
      selectedFormat: 'all',
      selectedObjective: 'all',
      searchQuery: '',
    }),

  setActivePractice: (practice) => set({ activePractice: practice }),

  toggleFavorite: async (practiceId: string, userId?: string) => {
    const prevPractices = get().practices;
    const currentP = prevPractices.find((p) => p.id === practiceId);
    const optimisticIsFavorite = !(currentP?.isFavorite ?? false);

    // Atualização otimista imediata
    set({
      practices: prevPractices.map((p) =>
        p.id === practiceId ? { ...p, isFavorite: optimisticIsFavorite } : p
      ),
    });

    try {
      const result = await practiceService.toggleFavorite(practiceId, userId);
      set({
        practices: get().practices.map((p) =>
          p.id === practiceId ? { ...p, isFavorite: result.isFavorite } : p
        ),
      });
      return result;
    } catch (err) {
      set({ practices: prevPractices });
      throw err;
    }
  },

  toggleOfflineDownload: async (practiceId) => {
    const isDown = await practiceService.toggleOfflineDownload(practiceId);
    const downloadedIds = isDown
      ? [...get().downloadedIds, practiceId]
      : get().downloadedIds.filter((id) => id !== practiceId);
    set({ downloadedIds });
    return isDown;
  },

  recordCompletion: async (practiceId) => {
    await practiceService.recordCompletion(practiceId);
    const updated = get().practices.map((p) =>
      p.id === practiceId ? { ...p, completedCount: (p.completedCount ?? 0) + 1 } : p
    );
    set({ practices: updated });
  },

  saveProgress: async (userId, practiceId, positionSeconds, totalSeconds, isCompleted) => {
    const updatedProgress = await practiceService.saveProgress(
      userId,
      practiceId,
      positionSeconds,
      totalSeconds,
      isCompleted
    );

    set((state) => ({
      userProgress: {
        ...state.userProgress,
        [practiceId]: updatedProgress,
      },
    }));

    if (isCompleted) {
      get().recordCompletion(practiceId);
    }

    return updatedProgress;
  },

  recordPostFeeling: async (userId, practiceId, feeling, notes) => {
    await practiceService.recordPostFeeling(userId, practiceId, feeling, notes);
    await get().fetchUserProgress(userId);
  },

  createPractice: async (practiceData) => {
    const newPractice = await practiceService.createPractice(practiceData);
    set((state) => ({ practices: [newPractice, ...state.practices] }));
    return newPractice;
  },

  updatePractice: async (id, partial) => {
    const updated = await practiceService.updatePractice(id, partial);
    set((state) => ({
      practices: state.practices.map((p) => (p.id === id ? updated : p)),
    }));
    return updated;
  },

  deletePractice: async (id) => {
    await practiceService.deletePractice(id);
    set((state) => ({
      practices: state.practices.filter((p) => p.id !== id),
    }));
  },

  // ==========================================
  // SELECTORS & FILTERS
  // ==========================================
  getFilteredPractices: () => {
    const {
      practices,
      selectedCategory,
      selectedDuration,
      selectedLevel,
      selectedFormat,
      selectedObjective,
      searchQuery,
    } = get();

    return practices.filter((p) => {
      // 1. Categoria
      if (selectedCategory === 'favorites') {
        if (!p.isFavorite) return false;
      } else if (selectedCategory !== 'all') {
        // Compatibilidade legada e equivalências
        if (selectedCategory === 'guided_meditation' && (p.category === 'guided_meditation' || p.category === 'meditation')) {
          // match
        } else if (selectedCategory === 'mindfulness_focus' && (p.category === 'mindfulness_focus' || p.category === 'mindfulness')) {
          // match
        } else if (p.category !== selectedCategory) {
          return false;
        }
      }

      // 2. Duração
      if (selectedDuration === '1_min' && p.durationMinutes !== 1) return false;
      if (selectedDuration === '5_min' && p.durationMinutes !== 5) return false;
      if (selectedDuration === '10_min' && p.durationMinutes !== 10) return false;
      if (selectedDuration === '15_min' && p.durationMinutes !== 15) return false;
      if (selectedDuration === 'up_to_5' && p.durationMinutes > 5) return false;
      if (selectedDuration === '5_to_10' && (p.durationMinutes < 5 || p.durationMinutes > 10)) return false;
      if (selectedDuration === '10_to_20' && (p.durationMinutes < 10 || p.durationMinutes > 20)) return false;
      if (selectedDuration === 'more_than_20' && p.durationMinutes <= 20) return false;

      // 3. Nível
      if (selectedLevel !== 'all' && p.level !== selectedLevel) return false;

      // 4. Formato
      if (selectedFormat !== 'all' && p.format && p.format !== selectedFormat) return false;

      // 5. Objetivo
      if (selectedObjective !== 'all' && p.objective && p.objective !== selectedObjective) return false;

      // 6. Busca textual com normalização de acentos e hífens
      const q = searchQuery
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u2010-\u2015]/g, '-')
        .trim();

      if (q) {
        const norm = (str?: string) =>
          (str || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[\u2010-\u2015]/g, '-');

        const matchesTitle = norm(p.title).includes(q);
        const matchesSubtitle = norm(p.subtitle).includes(q);
        const matchesDesc = norm(p.description).includes(q);
        const matchesCategory = norm(p.category).includes(q);
        const matchesInstructor = p.instructor ? norm(p.instructor.name).includes(q) : false;
        const matchesId = norm(p.id).includes(q);

        if (!matchesTitle && !matchesSubtitle && !matchesDesc && !matchesCategory && !matchesInstructor && !matchesId) {
          return false;
        }
      }

      return true;
    });
  },

  getRecommendedPractices: () => {
    const { practices } = get();
    return practices.filter((p) => p.isFeatured || p.id === 'practice-breathing-478').slice(0, 3);
  },

  getInProgressPractices: () => {
    const { practices, userProgress } = get();
    return practices.filter((p) => {
      const prog = userProgress[p.id];
      return prog && prog.status === 'started' && prog.progressPercent > 0 && prog.progressPercent < 100;
    });
  },

  getQuickPractices: () => {
    const { practices } = get();
    return practices.filter((p) => p.durationMinutes <= 5).slice(0, 6);
  },

  getNewPractices: () => {
    const { practices } = get();
    return practices.slice(0, 6);
  },

  getMostCompletedPractices: () => {
    const { practices } = get();
    return [...practices].sort((a, b) => (b.completedCount || 0) - (a.completedCount || 0)).slice(0, 6);
  },
}));
