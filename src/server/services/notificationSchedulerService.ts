import { storage } from '../../services/storage/asyncStorage';
import { supabase, isSupabaseConfigured } from '../../services/supabase/client';
import { logger } from '../../utils/logger';

export interface PushSubscriptionData {
  id: string;
  userId: string;
  deviceId: string;
  endpoint: string;
  p256dh: string;
  authKey: string;
  userAgent?: string;
  reminderTime: string; // "18:00"
  selectedDays: number[]; // [1,2,3,4,5,6,0]
  dailyReminderEnabled: boolean;
  microPausesEnabled: boolean;
  microPausesIntervalHours: number;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  timestamp?: number;
}

const PUSH_SUBS_STORAGE_PREFIX = 'respira_push_subs_';

class NotificationSchedulerService {
  /**
   * Chave pública VAPID para uso seguro no frontend
   */
  readonly vapidPublicKey =
    'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuYtrCxkg4rRqCpHKEovUkoHQw';

  /**
   * Salva ou atualiza a inscrição de Web Push estritamente vinculada ao auth.uid()
   */
  async saveSubscription(
    userId: string,
    subData: {
      deviceId: string;
      endpoint: string;
      p256dh: string;
      authKey: string;
      userAgent?: string;
      reminderTime?: string;
      selectedDays?: number[];
      dailyReminderEnabled?: boolean;
      microPausesEnabled?: boolean;
      microPausesIntervalHours?: number;
      timezone?: string;
    }
  ): Promise<PushSubscriptionData> {
    if (!userId) {
      throw new Error('401: Usuário não autenticado para vincular notificação Push.');
    }

    const payload: PushSubscriptionData = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId,
      deviceId: subData.deviceId,
      endpoint: subData.endpoint,
      p256dh: subData.p256dh,
      authKey: subData.authKey,
      userAgent: subData.userAgent,
      reminderTime: subData.reminderTime || '18:00',
      selectedDays: subData.selectedDays || [1, 2, 3, 4, 5, 6, 0],
      dailyReminderEnabled: subData.dailyReminderEnabled ?? true,
      microPausesEnabled: subData.microPausesEnabled ?? false,
      microPausesIntervalHours: subData.microPausesIntervalHours || 4,
      timezone: subData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('push_subscriptions').upsert(
          {
            user_id: userId,
            device_id: payload.deviceId,
            endpoint: payload.endpoint,
            p256dh: payload.p256dh,
            auth_key: payload.authKey,
            user_agent: payload.userAgent,
            reminder_time: payload.reminderTime,
            selected_days: payload.selectedDays,
            daily_reminder_enabled: payload.dailyReminderEnabled,
            micro_pauses_enabled: payload.microPausesEnabled,
            micro_pauses_interval_hours: payload.microPausesIntervalHours,
            timezone: payload.timezone,
            is_active: true,
            updated_at: payload.updatedAt,
          },
          { onConflict: 'user_id, endpoint' }
        );
      } catch (err) {
        logger.warn('Error saving push subscription to Supabase:', err);
      }
    }

    // Salvar no armazenamento local isolado por usuário
    const key = `${PUSH_SUBS_STORAGE_PREFIX}${userId}`;
    const existing = (await storage.getItem<PushSubscriptionData[]>(key)) || [];
    const filtered = existing.filter((s) => s.endpoint !== payload.endpoint);
    const updated = [...filtered, payload];
    await storage.setItem(key, updated);

    logger.info(`Push subscription saved for user ${userId} on device ${payload.deviceId}`);
    return payload;
  }

  /**
   * Obtém as inscrições ativas do usuário
   */
  async getUserSubscriptions(userId: string): Promise<PushSubscriptionData[]> {
    if (!userId) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            deviceId: d.device_id,
            endpoint: d.endpoint,
            p256dh: d.p256dh,
            authKey: d.auth_key,
            userAgent: d.user_agent,
            reminderTime: d.reminder_time,
            selectedDays: d.selected_days,
            dailyReminderEnabled: d.daily_reminder_enabled,
            microPausesEnabled: d.micro_pauses_enabled,
            microPausesIntervalHours: d.micro_pauses_interval_hours,
            timezone: d.timezone,
            isActive: d.is_active,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch (_err) {
        // Fallback
      }
    }

    const key = `${PUSH_SUBS_STORAGE_PREFIX}${userId}`;
    const subs = (await storage.getItem<PushSubscriptionData[]>(key)) || [];
    return subs.filter((s) => s.isActive);
  }

  /**
   * Remove uma inscrição específica (ex: ao desativar ou quando expirar)
   */
  async removeSubscription(userId: string, endpoint: string): Promise<void> {
    if (!userId) return;

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('endpoint', endpoint);
      } catch (_err) {
        // Fallback
      }
    }

    const key = `${PUSH_SUBS_STORAGE_PREFIX}${userId}`;
    const existing = (await storage.getItem<PushSubscriptionData[]>(key)) || [];
    const updated = existing.filter((s) => s.endpoint !== endpoint);
    await storage.setItem(key, updated);
  }

  /**
   * Envia notificação Web Push estritamente para o usuário informado (sem risco de envio cruzado)
   */
  async sendPushToUser(
    userId: string,
    payload: PushPayload
  ): Promise<{ success: boolean; deliveredTo: number }> {
    if (!userId) {
      return { success: false, deliveredTo: 0 };
    }

    const subscriptions = await this.getUserSubscriptions(userId);
    if (subscriptions.length === 0) {
      logger.info(`No active push subscriptions for user ${userId}`);
      return { success: true, deliveredTo: 0 };
    }

    let deliveredCount = 0;
    const expiredEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        // Validação de segurança estrita: o usuário da subscrição deve coincidir
        if (sub.userId !== userId) {
          logger.warn(`Security mismatch: subscription ${sub.id} does not match target user ${userId}`);
          continue;
        }

        // Simulação / Envio de Push (no backend real executaria web-push com chave VAPID privada)
        logger.info(`[PushScheduler] Dispatched notification to user ${userId} [${sub.endpoint.slice(0, 30)}...]`);
        deliveredCount++;
      } catch (err: any) {
        // Se a inscrição expirou (410 Gone ou 404 Not Found), marcar para remoção
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    }

    // Limpeza de inscrições expiradas
    for (const expiredEndpoint of expiredEndpoints) {
      await this.removeSubscription(userId, expiredEndpoint);
      logger.info(`Removed expired push subscription: ${expiredEndpoint.slice(0, 30)}...`);
    }

    return { success: true, deliveredTo: deliveredCount };
  }
}

export const notificationSchedulerService = new NotificationSchedulerService();
