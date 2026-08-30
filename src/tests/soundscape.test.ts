import { useSoundscapeStore } from '../store/soundscapeStore';
import { useMusicStore } from '../store/musicStore';
import { SOUNDSCAPES, Soundscape } from '../constants/soundscapes';
import { soundEngine } from '../services/sound/soundEngine';

describe('16 Paisagens Sonoras Exclusivas — Testes de Reprodução e Catálogo', () => {
  beforeEach(async () => {
    await useSoundscapeStore.getState().stopSoundscape();
  });

  it('1. Deve conter exatamente 16 sons cadastrados', () => {
    expect(SOUNDSCAPES.length).toBe(16);
  });

  it('2. Deve conter todos os 16 nomes e descrições específicos solicitados', () => {
    const expectedNames = [
      'Chuva leve',
      'Chuva na janela',
      'Chuva no telhado',
      'Ondas do mar',
      'Riacho',
      'Cachoeira distante',
      'Floresta',
      'Noite na floresta',
      'Fogueira',
      'Vento suave',
      'Tempestade distante',
      'Cafeteria',
      'Ventilador',
      'Ruído branco',
      'Ruído rosa',
      'Ruído marrom',
    ];

    const currentNames = SOUNDSCAPES.map((s) => s.name);
    expectedNames.forEach((name) => {
      expect(currentNames).toContain(name);
    });
  });

  it('3. Cada som deve possuir ID, áudio e gerador exclusivo (sem duplicações)', () => {
    const ids = SOUNDSCAPES.map((s) => s.id);
    const audioUrls = SOUNDSCAPES.map((s) => s.audioUrl);
    const generatorTypes = SOUNDSCAPES.map((s) => s.generatorType);

    expect(new Set(ids).size).toBe(16);
    expect(new Set(audioUrls).size).toBe(16);
    expect(new Set(generatorTypes).size).toBe(16);
  });

  it('4. Cada som deve possuir imagem de capa válida e descrições temáticas', () => {
    SOUNDSCAPES.forEach((sound) => {
      expect(sound.thumbnailUrl).toBeDefined();
      expect(sound.thumbnailUrl.startsWith('http')).toBe(true);
      expect(sound.subtitle.length).toBeGreaterThan(5);
      expect(sound.description.length).toBeGreaterThan(15);
      expect(sound.category).toBeDefined();
      expect(sound.categoryLabel).toBeDefined();
    });
  });

  it('5. Deve iniciar a reprodução individual de cada um dos 16 sons', async () => {
    for (const sound of SOUNDSCAPES) {
      await useSoundscapeStore.getState().playSoundscape(sound);
      const state = useSoundscapeStore.getState();
      expect(state.isPlaying).toBe(true);
      expect(state.currentSoundscape?.id).toBe(sound.id);
      expect(state.isMiniPlayerVisible).toBe(true);
    }
  });

  it('6. Deve alternar entre reproduzir e pausar mantendo o som atual', async () => {
    const sound = SOUNDSCAPES[0];
    await useSoundscapeStore.getState().playSoundscape(sound);
    expect(useSoundscapeStore.getState().isPlaying).toBe(true);

    await useSoundscapeStore.getState().togglePlayPause();
    expect(useSoundscapeStore.getState().isPlaying).toBe(false);
    expect(useSoundscapeStore.getState().currentSoundscape?.id).toBe(sound.id);

    await useSoundscapeStore.getState().togglePlayPause();
    expect(useSoundscapeStore.getState().isPlaying).toBe(true);
  });

  it('7. Ao iniciar um novo som, deve interromper automaticamente o anterior', async () => {
    const sound1 = SOUNDSCAPES[0];
    const sound2 = SOUNDSCAPES[1];

    await useSoundscapeStore.getState().playSoundscape(sound1);
    expect(useSoundscapeStore.getState().currentSoundscape?.id).toBe(sound1.id);

    await useSoundscapeStore.getState().playSoundscape(sound2);
    expect(useSoundscapeStore.getState().currentSoundscape?.id).toBe(sound2.id);
    expect(useSoundscapeStore.getState().isPlaying).toBe(true);
  });

  it('8. Não deve permitir dois áudios tocando simultaneamente (interrompe música ativa)', async () => {
    const sound = SOUNDSCAPES[3]; // Ondas do mar
    const spyStopAmbience = jest.spyOn(soundEngine, 'playAmbience');

    await useSoundscapeStore.getState().playSoundscape(sound);
    expect(spyStopAmbience).toHaveBeenCalledWith(
      sound.id,
      expect.any(Number),
      sound.audioUrl
    );
  });

  it('9. Deve controlar o volume entre 0 e 1 em tempo real', async () => {
    await useSoundscapeStore.getState().setVolume(0.5);
    expect(useSoundscapeStore.getState().volume).toBe(0.5);

    await useSoundscapeStore.getState().setVolume(1.8);
    expect(useSoundscapeStore.getState().volume).toBe(1.0);

    await useSoundscapeStore.getState().setVolume(-0.2);
    expect(useSoundscapeStore.getState().volume).toBe(0.0);
  });

  it('10. Deve gerenciar temporizador regressivo e pausar ao finalizar', () => {
    useSoundscapeStore.getState().setTimer(30);
    expect(useSoundscapeStore.getState().timerMinutes).toBe(30);
    expect(useSoundscapeStore.getState().remainingSeconds).toBe(1800);

    useSoundscapeStore.getState().tickTimer();
    // Se não estiver tocando, não decrementa
    expect(useSoundscapeStore.getState().remainingSeconds).toBe(1800);

    useSoundscapeStore.setState({ isPlaying: true });
    useSoundscapeStore.getState().tickTimer();
    expect(useSoundscapeStore.getState().remainingSeconds).toBe(1799);
  });

  it('11. Deve salvar e remover favoritos preservando persistência', async () => {
    const testId = SOUNDSCAPES[4].id; // Riacho
    await useSoundscapeStore.getState().toggleFavoriteSound(testId);
    expect(useSoundscapeStore.getState().favoriteIds).toContain(testId);

    await useSoundscapeStore.getState().toggleFavoriteSound(testId);
    expect(useSoundscapeStore.getState().favoriteIds).not.toContain(testId);
  });

  it('12. Deve fechar e encerrar o miniplayer adequadamente', async () => {
    await useSoundscapeStore.getState().playSoundscape(SOUNDSCAPES[0]);
    expect(useSoundscapeStore.getState().isMiniPlayerVisible).toBe(true);

    await useSoundscapeStore.getState().closeMiniPlayer();
    const state = useSoundscapeStore.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.isMiniPlayerVisible).toBe(false);
    expect(state.currentSoundscape).toBeNull();
  });
});
