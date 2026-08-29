import { User, UserSession, SecurityEvent } from '../../types';
import { storage } from '../storage/asyncStorage';
import { secureStorage } from '../storage/secureStorage';
import { userAccountService } from '../../server/services/userAccountService';
import { supabaseUserService } from './supabaseUserService';
import { supabaseAuthService } from '../auth/supabaseAuthService';
import { isSupabaseConfigured } from '../supabase/client';
import { logger } from '../../utils/logger';

const CURRENT_USER_KEY = 'respira_current_user';

class UserService {
  async saveProfileAndAvatar(params: {
    fullName: string;
    bio: string;
    avatarFile?: File | Blob | null;
    removeAvatar?: boolean;
  }): Promise<User> {
    let result = {
      name: params.fullName.trim(),
      bio: params.bio.trim(),
      avatarUrl: null as string | null,
    };

    if (isSupabaseConfigured) {
      result = await supabaseUserService.saveProfileAndAvatar(params);
    } else {
      if (params.avatarFile && typeof FileReader !== 'undefined' && params.avatarFile instanceof Blob) {
        result.avatarUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(params.avatarFile as Blob);
        });
      }
    }

    const currentUser = await storage.getItem<User>(CURRENT_USER_KEY);
    const userId = currentUser?.id || 'current-user';

    const updatedUser = await userAccountService.updateProfileDetails(userId, {
      name: result.name,
      bio: result.bio,
      avatarUrl: result.avatarUrl !== undefined ? result.avatarUrl : currentUser?.avatarUrl,
    });

    await storage.setItem(CURRENT_USER_KEY, updatedUser);
    return updatedUser;
  }

  async updateProfile(userId: string, partial: Partial<User>): Promise<User> {
    // 1. Atualizar no Supabase via upsert caso configurado
    if (isSupabaseConfigured) {
      try {
        await supabaseUserService.updateProfile(userId, {
          name: partial.name,
          bio: partial.bio,
          avatarUrl: partial.avatarUrl,
          phone: partial.phone,
          birthDate: partial.birthDate,
        });
      } catch (err) {
        logger.error('Error updating profile in Supabase:', err);
        throw err;
      }
    }

    // 2. Atualizar no cache / local store
    const updatedUser = await userAccountService.updateProfileDetails(userId, {
      name: partial.name,
      bio: partial.bio,
      avatarUrl: partial.avatarUrl,
    });

    await storage.setItem(CURRENT_USER_KEY, updatedUser);
    return updatedUser;
  }

  async uploadAvatar(
    userId: string,
    fileBlob: Blob | File | Uint8Array,
    fileExt = 'jpg'
  ): Promise<string | null> {
    if (isSupabaseConfigured) {
      return await supabaseUserService.uploadAvatar(userId, fileBlob, fileExt);
    }
    if (typeof FileReader !== 'undefined' && fileBlob instanceof Blob) {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(fileBlob);
      });
    }
    return null;
  }

  async updateAvatar(userId: string, avatarUrl: string | null): Promise<User> {
    if (isSupabaseConfigured) {
      try {
        await supabaseUserService.updateAvatar(userId, avatarUrl);
      } catch (err) {
        logger.error('Error updating avatar in Supabase:', err);
      }
    }
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

  async exportUserData(_userId: string): Promise<string> {
    throw new Error('403: A funcionalidade de exportação de dados foi descontinuada.');
  }

  async deleteAccount(
    userId: string,
    confirmationPhrase: string = 'EXCLUIR MINHA CONTA',
    currentPassword?: string
  ): Promise<boolean> {
    logger.info(`Deleting account and local data for user ${userId}`);
    if (currentPassword) {
      const res = await supabaseAuthService.deleteAccount(currentPassword);
      if (!res.success) {
        throw new Error(res.error || 'Não foi possível excluir sua conta.');
      }
    } else {
      await userAccountService.requestAccountDeletion(userId, confirmationPhrase, currentPassword);
    }
    await storage.clear();
    await secureStorage.deleteItem('auth_token');
    await secureStorage.deleteItem('auth_refresh_token');
    return true;
  }
}

export const userService = new UserService();
