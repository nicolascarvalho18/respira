import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../../utils/logger';

export const storage = {
  async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return defaultValue ?? null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Error reading key ${key} from AsyncStorage:`, error);
      return defaultValue ?? null;
    }
  },

  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Error writing key ${key} to AsyncStorage:`, error);
      return false;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      logger.error(`Error removing key ${key} from AsyncStorage:`, error);
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      logger.error('Error clearing AsyncStorage:', error);
      return false;
    }
  },
};
