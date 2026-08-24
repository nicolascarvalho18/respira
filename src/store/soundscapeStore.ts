import { create } from 'zustand';
import { Soundscape } from '../constants/soundscapes';
import { storage } from '../services/storage/asyncStorage';
import { soundEngine, AmbienceType } from '../services/sound/soundEngine';

interface SoundscapeState {
  currentSoundscape: Soundscape | null;
  isPlaying: boolean;
  volume: number; // 0.0 to 1.0
  timerMinutes: number | null; // 15, 30, 45, 60, or null
  remainingSeconds: number | null;
  favoriteIds: string[];
  isMiniPlayerVisible: boolean;

  // Actions
  playSoundscape: (soundscape: Soundscape) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  pauseSoundscape: () => Promise<void>;
  stopSoundscape: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  setTimer: (minutes: number | null) => void;
  toggleFavoriteSound: (id: string) => Promise<void>;
  closeMiniPlayer: () => Promise<void>;
  tickTimer: () => void;
}

const FAVORITES_STORAGE_KEY = 'respira_soundscape_favorites';
let audioInterval: ReturnType<typeof setInterval> | null = null;

function mapGeneratorToAmbience(gen: string): AmbienceType {
  if (gen === 'waves') return 'waves';
  if (gen === 'rain') return 'rain';
  if (gen === 'forest') return 'forest';
  if (gen === 'brown_noise') return 'brown_noise';
  return 'waves';
}

export const useSoundscapeStore = create<SoundscapeState>((set, get) => ({
  currentSoundscape: null,
  isPlaying: false,
  volume: 0.7,
  timerMinutes: null,
  remainingSeconds: null,
  favoriteIds: [],
  isMiniPlayerVisible: false,

  playSoundscape: async (soundscape: Soundscape) => {
    const { volume, timerMinutes } = get();
    const remaining = timerMinutes ? timerMinutes * 60 : null;

    set({
      currentSoundscape: soundscape,
      isPlaying: true,
      remainingSeconds: remaining,
      isMiniPlayerVisible: true,
    });

    const ambType = mapGeneratorToAmbience(soundscape.generatorType);
    soundEngine.playAmbience(ambType, volume);

    if (audioInterval) clearInterval(audioInterval);
    audioInterval = setInterval(() => {
      get().tickTimer();
    }, 1000);
  },

  togglePlayPause: async () => {
    const { isPlaying, currentSoundscape, volume } = get();
    if (!currentSoundscape) return;

    if (isPlaying) {
      soundEngine.stopAmbience();
      set({ isPlaying: false });
    } else {
      set({ isPlaying: true });
      const ambType = mapGeneratorToAmbience(currentSoundscape.generatorType);
      soundEngine.playAmbience(ambType, volume);
    }
  },

  pauseSoundscape: async () => {
    soundEngine.stopAmbience();
    set({ isPlaying: false });
  },

  stopSoundscape: async () => {
    soundEngine.stopAmbience();
    if (audioInterval) clearInterval(audioInterval);
    set({
      isPlaying: false,
      currentSoundscape: null,
      remainingSeconds: null,
      isMiniPlayerVisible: false,
    });
  },

  setVolume: async (newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    set({ volume: clamped });
    const { isPlaying, currentSoundscape } = get();
    if (isPlaying && currentSoundscape) {
      const ambType = mapGeneratorToAmbience(currentSoundscape.generatorType);
      soundEngine.playAmbience(ambType, clamped);
    }
  },

  setTimer: (minutes: number | null) => {
    set({
      timerMinutes: minutes,
      remainingSeconds: minutes ? minutes * 60 : null,
    });
  },

  toggleFavoriteSound: async (id: string) => {
    const { favoriteIds } = get();
    const isFav = favoriteIds.includes(id);
    const updated = isFav ? favoriteIds.filter((f) => f !== id) : [...favoriteIds, id];
    set({ favoriteIds: updated });
    await storage.setItem(FAVORITES_STORAGE_KEY, updated);
  },

  closeMiniPlayer: async () => {
    soundEngine.stopAmbience();
    if (audioInterval) clearInterval(audioInterval);
    set({
      isPlaying: false,
      isMiniPlayerVisible: false,
      currentSoundscape: null,
      remainingSeconds: null,
    });
  },

  tickTimer: () => {
    const { remainingSeconds, isPlaying } = get();
    if (!isPlaying || remainingSeconds === null) return;

    if (remainingSeconds <= 1) {
      get().pauseSoundscape();
      set({ remainingSeconds: null, timerMinutes: null });
    } else {
      set({ remainingSeconds: remainingSeconds - 1 });
    }
  },
}));
