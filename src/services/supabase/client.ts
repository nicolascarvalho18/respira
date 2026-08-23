import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Helper to resolve client-side environment variables safely
const getClientEnvVar = (name: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[name]) return process.env[name] as string;
    if (process.env[`VITE_${name}`]) return process.env[`VITE_${name}`] as string;
    if (process.env[`EXPO_PUBLIC_${name}`]) return process.env[`EXPO_PUBLIC_${name}`] as string;
  }
  return '';
};

// 1. Standard Frontend Environment Variables
export const SUPABASE_URL =
  getClientEnvVar('SUPABASE_URL') ||
  getClientEnvVar('VITE_SUPABASE_URL') ||
  getClientEnvVar('EXPO_PUBLIC_SUPABASE_URL') ||
  '';

export const SUPABASE_PUBLISHABLE_KEY =
  getClientEnvVar('SUPABASE_PUBLISHABLE_KEY') ||
  getClientEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') ||
  getClientEnvVar('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
  getClientEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY') || // Backwards compatibility fallback
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
