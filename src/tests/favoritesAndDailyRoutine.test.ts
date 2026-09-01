import { favoriteService } from '../services/favorite/favoriteService';
import { dailyRoutineService } from '../services/dailyRoutine/dailyRoutineService';
import { usePracticeStore } from '../store/practiceStore';
import { useContentStore } from '../store/contentStore';
import { useSoundscapeStore } from '../store/soundscapeStore';
import { useMusicStore } from '../store/musicStore';
import { useDailyRoutineStore } from '../store/dailyRoutineStore';
import { storage } from '../services/storage/asyncStorage';

describe('Validação Completa de Favoritos e Exercícios Diários', () => {
  const USER_A = 'user-1111-aaaa';
  const USER_B = 'user-2222-bbbb';

  beforeEach(async () => {
    await storage.clear();
    usePracticeStore.setState({ practices: [], isLoading: false });
    useContentStore.setState({ articles: [], isLoading: false });
    useSoundscapeStore.setState({ favoriteIds: [] });
    useMusicStore.setState({ favoriteTrackIds: [] });
    useDailyRoutineStore.getState().resetRoutine();
  });

  describe('1. Sistema de Favoritos Isolado por Usuário', () => {
    it('conta nova deve começar com a lista de favoritos 100% vazia', async () => {
      const favs = await favoriteService.getFavorites(USER_A, 'practice');
      expect(favs).toEqual([]);

      const allFavs = await favoriteService.loadAllUserFavorites(USER_A);
      expect(allFavs.practices).toHaveLength(0);
      expect(allFavs.soundscapes).toHaveLength(0);
      expect(allFavs.music).toHaveLength(0);
      expect(allFavs.articles).toHaveLength(0);
    });

    it('nenhum conteúdo deve vir marcado como favorito por padrão', async () => {
      await usePracticeStore.getState().fetchPractices(USER_A);
      const practices = usePracticeStore.getState().practices;

      expect(practices.length).toBeGreaterThan(0);
      practices.forEach((p) => {
        expect(p.isFavorite).toBe(false);
      });
    });

    it('deve marcar e desmarcar favoritos com mensagens discretas corretas', async () => {
      const practiceId = 'practice-breathing-478';

      // 1. Marcar
      const res1 = await favoriteService.toggleFavorite(practiceId, 'practice', USER_A);
      expect(res1.isFavorite).toBe(true);
      expect(res1.message).toBe('Adicionado aos favoritos');

      const favsAfterAdd = await favoriteService.getFavorites(USER_A, 'practice');
      expect(favsAfterAdd).toContain(practiceId);

      // 2. Desmarcar
      const res2 = await favoriteService.toggleFavorite(practiceId, 'practice', USER_A);
      expect(res2.isFavorite).toBe(false);
      expect(res2.message).toBe('Removido dos favoritos');

      const favsAfterRemove = await favoriteService.getFavorites(USER_A, 'practice');
      expect(favsAfterRemove).not.toContain(practiceId);
    });

    it('dois usuários diferentes no mesmo navegador devem ter dados 100% isolados', async () => {
      const practiceId = 'practice-breathing-box';

      // Usuário A favorita
      await favoriteService.toggleFavorite(practiceId, 'practice', USER_A);

      // Usuário A tem o favorito
      const favsA = await favoriteService.getFavorites(USER_A, 'practice');
      expect(favsA).toContain(practiceId);

      // Usuário B NÃO deve ver o favorito do Usuário A
      const favsB = await favoriteService.getFavorites(USER_B, 'practice');
      expect(favsB).not.toContain(practiceId);
      expect(favsB).toEqual([]);
    });

    it('ao sair da conta e entrar novamente, deve manter os dados corretos sem vazamentos', async () => {
      const soundId = 'soundscape-rain';
      await favoriteService.toggleFavorite(soundId, 'soundscape', USER_A);

      // Limpar cache de logout para Usuário A
      await favoriteService.clearUserCache(USER_A);

      // Usuário B entra: não tem favoritos
      const favsB = await favoriteService.getFavorites(USER_B, 'soundscape');
      expect(favsB).toEqual([]);
    });
  });

  describe('2. Seção de Exercícios Diários (Exercícios de Hoje)', () => {
    it('deve gerar exatamente 3 atividades por dia: respiração, atenção plena e humor/reflexão', async () => {
      const routine = await dailyRoutineService.getDailyRoutine(USER_A, new Date('2026-08-30'));

      expect(routine.exercises).toHaveLength(3);
      expect(routine.exercises[0].type).toBe('breathing');
      expect(routine.exercises[1].type).toBe('mindfulness');
      expect(routine.exercises[2].type).toBe('mood_checkin');

      routine.exercises.forEach((ex) => {
        expect(ex.title).toBeTruthy();
        expect(ex.description).toBeTruthy();
        expect(ex.durationMinutes).toBeGreaterThan(0);
        expect(ex.difficulty).toMatch(/^(Suave|Leve|Moderado)$/);
        expect(ex.status).toBe('not_started');
      });

      expect(routine.completedCount).toBe(0);
      expect(routine.isAllCompleted).toBe(false);
    });

    it('não deve marcar exercícios como concluídos automaticamente', async () => {
      const routine = await dailyRoutineService.getDailyRoutine(USER_A);
      routine.exercises.forEach((ex) => {
        expect(ex.status).toBe('not_started');
        expect(ex.completedAt).toBeUndefined();
      });
      expect(routine.isAllCompleted).toBe(false);
    });

    it('deve atualizar o progresso individualmente e indicar conclusão de todos', async () => {
      const targetDate = new Date('2026-08-30');
      const initial = await dailyRoutineService.getDailyRoutine(USER_A, targetDate);
      const ex1 = initial.exercises[0].id;
      const ex2 = initial.exercises[1].id;
      const ex3 = initial.exercises[2].id;

      // 1. Concluir exercício 1
      const state1 = await dailyRoutineService.updateExerciseStatus(USER_A, ex1, 'completed', targetDate);
      expect(state1.completedCount).toBe(1);
      expect(state1.exercises[0].status).toBe('completed');
      expect(state1.isAllCompleted).toBe(false);

      // 2. Concluir exercício 2
      const state2 = await dailyRoutineService.updateExerciseStatus(USER_A, ex2, 'completed', targetDate);
      expect(state2.completedCount).toBe(2);
      expect(state2.isAllCompleted).toBe(false);

      // 3. Concluir exercício 3 -> rotina concluída!
      const state3 = await dailyRoutineService.updateExerciseStatus(USER_A, ex3, 'completed', targetDate);
      expect(state3.completedCount).toBe(3);
      expect(state3.isAllCompleted).toBe(true);
    });

    it('progresso dos exercícios diários deve ser isolado entre usuários', async () => {
      const targetDate = new Date('2026-08-30');
      const routineA = await dailyRoutineService.getDailyRoutine(USER_A, targetDate);
      const exId = routineA.exercises[0].id;

      // Usuário A completa
      await dailyRoutineService.updateExerciseStatus(USER_A, exId, 'completed', targetDate);

      // Usuário B consulta: deve estar com 0 concluídos e 'not_started'
      const routineB = await dailyRoutineService.getDailyRoutine(USER_B, targetDate);
      expect(routineB.completedCount).toBe(0);
      expect(routineB.exercises[0].status).toBe('not_started');
      expect(routineB.isAllCompleted).toBe(false);
    });

    it('mudança de data deve renovar a rotina mantendo o histórico de dias anteriores', async () => {
      const day1 = '2026-08-30';
      const day2 = '2026-08-31';

      // Dia 1: Usuário A completa o primeiro exercício
      const routineDay1 = await dailyRoutineService.getDailyRoutine(USER_A, day1);
      await dailyRoutineService.updateExerciseStatus(USER_A, routineDay1.exercises[0].id, 'completed', day1);

      // Dia 2: Nova rotina começa com 0 concluídos
      const routineDay2 = await dailyRoutineService.getDailyRoutine(USER_A, day2);
      expect(routineDay2.routineDate).toBe('2026-08-31');
      expect(routineDay2.completedCount).toBe(0);
      expect(routineDay2.exercises[0].status).toBe('not_started');

      // Histórico do dia 1 continua preservado
      const historyDay1 = await dailyRoutineService.getDailyRoutine(USER_A, day1);
      expect(historyDay1.completedCount).toBe(1);
      expect(historyDay1.exercises[0].status).toBe('completed');
    });
  });
});
