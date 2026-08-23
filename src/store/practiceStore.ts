import { create } from 'zustand';
import { Practice, PracticeCategory } from '../types';
import { practiceService } from '../services/practice/practiceService';

interface PracticeState {
  practices: Practice[];
  selectedCategory: PracticeCategory | 'all' | 'favorites';
  searchQuery: string;
  activePractice: Practice | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPractices: () => Promise<void>;
  setSelectedCategory: (category: PracticeCategory | 'all' | 'favorites') => void;
  setSearchQuery: (query: string) => void;
  setActivePractice: (practice: Practice | null) => void;
  toggleFavorite: (practiceId: string) => Promise<void>;
  recordCompletion: (practiceId: string) => Promise<void>;
  getFilteredPractices: () => Practice[];
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  practices: [],
  selectedCategory: 'all',
  searchQuery: '',
  activePractice: null,
  isLoading: false,
  error: null,

  fetchPractices: async () => {
    try {
      set({ isLoading: true, error: null });
      const practices = await practiceService.getPractices();
      set({ practices, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao carregar práticas' });
    }
  },

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setActivePractice: (practice) => set({ activePractice: practice }),

  toggleFavorite: async (practiceId) => {
    const isFav = await practiceService.toggleFavorite(practiceId);
    const updated = get().practices.map((p) =>
      p.id === practiceId ? { ...p, isFavorite: isFav } : p
    );
    set({ practices: updated });
  },

  recordCompletion: async (practiceId) => {
    await practiceService.recordCompletion(practiceId);
    const updated = get().practices.map((p) =>
      p.id === practiceId ? { ...p, completedCount: (p.completedCount ?? 0) + 1 } : p
    );
    set({ practices: updated });
  },

  getFilteredPractices: () => {
    const { practices, selectedCategory, searchQuery } = get();
    return practices.filter((p) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        p.category === selectedCategory ||
        (selectedCategory === 'favorites' && p.isFavorite);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  },
}));
