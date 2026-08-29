import { moodService } from '../services/mood/moodService';
import { useMoodStore } from '../store/moodStore';
import { storage } from '../services/storage/asyncStorage';

describe('Mood Registration & Supabase Persistence Tests', () => {
  const user1Id = 'usr-test-alice-101';
  const user2Id = 'usr-test-bob-202';

  beforeEach(async () => {
    await moodService.clearUserCache(user1Id);
    await moodService.clearUserCache(user2Id);
    useMoodStore.getState().clearRecords();
  });

  describe('1. Registration of Mood Moment', () => {
    it('creates and persists mood record with mood, anxiety, emotions, activities, notes, and user_id', async () => {
      const created = await moodService.createRecord({
        userId: user1Id,
        mood: 4,
        anxietyLevel: 3,
        emotions: ['Calmo', 'Focado'],
        activities: ['Trabalho', 'Caminhada'],
        notes: 'Me senti produtivo e tranquilo hoje.',
      });

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.userId).toBe(user1Id);
      expect(created.mood).toBe(4);
      expect(created.anxietyLevel).toBe(3);
      expect(created.emotions).toEqual(['Calmo', 'Focado']);
      expect(created.activities).toEqual(['Trabalho', 'Caminhada']);
      expect(created.notes).toBe('Me senti produtivo e tranquilo hoje.');
      expect(created.createdAt).toBeDefined();

      // Verificar persistência
      const records = await moodService.getRecords(user1Id);
      expect(records.length).toBe(1);
      expect(records[0].id).toBe(created.id);
    });

    it('immediately updates store records, count from 0 to 1, and calculates real averages', async () => {
      const store = useMoodStore.getState();
      expect(store.records.length).toBe(0);
      expect(store.stats.totalCheckins).toBe(0);

      await store.addRecord({
        userId: user1Id,
        mood: 5,
        anxietyLevel: 2,
        emotions: ['Alegre', 'Grato'],
        activities: ['Exercício'],
        notes: 'Excelente dia.',
      });

      const updatedState = useMoodStore.getState();
      expect(updatedState.records.length).toBe(1);
      expect(updatedState.stats.totalCheckins).toBe(1);
      expect(updatedState.stats.averageMood).toBe(5);
      expect(updatedState.stats.averageAnxiety).toBe(2);

      // Adicionar um segundo registro e verificar atualização das médias
      await updatedState.addRecord({
        userId: user1Id,
        mood: 3,
        anxietyLevel: 6,
        emotions: ['Inquieto'],
        activities: ['Estudo'],
        notes: 'Um pouco mais tenso à tarde.',
      });

      const secondState = useMoodStore.getState();
      expect(secondState.records.length).toBe(2);
      expect(secondState.stats.totalCheckins).toBe(2);
      expect(secondState.stats.averageMood).toBe(4); // (5 + 3) / 2
      expect(secondState.stats.averageAnxiety).toBe(4); // (2 + 6) / 2
    });
  });

  describe('2. Multi-User Isolation & Security', () => {
    it('guarantees that User 2 cannot see User 1 records and starts with 0 records', async () => {
      // User 1 cria 2 registros
      await moodService.createRecord({
        userId: user1Id,
        mood: 5,
        anxietyLevel: 1,
        emotions: ['Calmo'],
      });
      await moodService.createRecord({
        userId: user1Id,
        mood: 4,
        anxietyLevel: 2,
        emotions: ['Relaxado'],
      });

      // User 1 vê 2 registros
      const user1Records = await moodService.getRecords(user1Id);
      expect(user1Records.length).toBe(2);

      // User 2 deve ter 0 registros e médias zeradas
      const user2Records = await moodService.getRecords(user2Id);
      expect(user2Records.length).toBe(0);

      // User 2 cria 1 registro
      await moodService.createRecord({
        userId: user2Id,
        mood: 2,
        anxietyLevel: 8,
        emotions: ['Preocupado'],
      });

      // User 2 vê apenas 1 registro
      const updatedUser2Records = await moodService.getRecords(user2Id);
      expect(updatedUser2Records.length).toBe(1);
      expect(updatedUser2Records[0].userId).toBe(user2Id);
      expect(updatedUser2Records[0].mood).toBe(2);

      // User 1 continua vendo apenas seus 2 registros
      const checkUser1Records = await moodService.getRecords(user1Id);
      expect(checkUser1Records.length).toBe(2);
      expect(checkUser1Records.every((r) => r.userId === user1Id)).toBe(true);
    });

    it('clears records from store and cache upon logout', async () => {
      await moodService.createRecord({
        userId: user1Id,
        mood: 4,
        anxietyLevel: 3,
        emotions: ['Calmo'],
      });

      // Limpar cache de logout
      await moodService.clearUserCache(user1Id);
      useMoodStore.getState().clearRecords();

      const clearedState = useMoodStore.getState();
      expect(clearedState.records.length).toBe(0);
      expect(clearedState.stats.totalCheckins).toBe(0);
    });
  });
});
