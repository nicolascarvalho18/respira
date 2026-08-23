import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Resolve environment variables without leaking secrets or crashing if unconfigured
const getEnvVar = (name: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[name]) return process.env[name] as string;
    if (process.env[`EXPO_PUBLIC_${name}`]) return process.env[`EXPO_PUBLIC_${name}`] as string;
    if (process.env[`VITE_${name}`]) return process.env[`VITE_${name}`] as string;
  }
  return '';
};

export const SUPABASE_URL =
  getEnvVar('SUPABASE_URL') ||
  getEnvVar('VITE_SUPABASE_URL') ||
  getEnvVar('EXPO_PUBLIC_SUPABASE_URL') ||
  '';

export const SUPABASE_ANON_KEY =
  getEnvVar('SUPABASE_PUBLISHABLE_KEY') ||
  getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') ||
  getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnvVar('EXPO_PUBLIC_SUPABASE_KEY') ||
  '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_URL.startsWith('http') &&
    SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY.length > 10
);

// Fallback dummy URL and anon key for safe client initialization during tests/mock runs
const validUrl = isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder-project.supabase.co';
const validKey = isSupabaseConfigured ? SUPABASE_ANON_KEY : 'placeholder-anon-key-respira-client';

export const supabase: SupabaseClient = createClient(validUrl, validKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
