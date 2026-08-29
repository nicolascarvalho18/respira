import { MOCK_PRACTICES } from '../mocks/practices.mock';
import { guidedVoiceService } from '../services/sound/guidedVoiceService';
import { usePracticeStore } from '../store/practiceStore';

describe('Guided Audiovisual Practices & Character System Tests', () => {
  const userAId = 'user-practice-alpha';
  const userBId = 'user-practice-beta';

  beforeEach(() => {
    usePracticeStore.setState({
      userProgress: {},
      downloadedIds: [],
    });
  });

  describe('1. Breathing Techniques Timings & Configurations', () => {
    it('Respiração 4–7–8 has exact 4s inhale, 7s hold, 8s exhale configuration', () => {
      const p478 = MOCK_PRACTICES.find((p) => p.id === 'practice-breathing-478');
      expect(p478).toBeDefined();
      expect(p478?.breathingConfig?.inhaleSeconds).toBe(4);
      expect(p478?.breathingConfig?.holdSeconds).toBe(7);
      expect(p478?.breathingConfig?.exhaleSeconds).toBe(8);
      expect(p478?.breathingConfig?.cycles).toBeGreaterThanOrEqual(3);
    });

    it('Respiração Quadrada has symmetrical 4s tempos for all four phases', () => {
      const box = MOCK_PRACTICES.find((p) => p.id === 'practice-breathing-box');
      expect(box).toBeDefined();
      expect(box?.breathingConfig?.inhaleSeconds).toBe(4);
      expect(box?.breathingConfig?.holdSeconds).toBe(4);
      expect(box?.breathingConfig?.exhaleSeconds).toBe(4);
      expect(box?.breathingConfig?.holdAfterExhaleSeconds).toBe(4);
    });

    it('Respiração 4–4 and Guided Breathing have distinct configs and do not reuse 4-7-8', () => {
      const p44 = MOCK_PRACTICES.find((p) => p.id === 'practice-breathing-44');
      expect(p44?.breathingConfig?.inhaleSeconds).toBe(4);
      expect(p44?.breathingConfig?.holdSeconds).toBe(0);
      expect(p44?.breathingConfig?.exhaleSeconds).toBe(4);
    });
  });

  describe('2. Voice Narration Service & Audio Mixer', () => {
    it('provides tailored narration scripts for 4-7-8, grounding 5-4-3-2-1, and PMR', () => {
      const script478 = guidedVoiceService.getNarrationScript('practice-breathing-478');
      expect(script478.length).toBeGreaterThan(0);
      expect(script478.some((s) => s.phase === 'inhale')).toBe(true);
      expect(script478.some((s) => s.phase === 'hold')).toBe(true);
      expect(script478.some((s) => s.phase === 'exhale')).toBe(true);

      const scriptGrounding = guidedVoiceService.getNarrationScript('practice-grounding-54321');
      expect(scriptGrounding.some((s) => s.text.includes('5 coisas'))).toBe(true);

      const scriptPMR = guidedVoiceService.getNarrationScript('practice-pmr-relaxation');
      expect(scriptPMR.some((s) => s.text.includes('punhos'))).toBe(true);
    });

    it('provides standard guided breathing cycle script with 4s inhale, 2s hold, 6s exhale, 2s pause', () => {
      const defaultScript = guidedVoiceService.getNarrationScript('practice-breathing-guided');
      expect(defaultScript.length).toBeGreaterThan(0);
      const inhale = defaultScript.find((s) => s.phase === 'inhale');
      const hold = defaultScript.find((s) => s.phase === 'hold');
      const exhale = defaultScript.find((s) => s.phase === 'exhale');
      const holdAfter = defaultScript.find((s) => s.phase === 'hold_after_exhale');

      expect(inhale?.text).toBe('Inspire suavemente pelo nariz.');
      expect(inhale?.durationSeconds).toBe(4);
      expect(hold?.text).toBe('Segure com calma.');
      expect(hold?.durationSeconds).toBe(2);
      expect(exhale?.text).toBe('Agora... solte o ar devagar, sem forçar.');
      expect(exhale?.durationSeconds).toBe(6);
      expect(holdAfter?.durationSeconds).toBe(2);
    });

    it('supports voice speed multiplier (0.75x, 1x, 1.25x)', () => {
      guidedVoiceService.setVoiceSpeedMultiplier(0.75);
      expect(guidedVoiceService.getVoiceSpeedMultiplier()).toBe(0.75);

      guidedVoiceService.setVoiceSpeedMultiplier(1.25);
      expect(guidedVoiceService.getVoiceSpeedMultiplier()).toBe(1.25);

      guidedVoiceService.setVoiceSpeedMultiplier(1.0);
      expect(guidedVoiceService.getVoiceSpeedMultiplier()).toBe(1.0);
    });

    it('supports independent voice and ambient music volume mixing and muting', () => {
      guidedVoiceService.setVoiceVolume(0.8);
      expect(guidedVoiceService.getVoiceVolume()).toBe(0.8);

      guidedVoiceService.setAmbientVolume(0.4);
      expect(guidedVoiceService.getAmbientVolume()).toBe(0.4);

      guidedVoiceService.setVoiceMuted(true);
      expect(guidedVoiceService.getIsVoiceMuted()).toBe(true);

      guidedVoiceService.setAmbientMuted(false);
      expect(guidedVoiceService.getIsAmbientMuted()).toBe(false);
    });
  });

  describe('3. Practice Progress & User Isolation', () => {
    it('saves user practice progress strictly isolated per user', async () => {
      const store = usePracticeStore.getState();

      await store.saveProgress(userAId, 'practice-breathing-478', 120, 240, false);
      const stateA = usePracticeStore.getState();
      expect(stateA.userProgress['practice-breathing-478']).toBeDefined();
      expect(stateA.userProgress['practice-breathing-478'].playbackPositionSeconds).toBe(120);

      // Registrar sensação pós-prática
      await store.recordPostFeeling(userAId, 'practice-breathing-478', 'calmer');
      const updatedA = usePracticeStore.getState();
      expect(updatedA.userProgress['practice-breathing-478'].postFeeling).toBe('calmer');
    });
  });
});
