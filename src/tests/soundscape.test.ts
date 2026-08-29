import { useSoundscapeStore } from '../store/soundscapeStore';
import { SOUNDSCAPES } from '../constants/soundscapes';

describe('Soundscape Store & Ambient Audio', () => {
  beforeEach(() => {
    useSoundscapeStore.getState().stopSoundscape();
  });

  it('should have calming soundscapes in the library', () => {
    expect(SOUNDSCAPES.length).toBeGreaterThanOrEqual(6);
    expect(SOUNDSCAPES.map((s) => s.name)).toContain('Ondas do mar');
    expect(SOUNDSCAPES.map((s) => s.name)).toContain('Fogueira');
    expect(SOUNDSCAPES.map((s) => s.name)).toContain('Ruído branco');
    expect(SOUNDSCAPES.map((s) => s.name)).toContain('Ruído marrom');
  });

  it('should start playing a soundscape and display miniplayer', async () => {
    const rain = SOUNDSCAPES[0];
    await useSoundscapeStore.getState().playSoundscape(rain);

    const state = useSoundscapeStore.getState();
    expect(state.isPlaying).toBe(true);
    expect(state.currentSoundscape?.id).toBe(rain.id);
    expect(state.isMiniPlayerVisible).toBe(true);
  });

  it('should toggle play/pause correctly', async () => {
    const rain = SOUNDSCAPES[0];
    await useSoundscapeStore.getState().playSoundscape(rain);
    await useSoundscapeStore.getState().togglePlayPause();

    expect(useSoundscapeStore.getState().isPlaying).toBe(false);

    await useSoundscapeStore.getState().togglePlayPause();
    expect(useSoundscapeStore.getState().isPlaying).toBe(true);
  });

  it('should clamp volume between 0 and 1', async () => {
    await useSoundscapeStore.getState().setVolume(1.5);
    expect(useSoundscapeStore.getState().volume).toBe(1.0);

    await useSoundscapeStore.getState().setVolume(-0.5);
    expect(useSoundscapeStore.getState().volume).toBe(0.0);

    await useSoundscapeStore.getState().setVolume(0.65);
    expect(useSoundscapeStore.getState().volume).toBe(0.65);
  });

  it('should handle countdown timer correctly', () => {
    useSoundscapeStore.getState().setTimer(15);
    expect(useSoundscapeStore.getState().timerMinutes).toBe(15);
    expect(useSoundscapeStore.getState().remainingSeconds).toBe(15 * 60);

    useSoundscapeStore.getState().setTimer(null);
    expect(useSoundscapeStore.getState().timerMinutes).toBe(null);
    expect(useSoundscapeStore.getState().remainingSeconds).toBe(null);
  });

  it('should toggle favorite soundscapes', async () => {
    const rainId = SOUNDSCAPES[0].id;
    await useSoundscapeStore.getState().toggleFavoriteSound(rainId);
    expect(useSoundscapeStore.getState().favoriteIds).toContain(rainId);

    await useSoundscapeStore.getState().toggleFavoriteSound(rainId);
    expect(useSoundscapeStore.getState().favoriteIds).not.toContain(rainId);
  });
});
