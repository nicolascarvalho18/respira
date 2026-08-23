// Domain types for Respira

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

export type PracticeCategory = 'breathing' | 'relaxation' | 'mindfulness' | 'meditation' | 'quick_routine';

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

export type ArticleCategory = 'basics' | 'regulation' | 'sleep' | 'myths' | 'lifestyle';

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string; // Markdown / paragraphs
  category: ArticleCategory;
  categoryName: string;
  readTimeMinutes: number;
  publishedAt: string;
  author: string;
  isFavorite?: boolean;
  readProgress?: number; // 0 to 100
  relatedPracticeIds?: string[];
  tags: string[];
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
    acceptedAt: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    reducedMotion: boolean;
    dailyReminder: boolean;
    reminderTime: string; // "20:00"
    vibrationEnabled: boolean;
    soundEnabled: boolean;
    countryHelpline: string; // "BR" | "US" | "PT" | "OTHER"
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  suggestions?: string[];
  isEmergencyAlert?: boolean;
  recommendedPracticeId?: string;
  recommendedArticleId?: string;
}

export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  target: string;
  timestamp: string;
  ipAddressMasked: string;
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
