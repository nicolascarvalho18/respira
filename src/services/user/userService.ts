import { User } from '../../types';
import { storage } from '../storage/asyncStorage';
import { secureStorage } from '../storage/secureStorage';
import { apiClient, isMockMode } from '../api/apiClient';
import { logger } from '../../utils/logger';

const CURRENT_USER_KEY = 'respira_current_user';

class UserService {
  async updateProfile(userId: string, partial: Partial<User>): Promise<User> {
    if (!isMockMode) {
      return apiClient.put<User>(`/users/${userId}`, partial);
    }

    const current = (await storage.getItem<User>(CURRENT_USER_KEY)) || ({} as User);
    const updated: User = {
      ...current,
      ...partial,
      id: userId,
    };

    await storage.setItem(CURRENT_USER_KEY, updated);
    return updated;
  }

  async updatePreferences(userId: string, preferences: Partial<User['preferences']>): Promise<User> {
    const current = (await storage.getItem<User>(CURRENT_USER_KEY)) || ({} as User);
    const updated: User = {
      ...current,
      preferences: {
        ...current.preferences,
        ...preferences,
      },
    };

    await storage.setItem(CURRENT_USER_KEY, updated);
    return updated;
  }

  async updateConsents(userId: string, consents: Partial<User['consents']>): Promise<User> {
    const current = (await storage.getItem<User>(CURRENT_USER_KEY)) || ({} as User);
    const updated: User = {
      ...current,
      consents: {
        ...current.consents,
        ...consents,
        acceptedAt: new Date().toISOString(),
      },
    };

    await storage.setItem(CURRENT_USER_KEY, updated);
    return updated;
  }

  async exportUserData(userId: string): Promise<string> {
    logger.info(`Exporting data package for user ${userId}`);
    const user = await storage.getItem<User>(CURRENT_USER_KEY);
    const moods = (await storage.getItem<any[]>('respira_mood_records')) || [];
    const favorites = (await storage.getItem<string[]>('respira_favorite_practices')) || [];
    const chatHistory = (await storage.getItem<any[]>('respira_chat_history')) || [];

    const exportPackage = {
      exportTimestamp: new Date().toISOString(),
      appVersion: '1.0.0 (Respira)',
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        createdAt: user?.createdAt,
        preferences: user?.preferences,
        consents: user?.consents,
      },
      moodRecords: moods,
      favoritePractices: favorites,
      chatMessagesCount: chatHistory.length,
      legalNotice:
        'Este arquivo contém seus dados de bem-estar exportados em conformidade com as diretrizes de privacidade e LGPD.',
    };

    return JSON.stringify(exportPackage, null, 2);
  }

  async deleteAccount(userId: string): Promise<boolean> {
    logger.info(`Deleting account and local data for user ${userId}`);
    if (!isMockMode) {
      await apiClient.delete(`/users/${userId}`);
    }

    await storage.clear();
    await secureStorage.deleteItem('auth_token');
    return true;
  }
}

export const userService = new UserService();
