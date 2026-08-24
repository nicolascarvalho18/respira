import { MoodRecord, MoodStats } from '../../types';
import { MOCK_MOOD_RECORDS } from '../../mocks/moods.mock';
import { storage } from '../storage/asyncStorage';
import { calculateMoodStats } from '../../utils/stats';
import { apiClient, isMockMode } from '../api/apiClient';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { logger } from '../../utils/logger';

const MOODS_STORAGE_KEY = 'respira_mood_records';

class MoodService {
  async getRecords(userId?: string): Promise<MoodRecord[]> {
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;

        if (targetUserId) {
          const { data: dbMoods, error } = await supabase
            .from('mood_entries')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

          if (!error && dbMoods && dbMoods.length > 0) {
            return dbMoods.map((m) => ({
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
          }
        }
      } catch (err) {
        logger.warn('Error fetching moods from Supabase, fallback to cache:', err);
      }
    }

    if (!isMockMode) {
      return apiClient.get<MoodRecord[]>('/moods', { userId });
    }

    let localRecords = await storage.getItem<MoodRecord[]>(MOODS_STORAGE_KEY);
    if (!localRecords || localRecords.length === 0) {
      localRecords = MOCK_MOOD_RECORDS;
      await storage.setItem(MOODS_STORAGE_KEY, localRecords);
    }

    return localRecords.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getRecordById(id: string): Promise<MoodRecord | null> {
    const records = await this.getRecords();
    return records.find((r) => r.id === id) || null;
  }

  async createRecord(record: Omit<MoodRecord, 'id' | 'createdAt'>): Promise<MoodRecord> {
    const newRecord: MoodRecord = {
      ...record,
      id: `mood-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('mood_entries')
            .insert({
              user_id: user.id,
              mood_score: record.mood,
              anxiety_score: record.anxietyLevel,
              emotions: record.emotions,
              activities: record.activities || [],
              planned_exercises: record.plannedExercises || [],
              notes: record.notes || null,
            })
            .select()
            .single();

          if (!error && data) {
            newRecord.id = data.id;
            newRecord.createdAt = data.created_at;
          }
        }
      } catch (err) {
        logger.warn('Error saving mood to Supabase:', err);
      }
    }

    if (!isMockMode) {
      return apiClient.post<MoodRecord>('/moods', newRecord);
    }

    const records = await this.getRecords();
    const updated = [newRecord, ...records];
    await storage.setItem(MOODS_STORAGE_KEY, updated);

    logger.info(`Mood record created: score ${newRecord.mood}, anxiety ${newRecord.anxietyLevel}`);
    return newRecord;
  }

  async updateRecord(id: string, partial: Partial<MoodRecord>): Promise<MoodRecord> {
    if (isSupabaseConfigured) {
      try {
        const payload: Record<string, any> = { updated_at: new Date().toISOString() };
        if (partial.mood !== undefined) payload.mood_score = partial.mood;
        if (partial.anxietyLevel !== undefined) payload.anxiety_score = partial.anxietyLevel;
        if (partial.emotions !== undefined) payload.emotions = partial.emotions;
        if (partial.activities !== undefined) payload.activities = partial.activities;
        if (partial.plannedExercises !== undefined) payload.planned_exercises = partial.plannedExercises;
        if (partial.notes !== undefined) payload.notes = partial.notes;

        await supabase.from('mood_entries').update(payload).eq('id', id);
      } catch (err) {
        logger.warn('Error updating mood in Supabase:', err);
      }
    }

    if (!isMockMode) {
      return apiClient.put<MoodRecord>(`/moods/${id}`, partial);
    }

    const records = await this.getRecords();
    let updatedRecord: MoodRecord | null = null;

    const updated = records.map((r) => {
      if (r.id === id) {
        updatedRecord = { ...r, ...partial, updatedAt: new Date().toISOString() };
        return updatedRecord;
      }
      return r;
    });

    if (!updatedRecord) throw new Error('Record not found');
    await storage.setItem(MOODS_STORAGE_KEY, updated);
    return updatedRecord;
  }

  async deleteRecord(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('mood_entries').delete().eq('id', id);
      } catch (err) {
        logger.warn('Error deleting mood from Supabase:', err);
      }
    }

    if (!isMockMode) {
      return apiClient.delete(`/moods/${id}`);
    }

    const records = await this.getRecords();
    const filtered = records.filter((r) => r.id !== id);
    await storage.setItem(MOODS_STORAGE_KEY, filtered);
    logger.info(`Mood record deleted: ${id}`);
    return true;
  }

  async getStats(userId?: string): Promise<MoodStats> {
    const records = await this.getRecords(userId);
    return calculateMoodStats(records);
  }
}

export const moodService = new MoodService();
