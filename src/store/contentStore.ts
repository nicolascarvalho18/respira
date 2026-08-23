import { create } from 'zustand';
import { Article } from '../types';
import { contentService } from '../services/content/contentService';

interface ContentState {
  articles: Article[];
  categories: { id: string; name: string }[];
  selectedCategory: string;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchArticles: () => Promise<void>;
  setSelectedCategory: (categoryId: string) => void;
  setSearchQuery: (query: string) => void;
  toggleFavorite: (articleId: string) => Promise<void>;
  updateProgress: (articleId: string, progress: number) => Promise<void>;
  getFilteredArticles: () => Article[];
}

export const useContentStore = create<ContentState>((set, get) => ({
  articles: [],
  categories: [],
  selectedCategory: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,

  fetchArticles: async () => {
    try {
      set({ isLoading: true, error: null });
      const [articles, categories] = await Promise.all([
        contentService.getArticles(),
        contentService.getCategories(),
      ]);
      set({ articles, categories, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao carregar conteúdos' });
    }
  },

  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleFavorite: async (articleId) => {
    const isFav = await contentService.toggleFavorite(articleId);
    const updated = get().articles.map((a) =>
      a.id === articleId ? { ...a, isFavorite: isFav } : a
    );
    set({ articles: updated });
  },

  updateProgress: async (articleId, progress) => {
    await contentService.updateReadProgress(articleId, progress);
    const updated = get().articles.map((a) =>
      a.id === articleId ? { ...a, readProgress: progress } : a
    );
    set({ articles: updated });
  },

  getFilteredArticles: () => {
    const { articles, selectedCategory, searchQuery } = get();
    return articles.filter((a) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        a.category === selectedCategory ||
        (selectedCategory === 'favorites' && a.isFavorite);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.tags?.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  },
}));
