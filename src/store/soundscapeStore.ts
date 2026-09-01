import { create } from 'zustand';
import { Platform } from 'react-native';
import { Soundscape, SOUNDSCAPES } from '../constants/soundscapes';
import { soundEngine } from '../services/sound/soundEngine';
import { storage } from '../services/storage/asyncStorage';
import { supabase, isSupabaseConfigured } from '../services/supabase/client';
import { favoriteService } from '../services/favorite/favoriteService';
import { useMusicStore } from './musicStore';

interface SoundscapeState {
  soundscapes: Soundscape[];
  currentSoundscape: Soundscape | null;
  secondarySoundscape: Soundscape | null;
  isPlaying: boolean;
  volume: number; // 0.0 to 1.0
  secondaryVolume: number;
  timerMinutes: number | null; // 5, 10, 15, 30, 45, 60
  remainingSeconds: number | null;
  favoriteIds: string[];
  isMiniPlayerVisible: boolean;
  searchQuery: string;
  selectedCategory: string;

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  playSoundscape: (soundscape: Soundscape) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  pauseSoundscape: () => Promise<void>;
  stopSoundscape: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  setSecondarySoundscape: (soundscape: Soundscape | null) => void;
  setSecondaryVolume: (vol: number) => void;
  setTimer: (minutes: number | null) => void;
  toggleFavoriteSound: (id: string, userId?: string) => Promise<{ isFavorite: boolean; message: string; }>;
  closeMiniPlayer: () => Promise<void>;
  tickTimer: () => void;
  loadSavedPreferences: (userId?: string) => Promise<void>;
}

const FAVORITES_STORAGE_KEY = 'respira_soundscape_favorites';
const LAST_PLAYED_KEY = 'respira_last_played_soundscape';

let audioInterval: any = null;

export const useSoundscapeStore = create<SoundscapeState>((set, get) => ({
  soundscapes: SOUNDSCAPES,
  currentSoundscape: null,
  secondarySoundscape: null,
  isPlaying: false,
  volume: 0.8,
  secondaryVolume: 0.5,
  timerMinutes: null,
  remainingSeconds: null,
  favoriteIds: [],
  isMiniPlayerVisible: false,
  searchQuery: '',
  selectedCategory: 'all',

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedCategory: (category: string) => set({ selectedCategory: category }),

  playSoundscape: async (soundscape: Soundscape) => {
    const { volume, timerMinutes } = get();
    const remaining = timerMinutes ? timerMinutes * 60 : null;

    // Pausar qualquer música que esteja tocando para nunca haver 2 sons simultâneos
    try {
      useMusicStore.getState().pauseTrack();
    } catch (_e) {}

    // Iniciar áudio com volume e URL configurados
    soundEngine.ensureRunning();
    soundEngine.setMasterVolume(volume);
    soundEngine.setAmbienceVolume(volume);
    soundEngine.playAmbience(soundscape.id || soundscape.generatorType, volume, soundscape.audioUrl);

    storage.setItem(LAST_PLAYED_KEY, soundscape.id).catch(() => {});

    set({
      currentSoundscape: soundscape,
      isPlaying: true,
      remainingSeconds: remaining,
      isMiniPlayerVisible: true,
    });

    if (audioInterval) clearInterval(audioInterval);
    audioInterval = setInterval(() => {
      get().tickTimer();
    }, 1000);
  },

  togglePlayPause: async () => {
    const { isPlaying, currentSoundscape, soundscapes, playSoundscape, volume } = get();
    if (!currentSoundscape) {
      if (soundscapes.length > 0) {
        playSoundscape(soundscapes[0]);
      }
      return;
    }

    if (isPlaying) {
      soundEngine.pauseAmbience();
      set({ isPlaying: false });
    } else {
      try {
        useMusicStore.getState().pauseTrack();
      } catch (_e) {}
      soundEngine.ensureRunning();
      soundEngine.setMasterVolume(volume);
      soundEngine.setAmbienceVolume(volume);
      soundEngine.resumeAmbience(volume);
      set({ isPlaying: true });
    }
  },

  pauseSoundscape: async () => {
    soundEngine.pauseAmbience();
    set({ isPlaying: false });
  },

  stopSoundscape: async () => {
    soundEngine.stopAmbience();
    if (audioInterval) clearInterval(audioInterval);
    set({
      isPlaying: false,
      currentSoundscape: null,
      secondarySoundscape: null,
      remainingSeconds: null,
      isMiniPlayerVisible: false,
    });
  },

  setVolume: async (newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    soundEngine.setMasterVolume(clamped);
    soundEngine.setAmbienceVolume(clamped);
    set({ volume: clamped });
  },

  setSecondarySoundscape: (soundscape: Soundscape | null) => {
    set({ secondarySoundscape: soundscape });
  },

  setSecondaryVolume: (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    set({ secondaryVolume: clamped });
  },

  setTimer: (minutes: number | null) => {
    set({
      timerMinutes: minutes,
      remainingSeconds: minutes ? minutes * 60 : null,
    });
  },

  toggleFavoriteSound: async (id: string, userId?: string) => {
    const effectiveUserId = userId || 'local-user';
    const result = await favoriteService.toggleFavorite(id, 'soundscape', effectiveUserId);
    const favoriteIds = await favoriteService.getFavorites(effectiveUserId, 'soundscape');
    set({ favoriteIds });
    return result;
  },

  closeMiniPlayer: async () => {
    soundEngine.stopAmbience();
    if (audioInterval) clearInterval(audioInterval);
    set({
      isPlaying: false,
      isMiniPlayerVisible: false,
      currentSoundscape: null,
      secondarySoundscape: null,
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

  loadSavedPreferences: async (userId?: string) => {
    try {
      if (userId) {
        const favoriteIds = await favoriteService.getFavorites(userId, 'soundscape');
        set({ favoriteIds });
      } else {
        set({ favoriteIds: [] });
      }
    } catch {}
  },
}));
