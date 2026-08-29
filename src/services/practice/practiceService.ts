import { Practice, UserPracticeProgress } from '../../types';
import { MOCK_PRACTICES } from '../../mocks/practices.mock';
import { storage } from '../storage/asyncStorage';
import { apiClient, isMockMode } from '../api/apiClient';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { logger } from '../../utils/logger';

const PRACTICES_STORAGE_KEY = 'respira_practices';
const FAVORITE_PRACTICES_KEY = 'respira_favorite_practices';
const COMPLETED_PRACTICES_KEY = 'respira_completed_practices';
const USER_PROGRESS_STORAGE_KEY = 'respira_user_practice_progress';
const OFFLINE_DOWNLOADS_KEY = 'respira_offline_downloaded_practices';

class PracticeService {
  async getPractices(): Promise<Practice[]> {
    if (isSupabaseConfigured) {
      try {
        const { data: dbPractices, error } = await supabase
          .from('practices')
          .select('*')
          .order('order', { ascending: true });

        if (!error && dbPractices && dbPractices.length > 0) {
          const { data: { user } } = await supabase.auth.getUser();
          const completedMap: Record<string, number> = {};

          if (user) {
            const { data: userProgress } = await supabase
              .from('practice_progress')
              .select('practice_id, status')
              .eq('user_id', user.id);

            if (userProgress) {
              userProgress.forEach((p) => {
                completedMap[p.practice_id] = (completedMap[p.practice_id] || 0) + 1;
              });
            }
          }

          const favorites = (await storage.getItem<string[]>(FAVORITE_PRACTICES_KEY)) || [];

          return dbPractices.map((p) => ({
            id: p.id,
            title: p.title,
            subtitle: p.subtitle || '',
            description: p.description,
            category: p.category,
            objective: p.objective,
            format: p.format || 'video',
            durationMinutes: p.duration_minutes || 5,
            level: p.level || 'Iniciante',
            effortLevel: p.effort_level || 'Suave',
            activityType: p.activity_type || 'mental',
            icon: p.icon || 'wind',
            thumbnailUrl: p.thumbnail_url,
            videoUrl: p.video_url,
            audioUrl: p.audio_url,
            instructor: p.instructor,
            captions: p.captions || [],
            transcript: p.transcript,
            guidelinesBeforeStarting: p.guidelines_before_starting || [],
            stages: p.stages || [],
            benefits: p.benefits || [],
            careAndLimitations: p.care_and_limitations || [],
            relatedPracticeIds: p.related_practice_ids || [],
            isFavorite: favorites.includes(p.id),
            completedCount: completedMap[p.id] || 0,
            isFeatured: p.is_featured || false,
            order: p.order || 99,
            status: p.status || 'published',
            instructions: p.instructions || [],
            breathingConfig: p.breathing_config || undefined,
          }));
        }
      } catch (err) {
        logger.warn('Could not fetch practices from Supabase, falling back to local cache:', err);
      }
    }

    if (!isMockMode) {
      return apiClient.get<Practice[]>('/practices');
    }

    let practices = await storage.getItem<Practice[]>(PRACTICES_STORAGE_KEY);
    if (!practices || practices.length === 0) {
      practices = MOCK_PRACTICES;
      await storage.setItem(PRACTICES_STORAGE_KEY, practices);
    }

    const favorites = (await storage.getItem<string[]>(FAVORITE_PRACTICES_KEY)) || [];
    const completedMap =
      (await storage.getItem<Record<string, number>>(COMPLETED_PRACTICES_KEY)) || {};

    return practices.map((p) => ({
      ...p,
      isFavorite: favorites.includes(p.id) || p.isFavorite,
      completedCount: (completedMap[p.id] ?? 0) + (p.completedCount ?? 0),
    }));
  }

  async getPracticeById(id: string): Promise<Practice | null> {
    const practices = await this.getPractices();
    return practices.find((p) => p.id === id) || null;
  }

  async toggleFavorite(practiceId: string): Promise<boolean> {
    const favorites = (await storage.getItem<string[]>(FAVORITE_PRACTICES_KEY)) || [];
    let updated: string[];

    if (favorites.includes(practiceId)) {
      updated = favorites.filter((id) => id !== practiceId);
    } else {
      updated = [...favorites, practiceId];
    }

    await storage.setItem(FAVORITE_PRACTICES_KEY, updated);
    return updated.includes(practiceId);
  }

  async recordCompletion(practiceId: string): Promise<void> {
    const completedMap =
      (await storage.getItem<Record<string, number>>(COMPLETED_PRACTICES_KEY)) || {};
    completedMap[practiceId] = (completedMap[practiceId] || 0) + 1;
    await storage.setItem(COMPLETED_PRACTICES_KEY, completedMap);

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('practice_progress').insert({
            user_id: user.id,
            practice_id: practiceId,
            status: 'completed',
            progress: 100,
            completed_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        logger.warn('Error syncing practice progress to Supabase:', err);
      }
    }
  }

  // ==========================================
  // PROGRESS & RESUME POSITION PERSISTENCE
  // ==========================================
  async saveProgress(
    userId: string,
    practiceId: string,
    positionSeconds: number,
    totalSeconds: number,
    isCompleted = false
  ): Promise<UserPracticeProgress> {
    const allProgress =
      (await storage.getItem<Record<string, UserPracticeProgress>>(USER_PROGRESS_STORAGE_KEY)) || {};

    const key = `${userId}_${practiceId}`;
    const prev = allProgress[key];

    const progressPercent = totalSeconds > 0
      ? Math.min(100, Math.round((positionSeconds / totalSeconds) * 100))
      : 0;

    const updatedProgress: UserPracticeProgress = {
      userId,
      practiceId,
      playbackPositionSeconds: isCompleted ? 0 : positionSeconds,
      progressPercent: isCompleted ? 100 : progressPercent,
      status: isCompleted ? 'completed' : 'started',
      completedCount: isCompleted ? (prev?.completedCount || 0) + 1 : (prev?.completedCount || 0),
      lastPlayedAt: new Date().toISOString(),
      lastCompletedAt: isCompleted ? new Date().toISOString() : prev?.lastCompletedAt,
      postFeelingsHistory: prev?.postFeelingsHistory || [],
      isDownloadedOffline: prev?.isDownloadedOffline || false,
    };

    allProgress[key] = updatedProgress;
    await storage.setItem(USER_PROGRESS_STORAGE_KEY, allProgress);

    if (isCompleted) {
      await this.recordCompletion(practiceId);
    }

    return updatedProgress;
  }

  async getProgress(userId: string, practiceId: string): Promise<UserPracticeProgress | null> {
    const allProgress =
      (await storage.getItem<Record<string, UserPracticeProgress>>(USER_PROGRESS_STORAGE_KEY)) || {};
    return allProgress[`${userId}_${practiceId}`] || null;
  }

  async getAllUserProgress(userId: string): Promise<Record<string, UserPracticeProgress>> {
    const allProgress =
      (await storage.getItem<Record<string, UserPracticeProgress>>(USER_PROGRESS_STORAGE_KEY)) || {};

    const userMap: Record<string, UserPracticeProgress> = {};
    Object.keys(allProgress).forEach((k) => {
      if (k.startsWith(`${userId}_`)) {
        const p = allProgress[k];
        userMap[p.practiceId] = p;
      }
    });

    return userMap;
  }

  async recordPostFeeling(
    userId: string,
    practiceId: string,
    feeling: 'calmer' | 'same' | 'uncomfortable',
    notes?: string
  ): Promise<void> {
    const allProgress =
      (await storage.getItem<Record<string, UserPracticeProgress>>(USER_PROGRESS_STORAGE_KEY)) || {};
    const key = `${userId}_${practiceId}`;
    const current = allProgress[key] || {
      userId,
      practiceId,
      progressPercent: 100,
      playbackPositionSeconds: 0,
      status: 'completed',
      completedCount: 1,
      lastPlayedAt: new Date().toISOString(),
      lastCompletedAt: new Date().toISOString(),
      postFeelingsHistory: [],
    };

    const newHistory = current.postFeelingsHistory || [];
    newHistory.push({
      date: new Date().toISOString(),
      feeling,
      notes,
    });

    current.postFeeling = feeling;
    current.postFeelingsHistory = newHistory;
    allProgress[key] = current;
    await storage.setItem(USER_PROGRESS_STORAGE_KEY, allProgress);

    logger.info(`Recorded post feeling for practice ${practiceId}: ${feeling}`);
  }

  // ==========================================
  // OFFLINE ACCESS
  // ==========================================
  async toggleOfflineDownload(practiceId: string): Promise<boolean> {
    const downloads = (await storage.getItem<string[]>(OFFLINE_DOWNLOADS_KEY)) || [];
    let updated: string[];

    if (downloads.includes(practiceId)) {
      updated = downloads.filter((id) => id !== practiceId);
    } else {
      updated = [...downloads, practiceId];
    }

    await storage.setItem(OFFLINE_DOWNLOADS_KEY, updated);
    return updated.includes(practiceId);
  }

  async isDownloaded(practiceId: string): Promise<boolean> {
    const downloads = (await storage.getItem<string[]>(OFFLINE_DOWNLOADS_KEY)) || [];
    return downloads.includes(practiceId);
  }

  // ==========================================
  // ADMIN CAPABILITIES (CRUD)
  // ==========================================
  async createPractice(practice: Omit<Practice, 'id'>): Promise<Practice> {
    const newPractice: Practice = {
      ...practice,
      id: `practice-${Date.now()}`,
      status: practice.status || 'published',
      order: practice.order ?? 99,
      completedCount: 0,
      isFavorite: false,
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('practices').insert({
          id: newPractice.id,
          title: newPractice.title,
          subtitle: newPractice.subtitle,
          description: newPractice.description,
          category: newPractice.category,
          objective: newPractice.objective,
          format: newPractice.format,
          duration_minutes: newPractice.durationMinutes,
          level: newPractice.level,
          effort_level: newPractice.effortLevel,
          activity_type: newPractice.activityType,
          icon: newPractice.icon,
          thumbnail_url: newPractice.thumbnailUrl,
          video_url: newPractice.videoUrl,
          audio_url: newPractice.audioUrl,
          instructor: newPractice.instructor,
          captions: newPractice.captions,
          transcript: newPractice.transcript,
          guidelines_before_starting: newPractice.guidelinesBeforeStarting,
          stages: newPractice.stages,
          benefits: newPractice.benefits,
          care_and_limitations: newPractice.careAndLimitations,
          is_featured: newPractice.isFeatured,
          order: newPractice.order,
          status: newPractice.status,
          instructions: newPractice.instructions,
        });
      } catch (err) {
        logger.warn('Error creating practice on Supabase:', err);
      }
    }

    const practices = await this.getPractices();
    const updated = [newPractice, ...practices];
    await storage.setItem(PRACTICES_STORAGE_KEY, updated);
    logger.info(`Practice created: ${newPractice.title}`);
    return newPractice;
  }

  async updatePractice(id: string, partial: Partial<Practice>): Promise<Practice> {
    if (isSupabaseConfigured) {
      try {
        const payload: Record<string, any> = {};
        if (partial.title !== undefined) payload.title = partial.title;
        if (partial.subtitle !== undefined) payload.subtitle = partial.subtitle;
        if (partial.description !== undefined) payload.description = partial.description;
        if (partial.category !== undefined) payload.category = partial.category;
        if (partial.objective !== undefined) payload.objective = partial.objective;
        if (partial.format !== undefined) payload.format = partial.format;
        if (partial.durationMinutes !== undefined) payload.duration_minutes = partial.durationMinutes;
        if (partial.level !== undefined) payload.level = partial.level;
        if (partial.thumbnailUrl !== undefined) payload.thumbnail_url = partial.thumbnailUrl;
        if (partial.videoUrl !== undefined) payload.video_url = partial.videoUrl;
        if (partial.audioUrl !== undefined) payload.audio_url = partial.audioUrl;
        if (partial.captions !== undefined) payload.captions = partial.captions;
        if (partial.status !== undefined) payload.status = partial.status;
        if (partial.isFeatured !== undefined) payload.is_featured = partial.isFeatured;

        await supabase.from('practices').update(payload).eq('id', id);
      } catch (err) {
        logger.warn('Error updating practice in Supabase:', err);
      }
    }

    const practices = await this.getPractices();
    let updatedPractice: Practice | null = null;
    const updated = practices.map((p) => {
      if (p.id === id) {
        updatedPractice = { ...p, ...partial };
        return updatedPractice;
      }
      return p;
    });

    if (!updatedPractice) throw new Error('Practice not found');
    await storage.setItem(PRACTICES_STORAGE_KEY, updated);
    return updatedPractice;
  }

  async deletePractice(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('practices').delete().eq('id', id);
      } catch (err) {
        logger.warn('Error deleting practice in Supabase:', err);
      }
    }

    const practices = await this.getPractices();
    const filtered = practices.filter((p) => p.id !== id);
    await storage.setItem(PRACTICES_STORAGE_KEY, filtered);
    logger.info(`Practice deleted: ${id}`);
    return true;
  }
}

export const practiceService = new PracticeService();
