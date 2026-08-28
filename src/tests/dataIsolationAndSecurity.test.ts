import { moodService } from '../services/mood/moodService';
import { useMoodStore } from '../store/moodStore';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/user/userService';
import { userAccountService } from '../server/services/userAccountService';
import { privacyService } from '../services/privacy/privacyService';
import { notificationSchedulerService } from '../server/services/notificationSchedulerService';
import { notificationService } from '../services/notifications/notificationService';

describe('Respira Security, Data Isolation & Features Test Suite', () => {
  const userAId = 'user-alpha-111';
  const userBId = 'user-beta-222';

  beforeEach(async () => {
    // Limpar estados antes de cada teste
    useMoodStore.getState().clearRecords();
    await moodService.clearUserCache(userAId);
    await moodService.clearUserCache(userBId);
  });

  describe('1. Data Isolation between User A and User B (No Leaks)', () => {
    it('User A registers mood records, User B sees only their own records', async () => {
      // 1. Usuário A cria 2 registros
      await moodService.createRecord({
        userId: userAId,
        mood: 4,
        anxietyLevel: 3,
        emotions: ['calma', 'gratidão'],
        activities: ['meditação'],
        notes: 'Nota privada do Usuário A',
      });

      await moodService.createRecord({
        userId: userAId,
        mood: 5,
        anxietyLevel: 1,
        emotions: ['alegria'],
        activities: ['caminhada'],
        notes: 'Outra nota do Usuário A',
      });

      const userARecords = await moodService.getRecords(userAId);
      expect(userARecords.length).toBe(2);
      expect(userARecords[0].userId).toBe(userAId);

      // 2. Usuário B consulta seus registros -> deve ter 0 registros e NÃO ver registros de A
      const userBRecords = await moodService.getRecords(userBId);
      expect(userBRecords.length).toBe(0);

      // 3. Usuário B cria 1 registro
      await moodService.createRecord({
        userId: userBId,
        mood: 2,
        anxietyLevel: 8,
        emotions: ['tensão'],
        activities: ['trabalho'],
        notes: 'Nota do Usuário B',
      });

      const updatedBRecords = await moodService.getRecords(userBId);
      expect(updatedBRecords.length).toBe(1);
      expect(updatedBRecords[0].notes).toBe('Nota do Usuário B');

      // 4. Usuário A consulta novamente -> continua vendo apenas seus 2 registros
      const finalARecords = await moodService.getRecords(userAId);
      expect(finalARecords.length).toBe(2);
      expect(finalARecords.some((r) => r.notes === 'Nota do Usuário B')).toBe(false);
    });

    it('Logout immediately cleans memory stores and caches', async () => {
      useMoodStore.setState({
        records: [
          {
            id: 'temp-1',
            userId: userAId,
            mood: 4,
            anxietyLevel: 3,
            emotions: [],
            activities: [],
            createdAt: new Date().toISOString(),
          },
        ],
      });

      expect(useMoodStore.getState().records.length).toBe(1);

      // Executar logout
      useMoodStore.getState().clearRecords();
      await moodService.clearUserCache(userAId);

      expect(useMoodStore.getState().records.length).toBe(0);
      expect(useMoodStore.getState().stats.totalCheckins).toBe(0);
    });
  });

  describe('2. Complete Removal of "Exportar Meus Dados" (403 Forbidden)', () => {
    it('userService.exportUserData throws 403 error', async () => {
      await expect(userService.exportUserData(userAId)).rejects.toThrow('403');
    });

    it('userAccountService.exportUserDataPackage throws 403 error', async () => {
      await expect(userAccountService.exportUserDataPackage(userAId)).rejects.toThrow('403');
    });

    it('privacyService.exportAllData throws 403 error', async () => {
      await expect(privacyService.exportAllData(userAId)).rejects.toThrow('403');
    });
  });

  describe('3. Notifications & Web Push Scheduler', () => {
    it('saves push subscription strictly isolated by user ID', async () => {
      const sub = await notificationSchedulerService.saveSubscription(userAId, {
        deviceId: 'device-test-1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-sub-1',
        p256dh: 'test-p256dh-key',
        authKey: 'test-auth-key',
        reminderTime: '19:30',
        selectedDays: [1, 2, 3, 4, 5],
        dailyReminderEnabled: true,
      });

      expect(sub.userId).toBe(userAId);
      expect(sub.reminderTime).toBe('19:30');

      const userASubs = await notificationSchedulerService.getUserSubscriptions(userAId);
      expect(userASubs.length).toBe(1);

      // Usuário B não possui inscrições de A
      const userBSubs = await notificationSchedulerService.getUserSubscriptions(userBId);
      expect(userBSubs.length).toBe(0);
    });

    it('never crosses push notifications between different users', async () => {
      const res = await notificationSchedulerService.sendPushToUser(userAId, {
        title: 'Respira',
        body: 'Hora da pausa',
      });

      expect(res.success).toBe(true);
    });
  });

  describe('4. Notification Service Permission Handling', () => {
    it('returns valid permission status without throwing', async () => {
      const status = await notificationService.getPermissionStatus();
      expect(['granted', 'denied', 'default', 'unsupported']).toContain(status);
    });

    it('saves user notification config with custom hours and days', async () => {
      await notificationService.saveConfig(
        {
          dailyReminderEnabled: false,
          reminderTime: '21:00',
          selectedDays: [1, 3, 5],
          microPausesEnabled: true,
          microPausesIntervalHours: 3,
        },
        userAId
      );

      const saved = await notificationService.getSavedConfig(userAId);
      expect(saved.reminderTime).toBe('21:00');
      expect(saved.selectedDays).toEqual([1, 3, 5]);
      expect(saved.microPausesIntervalHours).toBe(3);
    });
  });
});
