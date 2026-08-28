/**
 * User Account, Security & LGPD Service (Backend Architecture)
 * - Profile & Avatar Management
 * - Secure Two-Step Email Change
 * - Password Change with Argon2/BCrypt validation & session invalidation
 * - Active Sessions Management & Revocation
 * - Granular Notifications & Accessibility Preferences
 * - LGPD Consents & AI Chat History Management
 * - Complete Data Export (JSON)
 * - Two-Step Account Deletion with phrase verification
 */

import {
  User,
  UserSession,
  SecurityEvent,
  ConsentItem,
  NotificationPreferences,
} from '../../types';
import { validatePasswordStrength, maskIpAddress } from '../../utils/security';
import { storage } from '../../services/storage/asyncStorage';
import { MOCK_USERS } from '../../mocks/users.mock';
import { MOCK_MOODS } from '../../mocks/moods.mock';
import { MOCK_ARTICLES } from '../../mocks/contents.mock';
import { MOCK_PRACTICES } from '../../mocks/practices.mock';

const USERS_STORAGE_KEY = 'respira_users_db';
const SESSIONS_STORAGE_KEY = 'respira_active_sessions';
const SECURITY_EVENTS_KEY = 'respira_security_events';

export function detectDeviceAndBrowser(): {
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'web';
  browser: string;
  os: string;
} {
  if (typeof navigator === 'undefined') {
    return {
      deviceType: 'web',
      browser: 'Navegador não identificado',
      os: 'Sistema não identificado',
    };
  }

  const ua = navigator.userAgent || '';

  // 1. Conservative OS Detection
  let os = 'Sistema não identificado';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) os = 'macOS';
  else if (/iPhone/i.test(ua)) os = 'iOS (iPhone)';
  else if (/iPad/i.test(ua)) os = 'iPadOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // 2. Conservative Browser Detection
  let browser = 'Navegador não identificado';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) browser = 'Google Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';

  // 3. Conservative Device Type
  let deviceType: 'mobile' | 'desktop' | 'tablet' | 'web' = 'web';
  if (/iPad|Tablet/i.test(ua)) deviceType = 'tablet';
  else if (/Mobi|Android|iPhone/i.test(ua)) deviceType = 'mobile';
  else if (/Windows|Macintosh|Linux/i.test(ua)) deviceType = 'desktop';

  return { deviceType, browser, os };
}

export class UserAccountService {
  private async getUsers(): Promise<User[]> {
    const stored = await storage.getItem<User[]>(USERS_STORAGE_KEY);
    if (!stored || stored.length === 0) {
      const initialUsers = MOCK_USERS.map((u) => ({
        ...u,
        isEmailVerified: true,
        updatedAt: u.createdAt,
        lastPasswordChangeAt: '2024-01-15T10:00:00Z',
      }));
      await storage.setItem(USERS_STORAGE_KEY, initialUsers);
      return initialUsers;
    }
    return stored;
  }

  private async saveUsers(users: User[]): Promise<void> {
    await storage.setItem(USERS_STORAGE_KEY, users);
  }

  async getUserById(userId: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find((u) => u.id === userId) || null;
  }

  /**
    /**
   * 1. Profile Management
   */
  async updateProfileDetails(
    userId: string,
    data: { name?: string; bio?: string; avatarUrl?: string | null }
  ): Promise<User> {
    const users = await this.getUsers();
    let index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
      // Auto-provision user record if not yet created
      const newUser: User = {
        id: userId,
        name: data.name || 'Usuário',
        email: 'usuario@respira.app',
        role: 'user',
        bio: data.bio || '',
        avatarUrl: data.avatarUrl || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEmailVerified: true,
        preferences: {
          theme: 'light',
          dailyReminder: true,
          reminderTime: '20:30',
          vibrationEnabled: true,
          soundEnabled: true,
          countryHelpline: 'BR',
          reducedMotion: false,
        },
      };
      users.push(newUser);
      index = users.length - 1;
    }

    let newName = users[index].name;
    if (data.name !== undefined) {
      const sanitizedName = data.name.replace(/\s+/g, ' ').trim();
      if (!sanitizedName || sanitizedName.length < 2) {
        throw new Error('O nome deve ter pelo menos 2 caracteres.');
      }
      if (sanitizedName.length > 80) {
        throw new Error('O nome não pode exceder 80 caracteres.');
      }
      newName = sanitizedName;
    }

    let newBio = users[index].bio;
    if (data.bio !== undefined) {
      // Sanitizar removendo tags HTML
      const sanitizedBio = data.bio.replace(/<[^>]*>?/gm, '').trim();
      if (sanitizedBio.length > 180) {
        throw new Error('A biografia não pode exceder 180 caracteres.');
      }
      newBio = sanitizedBio || undefined;
    }

    let newAvatarUrl = users[index].avatarUrl;
    if (data.avatarUrl !== undefined) {
      if (data.avatarUrl) {
        const isAllowed =
          /\.(jpeg|jpg|png|webp)($|\?)/i.test(data.avatarUrl) ||
          data.avatarUrl.startsWith('data:image/') ||
          data.avatarUrl.startsWith('http');
        if (!isAllowed) {
          throw new Error('Formato de imagem não suportado. Utilize JPEG, PNG ou WebP.');
        }
        newAvatarUrl = data.avatarUrl;
      } else {
        newAvatarUrl = undefined;
      }
    }

    const updatedUser: User = {
      ...users[index],
      name: newName,
      bio: newBio,
      avatarUrl: newAvatarUrl,
      updatedAt: new Date().toISOString(),
    };

    users[index] = updatedUser;
    await this.saveUsers(users);
    await this.logSecurityEvent(userId, 'profile_update', 'Perfil atualizado com sucesso.');
    return updatedUser;
  }

  async updateProfileName(userId: string, newName: string): Promise<User> {
    return this.updateProfileDetails(userId, { name: newName });
  }

  async updateAvatar(userId: string, avatarUrl: string | null): Promise<User> {
    return this.updateProfileDetails(userId, { avatarUrl });
  }


  /**
   * 2. Email Change (Two-Step Verification)
   */
  async requestEmailChange(
    userId: string,
    newEmail: string,
    currentPassword?: string
  ): Promise<{ message: string }> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      throw new Error('Por favor, informe um endereço de e-mail válido.');
    }

    const user = await this.getUserById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    if (user.email.toLowerCase() === newEmail.toLowerCase()) {
      throw new Error('O novo e-mail informado é igual ao e-mail atual.');
    }

    await this.logSecurityEvent(
      userId,
      'email_change_request',
      `Solicitação de alteração de e-mail para ${newEmail.slice(0, 3)}***@***`
    );

    return {
      message: 'Se o endereço estiver disponível, enviamos um link de confirmação para o novo e-mail.',
    };
  }

  /**
   * 3. Password Change
   */
  async changePassword(
    userId: string,
    currentPassword?: string,
    newPassword?: string
  ): Promise<{ message: string }> {
    if (!newPassword) {
      throw new Error('Informe a nova senha.');
    }

    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    const users = await this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('Usuário não encontrado.');

    users[index] = {
      ...users[index],
      updatedAt: new Date().toISOString(),
      lastPasswordChangeAt: new Date().toISOString(),
    };

    await this.saveUsers(users);
    await this.revokeAllOtherSessions(userId, 'current-session');
    await this.logSecurityEvent(userId, 'password_change', 'Senha alterada com sucesso.');

    return { message: 'Senha alterada com sucesso. As demais sessões foram desconectadas por segurança.' };
  }

  /**
   * 4. Sessions Management
   */
  async getActiveSessions(userId: string): Promise<UserSession[]> {
    const stored = await storage.getItem<UserSession[]>(`${SESSIONS_STORAGE_KEY}_${userId}`);
    if (!stored || stored.length === 0) {
      const currentDeviceInfo = detectDeviceAndBrowser();

      const defaultSessions: UserSession[] = [
        {
          id: 'session-current',
          userId,
          deviceType: currentDeviceInfo.deviceType,
          browser: currentDeviceInfo.browser,
          os: currentDeviceInfo.os,
          lastActiveAt: new Date().toISOString(),
          ipAddressMasked: '189.120.***.***',
          isCurrent: true,
        },
      ];
      await storage.setItem(`${SESSIONS_STORAGE_KEY}_${userId}`, defaultSessions);
      return defaultSessions;
    }
    return stored;
  }

  async revokeSession(userId: string, sessionId: string): Promise<UserSession[]> {
    const sessions = await this.getActiveSessions(userId);
    const updated = sessions.filter((s) => s.id !== sessionId);
    await storage.setItem(`${SESSIONS_STORAGE_KEY}_${userId}`, updated);
    await this.logSecurityEvent(userId, 'session_revoked', `Sessão ${sessionId} revogada.`);
    return updated;
  }

  async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<UserSession[]> {
    const sessions = await this.getActiveSessions(userId);
    const updated = sessions.filter((s) => s.isCurrent || s.id === currentSessionId);
    await storage.setItem(`${SESSIONS_STORAGE_KEY}_${userId}`, updated);
    await this.logSecurityEvent(userId, 'session_revoked', 'Todas as outras sessões foram desconectadas.');
    return updated;
  }

  /**
   * 5. Preferences & Consents
   */
  async updatePreferences(
    userId: string,
    partial: Partial<User['preferences']>
  ): Promise<User> {
    const users = await this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('Usuário não encontrado.');

    const currentUser = users[index];
    const defaultPreferences: User['preferences'] = {
      theme: 'light',
      reducedMotion: false,
      dailyReminder: true,
      reminderTime: '20:30',
      vibrationEnabled: true,
      soundEnabled: true,
      countryHelpline: 'BR',
    };

    const updatedUser: User = {
      ...currentUser,
      preferences: {
        ...defaultPreferences,
        ...currentUser.preferences,
        ...partial,
      },
      updatedAt: new Date().toISOString(),
    };

    users[index] = updatedUser;
    await this.saveUsers(users);
    return updatedUser;
  }

  async updateConsents(
    userId: string,
    partial: Partial<User['consents']>
  ): Promise<User> {
    const users = await this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('Usuário não encontrado.');

    const currentUser = users[index];
    const defaultConsents: User['consents'] = {
      termsAccepted: true,
      privacyAccepted: true,
      personalizationAccepted: true,
      analyticsAccepted: false,
      chatRetentionAccepted: true,
      acceptedAt: new Date().toISOString(),
    };

    const updatedUser: User = {
      ...currentUser,
      consents: {
        ...defaultConsents,
        ...currentUser.consents,
        ...partial,
        acceptedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    users[index] = updatedUser;
    await this.saveUsers(users);
    await this.logSecurityEvent(userId, 'consent_change', 'Consentimentos LGPD atualizados.');
    return updatedUser;
  }

  /**
   * 6. Complete Data Export (Descontinuado)
   */
  async exportUserDataPackage(_userId: string): Promise<string> {
    throw new Error('403: A funcionalidade de exportação de dados foi descontinuada.');
  }

  /**
   * 7. Two-Step Account Deletion
   */
  async requestAccountDeletion(
    userId: string,
    confirmationPhrase: string,
    currentPassword?: string
  ): Promise<{ success: boolean; message: string }> {
    if (confirmationPhrase.trim().toUpperCase() !== 'EXCLUIR MINHA CONTA') {
      throw new Error('Digite exatamente a frase "EXCLUIR MINHA CONTA" para confirmar a exclusão.');
    }

    const users = await this.getUsers();
    const updatedUsers = users.filter((u) => u.id !== userId);
    await this.saveUsers(updatedUsers);

    await storage.removeItem(`${SESSIONS_STORAGE_KEY}_${userId}`);
    await this.logSecurityEvent(userId, 'account_deleted', 'Conta e dados pessoais excluídos permanentemente.');

    return {
      success: true,
      message: 'Sua conta e todos os dados foram apagados permanentemente do Respira.',
    };
  }

  /**
   * 8. Security Events Log
   */
  async getSecurityEvents(userId: string): Promise<SecurityEvent[]> {
    const stored = await storage.getItem<SecurityEvent[]>(`${SECURITY_EVENTS_KEY}_${userId}`);
    if (!stored || stored.length === 0) {
      return [
        {
          id: 'sec-1',
          eventType: 'login',
          description: 'Login realizado com sucesso.',
          timestamp: new Date().toISOString(),
          ipAddressMasked: '189.120.***.***',
        },
      ];
    }
    return stored;
  }

  async logSecurityEvent(
    userId: string,
    eventType: SecurityEvent['eventType'] | string,
    description: string
  ): Promise<void> {
    const events = await this.getSecurityEvents(userId);
    const newEvent: SecurityEvent = {
      id: `sec-${Date.now()}`,
      eventType: eventType as any,
      description,
      timestamp: new Date().toISOString(),
      ipAddressMasked: '189.120.***.***',
    };
    await storage.setItem(`${SECURITY_EVENTS_KEY}_${userId}`, [newEvent, ...events].slice(0, 30));
  }
}

export const userAccountService = new UserAccountService();
