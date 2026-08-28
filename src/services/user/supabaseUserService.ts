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

  /**
   * 1. Obter Perfil do Usuário Autenticado
   * Utiliza auth.getUser() e maybeSingle() para tratar ausência inicial do registro sem falhar.
   */
  async getProfile(userId?: string): Promise<Partial<User> | null> {
    if (!isSupabaseConfigured) return null;
    try {
      // 1. Validar autenticação diretamente no Supabase Auth
      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !authUser) {
        logger.warn('SupabaseUserService.getProfile: Sessão não encontrada ou expirada.', userError);
        return null;
      }

      const targetId = userId || authUser.id;

      // 2. Buscar perfil existente com maybeSingle()
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, bio, avatar_url, phone, birth_date, created_at, updated_at')
        .eq('id', targetId)
        .maybeSingle();

      if (error) {
        logger.error('SupabaseUserService.getProfile error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          stage: 'profiles_select',
        });
        return null;
      }

      // 3. Se não existir registro em profiles, criar automaticamente via upsert
      if (!data && targetId === authUser.id) {
        const defaultName =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split('@')[0] ||
          'Usuário';

        const initialProfile = {
          id: authUser.id,
          full_name: defaultName,
          display_name: defaultName,
          bio: '',
          avatar_url: authUser.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: createdData, error: createError } = await supabase
          .from('profiles')
          .upsert(initialProfile, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (!createError && createdData) {
          return {
            id: createdData.id,
            name: createdData.full_name || createdData.display_name,
            bio: createdData.bio || '',
            avatarUrl: createdData.avatar_url,
            phone: createdData.phone,
            birthDate: createdData.birth_date,
            createdAt: createdData.created_at,
            updatedAt: createdData.updated_at,
          };
        }
      }

      if (!data) return null;

      return {
        id: data.id,
        name: data.full_name || data.display_name,
        bio: data.bio || '',
        avatarUrl: data.avatar_url,
        phone: data.phone,
        birthDate: data.birth_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (err: any) {
      logger.error('Error fetching profile from Supabase:', {
        message: err?.message,
        stage: 'profiles_fetch_exception',
      });
      return null;
    }
  }

  /**
   * 2. Salvar / Atualizar Perfil
   * Usa upsert({ onConflict: 'id' }) para nunca falhar por registro ausente.
   */
  async updateProfile(
    userId: string,
    updates: {
      name?: string;
      displayName?: string;
      bio?: string;
      avatarUrl?: string | null;
      phone?: string;
      birthDate?: string;
    }
  ): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      // 1. Obter usuário autenticado
      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !authUser) {
        throw new Error('Sua sessão expirou. Entre novamente.');
      }

      const targetId = authUser.id;

      // 2. Montar payload do perfil
      const payload: Record<string, any> = {
        id: targetId,
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) {
        const cleanName = updates.name.replace(/\s+/g, ' ').trim();
        payload.full_name = cleanName;
        payload.display_name = cleanName;
      } else if (updates.displayName !== undefined) {
        const cleanDisplayName = updates.displayName.replace(/\s+/g, ' ').trim();
        payload.display_name = cleanDisplayName;
      }

      if (updates.bio !== undefined) {
        payload.bio = updates.bio.trim();
      }

      if (updates.avatarUrl !== undefined) {
        payload.avatar_url = updates.avatarUrl;
      }

      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.birthDate !== undefined) payload.birth_date = updates.birthDate;

      // 3. Executar Upsert
      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        logger.error('SupabaseUserService.updateProfile error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          stage: 'profiles_upsert',
        });
        throw new Error('Não foi possível salvar seu perfil.');
      }

      return true;
    } catch (err: any) {
      logger.error('Error updating profile in Supabase:', {
        message: err?.message,
        stage: 'profiles_update_exception',
      });
      throw err;
    }
  }

  /**
   * 3. Upload de Foto de Perfil no Supabase Storage
   * Salva no bucket 'avatars' com caminho `${user.id}/avatar-${Date.now()}.${fileExt}`.
   */
  async uploadAvatar(
    userId: string,
    fileBlob: Blob | Uint8Array | File,
    fileExt = 'jpg'
  ): Promise<string | null> {
    if (!isSupabaseConfigured) {
      if (typeof FileReader !== 'undefined' && fileBlob instanceof Blob) {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(fileBlob);
        });
      }
      return null;
    }

    try {
      // 1. Validar usuário autenticado
      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !authUser) {
        throw new Error('Sua sessão expirou. Entre novamente.');
      }

      const targetId = authUser.id;
      const normalizedExt = fileExt.toLowerCase().replace('.', '');
      const fileName = `${targetId}/avatar-${Date.now()}.${normalizedExt}`;

      let contentType = 'image/jpeg';
      if (normalizedExt === 'png') contentType = 'image/png';
      else if (normalizedExt === 'webp') contentType = 'image/webp';

      // 2. Enviar arquivo para o Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileBlob, {
          upsert: true,
          contentType,
        });

      if (error || !data) {
        logger.error('Error uploading avatar to Supabase Storage:', {
          code: (error as any)?.statusCode || (error as any)?.code,
          message: error?.message,
          stage: 'storage_upload',
        });
        throw new Error('Não foi possível enviar a foto.');
      }

      // 3. Obter URL pública permanente
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const finalUrl = urlData.publicUrl;

      // 4. Atualizar registro do perfil com a URL definitiva
      await this.updateProfile(targetId, { avatarUrl: finalUrl });
      return finalUrl;
    } catch (err: any) {
      logger.error('SupabaseUserService.uploadAvatar exception:', {
        message: err?.message,
        stage: 'avatar_upload_exception',
      });
      throw err;
    }
  }

  /**
   * 4. Obter Preferências do Usuário
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        theme: (data.theme as 'light' | 'dark') || 'light',
        reducedMotion: data.reduce_motion ?? false,
        dailyReminder: data.daily_reminder_enabled ?? true,
        reminderTime: data.daily_reminder_time || '20:30',
        vibrationEnabled: data.haptic_feedback ?? true,
        soundEnabled: data.guided_voice ?? true,
        countryHelpline: 'BR',
      };
    } catch (err) {
      logger.error('Error fetching user preferences:', err);
      return null;
    }
  }

  /**
   * 5. Sincronização de Dispositivos e Sessões
   */
  async syncCurrentDevice(userId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const now = Date.now();
    if (now - this.lastDeviceSync < 1000 * 60 * 10) return;
    this.lastDeviceSync = now;

    try {
      let deviceId = 'web-browser';
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        deviceId = localStorage.getItem('respira_device_id') || '';
        if (!deviceId) {
          deviceId = 'dev_' + Math.random().toString(36).substring(2, 11);
          localStorage.setItem('respira_device_id', deviceId);
        }
      }

      let deviceName = 'Navegador Web';
      let os = 'Web';
      let browser = 'Chrome';

      if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent;
        if (/iPhone/i.test(ua)) {
          deviceName = 'iPhone';
          os = 'iOS';
        } else if (/Android/i.test(ua)) {
          deviceName = 'Android Phone';
          os = 'Android';
        } else if (/Macintosh/i.test(ua)) {
          deviceName = 'Mac';
          os = 'macOS';
        } else if (/Windows/i.test(ua)) {
          deviceName = 'PC Windows';
          os = 'Windows';
        }

        if (/Firefox/i.test(ua)) browser = 'Firefox';
        else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
        else if (/Edg/i.test(ua)) browser = 'Edge';
      }

      await supabase.from('app_devices').upsert(
        {
          user_id: userId,
          device_id: deviceId,
          device_name: deviceName,
          device_type: Platform.OS === 'web' ? 'web' : 'mobile',
          browser,
          operating_system: os,
          last_active_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,device_id' }
      );
    } catch (err) {
      logger.warn('Failed to sync device info with Supabase:', err);
    }
  }

  async getActiveDevices(userId: string): Promise<DeviceInfo[]> {
    if (!isSupabaseConfigured) {
      return [
        {
          id: 'device-1',
          deviceId: 'web-current',
          name: 'Navegador Web (Sessão Atual)',
          type: 'desktop',
          browser: 'Google Chrome',
          operatingSystem: 'Windows',
          firstSeenAt: new Date().toISOString(),
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
        .order('last_active_at', { ascending: false });

      if (error || !data) return [];

      let currentDeviceId = '';
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        currentDeviceId = localStorage.getItem('respira_device_id') || '';
      }

      return data.map((d: any) => ({
        id: d.id,
        deviceId: d.device_id,
        name: d.device_name,
        type: d.device_type,
        browser: d.browser,
        operatingSystem: d.operating_system,
        firstSeenAt: d.first_seen_at,
        lastSeenAt: d.last_active_at,
        isCurrent: d.device_id === currentDeviceId,
      }));
    } catch (err) {
      logger.error('Error fetching active devices:', err);
      return [];
    }
  }

  async getDevices(userId: string): Promise<DeviceInfo[]> {
    return this.getActiveDevices(userId);
  }

  async exportUserData(userId: string): Promise<any> {
    const profile = await this.getProfile(userId);
    const prefs = await this.getUserPreferences(userId);
    const devices = await this.getActiveDevices(userId);
    return {
      exportedAt: new Date().toISOString(),
      user: profile,
      preferences: prefs,
      devices,
    };
  }
}

export const supabaseUserService = new SupabaseUserService();
