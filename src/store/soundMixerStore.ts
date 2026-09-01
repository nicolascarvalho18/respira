import { create } from 'zustand';
import { soundEngine } from '../services/sound/soundEngine';
import { soundMixService } from '../services/sound/soundMixService';
import { SoundMixLayer, SoundMixPreset } from '../types';

interface SoundMixerState {
  activeLayers: SoundMixLayer[];
  masterVolume: number;
  isPlaying: boolean;
  activePresetId?: string;
  activePresetName?: string;
  savedPresets: SoundMixPreset[];
  isMixerModalOpen: boolean;

  // Actions
  loadPresets: (userId?: string) => Promise<void>;
  addLayer: (sound: { id: string; name: string; audioUrl?: string; icon?: string }) => void;
  removeLayer: (soundId: string) => void;
  setLayerVolume: (soundId: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  playMix: () => void;
  pauseMix: () => void;
  togglePlayPause: () => void;
  stopMix: () => void;
  applyPreset: (preset: SoundMixPreset) => void;
  saveCurrentAsPreset: (name: string, userId: string) => Promise<SoundMixPreset>;
  deletePreset: (presetId: string, userId?: string) => Promise<void>;
  setMixerModalOpen: (open: boolean) => void;
}

export const useSoundMixerStore = create<SoundMixerState>((set, get) => ({
  activeLayers: [
    { soundId: 'soundscape-rain', name: 'Chuva leve', volume: 0.7 },
    { soundId: 'soundscape-wind', name: 'Vento suave', volume: 0.3 },
  ],
  masterVolume: 0.8,
  isPlaying: false,
  activePresetId: undefined,
  activePresetName: undefined,
  savedPresets: [],
  isMixerModalOpen: false,

  loadPresets: async (userId?: string) => {
    try {
      const presets = await soundMixService.getPresets(userId);
      set({ savedPresets: presets });
    } catch (_e) {}
  },

  addLayer: (sound) => {
    const current = get().activeLayers;
    if (current.find((l) => l.soundId === sound.id)) return;
    if (current.length >= 3) return; // Máximo 3 sons simultâneos

    const newLayer: SoundMixLayer = {
      soundId: sound.id,
      name: sound.name,
      volume: 0.5,
      audioUrl: sound.audioUrl,
      icon: sound.icon,
    };

    const updated = [...current, newLayer];
    set({ activeLayers: updated, activePresetId: undefined, activePresetName: undefined });

    if (get().isPlaying) {
      soundEngine.playMixedAmbiences(updated, get().masterVolume);
    }
  },

  removeLayer: (soundId) => {
    const current = get().activeLayers;
    const updated = current.filter((l) => l.soundId !== soundId);
    set({ activeLayers: updated, activePresetId: undefined, activePresetName: undefined });

    if (get().isPlaying) {
      if (updated.length === 0) {
        soundEngine.stopMixedAmbiences();
        set({ isPlaying: false });
      } else {
        soundEngine.playMixedAmbiences(updated, get().masterVolume);
      }
    }
  },

  setLayerVolume: (soundId, volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    const current = get().activeLayers;
    const updated = current.map((l) => (l.soundId === soundId ? { ...l, volume: clamped } : l));
    set({ activeLayers: updated });

    if (get().isPlaying) {
      soundEngine.setMixedLayerVolume(soundId, clamped, get().masterVolume);
    }
  },

  setMasterVolume: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    set({ masterVolume: clamped });

    if (get().isPlaying) {
      soundEngine.setMixedMasterVolume(clamped);
    }
  },

  playMix: () => {
    const { activeLayers, masterVolume } = get();
    if (activeLayers.length === 0) return;

    soundEngine.playMixedAmbiences(activeLayers, masterVolume);
    set({ isPlaying: true });
  },

  pauseMix: () => {
    soundEngine.stopMixedAmbiences();
    set({ isPlaying: false });
  },

  togglePlayPause: () => {
    if (get().isPlaying) {
      get().pauseMix();
    } else {
      get().playMix();
    }
  },

  stopMix: () => {
    soundEngine.stopMixedAmbiences();
    set({ isPlaying: false, activePresetId: undefined, activePresetName: undefined });
  },

  applyPreset: (preset) => {
    const layers = preset.layers.slice(0, 3);
    set({
      activeLayers: layers,
      masterVolume: preset.masterVolume || 0.8,
      activePresetId: preset.id,
      activePresetName: preset.name,
    });

    if (get().isPlaying) {
      soundEngine.playMixedAmbiences(layers, preset.masterVolume || 0.8);
    }
  },

  saveCurrentAsPreset: async (name, userId) => {
    const { activeLayers, masterVolume } = get();
    const newPreset = await soundMixService.savePreset(userId, name, activeLayers, masterVolume);
    const presets = await soundMixService.getPresets(userId);
    set({ savedPresets: presets, activePresetId: newPreset.id, activePresetName: newPreset.name });
    return newPreset;
  },

  deletePreset: async (presetId, userId) => {
    await soundMixService.deletePreset(presetId, userId);
    const presets = await soundMixService.getPresets(userId);
    set({ savedPresets: presets });
  },

  setMixerModalOpen: (open) => set({ isMixerModalOpen: open }),
}));
