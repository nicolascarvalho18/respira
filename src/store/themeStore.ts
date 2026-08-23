import { create } from 'zustand';
import { Appearance } from 'react-native';
import { storage } from '../services/storage/asyncStorage';
import { COLORS } from '../constants/theme';

type ThemeMode = 'light' | 'dark' | 'system';

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
    const savedMode = (await storage.getItem<ThemeMode>(THEME_STORAGE_KEY)) || 'light';
    const systemScheme = Appearance.getColorScheme();

    const isDark =
      savedMode === 'dark' || (savedMode === 'system' && systemScheme === 'dark');

    set({
      mode: savedMode,
      isDark,
      colors: isDark ? COLORS.dark : COLORS.light,
    });
  },

  setThemeMode: async (mode: ThemeMode) => {
    await storage.setItem(THEME_STORAGE_KEY, mode);
    const systemScheme = Appearance.getColorScheme();
    const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

    set({
      mode,
      isDark,
      colors: isDark ? COLORS.dark : COLORS.light,
    });
  },

  toggleTheme: async () => {
    const currentIsDark = get().isDark;
    const nextMode = currentIsDark ? 'light' : 'dark';
    await get().setThemeMode(nextMode);
  },
}));
