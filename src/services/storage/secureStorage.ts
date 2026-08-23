import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { logger } from '../../utils/logger';

const memoryStore: Record<string, string> = {};

export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(`secure_${key}`, value);
        } else {
          memoryStore[key] = value;
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      logger.error(`Error saving secure key ${key}:`, error);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(`secure_${key}`);
        }
        return memoryStore[key] ?? null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.error(`Error getting secure key ${key}:`, error);
      return null;
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(`secure_${key}`);
        }
        delete memoryStore[key];
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.error(`Error deleting secure key ${key}:`, error);
    }
  },
};
