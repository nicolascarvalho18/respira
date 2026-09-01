import { create } from 'zustand';
import { User } from '../types';
import { supabaseAuthService, LogoutScope } from '../services/auth/supabaseAuthService';
import { supabaseUserService } from '../services/user/supabaseUserService';
import { supabase } from '../services/supabase/client';
import { useMoodStore } from './moodStore';
import { usePracticeStore } from './practiceStore';
import { useContentStore } from './contentStore';
import { useSoundscapeStore } from './soundscapeStore';
import { useMusicStore } from './musicStore';
import { useDailyRoutineStore } from './dailyRoutineStore';
import { useSoundMixerStore } from './soundMixerStore';
import { useChatStore } from './chatStore';
import { moodService } from '../services/mood/moodService';
import { favoriteService } from '../services/favorite/favoriteService';
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
  deleteAccount: () => Promise<void>;
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

      const onboardingCompleted = await authService.isOnboardingCompleted();
      const { user, session } = await supabaseAuthService.getCurrentSession();

      if (user) {
        set({
          user,
          session,
          isAuthenticated: true,
          isOnboardingCompleted: true,
          isLoading: false,
        });

        // Inicializa todos os dados vinculados à conta do usuário autenticado
        useMoodStore.getState().fetchRecords(user.id);
        usePracticeStore.getState().fetchPractices(user.id);
        usePracticeStore.getState().fetchUserProgress(user.id);
        useContentStore.getState().fetchArticles(user.id);
        useSoundscapeStore.getState().loadSavedPreferences(user.id);
        useMusicStore.getState().loadSavedPreferences(user.id);
        useSoundMixerStore.getState().loadPresets(user.id);
        useDailyRoutineStore.getState().fetchDailyRoutine(user.id);
        useChatStore.getState().fetchMessages(user.id);
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

      // Carregar dados 100% isolados para a conta conectada
      useMoodStore.getState().fetchRecords(res.user.id);
      usePracticeStore.getState().fetchPractices(res.user.id);
      usePracticeStore.getState().fetchUserProgress(res.user.id);
      useContentStore.getState().fetchArticles(res.user.id);
      useSoundscapeStore.getState().loadSavedPreferences(res.user.id);
      useMusicStore.getState().loadSavedPreferences(res.user.id);
      useSoundMixerStore.getState().loadPresets(res.user.id);
      useDailyRoutineStore.getState().fetchDailyRoutine(res.user.id);
      useChatStore.getState().fetchMessages(res.user.id);
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
      // Carregar dados limpos e isolados para a nova conta
      useMoodStore.getState().fetchRecords(res.user.id);
      usePracticeStore.getState().fetchPractices(res.user.id);
      usePracticeStore.getState().fetchUserProgress(res.user.id);
      useContentStore.getState().fetchArticles(res.user.id);
      useSoundscapeStore.getState().loadSavedPreferences(res.user.id);
      useMusicStore.getState().loadSavedPreferences(res.user.id);
      useSoundMixerStore.getState().loadPresets(res.user.id);
      useDailyRoutineStore.getState().fetchDailyRoutine(res.user.id);
      useChatStore.getState().fetchMessages(res.user.id);
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao criar conta' });
      throw err;
    }
  },

  logout: async (scope: LogoutScope = 'local') => {
    try {
      const currentUser = get().user;
      set({ isLoading: true });

      // Parar reprodução ativa de áudio
      useMusicStore.getState().stopTrack();
      useSoundscapeStore.getState().stopSoundscape();
      useSoundMixerStore.getState().stopMix();

      // Limpar cache de dados em memória e isolamento entre contas
      useMoodStore.getState().clearRecords();
      useDailyRoutineStore.getState().resetRoutine();
      usePracticeStore.getState().fetchPractices(undefined);
      usePracticeStore.setState({ userProgress: {} });
      useContentStore.getState().fetchArticles(undefined);
      useSoundscapeStore.getState().loadSavedPreferences(undefined);
      useMusicStore.getState().loadSavedPreferences(undefined);
      useSoundMixerStore.getState().loadPresets(undefined);
      useChatStore.getState().resetChat();

      if (currentUser?.id) {
        await moodService.clearUserCache(currentUser.id);
        await favoriteService.clearUserCache(currentUser.id);
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
          try {
            await supabase.auth.updateUser({ data: metadataUpdate });
          } catch (_e) {}
        }

        try {
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
            );
        } catch (_e) {}
      } catch (_e) {
        // Ignorado
      }
    }
  },

  clearError: () => set({ error: null }),

  deleteAccount: async () => {
    try {
      const currentUser = get().user;
      set({ isLoading: true });

      if (currentUser?.id) {
        await moodService.clearUserCache(currentUser.id);
        await favoriteService.clearUserCache(currentUser.id);
      }

      await get().logout();
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao excluir conta' });
      throw err;
    }
  },
}));
