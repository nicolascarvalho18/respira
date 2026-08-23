import { User } from '../../types';
import { MOCK_USERS } from '../../mocks/users.mock';
import { secureStorage } from '../storage/secureStorage';
import { storage } from '../storage/asyncStorage';
import { apiClient, isMockMode } from '../api/apiClient';
import { logger } from '../../utils/logger';
import { validatePasswordStrength } from '../../utils/security';

export interface LoginCredentials {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
  termsAccepted: boolean;
  personalizationAccepted: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

const CURRENT_USER_KEY = 'respira_current_user';
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const ONBOARDING_KEY = 'respira_onboarding_completed';
const FAILED_ATTEMPTS_KEY = 'respira_failed_attempts';

class AuthService {
  private failedAttemptsMap = new Map<string, { count: number; lockUntil?: number }>();

  async getStoredSession(): Promise<User | null> {
    try {
      const token = await secureStorage.getItem(TOKEN_KEY);
      if (!token) return null;

      const cachedUser = await storage.getItem<User>(CURRENT_USER_KEY);
      if (cachedUser) return cachedUser;

      return MOCK_USERS[0];
    } catch (error) {
      logger.error('Error verifying stored session:', error);
      return null;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const emailLower = credentials.email.toLowerCase().trim();

    // Check Lockout
    const attempt = this.failedAttemptsMap.get(emailLower);
    if (attempt && attempt.lockUntil && Date.now() < attempt.lockUntil) {
      const waitMinutes = Math.ceil((attempt.lockUntil - Date.now()) / 60000);
      throw new Error(`Conta temporariamente bloqueada por muitas tentativas incorretas. Tente novamente em ${waitMinutes} minutos.`);
    }

    if (!isMockMode) {
      return apiClient.post<AuthResponse>('/auth/login', credentials);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    let user = MOCK_USERS.find((u) => u.email.toLowerCase() === emailLower);

    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        name: credentials.email.split('@')[0],
        email: credentials.email,
        role: emailLower.includes('admin') ? 'admin' : 'user',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        consents: {
          termsAccepted: true,
          privacyAccepted: true,
          personalizationAccepted: true,
          analyticsAccepted: false,
          chatRetentionAccepted: true,
          acceptedAt: new Date().toISOString(),
        },
        preferences: {
          theme: 'light',
          reducedMotion: false,
          dailyReminder: true,
          reminderTime: '20:00',
          vibrationEnabled: true,
          soundEnabled: true,
          countryHelpline: 'BR',
        },
      };
    }

    // Reset failed attempts on success
    this.failedAttemptsMap.delete(emailLower);

    const currentUser: User = user;
    const mockToken = `mock-jwt-token-${currentUser.id}-${Date.now()}`;
    const mockRefreshToken = `mock-refresh-token-${currentUser.id}-${Date.now()}`;
    await secureStorage.setItem(TOKEN_KEY, mockToken);
    await secureStorage.setItem(REFRESH_TOKEN_KEY, mockRefreshToken);
    await storage.setItem(CURRENT_USER_KEY, currentUser);

    logger.info(`Simulated login success for: ${currentUser.email}`);
    return { user: currentUser, token: mockToken, refreshToken: mockRefreshToken };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    if (data.password) {
      const val = validatePasswordStrength(data.password);
      if (!val.isValid) {
        throw new Error(val.errors.join(' '));
      }
    }

    if (!isMockMode) {
      return apiClient.post<AuthResponse>('/auth/register', data);
    }

    await new Promise((resolve) => setTimeout(resolve, 600));

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim(),
      role: 'user',
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      consents: {
        termsAccepted: data.termsAccepted,
        privacyAccepted: true,
        personalizationAccepted: data.personalizationAccepted,
        analyticsAccepted: false,
        chatRetentionAccepted: true,
        acceptedAt: new Date().toISOString(),
      },
      preferences: {
        theme: 'light',
        reducedMotion: false,
        dailyReminder: true,
        reminderTime: '20:00',
        vibrationEnabled: true,
        soundEnabled: true,
        countryHelpline: 'BR',
      },
    };

    const mockToken = `mock-jwt-token-${newUser.id}-${Date.now()}`;
    const mockRefreshToken = `mock-refresh-token-${newUser.id}-${Date.now()}`;
    await secureStorage.setItem(TOKEN_KEY, mockToken);
    await secureStorage.setItem(REFRESH_TOKEN_KEY, mockRefreshToken);
    await storage.setItem(CURRENT_USER_KEY, newUser);

    logger.info(`Simulated register success for: ${newUser.email}`);
    return { user: newUser, token: mockToken, refreshToken: mockRefreshToken };
  }

  async forgotPassword(email: string): Promise<string> {
    if (!isMockMode) {
      await apiClient.post('/auth/forgot-password', { email });
    } else {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
    // Neutral response as required by security guidelines
    return 'Se existir uma conta associada a esse e-mail, enviaremos as instruções.';
  }

  async logout(): Promise<void> {
    try {
      await secureStorage.deleteItem(TOKEN_KEY);
      await secureStorage.deleteItem(REFRESH_TOKEN_KEY);
      await storage.removeItem(CURRENT_USER_KEY);
      logger.info('Session cleared from storage');
    } catch (error) {
      logger.error('Error during logout:', error);
    }
  }

  async isOnboardingCompleted(): Promise<boolean> {
    const completed = await storage.getItem<boolean>(ONBOARDING_KEY);
    return !!completed;
  }

  async setOnboardingCompleted(completed: boolean = true): Promise<void> {
    await storage.setItem(ONBOARDING_KEY, completed);
  }
}

export const authService = new AuthService();
