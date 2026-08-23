import { MoodRecord, MoodStats } from '../../types';
import { MOCK_MOOD_RECORDS } from '../../mocks/moods.mock';
import { storage } from '../storage/asyncStorage';
import { calculateMoodStats } from '../../utils/stats';
import { apiClient, isMockMode } from '../api/apiClient';
import { logger } from '../../utils/logger';

const MOODS_STORAGE_KEY = 'respira_mood_records';

class MoodService {
  async getRecords(userId?: string): Promise<MoodRecord[]> {
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
    if (!isMockMode) {
      return apiClient.put<MoodRecord>(`/moods/${id}`, partial);
    }

    const records = await this.getRecords();
    let updatedRecord: MoodRecord | null = null;

    const updated = records.map((r) => {
      if (r.id === id) {
        updatedRecord = {
          ...r,
          ...partial,
          updatedAt: new Date().toISOString(),
        };
        return updatedRecord;
      }
      return r;
    });

    if (!updatedRecord) throw new Error('Record not found');
    await storage.setItem(MOODS_STORAGE_KEY, updated);
    return updatedRecord;
  }

  async deleteRecord(id: string): Promise<boolean> {
    if (!isMockMode) {
      await apiClient.delete(`/moods/${id}`);
      return true;
    }

    const records = await this.getRecords();
    const filtered = records.filter((r) => r.id !== id);
    await storage.setItem(MOODS_STORAGE_KEY, filtered);
    logger.info(`Mood record deleted: ${id}`);
    return true;
  }

  async getStats(daysCount: number = 7): Promise<MoodStats> {
    const records = await this.getRecords();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysCount);

    const filtered = records.filter((r) => new Date(r.createdAt) >= cutoffDate);
    return calculateMoodStats(filtered.length > 0 ? filtered : records);
  }
}

export const moodService = new MoodService();
