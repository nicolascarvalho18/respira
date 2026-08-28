import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { storage } from '../storage/asyncStorage';

export interface NotificationScheduleConfig {
  dailyReminderEnabled: boolean;
  reminderTime: string; // "20:30"
  selectedDays: number[]; // [1, 2, 3, 4, 5, 6, 0] (1=Seg, 0=Dom)
  microPausesEnabled: boolean;
  microPausesIntervalHours: number; // 2, 3, 4, etc.
  timezone?: string;
  updatedAt?: string;
}

const NOTIFICATION_CONFIG_KEY = 'respira_notification_config';

export const GENTLE_NOTIFICATION_MESSAGES = [
  'Hora de respirar. Que tal fazer uma pausa breve e perceber como foi seu dia?',
  'Um momento para você. Sinta seus ombros, relaxe a respiração e desacelere.',
  'Como você está se sentindo agora? Um minuto de atenção plena pode transformar seu ritmo.',
  'Pausa gentil: afaste os olhos das telas por um instante e respire com calma.',
];

class NotificationService {
  /**
   * Verifica o status atual da permissão sem solicitar popup automático
   */
  async getPermissionStatus(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        return Notification.permission as 'granted' | 'denied' | 'default';
      }
      return 'unsupported';
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') return 'granted';
      if (status === 'denied') return 'denied';
      return 'default';
    } catch (_err) {
      return 'default';
    }
  }

  /**
   * Solicita permissão de forma contextual apenas sob ação do usuário
   */
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

  /**
   * Carrega a configuração do usuário
   */
  async getSavedConfig(userId?: string): Promise<NotificationScheduleConfig> {
    const key = userId ? `${NOTIFICATION_CONFIG_KEY}_${userId}` : NOTIFICATION_CONFIG_KEY;
    const saved = await storage.getItem<NotificationScheduleConfig>(key);
    if (saved) return saved;

    // Fallback padrão
    return {
      dailyReminderEnabled: true,
      reminderTime: '18:00',
      selectedDays: [1, 2, 3, 4, 5, 6, 0],
      microPausesEnabled: false,
      microPausesIntervalHours: 4,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Salva a configuração e atualiza o agendamento real
   */
  async saveConfig(config: NotificationScheduleConfig, userId?: string): Promise<void> {
    const payload: NotificationScheduleConfig = {
      ...config,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
      updatedAt: new Date().toISOString(),
    };

    const key = userId ? `${NOTIFICATION_CONFIG_KEY}_${userId}` : NOTIFICATION_CONFIG_KEY;
    await storage.setItem(key, payload);
    await storage.setItem(NOTIFICATION_CONFIG_KEY, payload);

    // Agendamento real no dispositivo / navegador
    if (payload.dailyReminderEnabled) {
      const hasPermission = await this.requestPermissionContextually();
      if (hasPermission) {
        if (Platform.OS !== 'web') {
          try {
            await Notifications.cancelAllScheduledNotificationsAsync();
            const [hoursStr, minsStr] = payload.reminderTime.split(':');
            const hours = parseInt(hoursStr, 10) || 18;
            const minutes = parseInt(minsStr, 10) || 0;

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
            console.warn('[NotificationService] Erro ao agendar notificação:', err);
          }
        }
      }
    } else {
      if (Platform.OS !== 'web') {
        try {
          await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (_err) {
          // Ignorado
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
