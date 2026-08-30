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
      avatarUrl: undefined as string | null | undefined,
    };

    if (isSupabaseConfigured) {
      const saved = await supabaseUserService.saveProfileAndAvatar(params);
      result.name = saved.name;
      result.bio = saved.bio;
      result.avatarUrl = saved.avatarUrl;
    } else {
      if (params.avatarFile && typeof FileReader !== 'undefined' && params.avatarFile instanceof Blob) {
        result.avatarUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(params.avatarFile as Blob);
        });
      } else if (params.removeAvatar) {
        result.avatarUrl = null;
      }
    }

    let userId = 'current-user';
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabaseUserService.getProfile().then(p => ({ data: { user: p } })).catch(() => ({ data: { user: null } }));
        if (user?.id) userId = user.id;
      } catch (_e) {}
    }

    if (userId === 'current-user') {
      const currentUser = await storage.getItem<User>(CURRENT_USER_KEY);
      if (currentUser?.id) userId = currentUser.id;
    }

    const targetAvatar =
      params.removeAvatar
        ? null
        : result.avatarUrl !== undefined
        ? result.avatarUrl
        : null;

    const updatedUser = await userAccountService.updateProfileDetails(userId, {
      name: result.name,
      bio: result.bio,
      avatarUrl: targetAvatar,
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
        logger.warn('Warning updating profile in Supabase:', err);
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
        logger.warn('Warning updating avatar in Supabase:', err);
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

  async exportUserData(userId: string) {
    if (isSupabaseConfigured) {
      return await supabaseUserService.exportUserData(userId);
    }
    return await userAccountService.exportUserData(userId);
  }

  async deleteAccount(
    userId: string,
    confirmationPhrase = 'EXCLUIR MINHA CONTA',
    password?: string
  ): Promise<boolean> {
    if (isSupabaseConfigured) {
      return await supabaseUserService.deleteAccount(userId);
    }
    const result = await userAccountService.deleteAccount(userId, confirmationPhrase, password);
    return result.success;
  }
}

export const userService = new UserService();
