// Domain types for Respira - Digital Health Platform

export type MoodValue = 1 | 2 | 3 | 4 | 5;

export interface PlannedExercise {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  description: string;
  scheduledTime?: string;
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
  completedAt?: string;
}

export interface MoodRecord {
  id: string;
  userId: string;
  mood: MoodValue; // 1: Muito mal, 2: Mal, 3: Neutro, 4: Bem, 5: Muito bem
  anxietyLevel: number; // 0 a 10
  emotions: string[]; // e.g. ["Preocupado", "Inquieto", "Cansado", "Esperançoso", "Grato"]
  activities: string[]; // e.g. ["Trabalho", "Estudos", "Exercício", "Descanso", "Família"]
  plannedExercises?: PlannedExercise[];
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt?: string;
}

export interface MoodStats {
  averageMood: number;
  averageAnxiety: number;
  totalCheckins: number;
  topEmotions: { emotion: string; count: number }[];
  weeklyData: { day: string; date: string; mood: number; anxiety: number }[];
}

export type PracticeCategory =
  | 'breathing'
  | 'guided_meditation'
  | 'body_movement'
  | 'relaxation'
  | 'sleep'
  | 'mindfulness_focus'
  | 'quick_pauses'
  | 'morning_routine'
  | 'bedtime_prep'
  // Compatibilidade legada
  | 'mindfulness'
  | 'creative'
  | 'soundscapes'
  | 'meditation'
  | 'quick_routine';

export type PracticeObjective =
  | 'relax' // Relaxar
  | 'sleep_better' // Dormir melhor
  | 'regain_focus' // Recuperar o foco
  | 'relieve_tension' // Aliviar a tensão
  | 'take_a_pause'; // Fazer uma pausa

export type PracticeFormat = 'video' | 'audio' | 'interactive';

export interface PracticeInstructor {
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface PracticeCaption {
  start: number; // segundos
  end: number; // segundos
  text: string;
}

export interface PracticeStage {
  step: number;
  title: string;
  instruction: string;
  durationSeconds?: number;
}

export interface Practice {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: PracticeCategory;
  objective?: PracticeObjective;
  format?: PracticeFormat;
  durationMinutes: number;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  effortLevel?: 'Suave' | 'Leve' | 'Moderado';
  activityType?: 'physical' | 'mental' | 'breathing' | 'sound';
  icon?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  instructor?: PracticeInstructor;
  captions?: PracticeCaption[];
  transcript?: string;
  guidelinesBeforeStarting?: string[];
  stages?: PracticeStage[];
  benefits?: string[];
  careAndLimitations?: string[];
  relatedPracticeIds?: string[];
  isFavorite?: boolean;
  completedCount?: number;
  isFeatured?: boolean;
  order?: number;
  status?: 'published' | 'draft';
  instructions?: string[];
  breathingConfig?: {
    inhaleSeconds: number;
    holdSeconds: number;
    exhaleSeconds: number;
    holdAfterExhaleSeconds?: number;
    cycles: number;
  };
}

export interface UserPracticeProgress {
  userId: string;
  practiceId: string;
  progressPercent: number; // 0 - 100
  playbackPositionSeconds: number;
  status: 'started' | 'completed';
  completedCount: number;
  lastPlayedAt: string;
  lastCompletedAt?: string;
  postFeelingsHistory?: {
    date: string;
    feeling: 'calmer' | 'same' | 'uncomfortable';
    notes?: string;
  }[];
  isDownloadedOffline?: boolean;
}

export interface ArticleSection {
  title?: string;
  body: string;
  callout?: string;
  list?: string[];
}

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content?: string;
  sections?: ArticleSection[];
  categoryId?: string;
  category: string;
  categoryName?: string;
  readingTimeMinutes: number;
  readTimeMinutes?: number;
  keywords?: string[];
  tags?: string[];
  relatedArticleIds?: string[];
  relatedPracticeId?: string;
  relatedPracticeIds?: string[];
  reviewedBy?: string;
  updatedAt: string;
  publishedAt?: string;
  author?: string;
  isFavorite?: boolean;
  readProgress?: number; // 0 to 100
  status: 'draft' | 'published' | 'archived';
}

export type Role = 'user' | 'admin';

export interface UserSession {
  id: string;
  userId: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'web';
  deviceName?: string;
  browser: string;
  os: string;
  lastActiveAt: string;
  ipAddressMasked?: string;
  isCurrent: boolean;
}

export type UserPreferences = User['preferences'] & {
  soundscapeVolume?: number;
  voiceVolume?: number;
  microPausesEnabled?: boolean;
};

export interface NotificationPreferences {
  dailyReminder: boolean;
  reminderTime: string; // "20:00"
  reminderDays: number[]; // [1, 2, 3, 4, 5, 6, 0] (0 = Domingo, 1 = Segunda, etc.)
  newContentAlerts: boolean;
  favoritePracticesAlerts: boolean;
  securityAlerts: boolean; // Sempre true (não desativável)
  emailChannel: boolean;
  pushChannel: boolean;
}

export interface AccessibilityPreferences {
  reducedMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
  reduceTransparency: boolean;
}

export interface ConsentItem {
  type: 'terms' | 'privacy' | 'personalization' | 'ai_chat_retention' | 'analytics';
  title: string;
  description: string;
  version: string;
  isAccepted: boolean;
  isRequired: boolean;
  acceptedAt?: string;
  revokedAt?: string;
  documentUrl: string;
}

export interface SecurityEvent {
  id: string;
  eventType: 'login' | 'logout' | 'password_change' | 'email_change_request' | 'session_revoked' | 'data_exported';
  description: string;
  timestamp: string;
  ipAddressMasked: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  birthDate?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastPasswordChangeAt?: string;
  consents?: {
    termsAccepted: boolean;
    privacyAccepted: boolean;
    personalizationAccepted: boolean;
    analyticsAccepted: boolean;
    chatRetentionAccepted?: boolean;
    acceptedAt: string;
  };
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    reducedMotion: boolean;
    largeText?: boolean;
    highContrast?: boolean;
    reduceTransparency?: boolean;
    dailyReminder: boolean;
    reminderTime: string; // "20:00"
    vibrationEnabled: boolean;
    soundEnabled: boolean;
    countryHelpline: string; // "BR"
    notifications?: NotificationPreferences;
    soundscapeVolume?: number;
    voiceVolume?: number;
    microPausesEnabled?: boolean;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isTemporary?: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId?: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  suggestions?: string[];
  isEmergencyAlert?: boolean;
  recommendedPracticeId?: string;
  recommendedArticleId?: string;
  feedback?: 'helpful' | 'unhelpful';
}

export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  target: string;
  timestamp: string;
  ipAddressMasked: string;
}

export interface SupportContact {
  id: string;
  name: string;
  number: string;
  description: string;
  isFree: boolean;
  availableHours: string;
  isCrisisEmergency: boolean;
}

export interface HelplineInfo {
  countryCode: string;
  countryName: string;
  primaryService: {
    name: string;
    number: string;
    description: string;
    isFree: boolean;
    availableHours: string;
  };
  secondaryServices: {
    name: string;
    number: string;
    description: string;
  }[];
}
