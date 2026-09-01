import { useAuthStore } from '../store/authStore';
import { useMoodStore } from '../store/moodStore';
import { usePracticeStore } from '../store/practiceStore';
import { useContentStore } from '../store/contentStore';
import { useSoundscapeStore } from '../store/soundscapeStore';
import { useMusicStore } from '../store/musicStore';
import { useSoundMixerStore } from '../store/soundMixerStore';
import { useDailyRoutineStore } from '../store/dailyRoutineStore';
import { useChatStore } from '../store/chatStore';
import { favoriteService } from '../services/favorite/favoriteService';
import { soundMixService } from '../services/sound/soundMixService';
import { practiceService } from '../services/practice/practiceService';
import { contentService } from '../services/content/contentService';
import { dailyRoutineService } from '../services/dailyRoutine/dailyRoutineService';
import { moodService } from '../services/mood/moodService';
import { chatService } from '../services/chat/chatService';
import { storage } from '../services/storage/asyncStorage';

describe('Isolamento Completo de Recursos por Conta de Usuário (Multi-Account)', () => {
  const USER_A_ID = 'user-alice-101';
  const USER_B_ID = 'user-bob-202';

  beforeEach(async () => {
    await storage.clear();
    await useAuthStore.getState().logout();
  });

  it('1. Favoritos de todos os tipos devem ser 100% isolados por conta', async () => {
    await favoriteService.toggleFavorite('practice-breathing-478', 'practice', USER_A_ID);
    await favoriteService.toggleFavorite('music-track-1', 'music', USER_A_ID);
    await favoriteService.toggleFavorite('soundscape-rain', 'soundscape', USER_A_ID);
    await favoriteService.toggleFavorite('art-ansiedade-1', 'article', USER_A_ID);

    const aliceFavs = await favoriteService.loadAllUserFavorites(USER_A_ID);
    expect(aliceFavs.practices).toContain('practice-breathing-478');
    expect(aliceFavs.music).toContain('music-track-1');
    expect(aliceFavs.soundscapes).toContain('soundscape-rain');
    expect(aliceFavs.articles).toContain('art-ansiedade-1');

    const bobFavs = await favoriteService.loadAllUserFavorites(USER_B_ID);
    expect(bobFavs.practices).toHaveLength(0);
    expect(bobFavs.music).toHaveLength(0);
    expect(bobFavs.soundscapes).toHaveLength(0);
    expect(bobFavs.articles).toHaveLength(0);
  });

  it('2. Exercícios diários de hoje devem ter progresso exclusivo por conta', async () => {
    const today = dailyRoutineService.formatDateKey();

    await dailyRoutineService.updateExerciseStatus(USER_A_ID, `daily-breathing-${today}`, 'completed');
    await dailyRoutineService.updateExerciseStatus(USER_A_ID, `daily-mindfulness-${today}`, 'completed');

    const aliceRoutine = await dailyRoutineService.getDailyRoutine(USER_A_ID);
    expect(aliceRoutine.completedCount).toBe(2);

    const bobRoutine = await dailyRoutineService.getDailyRoutine(USER_B_ID);
    expect(bobRoutine.completedCount).toBe(0);
    expect(bobRoutine.exercises.every((e) => e.status === 'not_started')).toBe(true);
  });

  it('3. Presets customizados do Misturador de Sons devem pertencer unicamente ao autor', async () => {
    await soundMixService.savePreset(
      USER_A_ID,
      'Chuva e Fogueira da Alice',
      [
        { soundId: 'soundscape-rain', name: 'Chuva leve', volume: 0.8 },
        { soundId: 'soundscape-fire', name: 'Fogueira', volume: 0.5 },
      ],
      0.9
    );

    const alicePresets = await soundMixService.getPresets(USER_A_ID);
    expect(alicePresets.some((p) => p.name === 'Chuva e Fogueira da Alice')).toBe(true);

    const bobPresets = await soundMixService.getPresets(USER_B_ID);
    expect(bobPresets.some((p) => p.name === 'Chuva e Fogueira da Alice')).toBe(false);
  });

  it('4. Progresso de práticas guiadas e posições de reprodução devem ser isolados', async () => {
    await practiceService.saveProgress(USER_A_ID, 'practice-breathing-478', 180, 240, false);

    const aliceProgress = await practiceService.getProgress(USER_A_ID, 'practice-breathing-478');
    expect(aliceProgress?.playbackPositionSeconds).toBe(180);
    expect(aliceProgress?.progressPercent).toBe(75);

    const bobProgress = await practiceService.getProgress(USER_B_ID, 'practice-breathing-478');
    expect(bobProgress).toBeNull();
  });

  it('5. Progresso de leitura de artigos deve ser isolado por conta', async () => {
    await contentService.updateReadProgress('art-ansiedade-1', 90, USER_A_ID);

    const aliceArticles = await contentService.getArticles(USER_A_ID);
    const aliceTarget = aliceArticles.find((a) => a.id === 'art-ansiedade-1');
    expect(aliceTarget?.readProgress).toBe(90);

    const bobArticles = await contentService.getArticles(USER_B_ID);
    const bobTarget = bobArticles.find((a) => a.id === 'art-ansiedade-1');
    expect(bobTarget?.readProgress).toBe(0);
  });

  it('6. Registros de Diário de Humor devem ser estritamente confidenciais e isolados', async () => {
    await moodService.createRecord({
      userId: USER_A_ID,
      mood: 4,
      anxietyLevel: 2,
      emotions: ['calmo', 'grato'],
      notes: 'Diário secreto da Alice',
    });

    const aliceRecords = await moodService.getRecords(USER_A_ID);
    expect(aliceRecords.length).toBe(1);
    expect(aliceRecords[0].notes).toBe('Diário secreto da Alice');

    const bobRecords = await moodService.getRecords(USER_B_ID);
    expect(bobRecords.length).toBe(0);
  });

  it('7. Mensagens de conversa do assistente de chat devem ser isoladas por usuário', async () => {
    await chatService.saveMessages(
      [
        {
          id: 'msg-alice-1',
          sender: 'user',
          text: 'Olá assistente, me chamo Alice',
          timestamp: new Date().toISOString(),
        },
      ],
      undefined,
      USER_A_ID
    );

    const aliceMessages = await chatService.getMessages(undefined, USER_A_ID);
    expect(aliceMessages.some((m) => m.text.includes('Alice'))).toBe(true);

    const bobMessages = await chatService.getMessages(undefined, USER_B_ID);
    expect(bobMessages.some((m) => m.text.includes('Alice'))).toBe(false);
  });

  it('8. Troca de contas e logout devem resetar todos os estados em memória', async () => {
    useAuthStore.setState({
      user: {
        id: USER_A_ID,
        name: 'Alice',
        email: 'alice@teste.com',
        role: 'user',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isAuthenticated: true,
    });

    await usePracticeStore.getState().fetchPractices(USER_A_ID);
    await useDailyRoutineStore.getState().fetchDailyRoutine(USER_A_ID);
    await useSoundMixerStore.getState().loadPresets(USER_A_ID);

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useDailyRoutineStore.getState().routine.completedCount).toBe(0);
    expect(useMusicStore.getState().favoriteTrackIds).toHaveLength(0);
    expect(useSoundscapeStore.getState().favoriteIds).toHaveLength(0);
    expect(useMoodStore.getState().records).toHaveLength(0);
    expect(useChatStore.getState().messages).toHaveLength(0);
  });
});
