/**
 * Sistema de Design Tokens do Respira
 * Cores, Tipografia, Espaçamentos, Raios, Sombras e Breakpoints.
 */

export const COLOR_TOKENS = {
  primary: '#2E7477',
  primaryDark: '#20595C',
  primaryLight: '#DDEFEA',
  primaryMuted: '#B8DBD7',

  backgroundLight: '#F5F8F7',
  backgroundDark: '#111718',

  surfaceLight: '#FFFFFF',
  surfaceDark: '#1A2325',
  surfaceSecondaryLight: '#EEF4F2',
  surfaceSecondaryDark: '#232F31',

  textPrimaryLight: '#172B2D',
  textPrimaryDark: '#F0F5F5',
  textSecondaryLight: '#607174',
  textSecondaryDark: '#9CB0B3',
  textMutedLight: '#8A9A9D',
  textMutedDark: '#6C7E81',

  borderLight: '#D8E3E0',
  borderDark: '#2D3D40',
  borderStrongLight: '#BDCCC8',
  borderStrongDark: '#3E5357',

  success: '#428568',
  successLight: '#E8F5EF',
  warning: '#D47754',
  warningLight: '#FDF2EC',
  error: '#B84C4C',
  errorLight: '#FDF0F0',
  info: '#426E91',
  infoLight: '#EDF4F9',
};

export const COLORS = {
  light: {
    primary: COLOR_TOKENS.primary,
    primaryDark: COLOR_TOKENS.primaryDark,
    primaryLight: COLOR_TOKENS.primaryLight,
    primaryMuted: COLOR_TOKENS.primaryMuted,
    secondary: '#79B8A4',
    secondaryLight: '#E4F2EC',
    highlight: COLOR_TOKENS.primaryLight,
    background: COLOR_TOKENS.backgroundLight,
    surface: COLOR_TOKENS.surfaceLight,
    surfaceSecondary: COLOR_TOKENS.surfaceSecondaryLight,
    surfaceSubtle: COLOR_TOKENS.surfaceSecondaryLight,
    text: COLOR_TOKENS.textPrimaryLight,
    textSecondary: COLOR_TOKENS.textSecondaryLight,
    textMuted: COLOR_TOKENS.textSecondaryLight,
    textLight: COLOR_TOKENS.textMutedLight,
    border: COLOR_TOKENS.borderLight,
    borderStrong: COLOR_TOKENS.borderStrongLight,
    success: COLOR_TOKENS.success,
    successLight: COLOR_TOKENS.successLight,
    warning: COLOR_TOKENS.warning,
    warningLight: COLOR_TOKENS.warningLight,
    error: COLOR_TOKENS.error,
    errorLight: COLOR_TOKENS.errorLight,
    info: COLOR_TOKENS.info,
    infoLight: COLOR_TOKENS.infoLight,
    cardBg: COLOR_TOKENS.surfaceLight,
    tabBarBg: 'rgba(255, 255, 255, 0.95)',
    overlay: 'rgba(23, 43, 45, 0.5)',
  },
  dark: {
    primary: '#4CA4A7',
    primaryDark: '#2E7477',
    primaryLight: '#23383B',
    primaryMuted: '#2D4B4E',
    secondary: '#8AC4B2',
    secondaryLight: '#1F332E',
    highlight: '#23383B',
    background: COLOR_TOKENS.backgroundDark,
    surface: COLOR_TOKENS.surfaceDark,
    surfaceSecondary: COLOR_TOKENS.surfaceSecondaryDark,
    surfaceSubtle: COLOR_TOKENS.surfaceSecondaryDark,
    text: COLOR_TOKENS.textPrimaryDark,
    textSecondary: COLOR_TOKENS.textSecondaryDark,
    textMuted: COLOR_TOKENS.textSecondaryDark,
    textLight: COLOR_TOKENS.textMutedDark,
    border: COLOR_TOKENS.borderDark,
    borderStrong: COLOR_TOKENS.borderStrongDark,
    success: '#56A882',
    successLight: '#183327',
    warning: '#E28E6E',
    warningLight: '#3D251C',
    error: '#CF6666',
    errorLight: '#3D1C1C',
    info: '#5B8AB0',
    infoLight: '#192C3D',
    cardBg: COLOR_TOKENS.surfaceDark,
    tabBarBg: 'rgba(26, 35, 37, 0.95)',
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
    shadowColor: '#172B2D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#172B2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#172B2D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};
