import { Article } from '../../types';
import { MOCK_ARTICLES, ARTICLE_CATEGORIES } from '../../mocks/contents.mock';
import { storage } from '../storage/asyncStorage';
import { apiClient, isMockMode } from '../api/apiClient';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { logger } from '../../utils/logger';

const ARTICLES_STORAGE_KEY = 'respira_articles';
const FAVORITES_STORAGE_KEY = 'respira_favorite_articles';
const PROGRESS_STORAGE_KEY = 'respira_articles_progress';

class ContentService {
  async getArticles(): Promise<Article[]> {
    if (isSupabaseConfigured) {
      try {
        const { data: dbArticles, error } = await supabase
          .from('articles')
          .select('*')
          .order('id', { ascending: true });

        if (!error && dbArticles && dbArticles.length > 0) {
          const { data: { user } } = await supabase.auth.getUser();
          const progressMap: Record<string, { isFavorite: boolean; progress: number }> = {};

          if (user) {
            const { data: userProgress } = await supabase
              .from('article_progress')
              .select('article_id, is_favorite, progress')
              .eq('user_id', user.id);

            if (userProgress) {
              userProgress.forEach((p) => {
                progressMap[p.article_id] = {
                  isFavorite: Boolean(p.is_favorite),
                  progress: p.progress || 0,
                };
              });
            }
          }

          return dbArticles.map((a) => ({
            id: a.id,
            slug: a.slug,
            title: a.title,
            summary: a.summary,
            content: a.content,
            category: a.category,
            categoryName: a.category_name || a.category,
            readingTimeMinutes: a.reading_time_minutes || 5,
            readTimeMinutes: a.reading_time_minutes || 5,
            keywords: a.keywords || [],
            tags: a.tags || [],
            relatedArticleIds: a.related_article_ids || [],
            author: a.author,
            reviewedBy: a.reviewed_by,
            publishedAt: a.published_at,
            updatedAt: a.updated_at,
            status: a.status || 'published',
            isFavorite: progressMap[a.id]?.isFavorite ?? false,
            readProgress: progressMap[a.id]?.progress ?? 0,
          }));
        }
      } catch (err) {
        logger.warn('Could not fetch articles from Supabase, falling back to cache:', err);
      }
    }

    if (!isMockMode) {
      return apiClient.get<Article[]>('/articles');
    }

    let articles = await storage.getItem<Article[]>(ARTICLES_STORAGE_KEY);
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

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('article_progress').upsert(
            {
              user_id: user.id,
              article_id: articleId,
              is_favorite: updated.includes(articleId),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,article_id' }
          );
        }
      } catch (err) {
        logger.warn('Error syncing favorite to Supabase:', err);
      }
    }

    return updated.includes(articleId);
  }

  async updateReadProgress(articleId: string, progress: number): Promise<void> {
    const progressMap = (await storage.getItem<Record<string, number>>(PROGRESS_STORAGE_KEY)) || {};
    const cleanProg = Math.min(100, Math.max(0, progress));
    progressMap[articleId] = cleanProg;
    await storage.setItem(PROGRESS_STORAGE_KEY, progressMap);

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('article_progress').upsert(
            {
              user_id: user.id,
              article_id: articleId,
              progress: cleanProg,
              is_read: cleanProg >= 90,
              last_read_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,article_id' }
          );
        }
      } catch (err) {
        logger.warn('Error syncing article progress to Supabase:', err);
      }
    }
  }

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
