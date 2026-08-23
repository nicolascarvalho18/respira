import { Practice } from '../../types';
import { MOCK_PRACTICES } from '../../mocks/practices.mock';
import { storage } from '../storage/asyncStorage';
import { apiClient, isMockMode } from '../api/apiClient';

const PRACTICES_STORAGE_KEY = 'respira_practices';
const FAVORITE_PRACTICES_KEY = 'respira_favorite_practices';
const COMPLETED_PRACTICES_KEY = 'respira_completed_practices';

class PracticeService {
  async getPractices(): Promise<Practice[]> {
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
    const favorites = (await storage.getItem<string[]>(FAVORITE_PRACTICE_KEY_DEFAULT)) || [];
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
  }

  // Admin capability
  async createPractice(practice: Omit<Practice, 'id'>): Promise<Practice> {
    const newPractice: Practice = {
      ...practice,
      id: `practice-${Date.now()}`,
      completedCount: 0,
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

const FAVORITE_PRACTICE_KEY_DEFAULT = 'respira_favorite_practices';

export const practiceService = new PracticeService();
