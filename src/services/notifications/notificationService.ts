import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { storage } from '../storage/asyncStorage';
import { notificationSchedulerService } from '../../server/services/notificationSchedulerService';
import { logger } from '../../utils/logger';

export interface NotificationScheduleConfig {
  dailyReminderEnabled: boolean;
  reminderTime: string; // "18:00"
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

/**
 * Converte base64 VAPID em Uint8Array para pushManager
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

class NotificationService {
  private serviceWorkerRegistration: any = null;

  /**
   * Registra o Service Worker no ambiente Web
   */
  async registerServiceWorker(): Promise<any> {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      if (this.serviceWorkerRegistration) {
        return this.serviceWorkerRegistration;
      }

      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.serviceWorkerRegistration = reg;
      logger.info('Service Worker registered successfully with scope:', reg.scope);
      return reg;
    } catch (err) {
      logger.warn('Service Worker registration failed, trying fallback /service-worker.js:', err);
      try {
        const fallbackReg = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
        this.serviceWorkerRegistration = fallbackReg;
        return fallbackReg;
      } catch (fallbackErr) {
        logger.error('Fallback Service Worker registration failed:', fallbackErr);
        return null;
      }
    }
  }

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
   * Solicita permissão de forma contextual apenas sob ação clara do usuário
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
   * Inscreve o navegador no Web Push com a chave VAPID
   */
  async subscribeToWebPush(userId: string): Promise<boolean> {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await this.registerServiceWorker();
      if (!registration) return false;

      // Aguardar service worker ativo
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(
          notificationSchedulerService.vapidPublicKey
        );
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      if (subscription) {
        const subJson = subscription.toJSON();
        const p256dh = subJson.keys?.p256dh || '';
        const authKey = subJson.keys?.auth || '';
        const deviceId = (typeof localStorage !== 'undefined' && localStorage.getItem('respira_device_id')) || 'web-browser';

        await notificationSchedulerService.saveSubscription(userId, {
          deviceId,
          endpoint: subscription.endpoint,
          p256dh,
          authKey,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser',
        });

        logger.info('Web Push subscription registered successfully for user', userId);
        return true;
      }
      return false;
    } catch (err) {
      logger.warn('Web Push subscription failed or unsupported by browser:', err);
      return false;
    }
  }

  /**
   * Carrega a configuração de lembretes do usuário
   */
  async getSavedConfig(userId?: string): Promise<NotificationScheduleConfig> {
    const key = userId ? `${NOTIFICATION_CONFIG_KEY}_${userId}` : NOTIFICATION_CONFIG_KEY;
    const saved = await storage.getItem<NotificationScheduleConfig>(key);
    if (saved) return saved;

    // Fallback padrão seguro
    return {
      dailyReminderEnabled: false,
      reminderTime: '18:00',
      selectedDays: [1, 2, 3, 4, 5, 6, 0],
      microPausesEnabled: false,
      microPausesIntervalHours: 4,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Salva a configuração e sincroniza agendamentos locais e no servidor
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

    if (payload.dailyReminderEnabled) {
      const hasPermission = await this.requestPermissionContextually();
      if (!hasPermission) {
        // Se a permissão foi negada, não salvar como ativado
        payload.dailyReminderEnabled = false;
        await storage.setItem(key, payload);
        throw new Error('Permissão de notificação negada pelo navegador.');
      }

      if (userId) {
        // Registrar Web Push no servidor para entrega em segundo plano / com app fechado
        await this.subscribeToWebPush(userId);
      }

      // Agendamento no Mobile / Expo
      if (Platform.OS !== 'web') {
        try {
          await Notifications.cancelAllScheduledNotificationsAsync();
          const [hoursStr, minsStr] = payload.reminderTime.split(':');
          const hours = parseInt(hoursStr, 10) || 18;
          const minutes = parseInt(minsStr, 10) || 0;

          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Respira • Momento de pausa',
              body: this.getRandomGentleMessage(),
              sound: true,
            },
            trigger: {
              hour: hours,
              minute: minutes,
              repeats: true,
            } as any,
          });
        } catch (err) {
          logger.warn('[NotificationService] Erro ao agendar notificação nativa:', err);
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

  /**
   * Envia uma notificação imediata de teste
   */
  async sendTestNotification(title?: string, body?: string): Promise<boolean> {
    const perm = await this.getPermissionStatus();
    if (perm !== 'granted') return false;

    const notifTitle = title || 'Respira • Teste de Lembrete';
    const notifBody = body || this.getRandomGentleMessage();

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        new Notification(notifTitle, {
          body: notifBody,
          icon: '/favicon.ico',
        });
        return true;
      }
      return false;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notifTitle,
          body: notifBody,
          sound: true,
        },
        trigger: null, // Imediato
      });
      return true;
    } catch (_err) {
      return false;
    }
  }

  getRandomGentleMessage(): string {
    const idx = Math.floor(Math.random() * GENTLE_NOTIFICATION_MESSAGES.length);
    return GENTLE_NOTIFICATION_MESSAGES[idx];
  }
}

export const notificationService = new NotificationService();
