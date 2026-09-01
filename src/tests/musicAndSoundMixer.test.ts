import { useMusicStore } from '../store/musicStore';
import { useSoundMixerStore } from '../store/soundMixerStore';
import { soundMixService } from '../services/sound/soundMixService';
import { favoriteService } from '../services/favorite/favoriteService';
import { MUSIC_TRACKS } from '../constants/musicTracks';
import { SOUNDSCAPES } from '../constants/soundscapes';
import { storage } from '../services/storage/asyncStorage';

describe('Validação Completa de Músicas, Player em Tela Completa e Misturador de Sons', () => {
  const USER_A = 'user-music-aaaa';
  const USER_B = 'user-music-bbbb';

  beforeEach(async () => {
    await storage.clear();
    useMusicStore.getState().stopTrack();
    useSoundMixerStore.getState().stopMix();
    useMusicStore.setState({
      currentTrack: null,
      isPlaying: false,
      isShuffle: false,
      repeatMode: 'off',
      favoriteTrackIds: [],
      queue: MUSIC_TRACKS,
    });
  });

  describe('1. Catálogo Completo de 24 Músicas e 16 Sons Ambientes', () => {
    it('deve possuir exatamente 24 faixas de música com metadados reais e capas individuais', () => {
      expect(MUSIC_TRACKS).toHaveLength(24);
      MUSIC_TRACKS.forEach((track) => {
        expect(track.id).toBeTruthy();
        expect(track.title).toBeTruthy();
        expect(track.artist).toBeTruthy();
        expect(track.durationSeconds).toBeGreaterThan(60);
        expect(track.thumbnailUrl).toMatch(/^https?:\/\//);
        expect(track.category).toMatch(/^(relax|sleep|meditate|focus|study)$/);
      });
    });

    it('deve possuir 16 paisagens sonoras individuais', () => {
      expect(SOUNDSCAPES).toHaveLength(16);
      SOUNDSCAPES.forEach((sound) => {
        expect(sound.id).toBeTruthy();
        expect(sound.name).toBeTruthy();
        expect(sound.thumbnailUrl).toMatch(/^https?:\/\//);
      });
    });
  });

  describe('2. Player de Música em Tela Completa & Funções de Áudio', () => {
    it('deve iniciar a reprodução da faixa e registrar metadados corretos', () => {
      const track = MUSIC_TRACKS[0];
      useMusicStore.getState().playTrack(track);

      const state = useMusicStore.getState();
      expect(state.currentTrack?.id).toBe(track.id);
      expect(state.isPlaying).toBe(true);
      expect(state.durationSeconds).toBe(track.durationSeconds);
    });

    it('deve alternar play e pause corretamente', () => {
      const track = MUSIC_TRACKS[1];
      useMusicStore.getState().playTrack(track);
      expect(useMusicStore.getState().isPlaying).toBe(true);

      useMusicStore.getState().togglePlayPause();
      expect(useMusicStore.getState().isPlaying).toBe(false);

      useMusicStore.getState().togglePlayPause();
      expect(useMusicStore.getState().isPlaying).toBe(true);
    });

    it('deve navegar entre faixas (próxima e anterior) e respeitar a fila', () => {
      useMusicStore.getState().playTrack(MUSIC_TRACKS[0]);
      expect(useMusicStore.getState().currentTrack?.id).toBe(MUSIC_TRACKS[0].id);

      useMusicStore.getState().nextTrack();
      expect(useMusicStore.getState().currentTrack?.id).toBe(MUSIC_TRACKS[1].id);

      useMusicStore.getState().prevTrack();
      expect(useMusicStore.getState().currentTrack?.id).toBe(MUSIC_TRACKS[0].id);
    });

    it('deve ciclar os modos de repetição: off -> all -> one -> off', () => {
      expect(useMusicStore.getState().repeatMode).toBe('off');

      useMusicStore.getState().cycleRepeatMode();
      expect(useMusicStore.getState().repeatMode).toBe('all');

      useMusicStore.getState().cycleRepeatMode();
      expect(useMusicStore.getState().repeatMode).toBe('one');

      useMusicStore.getState().cycleRepeatMode();
      expect(useMusicStore.getState().repeatMode).toBe('off');
    });

    it('deve alternar o modo aleatório (shuffle)', () => {
      expect(useMusicStore.getState().isShuffle).toBe(false);
      useMusicStore.getState().toggleShuffle();
      expect(useMusicStore.getState().isShuffle).toBe(true);
      useMusicStore.getState().toggleShuffle();
      expect(useMusicStore.getState().isShuffle).toBe(false);
    });

    it('deve controlar o volume com limites seguros (0 a 1)', () => {
      useMusicStore.getState().setVolume(0.5);
      expect(useMusicStore.getState().volume).toBe(0.5);

      useMusicStore.getState().setVolume(1.5);
      expect(useMusicStore.getState().volume).toBe(1.0);

      useMusicStore.getState().setVolume(-0.2);
      expect(useMusicStore.getState().volume).toBe(0);
    });

    it('deve abrir e fechar a tela completa do player', () => {
      expect(useMusicStore.getState().isFullScreenPlayerOpen).toBe(false);
      useMusicStore.getState().setFullScreenPlayerOpen(true);
      expect(useMusicStore.getState().isFullScreenPlayerOpen).toBe(true);
      useMusicStore.getState().setFullScreenPlayerOpen(false);
      expect(useMusicStore.getState().isFullScreenPlayerOpen).toBe(false);
    });
  });

  describe('3. Misturador de Sons Ambientes (Soundscape Multi-Mixer)', () => {
    it('deve permitir combinar até 3 sons simultâneos com volumes individuais', () => {
      const store = useSoundMixerStore.getState();
      useSoundMixerStore.setState({ activeLayers: [] });

      // Adiciona som 1
      useSoundMixerStore.getState().addLayer({ id: 'soundscape-rain', name: 'Chuva leve' });
      // Adiciona som 2
      useSoundMixerStore.getState().addLayer({ id: 'soundscape-fire', name: 'Fogueira' });
      // Adiciona som 3
      useSoundMixerStore.getState().addLayer({ id: 'soundscape-wind', name: 'Vento suave' });

      expect(useSoundMixerStore.getState().activeLayers).toHaveLength(3);

      // Tenta adicionar 4º som (deve rejeitar e manter no máximo 3)
      useSoundMixerStore.getState().addLayer({ id: 'soundscape-ocean', name: 'Ondas do mar' });
      expect(useSoundMixerStore.getState().activeLayers).toHaveLength(3);

      // Ajusta volume individual
      useSoundMixerStore.getState().setLayerVolume('soundscape-rain', 0.7);
      useSoundMixerStore.getState().setLayerVolume('soundscape-fire', 0.3);
      useSoundMixerStore.getState().setLayerVolume('soundscape-wind', 0.2);

      const layers = useSoundMixerStore.getState().activeLayers;
      expect(layers.find((l) => l.soundId === 'soundscape-rain')?.volume).toBe(0.7);
      expect(layers.find((l) => l.soundId === 'soundscape-fire')?.volume).toBe(0.3);
      expect(layers.find((l) => l.soundId === 'soundscape-wind')?.volume).toBe(0.2);
    });

    it('deve controlar o volume geral da mistura (master volume)', () => {
      useSoundMixerStore.getState().setMasterVolume(0.65);
      expect(useSoundMixerStore.getState().masterVolume).toBe(0.65);
    });

    it('deve salvar presets personalizados exclusivos para o usuário autenticado', async () => {
      const layers = [
        { soundId: 'soundscape-rain', name: 'Chuva leve', volume: 0.8 },
        { soundId: 'soundscape-wind', name: 'Vento suave', volume: 0.4 },
      ];

      useSoundMixerStore.setState({ activeLayers: layers, masterVolume: 0.8 });
      const savedPreset = await useSoundMixerStore.getState().saveCurrentAsPreset('Meu Sono Perfeito', USER_A);

      expect(savedPreset.name).toBe('Meu Sono Perfeito');
      expect(savedPreset.userId).toBe(USER_A);
      expect(savedPreset.layers).toHaveLength(2);

      // Usuário A possui o preset salvo
      const presetsA = await soundMixService.getPresets(USER_A);
      expect(presetsA.some((p) => p.name === 'Meu Sono Perfeito')).toBe(true);

      // Usuário B NÃO deve ver o preset personalizado do Usuário A
      const presetsB = await soundMixService.getPresets(USER_B);
      expect(presetsB.some((p) => p.name === 'Meu Sono Perfeito')).toBe(false);
    });

    it('deve aplicar um preset alterando camadas e volume instantaneamente', () => {
      const preset = {
        id: 'preset-relax',
        userId: USER_A,
        name: 'Relaxar',
        masterVolume: 0.9,
        layers: [
          { soundId: 'soundscape-fire', name: 'Fogueira', volume: 0.5 },
          { soundId: 'soundscape-stream', name: 'Riacho', volume: 0.5 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useSoundMixerStore.getState().applyPreset(preset);

      const state = useSoundMixerStore.getState();
      expect(state.activePresetName).toBe('Relaxar');
      expect(state.masterVolume).toBe(0.9);
      expect(state.activeLayers).toHaveLength(2);
    });
  });

  describe('4. Isolamento de Favoritos de Música por Usuário', () => {
    it('favoritar música no Usuário A não altera favoritos do Usuário B', async () => {
      const trackId = 'music-caminho-sereno';

      await favoriteService.toggleFavorite(trackId, 'music', USER_A);

      const favsA = await favoriteService.getFavorites(USER_A, 'music');
      expect(favsA).toContain(trackId);

      const favsB = await favoriteService.getFavorites(USER_B, 'music');
      expect(favsB).not.toContain(trackId);
    });
  });
});
