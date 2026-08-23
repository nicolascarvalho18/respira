import { create } from 'zustand';
import { User } from '../types';
import { authService, LoginCredentials, RegisterData } from '../services/auth/authService';

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
  logout: () => Promise<void>;
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
      const { user } = await authService.login(credentials);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao realizar login' });
      throw err;
    }
  },

  register: async (data: RegisterData) => {
    try {
      set({ isLoading: true, error: null });
      const { user } = await authService.register(data);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao criar conta' });
      throw err;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authService.logout();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (err: any) {
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
