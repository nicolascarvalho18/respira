import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// 1. Standard Frontend Environment Variables com acesso estático direto para inlining do Metro/Vite/Expo
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_URL.startsWith('http') &&
    SUPABASE_PUBLISHABLE_KEY &&
    SUPABASE_PUBLISHABLE_KEY.length > 10
);

// Fallback dummy URL and anon key for safe client initialization during tests/mock runs
const validUrl = isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder-project.supabase.co';
const validKey = isSupabaseConfigured ? SUPABASE_PUBLISHABLE_KEY : 'placeholder-publishable-key-respira-client';

export const supabase: SupabaseClient = createClient(validUrl, validKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
