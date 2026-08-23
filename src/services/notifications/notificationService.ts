import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { logger } from '../../utils/logger';

// Configuração de comportamento padrão de notificação
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      logger.warn('Error requesting notification permissions:', error);
      return false;
    }
  }

  async scheduleDailyReminder(hour: number = 20, minute: number = 0): Promise<string | null> {
    if (Platform.OS === 'web') {
      logger.info(`[Web Simulator] Daily reminder scheduled for ${hour}:${minute}`);
      return 'web-reminder-id';
    }

    try {
      // Cancela notificações anteriores de lembrete
      await Notifications.cancelAllScheduledNotificationsAsync();

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Momento Respira 🌿',
          body: 'Como foi o seu dia? Reserve 2 minutos para fazer uma respiração suave e registrar como você está se sentindo.',
          data: { route: '/mood/new' },
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });

      logger.info(`Scheduled daily reminder for ${hour}:${minute}, ID: ${id}`);
      return id;
    } catch (error) {
      logger.error('Error scheduling reminder:', error);
      return null;
    }
  }

  async cancelReminders(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      logger.info('All scheduled reminders cancelled');
    } catch (error) {
      logger.error('Error cancelling notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();
