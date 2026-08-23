import { create } from 'zustand';
import { storage } from '../services/storage/asyncStorage';
import { COLORS } from '../constants/theme';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  colors: typeof COLORS.light;

  // Actions
  initializeTheme: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = 'respira_theme_mode';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  isDark: false,
  colors: COLORS.light,

  initializeTheme: async () => {
    const savedMode = (await storage.getItem<string>(THEME_STORAGE_KEY)) || 'light';
    const validMode: ThemeMode = savedMode === 'dark' ? 'dark' : 'light';
    const isDark = validMode === 'dark';

    set({
      mode: validMode,
      isDark,
      colors: isDark ? COLORS.dark : COLORS.light,
    });
  },

  setThemeMode: async (mode: ThemeMode) => {
    const validMode: ThemeMode = mode === 'dark' ? 'dark' : 'light';
    await storage.setItem(THEME_STORAGE_KEY, validMode);
    const isDark = validMode === 'dark';

    set({
      mode: validMode,
      isDark,
      colors: isDark ? COLORS.dark : COLORS.light,
    });
  },

  toggleTheme: async () => {
    const currentIsDark = get().isDark;
    const nextMode: ThemeMode = currentIsDark ? 'light' : 'dark';
    await get().setThemeMode(nextMode);
  },
}));
