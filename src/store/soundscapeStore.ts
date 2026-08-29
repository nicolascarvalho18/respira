import { create } from 'zustand';
import { Platform } from 'react-native';
import { Soundscape, SOUNDSCAPES } from '../constants/soundscapes';
import { soundEngine } from '../services/sound/soundEngine';
import { storage } from '../services/storage/asyncStorage';
import { supabase, isSupabaseConfigured } from '../services/supabase/client';

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
  toggleFavoriteSound: (id: string, userId?: string) => Promise<void>;
  closeMiniPlayer: () => Promise<void>;
  tickTimer: () => void;
  loadSavedPreferences: (userId?: string) => Promise<void>;
}

const FAVORITES_STORAGE_KEY = 'respira_soundscape_favorites';
const LAST_PLAYED_KEY = 'respira_last_played_soundscape';

let primaryAudio: any = null;
let secondaryAudio: any = null;
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

    soundEngine.ensureRunning();
    soundEngine.setMasterVolume(volume);
    soundEngine.setAmbienceVolume(volume);
    soundEngine.playAmbience(soundscape.generatorType || soundscape.id, volume);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (!primaryAudio) {
          primaryAudio = new (window as any).Audio();
        }
        primaryAudio.crossOrigin = 'anonymous';
        primaryAudio.src = soundscape.audioUrl;
        primaryAudio.volume = volume;
        primaryAudio.loop = true;
        primaryAudio.play().catch(() => {});
      } catch (err) {
        console.warn('[Soundscape HTML5 Audio Notice, WebAudio active]:', err);
      }
    }

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
      soundEngine.stopAmbience();
      if (Platform.OS === 'web' && primaryAudio) {
        primaryAudio.pause();
      }
      if (Platform.OS === 'web' && secondaryAudio) {
        secondaryAudio.pause();
      }
      set({ isPlaying: false });
    } else {
      soundEngine.ensureRunning();
      soundEngine.playAmbience(currentSoundscape.generatorType || currentSoundscape.id, volume);
      if (Platform.OS === 'web' && primaryAudio) {
        primaryAudio.play().catch(() => {});
      }
      if (Platform.OS === 'web' && secondaryAudio) {
        secondaryAudio.play().catch(() => {});
      }
      set({ isPlaying: true });
    }
  },

  pauseSoundscape: async () => {
    soundEngine.stopAmbience();
    if (Platform.OS === 'web' && primaryAudio) {
      primaryAudio.pause();
    }
    if (Platform.OS === 'web' && secondaryAudio) {
      secondaryAudio.pause();
    }
    set({ isPlaying: false });
  },

  stopSoundscape: async () => {
    soundEngine.stopAmbience();
    if (Platform.OS === 'web' && primaryAudio) {
      primaryAudio.pause();
    }
    if (Platform.OS === 'web' && secondaryAudio) {
      secondaryAudio.pause();
    }
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
    if (Platform.OS === 'web' && primaryAudio) {
      try {
        primaryAudio.volume = clamped;
      } catch (_e) {}
    }
    set({ volume: clamped });
  },

  setSecondarySoundscape: (soundscape: Soundscape | null) => {
    const { isPlaying, secondaryVolume } = get();
    if (!soundscape) {
      if (Platform.OS === 'web' && secondaryAudio) {
        secondaryAudio.pause();
      }
      set({ secondarySoundscape: null });
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (!secondaryAudio) {
          secondaryAudio = new (window as any).Audio();
        }
        secondaryAudio.crossOrigin = 'anonymous';
        secondaryAudio.src = soundscape.audioUrl;
        secondaryAudio.volume = secondaryVolume;
        secondaryAudio.loop = true;
        if (isPlaying) {
          secondaryAudio.play().catch(() => {});
        }
      } catch (err) {
        console.warn('[Secondary Soundscape Audio Notice]:', err);
      }
    }

    set({ secondarySoundscape: soundscape });
  },

  setSecondaryVolume: (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    if (Platform.OS === 'web' && secondaryAudio) {
      try {
        secondaryAudio.volume = clamped;
      } catch (_e) {}
    }
    set({ secondaryVolume: clamped });
  },

  setTimer: (minutes: number | null) => {
    set({
      timerMinutes: minutes,
      remainingSeconds: minutes ? minutes * 60 : null,
    });
  },

  toggleFavoriteSound: async (id: string, userId?: string) => {
    const { favoriteIds } = get();
    const isFav = favoriteIds.includes(id);
    const updated = isFav ? favoriteIds.filter((f) => f !== id) : [...favoriteIds, id];
    set({ favoriteIds: updated });
    await storage.setItem(FAVORITES_STORAGE_KEY, updated);

    if (userId && isSupabaseConfigured) {
      try {
        await supabase.from('user_favorites').upsert(
          {
            user_id: userId,
            item_id: id,
            item_type: 'soundscape',
            is_active: !isFav,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,item_id,item_type' }
        );
      } catch (_e) {}
    }
  },

  closeMiniPlayer: async () => {
    soundEngine.stopAmbience();
    if (Platform.OS === 'web' && primaryAudio) {
      primaryAudio.pause();
    }
    if (Platform.OS === 'web' && secondaryAudio) {
      secondaryAudio.pause();
    }
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
      const cachedFavs = await storage.getItem<string[]>(FAVORITES_STORAGE_KEY);
      if (cachedFavs) {
        set({ favoriteIds: cachedFavs });
      }

      if (userId && isSupabaseConfigured) {
        try {
          const { data } = await supabase
            .from('user_favorites')
            .select('item_id')
            .eq('user_id', userId)
            .eq('item_type', 'soundscape')
            .eq('is_active', true);

          if (data && data.length > 0) {
            const dbFavs = data.map((d: any) => d.item_id);
            const combined = Array.from(new Set([...(cachedFavs || []), ...dbFavs]));
            set({ favoriteIds: combined });
          }
        } catch (_e) {}
      }
    } catch {}
  },
}));
