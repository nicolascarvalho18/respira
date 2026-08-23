import { User } from '../../types';
import { MOCK_USERS } from '../../mocks/users.mock';
import { secureStorage } from '../storage/secureStorage';
import { storage } from '../storage/asyncStorage';
import { apiClient, isMockMode } from '../api/apiClient';
import { logger } from '../../utils/logger';

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
}

const CURRENT_USER_KEY = 'respira_current_user';
const TOKEN_KEY = 'auth_token';
const ONBOARDING_KEY = 'respira_onboarding_completed';

class AuthService {
  async getStoredSession(): Promise<User | null> {
    try {
      const token = await secureStorage.getItem(TOKEN_KEY);
      if (!token) return null;

      const cachedUser = await storage.getItem<User>(CURRENT_USER_KEY);
      if (cachedUser) return cachedUser;

      // Se estiver em modo mock, retorna o primeiro mock
      return MOCK_USERS[0];
    } catch (error) {
      logger.error('Error verifying stored session:', error);
      return null;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (!isMockMode) {
      return apiClient.post<AuthResponse>('/auth/login', credentials);
    }

    // Simulação com validação local
    await new Promise((resolve) => setTimeout(resolve, 600));

    const emailLower = credentials.email.toLowerCase().trim();
    let user = MOCK_USERS.find((u) => u.email.toLowerCase() === emailLower);

    if (!user) {
      // Se for um novo login em modo mock, cria sessão de teste
      user = {
        id: `user-${Date.now()}`,
        name: credentials.email.split('@')[0],
        email: credentials.email,
        role: emailLower.includes('admin') ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
        consents: {
          termsAccepted: true,
          privacyAccepted: true,
          personalizationAccepted: true,
          analyticsAccepted: false,
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

    const mockToken = `mock-jwt-token-${user.id}-${Date.now()}`;
    await secureStorage.setItem(TOKEN_KEY, mockToken);
    await storage.setItem(CURRENT_USER_KEY, user);

    logger.info(`Simulated login success for: ${user.email}`);
    return { user, token: mockToken };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    if (!isMockMode) {
      return apiClient.post<AuthResponse>('/auth/register', data);
    }

    await new Promise((resolve) => setTimeout(resolve, 700));

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim(),
      role: 'user',
      createdAt: new Date().toISOString(),
      consents: {
        termsAccepted: data.termsAccepted,
        privacyAccepted: true,
        personalizationAccepted: data.personalizationAccepted,
        analyticsAccepted: false,
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
    await secureStorage.setItem(TOKEN_KEY, mockToken);
    await storage.setItem(CURRENT_USER_KEY, newUser);

    logger.info(`Simulated register success for: ${newUser.email}`);
    return { user: newUser, token: mockToken };
  }

  async forgotPassword(email: string): Promise<boolean> {
    if (!isMockMode) {
      await apiClient.post('/auth/forgot-password', { email });
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
    logger.info(`Simulated recovery email sent to: ${email}`);
    return true;
  }

  async logout(): Promise<void> {
    try {
      await secureStorage.deleteItem(TOKEN_KEY);
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
