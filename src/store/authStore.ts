import { create } from 'zustand';
import { User } from '../types';
import { supabaseAuthService, LogoutScope } from '../services/auth/supabaseAuthService';
import { supabaseUserService } from '../services/user/supabaseUserService';
import { supabase } from '../services/supabase/client';
import { useMoodStore } from './moodStore';
import { moodService } from '../services/mood/moodService';
import { authService, LoginCredentials, RegisterData } from '../services/auth/authService';

interface AuthState {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboardingCompleted: boolean;
  error: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<{ requiresVerification: boolean; email: string }>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  resendCode: (email: string) => Promise<string>;
  logout: (scope?: LogoutScope) => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  updateUser: (partial: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  isOnboardingCompleted: false,
  error: null,

  initializeAuth: async () => {
    try {
      set({ isLoading: true, error: null });

      // 1. Escutar alterações de autenticação em tempo real no Supabase Auth
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user?.email_confirmed_at) {
            const currentUser = await supabaseAuthService.getCurrentUser();
            if (currentUser) {
              set({
                user: currentUser,
                session,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            }
          }
        }

        if (event === 'SIGNED_OUT') {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      });

      // 2. Verificar sessão persistida atual
      const { user, session } = await supabaseAuthService.getCurrentSession();
      const onboardingCompleted = await authService.isOnboardingCompleted();

      if (user && session) {
        await supabaseUserService.syncCurrentDevice(user.id);
        set({
          user,
          session,
          isAuthenticated: true,
          isOnboardingCompleted: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isOnboardingCompleted: onboardingCompleted,
          isLoading: false,
        });
      }
    } catch (err: any) {
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: err.message || 'Falha ao inicializar autenticação',
      });
    }
  },

  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null });

      const res = await supabaseAuthService.signIn(credentials.email, credentials.password);
      if (res.error || !res.user) {
        const errorMsg = res.error || 'E-mail ou senha inválidos.';
        set({ isLoading: false, error: errorMsg });
        const customErr: any = new Error(errorMsg);
        customErr.isEmailNotConfirmed = res.isEmailNotConfirmed;
        customErr.email = res.email;
        throw customErr;
      }

      await supabaseUserService.syncCurrentDevice(res.user.id);
      set({
        user: res.user,
        session: res.session,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      useMoodStore.getState().fetchRecords(res.user.id);
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao realizar login' });
      throw err;
    }
  },

  register: async (data: RegisterData) => {
    try {
      set({ isLoading: true, error: null });

      const res = await supabaseAuthService.signUp(data.email, data.password, data.name, {
        termsAccepted: data.termsAccepted,
        privacyAccepted: true,
        personalizationAccepted: data.personalizationAccepted,
      });

      if (res.error) {
        set({ isLoading: false, error: res.error });
        throw new Error(res.error);
      }

      set({ isLoading: false, error: null });
      return {
        requiresVerification: true,
        email: data.email.toLowerCase().trim(),
      };
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao criar conta' });
      throw err;
    }
  },

  verifyOtp: async (email: string, token: string) => {
    try {
      set({ isLoading: true, error: null });

      const res = await supabaseAuthService.verifyOtp(email, token);
      if (res.error || !res.user) {
        set({ isLoading: false, error: res.error || 'Código incorreto.' });
        throw new Error(res.error || 'Código incorreto.');
      }

      set({
        user: res.user,
        session: res.session,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      if (res.user.id) {
        await supabaseUserService.syncCurrentDevice(res.user.id);
        useMoodStore.getState().fetchRecords(res.user.id);
      }
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Código incorreto.' });
      throw err;
    }
  },

  resendCode: async (email: string) => {
    const res = await supabaseAuthService.resendVerificationCode(email);
    if (!res.success) {
      throw new Error(res.error || 'Não foi possível reenviar o código.');
    }
    return res.message;
  },

  logout: async (scope: LogoutScope = 'local') => {
    try {
      const currentUser = get().user;
      set({ isLoading: true });

      // Limpar cache de dados em memória
      useMoodStore.getState().clearRecords();
      if (currentUser?.id) {
        await moodService.clearUserCache(currentUser.id);
      }

      await supabaseAuthService.signOut(scope);
      await authService.logout();

      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (_err) {
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setOnboardingCompleted: async (completed: boolean) => {
    await authService.setOnboardingCompleted(completed);
    set({ isOnboardingCompleted: completed });
  },

  updateUser: async (partial: Partial<User>) => {
    const current = get().user;
    if (!current) return;

    const updated = { ...current, ...partial };
    set({ user: updated });

    if (current.id) {
      await supabase
        .from('profiles')
        .update({
          full_name: partial.name ?? current.name,
          avatar_url: partial.avatarUrl ?? current.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.id);
    }
  },

  clearError: () => set({ error: null }),
}));
