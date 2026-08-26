import { MOCK_PRACTICES } from '../mocks/practices.mock';
import { practiceService } from '../services/practice/practiceService';
import { usePracticeStore } from '../store/practiceStore';

describe('Nova Biblioteca de Práticas Guiadas em Vídeo e Áudio', () => {
  describe('1. Catálogo Completo das 20 Práticas Guiadas', () => {
    it('deve conter no mínimo 20 práticas cadastradas com atributos válidos', () => {
      expect(MOCK_PRACTICES.length).toBeGreaterThanOrEqual(20);
    });

    it('deve contemplar as 9 categorias da biblioteca', () => {
      const categories = new Set(MOCK_PRACTICES.map((p) => p.category));
      expect(categories.has('breathing')).toBe(true);
      expect(categories.has('guided_meditation')).toBe(true);
      expect(categories.has('body_movement')).toBe(true);
      expect(categories.has('relaxation')).toBe(true);
      expect(categories.has('sleep')).toBe(true);
      expect(categories.has('mindfulness_focus')).toBe(true);
      expect(categories.has('quick_pauses')).toBe(true);
      expect(categories.has('morning_routine')).toBe(true);
      expect(categories.has('bedtime_prep')).toBe(true);
    });

    it('deve conter práticas nos 3 formatos: vídeo, áudio e interativo', () => {
      const formats = new Set(MOCK_PRACTICES.map((p) => p.format));
      expect(formats.has('video')).toBe(true);
      expect(formats.has('audio')).toBe(true);
      expect(formats.has('interactive')).toBe(true);
    });

    it('todas as práticas corporais devem ter orientações de segurança e respeito a limites', () => {
      const physicalPractices = MOCK_PRACTICES.filter(
        (p) => p.category === 'body_movement' || p.activityType === 'physical'
      );

      physicalPractices.forEach((p) => {
        const hasSafetyNotice =
          (p.guidelinesBeforeStarting && p.guidelinesBeforeStarting.some((g) => g.includes('limite') || g.includes('desconforto') || g.includes('suave'))) ||
          (p.careAndLimitations && p.careAndLimitations.length > 0) ||
          (p.instructions && p.instructions.some((i) => i.includes('suavemente e respeite seus limites')));

        expect(hasSafetyNotice).toBe(true);
      });
    });
  });

  describe('2. Filtros e Seletores da Biblioteca', () => {
    it('deve filtrar práticas por categoria', async () => {
      const store = usePracticeStore.getState();
      await store.fetchPractices();

      store.setSelectedCategory('breathing');
      const filtered = store.getFilteredPractices();
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((p) => expect(p.category).toBe('breathing'));
    });

    it('deve filtrar práticas por duração (até 5 min)', () => {
      const store = usePracticeStore.getState();
      store.setSelectedCategory('all');
      store.setSelectedDuration('up_to_5');

      const filtered = store.getFilteredPractices();
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((p) => expect(p.durationMinutes).toBeLessThanOrEqual(5));
    });

    it('deve filtrar práticas por formato (vídeo)', () => {
      const store = usePracticeStore.getState();
      store.setSelectedDuration('all');
      store.setSelectedFormat('video');

      const filtered = store.getFilteredPractices();
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((p) => expect(p.format).toBe('video'));
    });

    it('deve buscar práticas por termo de pesquisa sem diferenciar maiúsculas/minúsculas', () => {
      const store = usePracticeStore.getState();
      store.setSelectedFormat('all');
      store.setSearchQuery('4-7-8');

      const filtered = store.getFilteredPractices();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.some((p) => p.id === 'practice-breathing-478')).toBe(true);
    });
  });

  describe('3. Progresso, Posição de Reprodução e Avaliação Pós-Prática', () => {
    it('deve salvar progresso intermediário e posição de reprodução do usuário', async () => {
      const userId = 'user-test-1';
      const practiceId = 'practice-breathing-478';

      const progress = await practiceService.saveProgress(userId, practiceId, 120, 240, false);
      expect(progress.playbackPositionSeconds).toBe(120);
      expect(progress.progressPercent).toBe(50);
      expect(progress.status).toBe('started');
    });

    it('deve registrar conclusão e avaliação subjetiva pós-prática (Mais tranquilo / Igual / Desconfortável)', async () => {
      const userId = 'user-test-1';
      const practiceId = 'practice-breathing-478';

      await practiceService.saveProgress(userId, practiceId, 240, 240, true);
      await practiceService.recordPostFeeling(userId, practiceId, 'calmer', 'Me senti mais presente');

      const saved = await practiceService.getProgress(userId, practiceId);
      expect(saved?.status).toBe('completed');
      expect(saved?.postFeelingsHistory).toBeDefined();
      expect(saved?.postFeelingsHistory?.some((f) => f.feeling === 'calmer')).toBe(true);
    });

    it('deve permitir alternar o status de download offline da prática', async () => {
      const practiceId = 'practice-grounding-54321';
      const isDownloaded1 = await practiceService.toggleOfflineDownload(practiceId);
      expect(isDownloaded1).toBe(true);

      const check1 = await practiceService.isDownloaded(practiceId);
      expect(check1).toBe(true);

      const isDownloaded2 = await practiceService.toggleOfflineDownload(practiceId);
      expect(isDownloaded2).toBe(false);
    });
  });

  describe('4. Painel Administrativo de Práticas (CRUD)', () => {
    it('deve criar, atualizar e excluir uma prática do catálogo', async () => {
      const newPractice = await practiceService.createPractice({
        title: 'Respiração para Foco Matinal',
        description: 'Prática curta de 3 minutos para iniciar o dia.',
        category: 'morning_routine',
        objective: 'regain_focus',
        format: 'video',
        durationMinutes: 3,
        level: 'Iniciante',
        videoUrl: 'https://exemplo.com/video.mp4',
        status: 'published',
      } as any);

      expect(newPractice.id).toBeDefined();
      expect(newPractice.title).toBe('Respiração para Foco Matinal');

      const updated = await practiceService.updatePractice(newPractice.id, {
        title: 'Respiração para Foco Matinal (Atualizada)',
        durationMinutes: 4,
      });
      expect(updated.title).toContain('Atualizada');
      expect(updated.durationMinutes).toBe(4);

      const deleted = await practiceService.deletePractice(newPractice.id);
      expect(deleted).toBe(true);
    });
  });
});
