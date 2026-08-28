/**
 * Sistema de Design Tokens do Respira
 * Cores, Tipografia, Espaçamentos, Raios, Sombras e Breakpoints Originais.
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
  placeholderDark: '#CBD5E1',

  anxiety: '#D87556',
  danger: '#C84E45',
  grid: '#E8ECEA',
  borderLight: '#E0E5E2',
  borderDark: '#2E3D3A',

  success: '#247B74',
  successLight: '#EDF7F5',
  successDark: '#65D6A6',
  warning: '#D87556',
  warningLight: '#FFF4EE',
  warningDark: '#F28B82',
  error: '#C84E45',
  errorLight: '#FDF2F2',
  errorDark: '#F28B82',
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
    primaryLight: '#243330',
    primaryMuted: '#2D4B48',
    secondary: '#5ECFC3',
    secondaryDark: '#389B93',
    secondaryLight: '#1C302D',
    accent: '#F28B82',
    accentDark: '#B86043',
    accentLight: '#3D251C',
    highlight: '#2A3C38',
    background: COLOR_TOKENS.backgroundDark,
    surface: COLOR_TOKENS.surfaceDark,
    surfaceSecondary: COLOR_TOKENS.surfaceSecondaryDark,
    surfaceSubtle: COLOR_TOKENS.surfaceSubtleDark,
    text: '#FFFFFF',
    textSecondary: '#F1F5F9',
    textMuted: '#E2E8F0',
    textLight: '#E2E8F0',
    placeholder: '#CBD5E1',
    border: COLOR_TOKENS.borderDark,
    borderStrong: '#3D524E',
    grid: '#2E3D3A',
    success: '#65D6A6',
    successLight: '#1C302D',
    warning: '#F28B82',
    warningLight: '#3D251C',
    error: '#F28B82',
    errorLight: '#3A1E1D',
    info: '#5ECFC3',
    infoLight: '#1C302D',
    cardBg: COLOR_TOKENS.surfaceDark,
    tabBarBg: '#1C2624',
    tabBarInactive: '#E2E8F0',
    tabBarActive: '#5ECFC3',
    iconInactive: '#E2E8F0',
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

export const ANIMATIONS = {
  fast: 150,
  normal: 200,
  slow: 250,
};

