import { MOCK_PRACTICES } from '../mocks/practices.mock';
import { soundEngine } from '../services/sound/soundEngine';

describe('Aba Práticas — Fluxo, Disponibilização e Gerenciador de Áudio', () => {
  describe('1. Disponibilização das Práticas Obrigatórias', () => {
    it('deve conter as 8 práticas obrigatórias com títulos, descrições e instruções', () => {
      const requiredIds = [
        'practice-breathing-guided',
        'practice-breathing-44',
        'practice-breathing-478',
        'practice-breathing-box',
        'practice-pmr-relaxation',
        'practice-grounding-54321',
        'practice-meditation-short',
        'practice-mindfulness-body-scan',
      ];

      requiredIds.forEach((id) => {
        const practice = MOCK_PRACTICES.find((p) => p.id === id);
        expect(practice).toBeDefined();
        expect(practice?.title).toBeTruthy();
        expect(practice?.description).toBeTruthy();
        expect(practice?.durationMinutes).toBeGreaterThan(0);
        expect(practice?.instructions).toBeDefined();
        expect(practice?.instructions?.length).toBeGreaterThan(0);
      });
    });

    it('deve possuir configurações de respiração corretas para as práticas respiratórias', () => {
      const b478 = MOCK_PRACTICES.find((p) => p.id === 'practice-breathing-478');
      expect(b478?.breathingConfig).toEqual({
        inhaleSeconds: 4,
        holdSeconds: 7,
        exhaleSeconds: 8,
        cycles: 4,
      });

      const bBox = MOCK_PRACTICES.find((p) => p.id === 'practice-breathing-box');
      expect(bBox?.breathingConfig).toEqual({
        inhaleSeconds: 4,
        holdSeconds: 4,
        exhaleSeconds: 4,
        holdAfterExhaleSeconds: 4,
        cycles: 4,
      });

      const b44 = MOCK_PRACTICES.find((p) => p.id === 'practice-breathing-44');
      expect(b44?.breathingConfig?.inhaleSeconds).toBe(4);
      expect(b44?.breathingConfig?.exhaleSeconds).toBe(4);
    });
  });

  describe('2. Gerenciador de Áudio Centralizado (SoundEngine)', () => {
    beforeEach(() => {
      soundEngine.setMuted(false);
      soundEngine.setMasterVolume(0.8);
    });

    afterEach(() => {
      soundEngine.stopAll();
    });

    it('deve controlar estado de mute instantâneo', () => {
      expect(soundEngine.getIsMuted()).toBe(false);
      soundEngine.setMuted(true);
      expect(soundEngine.getIsMuted()).toBe(true);

      const toggled = soundEngine.toggleMute();
      expect(toggled).toBe(false);
      expect(soundEngine.getIsMuted()).toBe(false);
    });

    it('deve ajustar volume master respeitando os limites [0, 1]', () => {
      soundEngine.setMasterVolume(0.5);
      expect(soundEngine.getMasterVolume()).toBe(0.5);

      soundEngine.setMasterVolume(1.5);
      expect(soundEngine.getMasterVolume()).toBe(1.0);

      soundEngine.setMasterVolume(-0.5);
      expect(soundEngine.getMasterVolume()).toBe(0.0);
    });

    it('deve executar stopAll sem lançar erros', () => {
      expect(() => {
        soundEngine.playCue('chime');
        soundEngine.playAmbience('waves', 0.5);
        soundEngine.stopAll();
      }).not.toThrow();
    });
  });

  describe('3. Lógica do Fluxo de Exercícios (Avanço Contínuo e Término)', () => {
    it('deve avançar corretamente para o próximo exercício na lista ordenada', () => {
      const currentIndex = 0;
      const currentPractice = MOCK_PRACTICES[currentIndex];
      const hasNext = currentIndex < MOCK_PRACTICES.length - 1;
      const nextPractice = hasNext ? MOCK_PRACTICES[currentIndex + 1] : null;

      expect(hasNext).toBe(true);
      expect(nextPractice).toBeDefined();
      expect(nextPractice?.id).not.toBe(currentPractice.id);
      expect(nextPractice?.id).toBe(MOCK_PRACTICES[1].id);
    });

    it('deve identificar quando o usuário atinge o último exercício da sequência', () => {
      const lastIndex = MOCK_PRACTICES.length - 1;
      const hasNext = lastIndex < MOCK_PRACTICES.length - 1;
      expect(hasNext).toBe(false);
    });
  });
});
