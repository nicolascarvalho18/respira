import { Practice } from '../../types';
import { MOCK_PRACTICES } from '../../mocks/practices.mock';
import { storage } from '../storage/asyncStorage';
import { apiClient, isMockMode } from '../api/apiClient';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { logger } from '../../utils/logger';

const PRACTICES_STORAGE_KEY = 'respira_practices';
const FAVORITE_PRACTICES_KEY = 'respira_favorite_practices';
const COMPLETED_PRACTICES_KEY = 'respira_completed_practices';

class PracticeService {
  async getPractices(): Promise<Practice[]> {
    if (isSupabaseConfigured) {
      try {
        const { data: dbPractices, error } = await supabase
          .from('practices')
          .select('*');

        if (!error && dbPractices && dbPractices.length > 0) {
          const { data: { user } } = await supabase.auth.getUser();
          const completedMap: Record<string, number> = {};

          if (user) {
            const { data: userProgress } = await supabase
              .from('practice_progress')
              .select('practice_id, status')
              .eq('user_id', user.id);

            if (userProgress) {
              userProgress.forEach((p) => {
                completedMap[p.practice_id] = (completedMap[p.practice_id] || 0) + 1;
              });
            }
          }

          const favorites = (await storage.getItem<string[]>(FAVORITE_PRACTICES_KEY)) || [];

          return dbPractices.map((p) => ({
            id: p.id,
            title: p.title,
            subtitle: p.subtitle || '',
            description: p.description,
            category: p.category,
            durationMinutes: p.duration_minutes || 5,
            level: p.level || 'Iniciante',
            icon: p.icon || 'wind',
            instructions: p.instructions || [],
            breathingConfig: p.breathing_config || undefined,
            isFavorite: favorites.includes(p.id),
            completedCount: completedMap[p.id] || 0,
          }));
        }
      } catch (err) {
        logger.warn('Could not fetch practices from Supabase, falling back to local cache:', err);
      }
    }

    if (!isMockMode) {
      return apiClient.get<Practice[]>('/practices');
    }

    let practices = await storage.getItem<Practice[]>(PRACTICES_STORAGE_KEY);
    if (!practices || practices.length === 0) {
      practices = MOCK_PRACTICES;
      await storage.setItem(PRACTICES_STORAGE_KEY, practices);
    }

    const favorites = (await storage.getItem<string[]>(FAVORITE_PRACTICES_KEY)) || [];
    const completedMap =
      (await storage.getItem<Record<string, number>>(COMPLETED_PRACTICES_KEY)) || {};

    return practices.map((p) => ({
      ...p,
      isFavorite: favorites.includes(p.id) || p.isFavorite,
      completedCount: (completedMap[p.id] ?? 0) + (p.completedCount ?? 0),
    }));
  }

  async getPracticeById(id: string): Promise<Practice | null> {
    const practices = await this.getPractices();
    return practices.find((p) => p.id === id) || null;
  }

  async toggleFavorite(practiceId: string): Promise<boolean> {
    const favorites = (await storage.getItem<string[]>(FAVORITE_PRACTICES_KEY)) || [];
    let updated: string[];

    if (favorites.includes(practiceId)) {
      updated = favorites.filter((id) => id !== practiceId);
    } else {
      updated = [...favorites, practiceId];
    }

    await storage.setItem(FAVORITE_PRACTICES_KEY, updated);
    return updated.includes(practiceId);
  }

  async recordCompletion(practiceId: string): Promise<void> {
    const completedMap =
      (await storage.getItem<Record<string, number>>(COMPLETED_PRACTICES_KEY)) || {};
    completedMap[practiceId] = (completedMap[practiceId] || 0) + 1;
    await storage.setItem(COMPLETED_PRACTICES_KEY, completedMap);

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('practice_progress').insert({
            user_id: user.id,
            practice_id: practiceId,
            status: 'completed',
            progress: 100,
            completed_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        logger.warn('Error syncing practice progress to Supabase:', err);
      }
    }
  }

  // Admin capability
  async createPractice(practice: Omit<Practice, 'id'>): Promise<Practice> {
    const newPractice: Practice = {
      ...practice,
      id: `practice-${Date.now()}`,
    };

    if (!isMockMode) {
      return apiClient.post<Practice>('/practices', newPractice);
    }

    const practices = await this.getPractices();
    const updated = [newPractice, ...practices];
    await storage.setItem(PRACTICES_STORAGE_KEY, updated);
    return newPractice;
  }
}

export const practiceService = new PracticeService();
