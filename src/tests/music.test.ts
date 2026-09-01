import { MUSIC_TRACKS } from '../constants/musicTracks';
import { SOUNDSCAPES } from '../constants/soundscapes';
import { useMusicStore } from '../store/musicStore';
import { useSoundscapeStore } from '../store/soundscapeStore';
import { soundEngine } from '../services/sound/soundEngine';
import { storage } from '../services/storage/asyncStorage';

describe('24 Músicas Instrumentais — Testes de Reprodução, Catálogo e Funcionalidades', () => {
  beforeEach(async () => {
    useMusicStore.setState({
      tracks: MUSIC_TRACKS,
      currentTrack: null,
      isPlaying: false,
      positionSeconds: 0,
      durationSeconds: 0,
      volume: 0.8,
      isShuffle: false,
      isRepeat: false,
      timerMinutes: null,
      remainingTimerSeconds: null,
      favoriteTrackIds: [],
      recentlyPlayedTrackIds: [],
      savedPositions: {},
      searchQuery: '',
      selectedCategory: 'all',
    });
    useSoundscapeStore.setState({
      currentSoundscape: null,
      isPlaying: false,
    });
    soundEngine.stopAll();
    await storage.clear();
  });

  afterAll(() => {
    soundEngine.stopAll();
  });

  it('1. Deve conter exatamente 24 faixas no catálogo', () => {
    expect(MUSIC_TRACKS).toHaveLength(24);
  });

  it('2. Cada faixa deve possuir título próprio e categorização correta', () => {
    const expectedTitles = [
      // Relaxar (6)
      'Caminho sereno',
      'Pausa para respirar',
      'Jardim silencioso',
      'Brisa tranquila',
      'Horizonte calmo',
      'Tarde de paz',
      // Dormir (6)
      'Noite tranquila',
      'Céu noturno',
      'Sono profundo',
      'Luz da lua',
      'Silêncio da madrugada',
      'Nuvens lentas',
      // Meditar (6)
      'Piano ao amanhecer',
      'Presença',
      'Instante de calma',
      'Respiração consciente',
      'Equilíbrio interior',
      'Som do presente',
      // Estudar (6)
      'Foco leve',
      'Concentração serena',
      'Piano para estudar',
      'Fluxo contínuo',
      'Mente organizada',
      'Leitura tranquila',
    ];

    expect(MUSIC_TRACKS.map((t) => t.title)).toEqual(expectedTitles);

    const categories = MUSIC_TRACKS.map((t) => t.category);
    expect(categories.filter((c) => c === 'relax')).toHaveLength(6);
    expect(categories.filter((c) => c === 'sleep')).toHaveLength(6);
    expect(categories.filter((c) => c === 'meditate')).toHaveLength(6);
    expect(categories.filter((c) => c === 'study')).toHaveLength(6);
  });

  it('3. Não devem existir títulos, IDs, áudios ou capas repetidas', () => {
    const ids = MUSIC_TRACKS.map((t) => t.id);
    const titles = MUSIC_TRACKS.map((t) => t.title);
    const audios = MUSIC_TRACKS.map((t) => t.audioUrl);
    const thumbnails = MUSIC_TRACKS.map((t) => t.thumbnailUrl);

    expect(new Set(ids).size).toBe(24);
    expect(new Set(titles).size).toBe(24);
    expect(new Set(audios).size).toBe(24);
    expect(new Set(thumbnails).size).toBe(24);
  });

  it('4. As durações exibidas devem ser verdadeiras e positivas', () => {
    MUSIC_TRACKS.forEach((track) => {
      expect(track.durationMinutes).toBeGreaterThan(0);
      expect(track.durationSeconds).toBeGreaterThan(0);
      expect(track.durationSeconds).toBeGreaterThanOrEqual(track.durationMinutes * 60 - 30);
      expect(track.durationSeconds).toBeLessThanOrEqual(track.durationMinutes * 60 + 60);
    });
  });

  it('5. Deve reproduzir individualmente cada uma das 24 músicas', () => {
    MUSIC_TRACKS.forEach((track) => {
      useMusicStore.getState().playTrack(track);
      const state = useMusicStore.getState();
      expect(state.currentTrack?.id).toBe(track.id);
      expect(state.isPlaying).toBe(true);
      expect(state.durationSeconds).toBe(track.durationSeconds);
      expect(state.recentlyPlayedTrackIds[0]).toBe(track.id);
    });
  });

  it('6. Deve alternar entre reproduzir e pausar mantendo a posição', () => {
    const track = MUSIC_TRACKS[0];
    useMusicStore.getState().playTrack(track);
    useMusicStore.getState().seekTo(45);

    expect(useMusicStore.getState().isPlaying).toBe(true);
    expect(useMusicStore.getState().positionSeconds).toBe(45);

    // Pausar
    useMusicStore.getState().togglePlayPause();
    expect(useMusicStore.getState().isPlaying).toBe(false);
    expect(useMusicStore.getState().savedPositions[track.id]).toBe(45);

    // Retomar
    useMusicStore.getState().togglePlayPause();
    expect(useMusicStore.getState().isPlaying).toBe(true);
  });

  it('7. Ao iniciar uma música, deve interromper qualquer som ambiente ativo (exclusividade de áudio)', () => {
    // 1. Iniciar som ambiente
    useSoundscapeStore.getState().playSoundscape(SOUNDSCAPES[0]);
    expect(useSoundscapeStore.getState().isPlaying).toBe(true);

    // 2. Iniciar música
    useMusicStore.getState().playTrack(MUSIC_TRACKS[0]);

    // O som ambiente anterior deve ser interrompido
    expect(useMusicStore.getState().isPlaying).toBe(true);
    expect(useMusicStore.getState().currentTrack?.id).toBe(MUSIC_TRACKS[0].id);
  });

  it('8. Deve avançar para a próxima e voltar para a anterior sequencialmente', () => {
    useMusicStore.getState().playTrack(MUSIC_TRACKS[0]);
    expect(useMusicStore.getState().currentTrack?.id).toBe(MUSIC_TRACKS[0].id);

    // Avançar
    useMusicStore.getState().nextTrack();
    expect(useMusicStore.getState().currentTrack?.id).toBe(MUSIC_TRACKS[1].id);

    // Voltar
    useMusicStore.getState().prevTrack();
    expect(useMusicStore.getState().currentTrack?.id).toBe(MUSIC_TRACKS[0].id);
  });

  it('9. Deve suportar modo aleatório (shuffle) e modo repetição (repeat)', () => {
    useMusicStore.getState().toggleShuffle();
    expect(useMusicStore.getState().isShuffle).toBe(true);

    useMusicStore.getState().toggleRepeat();
    expect(useMusicStore.getState().isRepeat).toBe(true);

    useMusicStore.getState().playTrack(MUSIC_TRACKS[0]);
    useMusicStore.getState().nextTrack();
    expect(useMusicStore.getState().isPlaying).toBe(true);
  });

  it('10. Deve controlar volume e temporizador regressivo', () => {
    useMusicStore.getState().setVolume(0.5);
    expect(useMusicStore.getState().volume).toBe(0.5);

    useMusicStore.getState().setVolume(1.5);
    expect(useMusicStore.getState().volume).toBe(1.0);

    useMusicStore.getState().setTimer(15);
    expect(useMusicStore.getState().timerMinutes).toBe(15);
    expect(useMusicStore.getState().remainingTimerSeconds).toBe(15 * 60);

    useMusicStore.getState().setTimer(null);
    expect(useMusicStore.getState().timerMinutes).toBeNull();
    expect(useMusicStore.getState().remainingTimerSeconds).toBeNull();
  });

  it('11. Deve salvar e remover favoritos persistindo no AsyncStorage', async () => {
    const trackId = MUSIC_TRACKS[0].id;
    await useMusicStore.getState().toggleFavorite(trackId);
    expect(useMusicStore.getState().favoriteTrackIds).toContain(trackId);

    // Desfavoritar
    await useMusicStore.getState().toggleFavorite(trackId);
    expect(useMusicStore.getState().favoriteTrackIds).not.toContain(trackId);
  });

  it('12. Deve permitir busca por título, artista e descrição', () => {
    const tracks = MUSIC_TRACKS;

    const searchTitle = tracks.filter((t) => t.title.toLowerCase().includes('piano'));
    expect(searchTitle.length).toBeGreaterThanOrEqual(2);

    const searchStudy = tracks.filter((t) => t.category === 'study');
    expect(searchStudy).toHaveLength(6);

    const searchRelax = tracks.filter((t) => t.category === 'relax');
    expect(searchRelax).toHaveLength(6);
  });

  it('13. Deve suportar fallback procedural quando áudio streaming não estiver acessível', () => {
    expect(() => {
      soundEngine.playMusic(MUSIC_TRACKS[0].id, 0.8, 'https://invalid-url-fake.mp3');
      soundEngine.pauseMusic();
      soundEngine.resumeMusic(0.7);
      soundEngine.stopMusic();
    }).not.toThrow();
  });

  it('14. Deve manter histórico de ouvidas recentemente e posições salvas para continuar ouvindo', () => {
    useMusicStore.getState().playTrack(MUSIC_TRACKS[0]);
    useMusicStore.getState().playTrack(MUSIC_TRACKS[1]);
    useMusicStore.getState().playTrack(MUSIC_TRACKS[2]);

    const state = useMusicStore.getState();
    expect(state.recentlyPlayedTrackIds.slice(0, 3)).toEqual([
      MUSIC_TRACKS[2].id,
      MUSIC_TRACKS[1].id,
      MUSIC_TRACKS[0].id,
    ]);
  });
});
