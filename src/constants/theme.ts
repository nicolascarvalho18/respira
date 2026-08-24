/**
 * Sistema de Design Tokens do Respira
 * Cores, Tipografia, Espaçamentos, Raios, Sombras e Breakpoints Originais.
 */

export const COLOR_TOKENS = {
  primaryLight: '#2F7F7C',
  primaryDark: '#69B8AE',

  backgroundLight: '#F7F9F7',
  backgroundDark: '#0F1B1A',

  surfaceLight: '#FFFFFF',
  surfaceDark: '#162523',
  surfaceSecondaryLight: '#E7F3EF',
  surfaceSecondaryDark: '#1C302D',
  surfaceSubtleLight: '#F0F6F4',
  surfaceSubtleDark: '#203936',

  textPrimaryLight: '#173D3B',
  textPrimaryDark: '#F2F7F5',
  textSecondaryLight: '#667775',
  textSecondaryDark: '#A9BBB7',
  textMutedLight: '#8C9E9B',
  textMutedDark: '#708885',

  borderLight: '#DCE5E2',
  borderDark: '#2B413E',

  success: '#2F7F7C',
  successLight: '#E7F3EF',
  warning: '#D98968',
  warningLight: '#FFF4EE',
  error: '#D9534F',
  errorLight: '#FDF0F0',
  info: '#426E91',
  infoLight: '#EDF4F9',
};

export const COLORS = {
  light: {
    primary: COLOR_TOKENS.primaryLight,
    primaryDark: '#1F5B58',
    primaryLight: '#E7F3EF',
    primaryMuted: '#B2D8D2',
    secondary: '#79B8A4',
    secondaryLight: '#E7F3EF',
    highlight: '#E7F3EF',
    background: COLOR_TOKENS.backgroundLight,
    surface: COLOR_TOKENS.surfaceLight,
    surfaceSecondary: COLOR_TOKENS.surfaceSecondaryLight,
    surfaceSubtle: COLOR_TOKENS.surfaceSubtleLight,
    text: COLOR_TOKENS.textPrimaryLight,
    textSecondary: COLOR_TOKENS.textSecondaryLight,
    textMuted: COLOR_TOKENS.textMutedLight,
    textLight: COLOR_TOKENS.textMutedLight,
    border: COLOR_TOKENS.borderLight,
    borderStrong: '#C5D6D2',
    success: COLOR_TOKENS.success,
    successLight: COLOR_TOKENS.successLight,
    warning: COLOR_TOKENS.warning,
    warningLight: COLOR_TOKENS.warningLight,
    error: COLOR_TOKENS.error,
    errorLight: COLOR_TOKENS.errorLight,
    info: COLOR_TOKENS.info,
    infoLight: COLOR_TOKENS.infoLight,
    cardBg: COLOR_TOKENS.surfaceLight,
    tabBarBg: '#FFFFFF',
    overlay: 'rgba(23, 61, 59, 0.5)',
  },
  dark: {
    primary: COLOR_TOKENS.primaryDark,
    primaryDark: '#2F7F7C',
    primaryLight: '#203936',
    primaryMuted: '#2D4B4E',
    secondary: '#8AC4B2',
    secondaryLight: '#1C302D',
    highlight: '#203936',
    background: COLOR_TOKENS.backgroundDark,
    surface: COLOR_TOKENS.surfaceDark,
    surfaceSecondary: COLOR_TOKENS.surfaceSecondaryDark,
    surfaceSubtle: COLOR_TOKENS.surfaceSubtleDark,
    text: COLOR_TOKENS.textPrimaryDark,
    textSecondary: COLOR_TOKENS.textSecondaryDark,
    textMuted: COLOR_TOKENS.textMutedDark,
    textLight: COLOR_TOKENS.textMutedDark,
    border: COLOR_TOKENS.borderDark,
    borderStrong: '#3D5955',
    success: '#69B8AE',
    successLight: '#183327',
    warning: '#E28E6E',
    warningLight: '#3D251C',
    error: '#E57373',
    errorLight: '#3D1C1C',
    info: '#5B8AB0',
    infoLight: '#192C3D',
    cardBg: COLOR_TOKENS.surfaceDark,
    tabBarBg: '#162523',
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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const BREAKPOINTS = {
  mobileMax: 767,
  tabletMin: 768,
  tabletMax: 1199,
  desktopMin: 1200,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
};
