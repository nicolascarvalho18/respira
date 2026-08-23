// Domain types for Respira - Digital Health Platform

export type MoodValue = 1 | 2 | 3 | 4 | 5;

export interface MoodRecord {
  id: string;
  userId: string;
  mood: MoodValue; // 1: Muito mal, 2: Mal, 3: Neutro, 4: Bem, 5: Muito bem
  anxietyLevel: number; // 0 a 10
  emotions: string[]; // e.g. ["Preocupado", "Inquieto", "Cansado", "Esperançoso", "Grato"]
  activities: string[]; // e.g. ["Trabalho", "Estudos", "Exercício", "Descanso", "Família"]
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
  | 'relaxation'
  | 'mindfulness'
  | 'meditation'
  | 'quick_routine';

export interface Practice {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: PracticeCategory;
  durationMinutes: number;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  icon: string;
  audioUrl?: string;
  isFavorite?: boolean;
  completedCount?: number;
  instructions?: string[];
  breathingConfig?: {
    inhaleSeconds: number;
    holdSeconds: number;
    exhaleSeconds: number;
    holdAfterExhaleSeconds?: number;
    cycles: number;
  };
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

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  createdAt: string;
  consents: {
    termsAccepted: boolean;
    privacyAccepted: boolean;
    personalizationAccepted: boolean;
    analyticsAccepted: boolean;
    chatRetentionAccepted?: boolean;
    acceptedAt: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    reducedMotion: boolean;
    dailyReminder: boolean;
    reminderTime: string; // "20:00"
    vibrationEnabled: boolean;
    soundEnabled: boolean;
    countryHelpline: string; // "BR"
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
