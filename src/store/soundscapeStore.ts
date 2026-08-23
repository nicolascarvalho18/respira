import { create } from 'zustand';
import { Platform } from 'react-native';
import { Soundscape } from '../constants/soundscapes';
import { storage } from '../services/storage/asyncStorage';

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
let webAudioContext: any = null;
let webAudioGain: any = null;
let webAudioSource: any = null;

// Synthetic ambient sound generator on web
function startWebAudioSynth(type: string, volume: number) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    if (!webAudioContext) {
      webAudioContext = new AudioCtx();
    }
    if (webAudioContext.state === 'suspended') {
      webAudioContext.resume();
    }

    if (webAudioSource) {
      try {
        webAudioSource.stop();
        webAudioSource.disconnect();
      } catch (_err) {
        // Ignored
      }
    }

    const bufferSize = webAudioContext.sampleRate * 2;
    const buffer = webAudioContext.createBuffer(1, bufferSize, webAudioContext.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'brown_noise' || type === 'waves') {
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      } else if (type === 'rain' || type === 'forest') {
        data[i] = (lastOut + 0.05 * white) / 1.05;
        lastOut = data[i];
        data[i] *= 2.0;
      } else {
        data[i] = white * 0.15;
      }
    }

    const noiseNode = webAudioContext.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;

    // Filter
    const filter = webAudioContext.createBiquadFilter();
    filter.type = type === 'brown_noise' ? 'lowpass' : type === 'rain' ? 'bandpass' : 'lowpass';
    filter.frequency.value = type === 'brown_noise' ? 400 : type === 'rain' ? 1200 : 800;

    // Gain node for smooth fade-in
    webAudioGain = webAudioContext.createGain();
    webAudioGain.gain.setValueAtTime(0.01, webAudioContext.currentTime);
    webAudioGain.gain.linearRampToValueAtTime(
      Math.max(0.01, volume * 0.4),
      webAudioContext.currentTime + 0.6
    );

    noiseNode.connect(filter);
    filter.connect(webAudioGain);
    webAudioGain.connect(webAudioContext.destination);

    noiseNode.start();
    webAudioSource = noiseNode;
  } catch (err) {
    console.warn('[SoundscapeAudio] Audio context init warning:', err);
  }
}

function stopWebAudioSynth() {
  if (webAudioGain && webAudioContext) {
    try {
      webAudioGain.gain.linearRampToValueAtTime(0.001, webAudioContext.currentTime + 0.4);
      setTimeout(() => {
        if (webAudioSource) {
          try {
            webAudioSource.stop();
          } catch (_err) {
            // Ignored
          }
        }
      }, 450);
    } catch (_err) {
      // Ignored
    }
  }
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

    // Set countdown if timer is set
    const remaining = timerMinutes ? timerMinutes * 60 : null;

    set({
      currentSoundscape: soundscape,
      isPlaying: true,
      remainingSeconds: remaining,
      isMiniPlayerVisible: true,
    });

    startWebAudioSynth(soundscape.generatorType, volume);

    // Start timer interval
    if (audioInterval) clearInterval(audioInterval);
    audioInterval = setInterval(() => {
      get().tickTimer();
    }, 1000);
  },

  togglePlayPause: async () => {
    const { isPlaying, currentSoundscape, volume } = get();
    if (!currentSoundscape) return;

    if (isPlaying) {
      stopWebAudioSynth();
      set({ isPlaying: false });
    } else {
      set({ isPlaying: true });
      startWebAudioSynth(currentSoundscape.generatorType, volume);
    }
  },

  pauseSoundscape: async () => {
    stopWebAudioSynth();
    set({ isPlaying: false });
  },

  stopSoundscape: async () => {
    stopWebAudioSynth();
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
    if (webAudioGain && webAudioContext) {
      webAudioGain.gain.setValueAtTime(clamped * 0.4, webAudioContext.currentTime);
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
    stopWebAudioSynth();
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
      // Timer finished, stop audio smoothly
      get().pauseSoundscape();
      set({ remainingSeconds: null, timerMinutes: null });
    } else {
      set({ remainingSeconds: remainingSeconds - 1 });
    }
  },
}));
