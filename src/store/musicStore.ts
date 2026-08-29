import { create } from 'zustand';
import { Platform } from 'react-native';
import { MusicTrack } from '../types';
import { MUSIC_TRACKS } from '../constants/musicTracks';
import { soundEngine } from '../services/sound/soundEngine';
import { storage } from '../services/storage/asyncStorage';
import { supabase, isSupabaseConfigured } from '../services/supabase/client';

const FAVORITE_MUSIC_KEY = 'respira_favorite_music_tracks';
const LAST_PLAYED_MUSIC_KEY = 'respira_last_played_music_id';

interface MusicState {
  tracks: MusicTrack[];
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
  volume: number;
  timerMinutes: number | null;
  remainingTimerSeconds: number | null;
  favoriteTrackIds: string[];
  searchQuery: string;
  selectedCategory: string;

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  playTrack: (track: MusicTrack) => void;
  togglePlayPause: () => void;
  pauseTrack: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setTimer: (minutes: number | null) => void;
  toggleFavorite: (trackId: string, userId?: string) => Promise<void>;
  loadSavedPreferences: (userId?: string) => Promise<void>;
}

let timerInterval: any = null;
let progressInterval: any = null;

export const useMusicStore = create<MusicState>((set, get) => ({
  tracks: MUSIC_TRACKS,
  currentTrack: null,
  isPlaying: false,
  positionSeconds: 0,
  durationSeconds: 0,
  volume: 0.8,
  timerMinutes: null,
  remainingTimerSeconds: null,
  favoriteTrackIds: [],
  searchQuery: '',
  selectedCategory: 'all',

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedCategory: (category: string) => set({ selectedCategory: category }),

  playTrack: (track: MusicTrack) => {
    const { volume } = get();

    // Iniciar áudio procedural garantido imediatamente
    soundEngine.ensureRunning();
    soundEngine.setMasterVolume(volume);
    soundEngine.setMusicVolume(volume);
    soundEngine.playMusic(track.id, volume);

    storage.setItem(LAST_PLAYED_MUSIC_KEY, track.id).catch(() => {});

    set({
      currentTrack: track,
      isPlaying: true,
      positionSeconds: 0,
      durationSeconds: track.durationSeconds || 300,
    });

    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      const { positionSeconds, durationSeconds, isPlaying } = get();
      if (!isPlaying) return;

      if (positionSeconds >= durationSeconds) {
        set({ positionSeconds: 0 });
      } else {
        set({ positionSeconds: positionSeconds + 1 });
      }
    }, 1000);
  },

  togglePlayPause: () => {
    const { isPlaying, currentTrack, tracks, playTrack, volume } = get();
    if (!currentTrack) {
      if (tracks.length > 0) {
        playTrack(tracks[0]);
      }
      return;
    }

    if (isPlaying) {
      soundEngine.stopMusic();
      set({ isPlaying: false });
    } else {
      soundEngine.ensureRunning();
      soundEngine.setMasterVolume(volume);
      soundEngine.setMusicVolume(volume);
      soundEngine.playMusic(currentTrack.id, volume);
      set({ isPlaying: true });
    }
  },

  pauseTrack: () => {
    soundEngine.stopMusic();
    set({ isPlaying: false });
  },

  nextTrack: () => {
    const { tracks, currentTrack, playTrack } = get();
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    playTrack(tracks[nextIndex]);
  },

  prevTrack: () => {
    const { tracks, currentTrack, playTrack } = get();
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    playTrack(tracks[prevIndex]);
  },

  seekTo: (seconds: number) => {
    set({ positionSeconds: seconds });
  },

  setVolume: (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    soundEngine.setMasterVolume(clamped);
    soundEngine.setMusicVolume(clamped);
    set({ volume: clamped });
  },

  setTimer: (minutes: number | null) => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (!minutes) {
      set({ timerMinutes: null, remainingTimerSeconds: null });
      return;
    }

    const totalSeconds = minutes * 60;
    set({ timerMinutes: minutes, remainingTimerSeconds: totalSeconds });

    timerInterval = setInterval(() => {
      const { remainingTimerSeconds } = get();
      if (remainingTimerSeconds === null || remainingTimerSeconds <= 1) {
        get().pauseTrack();
        if (timerInterval) clearInterval(timerInterval);
        set({ timerMinutes: null, remainingTimerSeconds: null });
      } else {
        set({ remainingTimerSeconds: remainingTimerSeconds - 1 });
      }
    }, 1000);
  },

  toggleFavorite: async (trackId: string, userId?: string) => {
    const { favoriteTrackIds } = get();
    const isFav = favoriteTrackIds.includes(trackId);
    const updated = isFav ? favoriteTrackIds.filter((id) => id !== trackId) : [...favoriteTrackIds, trackId];

    set({ favoriteTrackIds: updated });
    await storage.setItem(FAVORITE_MUSIC_KEY, updated);

    if (userId && isSupabaseConfigured) {
      try {
        await supabase.from('user_favorites').upsert(
          {
            user_id: userId,
            item_id: trackId,
            item_type: 'music',
            is_active: !isFav,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,item_id,item_type' }
        );
      } catch (_e) {}
    }
  },

  loadSavedPreferences: async (userId?: string) => {
    try {
      const cached = await storage.getItem<string[]>(FAVORITE_MUSIC_KEY);
      if (cached) {
        set({ favoriteTrackIds: cached });
      }

      if (userId && isSupabaseConfigured) {
        try {
          const { data } = await supabase
            .from('user_favorites')
            .select('item_id')
            .eq('user_id', userId)
            .eq('item_type', 'music')
            .eq('is_active', true);

          if (data && data.length > 0) {
            const dbFavs = data.map((d: any) => d.item_id);
            const combined = Array.from(new Set([...(cached || []), ...dbFavs]));
            set({ favoriteTrackIds: combined });
          }
        } catch (_e) {}
      }
    } catch {}
  },
}));
