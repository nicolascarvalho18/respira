import { User, UserSession, SecurityEvent } from '../../types';
import { storage } from '../storage/asyncStorage';
import { secureStorage } from '../storage/secureStorage';
import { userAccountService } from '../../server/services/userAccountService';
import { logger } from '../../utils/logger';

const CURRENT_USER_KEY = 'respira_current_user';

class UserService {
  async updateProfile(userId: string, partial: Partial<User>): Promise<User> {
    const updatedUser = await userAccountService.updateProfileDetails(userId, {
      name: partial.name,
      bio: partial.bio,
      avatarUrl: partial.avatarUrl,
    });

    await storage.setItem(CURRENT_USER_KEY, updatedUser);
    return updatedUser;
  }

  async updateAvatar(userId: string, avatarUrl: string | null): Promise<User> {
    const updated = await userAccountService.updateAvatar(userId, avatarUrl);
    await storage.setItem(CURRENT_USER_KEY, updated);
    return updated;
  }

  async requestEmailChange(
    userId: string,
    newEmail: string,
    currentPassword?: string
  ): Promise<{ message: string }> {
    return await userAccountService.requestEmailChange(userId, newEmail, currentPassword);
  }

  async changePassword(
    userId: string,
    currentPassword?: string,
    newPassword?: string
  ): Promise<{ message: string }> {
    return await userAccountService.changePassword(userId, currentPassword, newPassword);
  }

  async getActiveSessions(userId: string): Promise<UserSession[]> {
    return await userAccountService.getActiveSessions(userId);
  }

  async revokeSession(userId: string, sessionId: string): Promise<UserSession[]> {
    return await userAccountService.revokeSession(userId, sessionId);
  }

  async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<UserSession[]> {
    return await userAccountService.revokeAllOtherSessions(userId, currentSessionId);
  }

  async getSecurityEvents(userId: string): Promise<SecurityEvent[]> {
    return await userAccountService.getSecurityEvents(userId);
  }

  async updatePreferences(userId: string, preferences: Partial<User['preferences']>): Promise<User> {
    const updated = await userAccountService.updatePreferences(userId, preferences);
    await storage.setItem(CURRENT_USER_KEY, updated);
    return updated;
  }

  async updateConsents(userId: string, consents: Partial<User['consents']>): Promise<User> {
    const updated = await userAccountService.updateConsents(userId, consents);
    await storage.setItem(CURRENT_USER_KEY, updated);
    return updated;
  }

  async exportUserData(userId: string): Promise<string> {
    logger.info(`Exporting data package for user ${userId}`);
    return await userAccountService.exportUserDataPackage(userId);
  }

  async deleteAccount(
    userId: string,
    confirmationPhrase: string = 'EXCLUIR MINHA CONTA',
    currentPassword?: string
  ): Promise<boolean> {
    logger.info(`Deleting account and local data for user ${userId}`);
    await userAccountService.requestAccountDeletion(userId, confirmationPhrase, currentPassword);
    await storage.clear();
    await secureStorage.deleteItem('auth_token');
    await secureStorage.deleteItem('auth_refresh_token');
    return true;
  }
}

export const userService = new UserService();
