import { create } from 'zustand';
import { storage } from '../services/storage/asyncStorage';
import { COLORS } from '../constants/theme';
import { supabase, isSupabaseConfigured } from '../services/supabase/client';

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
    let validMode: ThemeMode = 'light';

    // 1. Tentar carregar das preferências salvas no Supabase se houver sessão ativa
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prefs } = await supabase
            .from('user_preferences')
            .select('theme')
            .eq('user_id', user.id)
            .maybeSingle();

          if (prefs?.theme === 'dark' || prefs?.theme === 'light') {
            validMode = prefs.theme;
          }
        }
      } catch (_e) {
        // Fallback para storage local
      }
    }

    if (!validMode || validMode === 'light') {
      const savedMode = (await storage.getItem<string>(THEME_STORAGE_KEY)) || 'light';
      validMode = savedMode === 'dark' ? 'dark' : 'light';
    }

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

    // 2. Persistir no Supabase em segundo plano
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('user_preferences')
            .upsert(
              {
                user_id: user.id,
                theme: validMode,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );
        }
      } catch (_e) {
        // Persistência local garantida
      }
    }
  },

  toggleTheme: async () => {
    const currentIsDark = get().isDark;
    const nextMode: ThemeMode = currentIsDark ? 'light' : 'dark';
    await get().setThemeMode(nextMode);
  },
}));
