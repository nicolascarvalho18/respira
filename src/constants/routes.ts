export const ROUTES = {
  // Public
  SPLASH: '/',
  ONBOARDING: '/(auth)/onboarding',
  LOGIN: '/(auth)/login',
  REGISTER: '/(auth)/register',
  FORGOT_PASSWORD: '/(auth)/forgot-password',
  TERMS: '/(auth)/terms',
  PRIVACY: '/(auth)/privacy',
  CONSENT: '/(auth)/consent',

  // Authenticated Tabs
  HOME: '/(tabs)',
  DIARY: '/(tabs)/diary',
  PRACTICES: '/(tabs)/practices',
  CONTENT: '/(tabs)/content',
  PROFILE: '/(tabs)/profile',

  // Features
  CHAT: '/chat',
  BREATHING: '/practices/breathing',
  MEDITATION_PLAYER: (id: string) => `/practices/player/${id}` as const,
  ARTICLE_DETAIL: (id: string) => `/content/${id}` as const,
  MOOD_NEW: '/mood/new',
  MOOD_EDIT: (id: string) => `/mood/edit/${id}` as const,
  SUPPORT: '/support',
  ADMIN: '/admin',
} as const;
