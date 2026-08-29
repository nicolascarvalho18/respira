import { MoodRecord, MoodStats } from '../../types';
import { storage } from '../storage/asyncStorage';
import { calculateMoodStats } from '../../utils/stats';
import { apiClient, isMockMode } from '../api/apiClient';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { logger } from '../../utils/logger';
import { authService } from '../auth/authService';

const BASE_MOODS_STORAGE_KEY = 'respira_mood_records';

class MoodService {
  private getStorageKey(userId?: string): string {
    return userId ? `${BASE_MOODS_STORAGE_KEY}_${userId}` : BASE_MOODS_STORAGE_KEY;
  }

  /**
   * Obtém os registros de humor estritamente pertencentes ao usuário autenticado.
   */
  async getRecords(userId?: string): Promise<MoodRecord[]> {
    let targetUserId = userId;

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          targetUserId = user.id;
        }

        if (targetUserId) {
          const { data: dbMoods, error } = await supabase
            .from('mood_entries')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('[Supabase mood_entries SELECT Error]:', error);
          } else if (dbMoods) {
            const mappedRecords: MoodRecord[] = dbMoods.map((m) => ({
              id: m.id,
              userId: m.user_id,
              mood: m.mood_score,
              anxietyLevel: m.anxiety_score,
              emotions: m.emotions || [],
              activities: m.activities || [],
              plannedExercises: m.planned_exercises || [],
              notes: m.notes || '',
              createdAt: m.created_at,
              updatedAt: m.updated_at,
            }));

            await storage.setItem(this.getStorageKey(targetUserId), mappedRecords);
            return mappedRecords;
          }
        }
      } catch (err) {
        console.error('[Supabase fetchMoods Error]:', err);
      }
    }

    if (!targetUserId) {
      const sessionUser = await authService.getStoredSession();
      targetUserId = sessionUser?.id;
    }

    if (!isMockMode) {
      return apiClient.get<MoodRecord[]>('/moods', { userId: targetUserId });
    }

    // Se temos um usuário alvo específico, retornar ESTRITAMENTE seus dados
    if (targetUserId) {
      const storageKey = this.getStorageKey(targetUserId);
      const localRecords = await storage.getItem<MoodRecord[]>(storageKey);
      if (!localRecords) {
        return [];
      }

      const userRecords = localRecords.filter((r) => r.userId === targetUserId);
      return userRecords.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // Fallback geral estritamente quando não há sessão nem usuário informado
    const globalRecords = (await storage.getItem<MoodRecord[]>(BASE_MOODS_STORAGE_KEY)) || [];
    return globalRecords.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getRecordById(id: string): Promise<MoodRecord | null> {
    const records = await this.getRecords();
    return records.find((r) => r.id === id) || null;
  }

  /**
   * Cria e persiste um novo registro de humor diretamente no Supabase e no cache local.
   */
  async createRecord(
    record: Omit<MoodRecord, 'id' | 'createdAt' | 'userId'> & { userId?: string }
  ): Promise<MoodRecord> {
    let targetUserId: string | undefined = record.userId;

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          targetUserId = user.id;
        }
      } catch (_err) {
        // Ignorado
      }
    }

    if (!targetUserId) {
      const sessionUser = await authService.getStoredSession();
      targetUserId = sessionUser?.id;
    }

    const newRecord: MoodRecord = {
      ...record,
      id: `mood-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: targetUserId || 'default-user',
      createdAt: new Date().toISOString(),
    };

    // 1. Persistência Real no Supabase
    if (isSupabaseConfigured && targetUserId) {
      try {
        const insertPayload: Record<string, any> = {
          user_id: targetUserId,
          mood_score: record.mood,
          anxiety_score: record.anxietyLevel,
          emotions: record.emotions || [],
          activities: record.activities || [],
          planned_exercises: record.plannedExercises || [],
          notes: record.notes || null,
        };

        const { data, error } = await supabase
          .from('mood_entries')
          .insert(insertPayload)
          .select()
          .single();

        if (error) {
          if (!error.message.includes('schema cache') && !error.message.includes('not find') && !error.message.includes('relation')) {
            console.error('[Supabase mood_entries INSERT Error]:', error);
            throw new Error(`Erro ao salvar no banco de dados: ${error.message}`);
          }
        } else if (data) {
          newRecord.id = data.id;
          newRecord.createdAt = data.created_at;
          newRecord.userId = data.user_id;
        }
      } catch (err: any) {
        if (!err.message?.includes('schema cache') && !err.message?.includes('not find') && !err.message?.includes('relation')) {
          console.error('[Supabase createRecord Error]:', err);
          throw err;
        }
      }
    }

    if (!isMockMode) {
      return apiClient.post<MoodRecord>('/moods', newRecord);
    }

    // 2. Atualização Imediata do Cache do Usuário
    if (targetUserId) {
      const storageKey = this.getStorageKey(targetUserId);
      const existing = (await storage.getItem<MoodRecord[]>(storageKey)) || [];
      const updated = [newRecord, ...existing.filter((r) => r.id !== newRecord.id)];
      await storage.setItem(storageKey, updated);
    }

    // Atualizar no storage global para compatibilidade de testes
    const globalExisting = (await storage.getItem<MoodRecord[]>(BASE_MOODS_STORAGE_KEY)) || [];
    await storage.setItem(
      BASE_MOODS_STORAGE_KEY,
      [newRecord, ...globalExisting.filter((r) => r.id !== newRecord.id)]
    );

    logger.info(`Mood record created: score ${newRecord.mood}, anxiety ${newRecord.anxietyLevel}`);
    return newRecord;
  }

  async updateRecord(id: string, partial: Partial<MoodRecord>): Promise<MoodRecord> {
    let targetUserId = partial.userId;
    if (!targetUserId) {
      const sessionUser = await authService.getStoredSession();
      targetUserId = sessionUser?.id;
    }

    if (isSupabaseConfigured) {
      try {
        const payload: Record<string, any> = { updated_at: new Date().toISOString() };
        if (partial.mood !== undefined) payload.mood_score = partial.mood;
        if (partial.anxietyLevel !== undefined) payload.anxiety_score = partial.anxietyLevel;
        if (partial.emotions !== undefined) payload.emotions = partial.emotions;
        if (partial.activities !== undefined) payload.activities = partial.activities;
        if (partial.plannedExercises !== undefined) payload.planned_exercises = partial.plannedExercises;
        if (partial.notes !== undefined) payload.notes = partial.notes;

        const { error } = await supabase.from('mood_entries').update(payload).eq('id', id);
        if (error) {
          console.error('[Supabase mood_entries UPDATE Error]:', error);
        }
      } catch (err) {
        console.error('[Supabase updateRecord Error]:', err);
      }
    }

    if (!isMockMode) {
      return apiClient.put<MoodRecord>(`/moods/${id}`, partial);
    }

    let updatedRecord: MoodRecord | null = null;

    if (targetUserId) {
      const storageKey = this.getStorageKey(targetUserId);
      const records = (await storage.getItem<MoodRecord[]>(storageKey)) || [];
      const updated = records.map((r) => {
        if (r.id === id) {
          updatedRecord = { ...r, ...partial, updatedAt: new Date().toISOString() };
          return updatedRecord;
        }
        return r;
      });
      if (updatedRecord) {
        await storage.setItem(storageKey, updated);
      }
    }

    const globalRecords = (await storage.getItem<MoodRecord[]>(BASE_MOODS_STORAGE_KEY)) || [];
    const updatedGlobal = globalRecords.map((r) => {
      if (r.id === id) {
        updatedRecord = { ...r, ...partial, updatedAt: new Date().toISOString() };
        return updatedRecord;
      }
      return r;
    });

    if (updatedRecord) {
      await storage.setItem(BASE_MOODS_STORAGE_KEY, updatedGlobal);
      return updatedRecord;
    }

    throw new Error('Record not found');
  }

  async deleteRecord(id: string): Promise<boolean> {
    let targetUserId: string | undefined;
    const sessionUser = await authService.getStoredSession();
    targetUserId = sessionUser?.id;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('mood_entries').delete().eq('id', id);
        if (error) {
          console.error('[Supabase mood_entries DELETE Error]:', error);
        }
      } catch (err) {
        console.error('[Supabase deleteRecord Error]:', err);
      }
    }

    if (!isMockMode) {
      return apiClient.delete(`/moods/${id}`);
    }

    if (targetUserId) {
      const storageKey = this.getStorageKey(targetUserId);
      const records = (await storage.getItem<MoodRecord[]>(storageKey)) || [];
      const filtered = records.filter((r) => r.id !== id);
      await storage.setItem(storageKey, filtered);
    }

    const globalRecords = (await storage.getItem<MoodRecord[]>(BASE_MOODS_STORAGE_KEY)) || [];
    const filteredGlobal = globalRecords.filter((r) => r.id !== id);
    await storage.setItem(BASE_MOODS_STORAGE_KEY, filteredGlobal);

    logger.info(`Mood record deleted: ${id}`);
    return true;
  }

  async getStats(userId?: string): Promise<MoodStats> {
    const records = await this.getRecords(userId);
    return calculateMoodStats(records);
  }

  /**
   * Limpa o cache de registros do usuário na saída / logout.
   */
  async clearUserCache(userId?: string): Promise<void> {
    if (userId) {
      await storage.removeItem(this.getStorageKey(userId));
    }
    await storage.removeItem(BASE_MOODS_STORAGE_KEY);
  }
}

export const moodService = new MoodService();
