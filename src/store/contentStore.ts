import { create } from 'zustand';
import { Article } from '../types';
import { contentService } from '../services/content/contentService';
import { normalizeText } from '../data/articles';

export type ArticleFilterOption =
  | 'all'
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'favorites'
  | 'shortest'
  | 'longest'
  | 'recent';

interface ContentState {
  articles: Article[];
  categories: { id: string; name: string }[];
  selectedCategory: string;
  searchQuery: string;
  selectedFilter: ArticleFilterOption;
  pageLimit: number; // For "Todos": 10, 20, 30, 40
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchArticles: (userId?: string) => Promise<void>;
  setSelectedCategory: (categoryId: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFilter: (filter: ArticleFilterOption) => void;
  clearFilters: () => void;
  loadMoreArticles: () => void;
  toggleFavorite: (articleId: string, userId?: string) => Promise<{ isFavorite: boolean; message: string }>;
  updateProgress: (articleId: string, progress: number) => Promise<void>;
  getFilteredArticles: () => Article[];
  getVisibleArticles: () => Article[];
}

export const useContentStore = create<ContentState>((set, get) => ({
  articles: [],
  categories: [],
  selectedCategory: 'all',
  searchQuery: '',
  selectedFilter: 'all',
  pageLimit: 10,
  isLoading: false,
  error: null,

  fetchArticles: async (userId?: string) => {
    try {
      set({ isLoading: true, error: null });
      const [articles, categories] = await Promise.all([
        contentService.getArticles(userId),
        contentService.getCategories(),
      ]);
      set({ articles, categories, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao carregar conteúdos' });
    }
  },

  setSelectedCategory: (categoryId) =>
    set({ selectedCategory: categoryId, pageLimit: 10 }),

  setSearchQuery: (query) =>
    set({ searchQuery: query, pageLimit: 10 }),

  setSelectedFilter: (filter) =>
    set({ selectedFilter: filter, pageLimit: 10 }),

  clearFilters: () =>
    set({
      selectedCategory: 'all',
      searchQuery: '',
      selectedFilter: 'all',
      pageLimit: 10,
    }),

  loadMoreArticles: () => {
    const { pageLimit, articles } = get();
    const nextLimit = Math.min(articles.length, pageLimit + 10);
    set({ pageLimit: nextLimit });
  },

  toggleFavorite: async (articleId, userId) => {
    const prevArticles = get().articles;
    const currentArticle = prevArticles.find((a) => a.id === articleId);
    const optimisticIsFavorite = !(currentArticle?.isFavorite ?? false);

    // 1. Atualização otimista imediata na interface
    set({
      articles: prevArticles.map((a) =>
        a.id === articleId ? { ...a, isFavorite: optimisticIsFavorite } : a
      ),
    });

    try {
      // 2. Persistência real no banco
      const result = await contentService.toggleFavorite(articleId, userId);
      // 3. Confirmação com o estado confirmado pelo banco
      set({
        articles: get().articles.map((a) =>
          a.id === articleId ? { ...a, isFavorite: result.isFavorite } : a
        ),
      });
      return result;
    } catch (error) {
      // 4. Rollback para o estado anterior em caso de erro
      set({ articles: prevArticles });
      throw error;
    }
  },

  updateProgress: async (articleId, progress) => {
    await contentService.updateReadProgress(articleId, progress);
    const updated = get().articles.map((a) =>
      a.id === articleId ? { ...a, readProgress: progress } : a
    );
    set({ articles: updated });
  },

  getFilteredArticles: () => {
    const { articles, selectedCategory, searchQuery, selectedFilter } = get();

    const result = articles.filter((a) => {
      // 1. Filtro por Categoria
      if (selectedCategory !== 'all') {
        const itemCat = normalizeText(a.category || a.categoryName || '');
        const targetCat = normalizeText(selectedCategory);

        const matchCat =
          itemCat === targetCat ||
          itemCat.includes(targetCat) ||
          targetCat.includes(itemCat);

        if (!matchCat) return false;
      }

      // 2. Filtro por Busca Textual (Título, Resumo, Categoria, Tags, Conteúdo)
      const q = normalizeText(searchQuery);
      if (q) {
        const titleMatch = normalizeText(a.title).includes(q);
        const summaryMatch = normalizeText(a.summary).includes(q);
        const catMatch = normalizeText(a.category || a.categoryName || '').includes(q);
        const tagsMatch = a.tags?.some((t) => normalizeText(t).includes(q)) ?? false;
        const keywordsMatch = a.keywords?.some((k) => normalizeText(k).includes(q)) ?? false;
        const contentMatch = a.content ? normalizeText(a.content).includes(q) : false;

        if (
          !titleMatch &&
          !summaryMatch &&
          !catMatch &&
          !tagsMatch &&
          !keywordsMatch &&
          !contentMatch
        ) {
          return false;
        }
      }

      // 3. Filtro por Status / Favoritos
      const prog = a.readProgress || 0;
      if (selectedFilter === 'not_started' && prog > 0) return false;
      if (selectedFilter === 'in_progress' && (prog <= 0 || prog >= 90)) return false;
      if (selectedFilter === 'completed' && prog < 90) return false;
      if (selectedFilter === 'favorites' && !a.isFavorite) return false;

      return true;
    });

    // 4. Ordenação
    if (selectedFilter === 'shortest') {
      result.sort((a, b) => (a.readingTimeMinutes || 4) - (b.readingTimeMinutes || 4));
    } else if (selectedFilter === 'longest') {
      result.sort((a, b) => (b.readingTimeMinutes || 4) - (a.readingTimeMinutes || 4));
    } else if (selectedFilter === 'recent') {
      result.sort(
        (a, b) =>
          new Date(b.publishedAt || b.updatedAt).getTime() -
          new Date(a.publishedAt || a.updatedAt).getTime()
      );
    }

    return result;
  },

  getVisibleArticles: () => {
    const { selectedCategory, pageLimit } = get();
    const filtered = get().getFilteredArticles();

    // Se categoria for "Todos" e não houver filtro restritivo de texto/status: paginação suave
    if (selectedCategory === 'all' && !get().searchQuery && get().selectedFilter === 'all') {
      return filtered.slice(0, pageLimit);
    }

    // Nas categorias específicas ou com busca/filtros ativos, exibe todos os resultados combinados
    return filtered;
  },
}));
