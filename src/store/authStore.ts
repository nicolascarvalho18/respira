import { create } from 'zustand';
import { User } from '../types';
import { authService, LoginCredentials, RegisterData } from '../services/auth/authService';
import { supabaseAuthService, LogoutScope } from '../services/auth/supabaseAuthService';
import { supabaseUserService } from '../services/user/supabaseUserService';
import { isSupabaseConfigured } from '../services/supabase/client';
import { useMoodStore } from './moodStore';
import { moodService } from '../services/mood/moodService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboardingCompleted: boolean;
  error: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: (scope?: LogoutScope) => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isOnboardingCompleted: false,
  error: null,

  initializeAuth: async () => {
    try {
      set({ isLoading: true, error: null });

      if (isSupabaseConfigured) {
        const supabaseUser = await supabaseAuthService.getCurrentUser();
        if (supabaseUser) {
          await supabaseUserService.syncCurrentDevice(supabaseUser.id);
          set({
            user: supabaseUser,
            isAuthenticated: true,
            isOnboardingCompleted: true,
            isLoading: false,
          });
          return;
        }
      }

      const [user, onboardingCompleted] = await Promise.all([
        authService.getStoredSession(),
        authService.isOnboardingCompleted(),
      ]);

      set({
        user,
        isAuthenticated: !!user,
        isOnboardingCompleted: onboardingCompleted,
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Falha ao inicializar autenticação' });
    }
  },

  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null });

      if (isSupabaseConfigured) {
        const res = await supabaseAuthService.signIn(credentials.email, credentials.password);
        if (res.error || !res.user) {
          throw new Error(res.error || 'Falha ao autenticar com Supabase');
        }
        await supabaseUserService.syncCurrentDevice(res.user.id);
        set({ user: res.user, isAuthenticated: true, isLoading: false });
        useMoodStore.getState().fetchRecords(res.user.id);
        return;
      }

      const { user } = await authService.login(credentials);
      set({ user, isAuthenticated: true, isLoading: false });
      useMoodStore.getState().fetchRecords(user.id);
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao realizar login' });
      throw err;
    }
  },

  register: async (data: RegisterData) => {
    try {
      set({ isLoading: true, error: null });

      if (isSupabaseConfigured) {
        const res = await supabaseAuthService.signUp(data.email, data.password, data.name);
        if (res.error || !res.user) {
          throw new Error(res.error || 'Falha ao cadastrar com Supabase');
        }
        await supabaseUserService.syncCurrentDevice(res.user.id);
        set({ user: res.user, isAuthenticated: true, isLoading: false });
        useMoodStore.getState().fetchRecords(res.user.id);
        return;
      }

      const { user } = await authService.register(data);
      set({ user, isAuthenticated: true, isLoading: false });
      useMoodStore.getState().fetchRecords(user.id);
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao criar conta' });
      throw err;
    }
  },

  logout: async (scope: LogoutScope = 'local') => {
    try {
      const currentUser = get().user;
      set({ isLoading: true });

      // Limpar estado em memória de humor e diário imediatamente
      useMoodStore.getState().clearRecords();
      if (currentUser?.id) {
        await moodService.clearUserCache(currentUser.id);
      }

      if (isSupabaseConfigured) {
        await supabaseAuthService.signOut(scope);
      }
      await authService.logout();
      if (scope === 'local' || scope === 'global') {
        set({ user: null, isAuthenticated: false, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (_err) {
      set({ isLoading: false });
    }
  },

  setOnboardingCompleted: async (completed: boolean) => {
    await authService.setOnboardingCompleted(completed);
    set({ isOnboardingCompleted: completed });
  },

  updateUser: (partial: Partial<User>) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...partial } });
    }
  },

  clearError: () => set({ error: null }),
}));
