import { User } from '../../types';
import { supabaseAuthService, LogoutScope } from './supabaseAuthService';
import { storage } from '../storage/asyncStorage';

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
  token?: string;
}

const ONBOARDING_KEY = 'respira_onboarding_completed';

class AuthService {
  async getStoredSession(): Promise<User | null> {
    return supabaseAuthService.getCurrentUser();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await supabaseAuthService.signIn(credentials.email, credentials.password);
    if (res.error || !res.user) {
      throw new Error(res.error || 'E-mail ou senha inválidos.');
    }
    return { user: res.user };
  }

  async register(data: RegisterData): Promise<{ message: string; requiresVerification: boolean; email: string }> {
    const res = await supabaseAuthService.signUp(data.email, data.password, data.name, {
      termsAccepted: data.termsAccepted,
      privacyAccepted: true,
      personalizationAccepted: data.personalizationAccepted,
    });

    if (res.error) {
      throw new Error(res.error);
    }

    return {
      message: res.message || 'Cadastro realizado com sucesso.',
      requiresVerification: true,
      email: data.email.toLowerCase().trim(),
    };
  }

  async verifyOtp(email: string, token: string): Promise<User> {
    const res = await supabaseAuthService.verifyOtp(email, token);
    if (res.error || !res.user) {
      throw new Error(res.error || 'Código inválido.');
    }
    return res.user;
  }

  async resendCode(email: string): Promise<string> {
    const res = await supabaseAuthService.resendVerificationCode(email);
    if (!res.success) {
      throw new Error(res.error || 'Não foi possível reenviar o código.');
    }
    return res.message;
  }

  async forgotPassword(email: string): Promise<string> {
    const res = await supabaseAuthService.resetPassword(email);
    return res.message;
  }

  async logout(scope: LogoutScope = 'local'): Promise<void> {
    await supabaseAuthService.signOut(scope);
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
