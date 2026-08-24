/**
 * Sistema de Design Tokens do Respira
 * Paleta Oficial Profissional:
 * - Principal: Azul Sereno (#426A8C)
 * - Secundária: Lilás Suave (#8176A8)
 * - Apoio: Amarelo Acolhedor (#D6AD55)
 * - Neutros: Fundo (#F6F8FA), Card (#FFFFFF), Texto (#18272F), Borda (#DDE5E9)
 * - Alerta: Coral (#C9795B), Fundo Alerta (#FFF1EB)
 */

export const COLOR_TOKENS = {
  // Azul Sereno
  primaryLight: '#426A8C',
  primaryDark: '#28475F',
  primaryTint: '#E8F1F7',

  // Lilás Suave
  secondaryLight: '#8176A8',
  secondaryDark: '#5D547D',
  secondaryTint: '#F0EDF7',

  // Amarelo Acolhedor
  accentLight: '#D6AD55',
  accentDark: '#8A6A28',
  accentTint: '#FFF7DF',

  // Neutros
  backgroundLight: '#F6F8FA',
  backgroundDark: '#0E161C',

  surfaceLight: '#FFFFFF',
  surfaceDark: '#162026',
  surfaceSecondaryLight: '#E8F1F7',
  surfaceSecondaryDark: '#1E2C33',
  surfaceSubtleLight: '#F0EDF7',
  surfaceSubtleDark: '#242033',

  textPrimaryLight: '#18272F',
  textPrimaryDark: '#F0F4F7',
  textSecondaryLight: '#64737A',
  textSecondaryDark: '#9DB0B9',
  textMutedLight: '#8898A1',
  textMutedDark: '#6C7E87',

  borderLight: '#DDE5E9',
  borderDark: '#263740',

  // Feedback & Alertas
  success: '#3D8B7A',
  successLight: '#E5F4F0',
  warning: '#D6AD55',
  warningLight: '#FFF7DF',
  error: '#C9795B',
  errorLight: '#FFF1EB',
  info: '#426A8C',
  infoLight: '#E8F1F7',
};

export const COLORS = {
  light: {
    primary: COLOR_TOKENS.primaryLight,
    primaryDark: COLOR_TOKENS.primaryDark,
    primaryLight: COLOR_TOKENS.primaryTint,
    primaryMuted: '#A0BBD0',
    secondary: COLOR_TOKENS.secondaryLight,
    secondaryDark: COLOR_TOKENS.secondaryDark,
    secondaryLight: COLOR_TOKENS.secondaryTint,
    accent: COLOR_TOKENS.accentLight,
    accentDark: COLOR_TOKENS.accentDark,
    accentLight: COLOR_TOKENS.accentTint,
    highlight: COLOR_TOKENS.primaryTint,
    background: COLOR_TOKENS.backgroundLight,
    surface: COLOR_TOKENS.surfaceLight,
    surfaceSecondary: COLOR_TOKENS.surfaceSecondaryLight,
    surfaceSubtle: COLOR_TOKENS.surfaceSubtleLight,
    text: COLOR_TOKENS.textPrimaryLight,
    textSecondary: COLOR_TOKENS.textSecondaryLight,
    textMuted: COLOR_TOKENS.textMutedLight,
    textLight: COLOR_TOKENS.textMutedLight,
    border: COLOR_TOKENS.borderLight,
    borderStrong: '#C5D4DC',
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
    overlay: 'rgba(24, 39, 47, 0.45)',
  },
  dark: {
    primary: '#6B96BD',
    primaryDark: COLOR_TOKENS.primaryLight,
    primaryLight: '#1E2C33',
    primaryMuted: '#385366',
    secondary: '#A399C7',
    secondaryDark: COLOR_TOKENS.secondaryDark,
    secondaryLight: '#242033',
    accent: '#E6C47A',
    accentDark: COLOR_TOKENS.accentDark,
    accentLight: '#2F2615',
    highlight: '#1E2C33',
    background: COLOR_TOKENS.backgroundDark,
    surface: COLOR_TOKENS.surfaceDark,
    surfaceSecondary: COLOR_TOKENS.surfaceSecondaryDark,
    surfaceSubtle: COLOR_TOKENS.surfaceSubtleDark,
    text: COLOR_TOKENS.textPrimaryDark,
    textSecondary: COLOR_TOKENS.textSecondaryDark,
    textMuted: COLOR_TOKENS.textMutedDark,
    textLight: COLOR_TOKENS.textMutedDark,
    border: COLOR_TOKENS.borderDark,
    borderStrong: '#3A4E59',
    success: '#59B09D',
    successLight: '#142C25',
    warning: '#E6C47A',
    warningLight: '#332712',
    error: '#DE8E73',
    errorLight: '#3D201A',
    info: '#6B96BD',
    infoLight: '#172836',
    cardBg: COLOR_TOKENS.surfaceDark,
    tabBarBg: '#121C21',
    overlay: 'rgba(0, 0, 0, 0.75)',
  },
};

export const TYPOGRAPHY = {
  display: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '800' as const,
    letterSpacing: -0.4,
  },
  h1: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700' as const,
  },
  h3: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  secondary: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  caption: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500' as const,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
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
    shadowColor: '#18272F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#18272F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#18272F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
};
