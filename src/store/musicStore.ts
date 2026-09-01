import { create } from 'zustand';
import { Platform } from 'react-native';
import { MusicTrack, RepeatMode } from '../types';
import { MUSIC_TRACKS } from '../constants/musicTracks';
import { soundEngine } from '../services/sound/soundEngine';
import { storage } from '../services/storage/asyncStorage';
import { supabase, isSupabaseConfigured } from '../services/supabase/client';
import { favoriteService } from '../services/favorite/favoriteService';

const FAVORITE_MUSIC_KEY = 'respira_favorite_music_tracks';
const LAST_PLAYED_MUSIC_KEY = 'respira_last_played_music_id';
const RECENTLY_PLAYED_MUSIC_KEY = 'respira_recently_played_music_ids';
const MUSIC_SAVED_POSITIONS_KEY = 'respira_music_saved_positions';

interface MusicState {
  tracks: MusicTrack[];
  queue: MusicTrack[];
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isRepeat: boolean; // Retrocompatibilidade
  timerMinutes: number | null;
  remainingTimerSeconds: number | null;
  favoriteTrackIds: string[];
  recentlyPlayedTrackIds: string[];
  savedPositions: Record<string, number>;
  searchQuery: string;
  selectedCategory: string;
  isFullScreenPlayerOpen: boolean;
  currentUserId: string | null;

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  playTrack: (track: MusicTrack, startPosition?: number) => void;
  playFromQueue: (index: number) => void;
  setQueue: (queue: MusicTrack[]) => void;
  togglePlayPause: () => void;
  pauseTrack: () => void;
  stopTrack: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  toggleRepeat: () => void;
  setTimer: (minutes: number | null) => void;
  toggleFavorite: (trackId: string, userId?: string) => Promise<any>;
  loadSavedPreferences: (userId?: string) => Promise<void>;
  setFullScreenPlayerOpen: (open: boolean) => void;
}

let timerInterval: any = null;
let progressInterval: any = null;

export const useMusicStore = create<MusicState>((set, get) => ({
  tracks: MUSIC_TRACKS,
  queue: MUSIC_TRACKS,
  currentTrack: null,
  isPlaying: false,
  positionSeconds: 0,
  durationSeconds: 0,
  volume: 0.8,
  isShuffle: false,
  repeatMode: 'off',
  isRepeat: false,
  timerMinutes: null,
  remainingTimerSeconds: null,
  favoriteTrackIds: [],
  recentlyPlayedTrackIds: [],
  savedPositions: {},
  searchQuery: '',
  selectedCategory: 'all',
  isFullScreenPlayerOpen: false,
  currentUserId: null,

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedCategory: (category: string) => set({ selectedCategory: category }),

  playTrack: (track: MusicTrack, startPosition?: number) => {
    const { volume, recentlyPlayedTrackIds, savedPositions } = get();

    // 1. Pausar som ambiente ativo para que nunca toquem 2 sons ao mesmo tempo
    try {
      soundEngine.stopAmbience();
    } catch (_e) {}

    const initialPos = startPosition !== undefined ? startPosition : savedPositions[track.id] || 0;

    // 2. Iniciar áudio com streaming ou síntese procedural
    soundEngine.ensureRunning();
    soundEngine.setMasterVolume(volume);
    soundEngine.setMusicVolume(volume);
    soundEngine.playMusic(track.id, volume, track.audioUrl);
    if (initialPos > 0) {
      soundEngine.seekMusic(initialPos);
    }

    // 3. Atualizar histórico de ouvidas recentemente
    const updatedRecent = Array.from(new Set([track.id, ...recentlyPlayedTrackIds])).slice(0, 10);
    const userSuffix = get().currentUserId ? `_${get().currentUserId}` : '';
    storage.setItem(`${RECENTLY_PLAYED_MUSIC_KEY}${userSuffix}`, updatedRecent).catch(() => {});
    storage.setItem(`${LAST_PLAYED_MUSIC_KEY}${userSuffix}`, track.id).catch(() => {});

    set({
      currentTrack: track,
      isPlaying: true,
      positionSeconds: initialPos,
      durationSeconds: track.durationSeconds || 300,
      recentlyPlayedTrackIds: updatedRecent,
    });

    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      const { positionSeconds, durationSeconds, isPlaying, repeatMode, isRepeat, nextTrack, currentUserId } = get();
      if (!isPlaying) return;

      if (positionSeconds >= durationSeconds) {
        if (repeatMode === 'one' || isRepeat) {
          set({ positionSeconds: 0 });
          soundEngine.seekMusic(0);
        } else {
          nextTrack();
        }
      } else {
        const nextPos = positionSeconds + 1;
        set({ positionSeconds: nextPos });
        if (nextPos % 5 === 0) {
          const { currentTrack, savedPositions } = get();
          if (currentTrack) {
            const updatedPos = { ...savedPositions, [currentTrack.id]: nextPos };
            set({ savedPositions: updatedPos });
            const sfx = currentUserId ? `_${currentUserId}` : '';
            storage.setItem(`${MUSIC_SAVED_POSITIONS_KEY}${sfx}`, updatedPos).catch(() => {});
          }
        }
      }
    }, 1000);
  },

  playFromQueue: (index: number) => {
    const { queue, playTrack } = get();
    if (index >= 0 && index < queue.length) {
      playTrack(queue[index], 0);
    }
  },

  setQueue: (newQueue: MusicTrack[]) => {
    set({ queue: newQueue });
  },

  setFullScreenPlayerOpen: (open: boolean) => {
    set({ isFullScreenPlayerOpen: open });
  },

  togglePlayPause: () => {
    const { isPlaying, currentTrack, tracks, playTrack, volume, positionSeconds } = get();
    if (!currentTrack) {
      if (tracks.length > 0) {
        playTrack(tracks[0]);
      }
      return;
    }

    if (isPlaying) {
      soundEngine.pauseMusic();
      const { savedPositions } = get();
      const updatedPos = { ...savedPositions, [currentTrack.id]: positionSeconds };
      set({ isPlaying: false, savedPositions: updatedPos });
      storage.setItem(MUSIC_SAVED_POSITIONS_KEY, updatedPos).catch(() => {});
    } else {
      soundEngine.ensureRunning();
      soundEngine.setMasterVolume(volume);
      soundEngine.setMusicVolume(volume);
      soundEngine.resumeMusic(volume);
      set({ isPlaying: true });
    }
  },

  pauseTrack: () => {
    const { currentTrack, positionSeconds, savedPositions } = get();
    soundEngine.pauseMusic();
    if (currentTrack) {
      const updatedPos = { ...savedPositions, [currentTrack.id]: positionSeconds };
      set({ isPlaying: false, savedPositions: updatedPos });
      storage.setItem(MUSIC_SAVED_POSITIONS_KEY, updatedPos).catch(() => {});
    } else {
      set({ isPlaying: false });
    }
  },

  stopTrack: () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    soundEngine.stopMusic();
    set({ isPlaying: false, currentTrack: null, positionSeconds: 0 });
  },

  nextTrack: () => {
    const { queue, tracks, currentTrack, playTrack, isShuffle, repeatMode } = get();
    const list = queue.length > 0 ? queue : tracks;
    if (!currentTrack || list.length === 0) return;

    if (repeatMode === 'one') {
      playTrack(currentTrack, 0);
      return;
    }

    if (isShuffle && list.length > 1) {
      let randIdx = Math.floor(Math.random() * list.length);
      const curIdx = list.findIndex((t) => t.id === currentTrack.id);
      while (randIdx === curIdx && list.length > 1) {
        randIdx = Math.floor(Math.random() * list.length);
      }
      playTrack(list[randIdx], 0);
      return;
    }

    const currentIndex = list.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex === list.length - 1 && repeatMode === 'off') {
      // Chegou ao fim da fila no modo sem repetição
      get().pauseTrack();
      set({ positionSeconds: 0 });
      return;
    }

    const nextIndex = (currentIndex + 1) % list.length;
    playTrack(list[nextIndex], 0);
  },

  prevTrack: () => {
    const { queue, tracks, currentTrack, playTrack, isShuffle, positionSeconds } = get();
    const list = queue.length > 0 ? queue : tracks;
    if (!currentTrack || list.length === 0) return;

    // Se já tocou mais de 3 segundos, volta para o início da mesma faixa
    if (positionSeconds > 3) {
      get().seekTo(0);
      return;
    }

    if (isShuffle && list.length > 1) {
      let randIdx = Math.floor(Math.random() * list.length);
      const curIdx = list.findIndex((t) => t.id === currentTrack.id);
      while (randIdx === curIdx && list.length > 1) {
        randIdx = Math.floor(Math.random() * list.length);
      }
      playTrack(list[randIdx], 0);
      return;
    }

    const currentIndex = list.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    playTrack(list[prevIndex], 0);
  },

  seekTo: (seconds: number) => {
    const { durationSeconds } = get();
    const clamped = Math.max(0, Math.min(durationSeconds, seconds));
    soundEngine.seekMusic(clamped);
    set({ positionSeconds: clamped });
  },

  setVolume: (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    soundEngine.setMasterVolume(clamped);
    soundEngine.setMusicVolume(clamped);
    set({ volume: clamped });
  },

  toggleShuffle: () => {
    set((state) => ({ isShuffle: !state.isShuffle }));
  },

  cycleRepeatMode: () => {
    set((state) => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const nextMode = modes[(modes.indexOf(state.repeatMode) + 1) % modes.length];
      return { repeatMode: nextMode, isRepeat: nextMode !== 'off' };
    });
  },

  toggleRepeat: () => {
    get().cycleRepeatMode();
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
    const effectiveUserId = userId || 'local-user';
    const result = await favoriteService.toggleFavorite(trackId, 'music', effectiveUserId);
    const favoriteTrackIds = await favoriteService.getFavorites(effectiveUserId, 'music');
    set({ favoriteTrackIds });
    return result;
  },

  loadSavedPreferences: async (userId?: string) => {
    try {
      set({ currentUserId: userId || null });
      const userSuffix = userId ? `_${userId}` : '';
      const cachedRecent = userId ? await storage.getItem<string[]>(`${RECENTLY_PLAYED_MUSIC_KEY}${userSuffix}`) : [];
      const cachedPositions = userId ? await storage.getItem<Record<string, number>>(`${MUSIC_SAVED_POSITIONS_KEY}${userSuffix}`) : {};

      set({
        recentlyPlayedTrackIds: cachedRecent || [],
        savedPositions: cachedPositions || {},
      });

      if (userId) {
        const favoriteTrackIds = await favoriteService.getFavorites(userId, 'music');
        set({ favoriteTrackIds });
      } else {
        set({ favoriteTrackIds: [] });
      }
    } catch {}
  },
}));
