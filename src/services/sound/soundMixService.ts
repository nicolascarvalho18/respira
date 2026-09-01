import { storage } from '../storage/asyncStorage';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { SoundMixPreset, SoundMixLayer } from '../../types';

class SoundMixService {
  private getStorageKey(userId?: string): string {
    return userId ? `respira_sound_mixes_${userId}` : 'respira_sound_mixes_guest';
  }

  /**
   * Obtém presets salvos pelo usuário (com fallback para presets padrão do Respira)
   */
  async getPresets(userId?: string): Promise<SoundMixPreset[]> {
    const defaultPresets: SoundMixPreset[] = [
      {
        id: 'preset-sleep-default',
        userId: userId || 'default',
        name: 'Dormir',
        masterVolume: 0.8,
        isFavorite: false,
        layers: [
          { soundId: 'soundscape-rain', name: 'Chuva leve', volume: 0.7 },
          { soundId: 'soundscape-wind', name: 'Vento suave', volume: 0.3 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'preset-study-default',
        userId: userId || 'default',
        name: 'Estudar',
        masterVolume: 0.75,
        isFavorite: false,
        layers: [
          { soundId: 'soundscape-cafe', name: 'Cafeteria', volume: 0.5 },
          { soundId: 'soundscape-rain', name: 'Chuva leve', volume: 0.4 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'preset-relax-default',
        userId: userId || 'default',
        name: 'Relaxar',
        masterVolume: 0.8,
        isFavorite: false,
        layers: [
          { soundId: 'soundscape-fire', name: 'Fogueira', volume: 0.6 },
          { soundId: 'soundscape-stream', name: 'Riacho', volume: 0.4 },
          { soundId: 'soundscape-wind', name: 'Vento suave', volume: 0.2 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    if (!userId) {
      return defaultPresets;
    }

    try {
      // 1. Tentar ler do Supabase se configurado
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('user_sound_mixes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: SoundMixPreset[] = data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            name: d.name,
            layers: d.layers || [],
            masterVolume: Number(d.master_volume) || 0.8,
            isFavorite: Boolean(d.is_favorite),
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
          await storage.setItem(this.getStorageKey(userId), mapped);
          return mapped;
        }
      }

      // 2. Fallback para AsyncStorage isolado
      const cached = await storage.getItem<SoundMixPreset[]>(this.getStorageKey(userId));
      if (cached && cached.length > 0) {
        return cached;
      }
    } catch (_e) {
      // Fallback
    }

    return defaultPresets;
  }

  /**
   * Salva um novo preset de mistura para o usuário
   */
  async savePreset(
    userId: string,
    name: string,
    layers: SoundMixLayer[],
    masterVolume: number = 0.8
  ): Promise<SoundMixPreset> {
    const newPreset: SoundMixPreset = {
      id: `mix-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId,
      name: name.trim(),
      layers: layers.slice(0, 3),
      masterVolume,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Atualizar cache local
    const current = await this.getPresets(userId);
    const updated = [newPreset, ...current.filter((p) => p.id !== newPreset.id)];
    await storage.setItem(this.getStorageKey(userId), updated);

    // Salvar no Supabase
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_sound_mixes')
          .insert({
            user_id: userId,
            name: newPreset.name,
            layers: newPreset.layers,
            master_volume: newPreset.masterVolume,
            is_favorite: false,
          })
          .select()
          .single();

        if (!error && data) {
          newPreset.id = data.id;
        }
      } catch (_e) {}
    }

    return newPreset;
  }

  /**
   * Remove um preset salvo
   */
  async deletePreset(presetId: string, userId?: string): Promise<boolean> {
    if (!userId) return false;

    const current = await this.getPresets(userId);
    const updated = current.filter((p) => p.id !== presetId);
    await storage.setItem(this.getStorageKey(userId), updated);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('user_sound_mixes')
          .delete()
          .eq('id', presetId)
          .eq('user_id', userId);
      } catch (_e) {}
    }

    return true;
  }

  /**
   * Limpa cache ao deslogar
   */
  async clearUserCache(userId: string): Promise<void> {
    await storage.removeItem(this.getStorageKey(userId));
  }
}

export const soundMixService = new SoundMixService();
