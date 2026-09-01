import { storage } from '../storage/asyncStorage';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { logger } from '../../utils/logger';

export type FavoriteItemType = 'practice' | 'soundscape' | 'music' | 'article';

class FavoriteService {
  private getStorageKey(itemType: FavoriteItemType, userId: string): string {
    return `respira_user_favs_${itemType}_${userId}`;
  }

  /**
   * Obtém a lista de IDs favoritados para um tipo específico e usuário
   */
  async getFavorites(userId?: string, itemType?: FavoriteItemType): Promise<string[]> {
    if (!userId) {
      return [];
    }

    const type = itemType || 'practice';
    const key = this.getStorageKey(type, userId);

    // 1. Tentar carregar do Supabase se configurado
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_favorites')
          .select('item_id')
          .eq('user_id', userId)
          .eq('item_type', type)
          .eq('is_active', true);

        if (!error && data) {
          const ids = data.map((d: any) => d.item_id);
          await storage.setItem(key, ids);
          return ids;
        }
      } catch (err) {
        logger.warn(`Could not fetch ${type} favorites from Supabase:`, err);
      }
    }

    // 2. Fallback para o storage isolado do usuário
    const cached = await storage.getItem<string[]>(key);
    return cached || [];
  }

  /**
   * Alterna o estado de favorito de um item para o usuário autenticado
   */
  async toggleFavorite(
    itemId: string,
    itemType: FavoriteItemType,
    userId?: string
  ): Promise<{ isFavorite: boolean; message: string }> {
    if (!userId) {
      return { isFavorite: false, message: 'Entre na sua conta para salvar favoritos.' };
    }

    const key = this.getStorageKey(itemType, userId);
    const current = (await storage.getItem<string[]>(key)) || [];
    const wasFavorite = current.includes(itemId);
    const isNowFavorite = !wasFavorite;

    let updated: string[];
    if (isNowFavorite) {
      updated = Array.from(new Set([...current, itemId]));
    } else {
      updated = current.filter((id) => id !== itemId);
    }

    await storage.setItem(key, updated);

    // Sincronizar com Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase.from('user_favorites').upsert(
          {
            user_id: userId,
            item_id: itemId,
            item_type: itemType,
            is_active: isNowFavorite,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,item_id,item_type' }
        );
      } catch (err) {
        logger.warn('Error syncing user favorite to Supabase:', err);
      }
    }

    return {
      isFavorite: isNowFavorite,
      message: isNowFavorite ? 'Adicionado aos favoritos' : 'Removido dos favoritos',
    };
  }

  /**
   * Verifica se um item é favorito para o usuário
   */
  async isFavorite(itemId: string, itemType: FavoriteItemType, userId?: string): Promise<boolean> {
    if (!userId) return false;
    const favorites = await this.getFavorites(userId, itemType);
    return favorites.includes(itemId);
  }

  /**
   * Carrega todos os favoritos de todas as categorias para o usuário
   */
  async loadAllUserFavorites(userId?: string): Promise<{
    practices: string[];
    soundscapes: string[];
    music: string[];
    articles: string[];
  }> {
    if (!userId) {
      return { practices: [], soundscapes: [], music: [], articles: [] };
    }

    const [practices, soundscapes, music, articles] = await Promise.all([
      this.getFavorites(userId, 'practice'),
      this.getFavorites(userId, 'soundscape'),
      this.getFavorites(userId, 'music'),
      this.getFavorites(userId, 'article'),
    ]);

    return { practices, soundscapes, music, articles };
  }

  /**
   * Limpa o cache local de favoritos ao sair da conta
   */
  async clearUserCache(userId: string): Promise<void> {
    const types: FavoriteItemType[] = ['practice', 'soundscape', 'music', 'article'];
    for (const type of types) {
      await storage.removeItem(this.getStorageKey(type, userId));
    }
  }
}

export const favoriteService = new FavoriteService();
