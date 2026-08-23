import { useThemeStore } from '../store/themeStore';

export function useTheme() {
  const mode = useThemeStore((state) => state.mode);
  const isDark = useThemeStore((state) => state.isDark);
  const colors = useThemeStore((state) => state.colors);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return {
    mode,
    isDark,
    colors,
    setThemeMode,
    toggleTheme,
  };
}
