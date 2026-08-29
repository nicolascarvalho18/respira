/**
 * Sistema de Design Tokens do Respira
 * Cores, Tipografia, Espaçamentos, Raios, Sombras e Breakpoints.
 * Tema Escuro Confortável com Alto Contraste (WCAG AA) e Tons Suaves.
 */

export const COLOR_TOKENS = {
  primary: '#247B74',
  primaryHover: '#1E6A64',
  primaryLight: '#247B74',
  primaryDark: '#5ECFC3',

  backgroundLight: '#F7F8F5',
  backgroundDark: '#121918',

  surfaceLight: '#FFFFFF',
  surfaceDark: '#1C2624',
  surfaceSecondaryLight: '#F2F8F6',
  surfaceSecondaryDark: '#243330',
  surfaceSubtleLight: '#EDF7F5',
  surfaceSubtleDark: '#2A3C38',

  textPrimaryLight: '#1F2927',
  textPrimaryDark: '#FFFFFF',
  textSecondaryLight: '#68736F',
  textSecondaryDark: '#F1F5F9',
  textMutedLight: '#8F9B97',
  textMutedDark: '#E2E8F0',

  placeholderLight: '#8F9B97',
  placeholderDark: '#94A3B8',

  anxiety: '#D87556',
  danger: '#C84E45',
  grid: '#E8ECEA',
  borderLight: '#E0E5E2',
  borderDark: '#2E3D3A',

  success: '#247B74',
  successLight: '#EDF7F5',
  successDark: '#4ADE80',
  warning: '#D87556',
  warningLight: '#FFF4EE',
  warningDark: '#FBBF24',
  error: '#C84E45',
  errorLight: '#FDF2F2',
  errorDark: '#F87171',
  info: '#247B74',
  infoLight: '#EDF7F5',
  infoDark: '#5ECFC3',
};

export const COLORS = {
  light: {
    primary: COLOR_TOKENS.primary,
    primaryHover: COLOR_TOKENS.primaryHover,
    primaryDark: '#1E6A64',
    primaryLight: COLOR_TOKENS.surfaceSubtleLight,
    primaryMuted: '#9BBDB8',
    secondary: '#389B93',
    secondaryDark: '#1E6A64',
    secondaryLight: '#EDF7F5',
    accent: COLOR_TOKENS.anxiety,
    accentDark: '#B86043',
    accentLight: '#FFF4EE',
    highlight: '#EDF7F5',
    background: COLOR_TOKENS.backgroundLight,
    surface: COLOR_TOKENS.surfaceLight,
    surfaceSecondary: COLOR_TOKENS.surfaceSecondaryLight,
    surfaceSubtle: COLOR_TOKENS.surfaceSubtleLight,
    text: COLOR_TOKENS.textPrimaryLight,
    textSecondary: COLOR_TOKENS.textSecondaryLight,
    textMuted: COLOR_TOKENS.textMutedLight,
    textLight: COLOR_TOKENS.textMutedLight,
    placeholder: COLOR_TOKENS.placeholderLight,
    border: COLOR_TOKENS.borderLight,
    borderStrong: '#CBD3D0',
    grid: COLOR_TOKENS.grid,
    success: COLOR_TOKENS.success,
    successLight: COLOR_TOKENS.successLight,
    warning: COLOR_TOKENS.warning,
    warningLight: COLOR_TOKENS.warningLight,
    error: COLOR_TOKENS.danger,
    errorLight: COLOR_TOKENS.errorLight,
    info: COLOR_TOKENS.info,
    infoLight: COLOR_TOKENS.infoLight,
    cardBg: COLOR_TOKENS.surfaceLight,
    tabBarBg: '#FFFFFF',
    tabBarInactive: '#68736F',
    tabBarActive: '#247B74',
    iconInactive: '#8F9B97',
    overlay: 'rgba(0, 0, 0, 0.45)',
  },
  dark: {
    primary: '#5ECFC3',
    primaryHover: '#7FE0D6',
    primaryDark: '#247B74',
    primaryLight: '#223431',
    primaryMuted: '#2D4B48',
    secondary: '#5ECFC3',
    secondaryDark: '#389B93',
    secondaryLight: '#1C302D',
    accent: '#F28B82',
    accentDark: '#B86043',
    accentLight: '#3D251C',
    highlight: '#2B3F3B',
    background: COLOR_TOKENS.backgroundDark,
    surface: COLOR_TOKENS.surfaceDark,
    surfaceSecondary: COLOR_TOKENS.surfaceSecondaryDark,
    surfaceSubtle: COLOR_TOKENS.surfaceSubtleDark,
    text: COLOR_TOKENS.textPrimaryDark,
    textSecondary: COLOR_TOKENS.textSecondaryDark,
    textMuted: COLOR_TOKENS.textMutedDark,
    textLight: COLOR_TOKENS.textMutedDark,
    placeholder: COLOR_TOKENS.placeholderDark,
    border: COLOR_TOKENS.borderDark,
    borderStrong: '#425D57',
    grid: '#2E433F',
    success: COLOR_TOKENS.successDark,
    successLight: '#1A332B',
    warning: COLOR_TOKENS.warningDark,
    warningLight: '#3A2B15',
    error: COLOR_TOKENS.errorDark,
    errorLight: '#3A1E1D',
    info: COLOR_TOKENS.infoDark,
    infoLight: '#1A3330',
    cardBg: COLOR_TOKENS.surfaceDark,
    tabBarBg: '#15211E',
    tabBarInactive: '#94A3B8',
    tabBarActive: '#5ECFC3',
    iconInactive: '#94A3B8',
    overlay: 'rgba(0, 0, 0, 0.75)',
  },
};

export const TYPOGRAPHY = {
  display: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700' as const,
  },
  h3: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  secondary: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
};

export const ANIMATIONS = {
  fast: 150,
  normal: 200,
  slow: 250,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const BREAKPOINTS = {
  mobileMax: 767,
  tabletMin: 768,
  tablet: 768,
  desktopMin: 1024,
  desktop: 1024,
  wide: 1280,
};
