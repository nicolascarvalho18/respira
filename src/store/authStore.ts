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
  register: (data: RegisterData) => Promise<void>;
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
          if (session?.user) {
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
        throw new Error(errorMsg);
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

      if (res.error || !res.user) {
        set({ isLoading: false, error: res.error || 'Não foi possível cadastrar.' });
        throw new Error(res.error || 'Não foi possível cadastrar.');
      }

      set({
        user: res.user,
        session: res.session,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      await supabaseUserService.syncCurrentDevice(res.user.id);
      useMoodStore.getState().fetchRecords(res.user.id);
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao criar conta' });
      throw err;
    }
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
      try {
        const metadataUpdate: Record<string, any> = {};
        if (partial.name !== undefined) {
          metadataUpdate.full_name = partial.name;
          metadataUpdate.name = partial.name;
          metadataUpdate.display_name = partial.name;
        }
        if (partial.bio !== undefined) {
          metadataUpdate.bio = partial.bio;
        }
        if (partial.avatarUrl !== undefined) {
          metadataUpdate.avatar_url = partial.avatarUrl;
        }

        if (Object.keys(metadataUpdate).length > 0) {
          await supabase.auth.updateUser({ data: metadataUpdate }).catch(() => {});
        }

        await supabase
          .from('profiles')
          .upsert(
            {
              id: current.id,
              full_name: partial.name !== undefined ? partial.name : current.name,
              display_name: partial.name !== undefined ? partial.name : current.name,
              bio: partial.bio !== undefined ? partial.bio : current.bio,
              avatar_url: partial.avatarUrl !== undefined ? partial.avatarUrl : current.avatarUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
          .catch(() => {});
      } catch (_e) {
        // Ignorado
      }
    }
  },

  clearError: () => set({ error: null }),
}));
