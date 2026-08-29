import { create } from 'zustand';
import { Platform } from 'react-native';
import { MusicTrack } from '../types';
import { MUSIC_TRACKS } from '../constants/musicTracks';
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

let audioInstance: any = null;
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

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (!audioInstance) {
          audioInstance = new (window as any).Audio();
        }
        audioInstance.src = track.audioUrl;
        audioInstance.volume = volume;
        audioInstance.loop = true;
        audioInstance.play().catch(() => {});

        if (progressInterval) clearInterval(progressInterval);
        progressInterval = setInterval(() => {
          if (audioInstance && !audioInstance.paused) {
            set({
              positionSeconds: Math.floor(audioInstance.currentTime),
              durationSeconds: Math.floor(audioInstance.duration || track.durationSeconds),
            });
          }
        }, 500);
      } catch (err) {
        console.warn('[Music Player Web Error]:', err);
      }
    }

    storage.setItem(LAST_PLAYED_MUSIC_KEY, track.id).catch(() => {});

    set({
      currentTrack: track,
      isPlaying: true,
      positionSeconds: 0,
      durationSeconds: track.durationSeconds,
    });
  },

  togglePlayPause: () => {
    const { isPlaying, currentTrack, tracks, playTrack } = get();
    if (!currentTrack) {
      if (tracks.length > 0) {
        playTrack(tracks[0]);
      }
      return;
    }

    if (isPlaying) {
      if (Platform.OS === 'web' && audioInstance) {
        audioInstance.pause();
      }
      set({ isPlaying: false });
    } else {
      if (Platform.OS === 'web' && audioInstance) {
        audioInstance.play().catch(() => {});
      }
      set({ isPlaying: true });
    }
  },

  pauseTrack: () => {
    if (Platform.OS === 'web' && audioInstance) {
      audioInstance.pause();
    }
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
    if (Platform.OS === 'web' && audioInstance) {
      audioInstance.currentTime = seconds;
    }
    set({ positionSeconds: seconds });
  },

  setVolume: (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    if (Platform.OS === 'web' && audioInstance) {
      audioInstance.volume = clamped;
    }
    set({ volume: clamped });
  },

  setTimer: (minutes: number | null) => {
    if (timerInterval) clearInterval(timerInterval);

    if (!minutes) {
      set({ timerMinutes: null, remainingTimerSeconds: null });
      return;
    }

    const totalSeconds = minutes * 60;
    set({ timerMinutes: minutes, remainingTimerSeconds: totalSeconds });

    timerInterval = setInterval(() => {
      const { remainingTimerSeconds, pauseTrack } = get();
      if (!remainingTimerSeconds || remainingTimerSeconds <= 1) {
        clearInterval(timerInterval);
        pauseTrack();
        set({ timerMinutes: null, remainingTimerSeconds: null });
      } else {
        set({ remainingTimerSeconds: remainingTimerSeconds - 1 });
      }
    }, 1000);
  },

  toggleFavorite: async (trackId: string, userId?: string) => {
    const { favoriteTrackIds } = get();
    const isFav = favoriteTrackIds.includes(trackId);
    const updated = isFav
      ? favoriteTrackIds.filter((id) => id !== trackId)
      : [...favoriteTrackIds, trackId];

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
      } catch (_e) {
        // Ignorado se tabela ainda não criada
      }
    }
  },

  loadSavedPreferences: async (userId?: string) => {
    try {
      const cachedFavs = await storage.getItem<string[]>(FAVORITE_MUSIC_KEY);
      if (cachedFavs) {
        set({ favoriteTrackIds: cachedFavs });
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
            const combined = Array.from(new Set([...(cachedFavs || []), ...dbFavs]));
            set({ favoriteTrackIds: combined });
          }
        } catch (_e) {
          // Ignorado
        }
      }
    } catch {
      // Ignorado
    }
  },
}));
