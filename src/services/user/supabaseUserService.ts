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
        console.error('Erro ao salvar perfil:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
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
      console.error('Erro ao buscar perfil:', {
        message: err?.message,
        stage: 'profiles_fetch_exception',
      });
      return null;
    }
  }

  /**
   * 2. Função Unificada de Salvamento de Perfil e Avatar
   * Executa a sequência estrita: auth.getUser() -> upsert profile -> upload avatar -> update avatar_url -> refresh profile.
   */
  async saveProfileAndAvatar(params: {
    fullName: string;
    bio: string;
    avatarFile?: File | Blob | null;
    removeAvatar?: boolean;
  }): Promise<{ name: string; bio: string; avatarUrl: string | null }> {
    if (!isSupabaseConfigured) {
      return {
        name: params.fullName.trim(),
        bio: params.bio.trim(),
        avatarUrl: null,
      };
    }

    // 1. Obtenha o usuário por supabase.auth.getUser() e confirme sessão válida
    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !authUser) {
      console.error('Erro ao salvar perfil:', {
        message: userError?.message || 'Sessão expirada. Entre novamente.',
        code: (userError as any)?.code,
        details: (userError as any)?.details,
        hint: (userError as any)?.hint,
      });
      throw new Error('Sua sessão expirou. Faça login novamente para continuar.');
    }

    const userId = authUser.id;
    const cleanName = params.fullName.replace(/\s+/g, ' ').trim();
    const cleanBio = params.bio.trim();

    // 2. Salvar nome e biografia na tabela 'profiles' via upsert
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: cleanName,
          display_name: cleanName,
          bio: cleanBio,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (upsertError) {
      console.error('Erro ao salvar perfil:', {
        message: upsertError.message,
        code: upsertError.code,
        details: upsertError.details,
        hint: upsertError.hint,
      });
      throw new Error('Não foi possível atualizar os seus dados.');
    }

    let finalAvatarUrl: string | null = undefined as any;

    // 3. Se existir uma nova foto, enviar ao bucket 'avatars'
    if (params.avatarFile) {
      const avatarPath = `${userId}/avatar-${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(avatarPath, params.avatarFile, {
          contentType: 'image/webp',
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Erro ao salvar perfil:', {
          message: uploadError.message,
          code: (uploadError as any)?.code,
          details: (uploadError as any)?.details,
          hint: (uploadError as any)?.hint,
        });
        throw new Error('Não foi possível enviar a imagem.');
      }

      // 4. Obter URL pública permanente da imagem
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
      finalAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // 5. Salvar o caminho na coluna avatar_url da tabela profiles
      const { error: avatarUpdateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (avatarUpdateError) {
        console.error('Erro ao salvar perfil:', {
          message: avatarUpdateError.message,
          code: avatarUpdateError.code,
          details: avatarUpdateError.details,
          hint: avatarUpdateError.hint,
        });
        throw new Error('Não foi possível atualizar os seus dados.');
      }
    } else if (params.removeAvatar) {
      finalAvatarUrl = null;
      const { error: removeError } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (removeError) {
        console.error('Erro ao salvar perfil:', {
          message: removeError.message,
          code: removeError.code,
          details: removeError.details,
          hint: removeError.hint,
        });
        throw new Error('Não foi possível atualizar os seus dados.');
      }
    }

    // 6. Buscar novamente o perfil no banco para confirmação
    const { data: refreshedProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, bio, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Erro ao salvar perfil:', {
        message: fetchError.message,
        code: fetchError.code,
        details: fetchError.details,
        hint: fetchError.hint,
      });
    }

    const confirmedName = refreshedProfile?.full_name || refreshedProfile?.display_name || cleanName;
    const confirmedBio = refreshedProfile?.bio ?? cleanBio;
    const confirmedAvatar =
      finalAvatarUrl !== undefined
        ? finalAvatarUrl
        : refreshedProfile?.avatar_url || null;

    return {
      name: confirmedName,
      bio: confirmedBio,
      avatarUrl: confirmedAvatar,
    };
  }

  /**
   * 3. Atualizar dados gerais do perfil
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
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      const session = await supabase.auth.getSession();
      const targetId = authUser?.id || session.data?.session?.user?.id || userId;

      if (!targetId) {
        throw new Error('Sua sessão expirou. Faça login novamente para continuar.');
      }

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

      const { error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('Erro ao salvar perfil:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return false;
      }

      return true;
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', {
        message: err?.message,
        stage: 'profiles_update_exception',
      });
      return false;
    }
  }

  /**
   * 4. Upload isolado de foto
   */
  async uploadAvatar(
    userId: string,
    fileBlob: Blob | Uint8Array | File,
    fileExt = 'webp'
  ): Promise<string | null> {
    if (!isSupabaseConfigured) {
      if (typeof FileReader !== 'undefined' && fileBlob instanceof Blob) {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(fileBlob);
        });
      }
      return null;
    }

    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !authUser) {
      console.error('Erro ao salvar perfil:', {
        message: userError?.message || 'Sessão expirada. Entre novamente.',
        code: (userError as any)?.code,
        details: (userError as any)?.details,
        hint: (userError as any)?.hint,
      });
      throw new Error('Sua sessão expirou. Faça login novamente para continuar.');
    }

    const targetId = authUser.id;

    const normalizedExt = fileExt.toLowerCase().replace('.', '') || 'webp';
    const filePath = `${targetId}/avatar.${normalizedExt}`;

    let contentType = 'image/webp';
    if (normalizedExt === 'png') contentType = 'image/png';
    else if (normalizedExt === 'jpg' || normalizedExt === 'jpeg') contentType = 'image/jpeg';

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, fileBlob, {
        upsert: true,
        contentType,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Erro ao salvar perfil:', {
        message: uploadError.message,
        code: (uploadError as any)?.code,
        details: (uploadError as any)?.details,
        hint: (uploadError as any)?.hint,
      });
      throw new Error('Não foi possível enviar a imagem.');
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const finalUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: targetId,
          avatar_url: finalUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('Erro ao salvar perfil:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
      });
      throw new Error('Não foi possível atualizar os seus dados.');
    }

    return finalUrl;
  }

  async updateAvatar(userId: string, avatarUrl: string | null): Promise<boolean> {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      const session = await supabase.auth.getSession();
      const targetId = authUser?.id || session.data?.session?.user?.id || userId;

      if (avatarUrl === null) {
        try {
          await supabase.storage.from('avatars').remove([
            `${targetId}/avatar.webp`,
            `${targetId}/avatar.jpg`,
            `${targetId}/avatar.png`,
          ]);
        } catch (_e) {}
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: targetId,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (error) {
        console.error('Erro ao salvar perfil:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  async getPreferences(userId: string): Promise<UserPreferences | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        theme: data.theme || 'system',
        reducedMotion: data.reduced_motion ?? false,
        largeText: data.large_text ?? false,
        highContrast: data.high_contrast ?? false,
        reduceTransparency: data.reduce_transparency ?? false,
        dailyReminder: data.daily_reminder ?? true,
        reminderTime: data.reminder_time || '20:00',
        vibrationEnabled: data.vibration_enabled ?? true,
        soundEnabled: data.sound_enabled ?? true,
        countryHelpline: data.country_helpline || 'BR',
        notifications: data.notifications || {
          dailyCheckin: true,
          practiceReminders: true,
          weeklyReport: true,
          achievements: true,
        },
      };
    } catch {
      return null;
    }
  }

  async updatePreferences(
    userId: string,
    prefs: Partial<UserPreferences>
  ): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const payload: Record<string, any> = {
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      if (prefs.theme) payload.theme = prefs.theme;
      if (prefs.reducedMotion !== undefined) payload.reduced_motion = prefs.reducedMotion;
      if (prefs.largeText !== undefined) payload.large_text = prefs.largeText;
      if (prefs.highContrast !== undefined) payload.high_contrast = prefs.highContrast;
      if (prefs.reduceTransparency !== undefined) payload.reduce_transparency = prefs.reduceTransparency;
      if (prefs.dailyReminder !== undefined) payload.daily_reminder = prefs.dailyReminder;
      if (prefs.reminderTime) payload.reminder_time = prefs.reminderTime;
      if (prefs.vibrationEnabled !== undefined) payload.vibration_enabled = prefs.vibrationEnabled;
      if (prefs.soundEnabled !== undefined) payload.sound_enabled = prefs.soundEnabled;
      if (prefs.countryHelpline) payload.country_helpline = prefs.countryHelpline;
      if (prefs.notifications) payload.notifications = prefs.notifications;

      const { error } = await supabase
        .from('user_preferences')
        .upsert(payload, { onConflict: 'user_id' });

      return !error;
    } catch {
      return false;
    }
  }

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

      if (error || !data || data.length === 0) {
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
        firstSeenAt: d.first_seen_at || new Date().toISOString(),
        lastSeenAt: d.last_active_at || d.last_seen_at || new Date().toISOString(),
        isCurrent: d.device_id === currentDeviceId || d.is_current,
      }));
    } catch {
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
  }

  async getDevices(userId: string): Promise<DeviceInfo[]> {
    return this.getActiveDevices(userId);
  }

  async exportUserData(_userId: string): Promise<any> {
    throw new Error('403: A funcionalidade de exportação de dados foi descontinuada.');
  }

  async registerDevice(
    userId: string,
    device: {
      deviceId: string;
      name: string;
      type: string;
      browser?: string;
      operatingSystem?: string;
      isCurrent?: boolean;
    }
  ): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const { error } = await supabase
        .from('user_devices')
        .upsert(
          {
            user_id: userId,
            device_id: device.deviceId,
            device_name: device.name,
            device_type: device.type,
            browser: device.browser,
            operating_system: device.operatingSystem,
            is_active: true,
            is_current: device.isCurrent ?? true,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,device_id' }
        );

      return !error;
    } catch {
      return false;
    }
  }

  async revokeDevice(userId: string, deviceId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const { error } = await supabase
        .from('user_devices')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('device_id', deviceId);

      return !error;
    } catch {
      return false;
    }
  }

  async revokeAllOtherDevices(userId: string, currentDeviceId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const { error } = await supabase
        .from('user_devices')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .neq('device_id', currentDeviceId);

      return !error;
    } catch {
      return false;
    }
  }
}

export const supabaseUserService = new SupabaseUserService();
