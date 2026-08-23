import { Article } from '../../types';
import { MOCK_ARTICLES, ARTICLE_CATEGORIES } from '../../mocks/contents.mock';
import { storage } from '../storage/asyncStorage';
import { apiClient, isMockMode } from '../api/apiClient';

const ARTICLES_STORAGE_KEY = 'respira_articles';
const FAVORITES_STORAGE_KEY = 'respira_favorite_articles';
const PROGRESS_STORAGE_KEY = 'respira_articles_progress';

class ContentService {
  async getArticles(): Promise<Article[]> {
    if (!isMockMode) {
      return apiClient.get<Article[]>('/articles');
    }

    let articles = await storage.getItem<Article[]>(ARTICLES_STORAGE_KEY);
    // Ensure all 40 articles are loaded if cache had only 4 old articles
    if (!articles || articles.length < MOCK_ARTICLES.length) {
      articles = MOCK_ARTICLES;
      await storage.setItem(ARTICLES_STORAGE_KEY, articles);
    }

    const favorites = (await storage.getItem<string[]>(FAVORITES_STORAGE_KEY)) || [];
    const progressMap = (await storage.getItem<Record<string, number>>(PROGRESS_STORAGE_KEY)) || {};

    return articles.map((a) => ({
      ...a,
      isFavorite: favorites.includes(a.id),
      readProgress: progressMap[a.id] ?? a.readProgress ?? 0,
    }));
  }

  async getArticleById(id: string): Promise<Article | null> {
    const articles = await this.getArticles();
    return articles.find((a) => a.id === id || a.slug === id) || null;
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    const articles = await this.getArticles();
    return articles.find((a) => a.slug === slug || a.id === slug) || null;
  }

  async getCategories() {
    return ARTICLE_CATEGORIES;
  }

  async toggleFavorite(articleId: string): Promise<boolean> {
    const favorites = (await storage.getItem<string[]>(FAVORITES_STORAGE_KEY)) || [];
    let updated: string[];

    if (favorites.includes(articleId)) {
      updated = favorites.filter((id) => id !== articleId);
    } else {
      updated = [...favorites, articleId];
    }

    await storage.setItem(FAVORITES_STORAGE_KEY, updated);
    return updated.includes(articleId);
  }

  async updateReadProgress(articleId: string, progress: number): Promise<void> {
    const progressMap = (await storage.getItem<Record<string, number>>(PROGRESS_STORAGE_KEY)) || {};
    progressMap[articleId] = Math.min(100, Math.max(0, progress));
    await storage.setItem(PROGRESS_STORAGE_KEY, progressMap);
  }

  // Admin capabilities
  async createArticle(article: Omit<Article, 'id' | 'publishedAt'>): Promise<Article> {
    const newArticle: Article = {
      ...article,
      id: `article-${Date.now()}`,
      publishedAt: new Date().toISOString(),
    };

    if (!isMockMode) {
      return apiClient.post<Article>('/articles', newArticle);
    }

    const articles = await this.getArticles();
    const updated = [newArticle, ...articles];
    await storage.setItem(ARTICLES_STORAGE_KEY, updated);
    return newArticle;
  }

  async updateArticle(id: string, partial: Partial<Article>): Promise<Article> {
    if (!isMockMode) {
      return apiClient.put<Article>(`/articles/${id}`, partial);
    }

    const articles = await this.getArticles();
    let updatedArticle: Article | null = null;

    const updated = articles.map((a) => {
      if (a.id === id) {
        updatedArticle = { ...a, ...partial };
        return updatedArticle;
      }
      return a;
    });

    if (!updatedArticle) throw new Error('Article not found');
    await storage.setItem(ARTICLES_STORAGE_KEY, updated);
    return updatedArticle;
  }
}

export const contentService = new ContentService();
