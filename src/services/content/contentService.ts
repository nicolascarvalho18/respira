import { Article } from '../../types';
import { MOCK_ARTICLES, ARTICLE_CATEGORIES } from '../../mocks/contents.mock';
import { storage } from '../storage/asyncStorage';
import { apiClient, isMockMode } from '../api/apiClient';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { favoriteService } from '../favorite/favoriteService';
import { logger } from '../../utils/logger';

const ARTICLES_STORAGE_KEY = 'respira_articles';
const PROGRESS_STORAGE_KEY = 'respira_articles_progress';

class ContentService {
  async getArticles(userId?: string): Promise<Article[]> {
    let effectiveUserId = userId;
    if (!effectiveUserId && isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        effectiveUserId = user?.id;
      } catch (_e) {}
    }

    const favorites = effectiveUserId
      ? await favoriteService.getFavorites(effectiveUserId, 'article')
      : [];

    if (isSupabaseConfigured) {
      try {
        const { data: dbArticles, error } = await supabase
          .from('articles')
          .select('*')
          .order('id', { ascending: true });

        if (!error && dbArticles && dbArticles.length > 0) {
          const progressMap: Record<string, { progress: number }> = {};

          if (effectiveUserId) {
            const { data: userProgress } = await supabase
              .from('article_progress')
              .select('article_id, progress')
              .eq('user_id', effectiveUserId);

            if (userProgress) {
              userProgress.forEach((p) => {
                progressMap[p.article_id] = {
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
            isFavorite: favorites.includes(a.id),
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

    const userSuffix = effectiveUserId ? `_${effectiveUserId}` : '';
    const progressKey = `${PROGRESS_STORAGE_KEY}${userSuffix}`;
    const progressMap = (await storage.getItem<Record<string, number>>(progressKey)) || {};

    return articles.map((a) => ({
      ...a,
      isFavorite: favorites.includes(a.id),
      readProgress: progressMap[a.id] ?? 0,
    }));
  }

  async getArticleById(id: string, userId?: string): Promise<Article | null> {
    const articles = await this.getArticles(userId);
    return articles.find((a) => a.id === id || a.slug === id) || null;
  }

  async getArticleBySlug(slug: string, userId?: string): Promise<Article | null> {
    const articles = await this.getArticles(userId);
    return articles.find((a) => a.slug === slug || a.id === slug) || null;
  }

  async getCategories() {
    return ARTICLE_CATEGORIES;
  }

  async toggleFavorite(
    articleId: string,
    userId?: string
  ): Promise<{ isFavorite: boolean; message: string }> {
    return favoriteService.toggleFavorite(articleId, 'article', userId);
  }

  async updateReadProgress(articleId: string, progress: number, userId?: string): Promise<void> {
    let effectiveUserId = userId;
    if (!effectiveUserId && isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        effectiveUserId = user?.id;
      } catch (_e) {}
    }

    const userSuffix = effectiveUserId ? `_${effectiveUserId}` : '';
    const progressKey = `${PROGRESS_STORAGE_KEY}${userSuffix}`;
    const progressMap = (await storage.getItem<Record<string, number>>(progressKey)) || {};
    const cleanProg = Math.min(100, Math.max(0, progress));
    progressMap[articleId] = cleanProg;
    await storage.setItem(progressKey, progressMap);

    if (isSupabaseConfigured && effectiveUserId) {
      try {
        await supabase.from('article_progress').upsert(
          {
            user_id: effectiveUserId,
            article_id: articleId,
            progress: cleanProg,
            is_read: cleanProg >= 90,
            last_read_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,article_id' }
        );
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
