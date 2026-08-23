import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { storage } from '../storage/asyncStorage';

export interface NotificationScheduleConfig {
  dailyReminderEnabled: boolean;
  reminderTime: string; // "20:30"
  selectedDays: number[]; // [1, 2, 3, 4, 5, 6, 0]
  microPausesEnabled: boolean;
  microPausesIntervalHours: number; // 2, 4, etc.
}

const NOTIFICATION_CONFIG_KEY = 'respira_notification_config';

export const GENTLE_NOTIFICATION_MESSAGES = [
  'Hora de respirar. Que tal fazer uma pausa breve e perceber como foi seu dia?',
  'Um momento para você. Sinta seus ombros, relaxe a respiração e desacelere.',
  'Como você está se sentindo agora? Um minuto de atenção plena pode transformar seu ritmo.',
  'Pausa gentil: afaste os olhos das telas por um instante e respire com calma.',
];

class NotificationService {
  async requestPermissionContextually(): Promise<boolean> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          const perm = await Notification.requestPermission();
          return perm === 'granted';
        } catch (_err) {
          return false;
        }
      }
      return true;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (_err) {
      return false;
    }
  }

  async getSavedConfig(): Promise<NotificationScheduleConfig> {
    const saved = await storage.getItem<NotificationScheduleConfig>(NOTIFICATION_CONFIG_KEY);
    if (saved) return saved;

    return {
      dailyReminderEnabled: true,
      reminderTime: '20:30',
      selectedDays: [1, 2, 3, 4, 5, 6, 0],
      microPausesEnabled: false,
      microPausesIntervalHours: 4,
    };
  }

  async saveConfig(config: NotificationScheduleConfig): Promise<void> {
    await storage.setItem(NOTIFICATION_CONFIG_KEY, config);

    if (config.dailyReminderEnabled) {
      const hasPermission = await this.requestPermissionContextually();
      if (hasPermission && Platform.OS !== 'web') {
        try {
          await Notifications.cancelAllScheduledNotificationsAsync();
          const [hoursStr, minsStr] = config.reminderTime.split(':');
          const hours = parseInt(hoursStr, 10) || 20;
          const minutes = parseInt(minsStr, 10) || 30;

          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Respira • Momento de pausa',
              body: GENTLE_NOTIFICATION_MESSAGES[0],
              sound: true,
            },
            trigger: {
              hour: hours,
              minute: minutes,
              repeats: true,
            } as any,
          });
        } catch (err) {
          console.warn('[NotificationService] Schedule error:', err);
        }
      }
    } else {
      if (Platform.OS !== 'web') {
        try {
          await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (_err) {
          // Ignored
        }
      }
    }
  }

  getRandomGentleMessage(): string {
    const idx = Math.floor(Math.random() * GENTLE_NOTIFICATION_MESSAGES.length);
    return GENTLE_NOTIFICATION_MESSAGES[idx];
  }
}

export const notificationService = new NotificationService();
