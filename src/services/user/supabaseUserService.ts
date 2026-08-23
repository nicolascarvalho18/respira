import { supabase, isSupabaseConfigured } from '../supabase/client';
import { User, UserPreferences } from '../../types';
import { logger } from '../../utils/logger';
import { Platform } from 'react-native';

export interface DeviceInfo {
  id: string;
  deviceId: string;
  name: string;
  type: string;
  browser?: string;
  operatingSystem?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
}

class SupabaseUserService {
  private lastDeviceSync = 0;

  async getProfile(userId: string): Promise<Partial<User> | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.display_name,
        avatarUrl: data.avatar_url,
        phone: data.phone,
        birthDate: data.birth_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (err) {
      logger.error('Error fetching profile from Supabase:', err);
      return null;
    }
  }

  async updateProfile(
    userId: string,
    updates: { displayName?: string; avatarUrl?: string; phone?: string; birthDate?: string }
  ): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const payload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.displayName !== undefined) payload.display_name = updates.displayName;
      if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.birthDate !== undefined) payload.birth_date = updates.birthDate;

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      logger.error('Error updating profile in Supabase:', err);
      return false;
    }
  }

  async uploadAvatar(
    userId: string,
    fileBlob: Blob | Uint8Array,
    fileExt = 'jpg'
  ): Promise<string | null> {
    if (!isSupabaseConfigured) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
    }

    try {
      const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileBlob, {
          upsert: true,
          contentType: fileExt === 'png' ? 'image/png' : 'image/jpeg',
        });

      if (error || !data) throw error;

      // Get public URL or signed URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const finalUrl = urlData.publicUrl;

      // Update profile
      await this.updateProfile(userId, { avatarUrl: finalUrl });
      return finalUrl;
    } catch (err) {
      logger.error('Error uploading avatar to Supabase Storage:', err);
      return null;
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        theme: data.theme || 'light',
        reducedMotion: Boolean(data.reduce_motion),
        dailyReminder: Boolean(data.daily_reminder_enabled),
        reminderTime: data.daily_reminder_time || '20:30',
        vibrationEnabled: Boolean(data.haptic_feedback),
        soundEnabled: Boolean(data.guided_voice),
        soundscapeVolume: data.soundscape_volume ?? 70,
        voiceVolume: data.voice_volume ?? 80,
        microPausesEnabled: Boolean(data.micro_pauses_enabled),
        countryHelpline: 'BR',
      };
    } catch (err) {
      logger.error('Error fetching preferences from Supabase:', err);
      return null;
    }
  }

  async updateUserPreferences(
    userId: string,
    prefs: Partial<UserPreferences>
  ): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const payload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (prefs.theme !== undefined) payload.theme = prefs.theme;
      if (prefs.reducedMotion !== undefined) payload.reduce_motion = prefs.reducedMotion;
      if (prefs.vibrationEnabled !== undefined) payload.haptic_feedback = prefs.vibrationEnabled;
      if (prefs.soundEnabled !== undefined) payload.guided_voice = prefs.soundEnabled;
      if (prefs.soundscapeVolume !== undefined) payload.soundscape_volume = prefs.soundscapeVolume;
      if (prefs.voiceVolume !== undefined) payload.voice_volume = prefs.voiceVolume;
      if (prefs.dailyReminder !== undefined) payload.daily_reminder_enabled = prefs.dailyReminder;
      if (prefs.reminderTime !== undefined) payload.daily_reminder_time = prefs.reminderTime;
      if (prefs.microPausesEnabled !== undefined) payload.micro_pauses_enabled = prefs.microPausesEnabled;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({ user_id: userId, ...payload }, { onConflict: 'user_id' });

      if (error) throw error;
      return true;
    } catch (err) {
      logger.error('Error updating user preferences in Supabase:', err);
      return false;
    }
  }

  async syncCurrentDevice(userId: string): Promise<void> {
    // Throttle device updates to once every 15 minutes
    const now = Date.now();
    if (now - this.lastDeviceSync < 15 * 60 * 1000) return;
    this.lastDeviceSync = now;

    if (!isSupabaseConfigured) return;

    try {
      const deviceId = `dev_${Platform.OS}_${typeof navigator !== 'undefined' ? (navigator.userAgent.slice(0, 30).replace(/\s+/g, '_')) : 'mobile'}`;
      const deviceName =
        Platform.OS === 'web'
          ? (typeof navigator !== 'undefined' && navigator.userAgent.includes('Chrome') ? 'Google Chrome (Navegador)' : 'Navegador Web')
          : (Platform.OS === 'ios' ? 'Apple iPhone' : 'Dispositivo Android');

      await supabase.from('app_devices').upsert(
        {
          user_id: userId,
          device_id: deviceId,
          device_name: deviceName,
          device_type: Platform.OS === 'web' ? 'web' : 'mobile',
          operating_system: Platform.OS.toUpperCase(),
          browser: Platform.OS === 'web' ? 'Web Browser' : 'App Nativo',
          is_current: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,device_id' }
      );
    } catch (err) {
      logger.warn('Non-blocking: could not sync device info', err);
    }
  }

  async getDevices(userId: string): Promise<DeviceInfo[]> {
    if (!isSupabaseConfigured) {
      return [
        {
          id: 'dev-1',
          deviceId: 'current-session',
          name: 'Dispositivo Atual (Web / Mobile)',
          type: Platform.OS === 'web' ? 'web' : 'mobile',
          browser: Platform.OS === 'web' ? 'Navegador Web' : 'Aplicativo Respira',
          operatingSystem: Platform.OS.toUpperCase(),
          firstSeenAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          lastSeenAt: new Date().toISOString(),
          isCurrent: true,
        },
      ];
    }

    try {
      const { data, error } = await supabase
        .from('app_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_seen_at', { ascending: false });

      if (error || !data) return [];

      return data.map((d) => ({
        id: d.id,
        deviceId: d.device_id,
        name: d.device_name,
        type: d.device_type,
        browser: d.browser,
        operatingSystem: d.operating_system,
        firstSeenAt: d.first_seen_at,
        lastSeenAt: d.last_seen_at,
        isCurrent: Boolean(d.is_current),
      }));
    } catch (err) {
      logger.error('Error fetching devices from Supabase:', err);
      return [];
    }
  }

  async exportUserData(userId: string): Promise<Record<string, any>> {
    if (!isSupabaseConfigured) {
      return {
        exportedAt: new Date().toISOString(),
        user: { id: userId, name: 'Ana', email: 'ana@exemplo.com' },
        note: 'Exportação simulada em modo de demonstração.',
      };
    }

    try {
      const [
        { data: profile },
        { data: preferences },
        { data: moodEntries },
        { data: practiceProgress },
        { data: articleProgress },
        { data: devices },
        { data: auditEvents },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_preferences').select('*').eq('user_id', userId).single(),
        supabase.from('mood_entries').select('*').eq('user_id', userId),
        supabase.from('practice_progress').select('*').eq('user_id', userId),
        supabase.from('article_progress').select('*').eq('user_id', userId),
        supabase.from('app_devices').select('*').eq('user_id', userId),
        supabase.from('audit_events').select('*').eq('user_id', userId),
      ]);

      // Record export event
      await supabase.from('audit_events').insert({
        user_id: userId,
        event_type: 'data_exported',
        metadata: { exported_at: new Date().toISOString() },
      });

      return {
        exportedAt: new Date().toISOString(),
        profile,
        preferences,
        moodEntries: moodEntries || [],
        practiceProgress: practiceProgress || [],
        articleProgress: articleProgress || [],
        devices: devices || [],
        auditEvents: auditEvents || [],
      };
    } catch (err) {
      logger.error('Error exporting user data from Supabase:', err);
      throw err;
    }
  }
}

export const supabaseUserService = new SupabaseUserService();
