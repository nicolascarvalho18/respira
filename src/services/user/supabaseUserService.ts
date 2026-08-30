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
   * Busca no banco de dados e sempre mantém fallback para os metadados do auth.users
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

      const fallbackName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] ||
        'Usuário';

      const fallbackBio = authUser.user_metadata?.bio || '';
      const fallbackAvatar = authUser.user_metadata?.avatar_url || null;

      // 2. Buscar perfil existente com maybeSingle()
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetId)
          .maybeSingle();

        if (data && !error) {
          return {
            id: data.id,
            name: data.full_name || data.display_name || fallbackName,
            bio: data.bio !== undefined ? data.bio : fallbackBio,
            avatarUrl: data.avatar_url || fallbackAvatar,
            phone: data.phone,
            birthDate: data.birth_date,
            createdAt: data.created_at || authUser.created_at,
            updatedAt: data.updated_at || authUser.updated_at,
          };
        }

        // Se não existir registro em profiles e for o próprio usuário, tentar criar
        if (!data && targetId === authUser.id) {
          const initialProfile = {
            id: authUser.id,
            full_name: fallbackName,
            display_name: fallbackName,
            bio: fallbackBio,
            avatar_url: fallbackAvatar,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await supabase
            .from('profiles')
            .upsert(initialProfile, { onConflict: 'id' })
            .catch(() => {});
        }
      } catch (tableErr) {
        logger.warn('SupabaseUserService.getProfile: Aviso ao consultar tabela profiles:', tableErr);
      }

      // Fallback garantido pelos metadados de autenticação
      return {
        id: authUser.id,
        name: fallbackName,
        bio: fallbackBio,
        avatarUrl: fallbackAvatar,
        createdAt: authUser.created_at,
        updatedAt: authUser.updated_at,
      };
    } catch (err: any) {
      logger.error('Erro ao buscar perfil:', err);
      return null;
    }
  }

  /**
   * 2. Função Unificada de Salvamento de Perfil e Avatar
   * Executa a sequência: auth.getUser() -> upsert profile -> upload avatar -> update avatar_url -> refresh profile.
   */
  async saveProfileAndAvatar(params: {
    fullName: string;
    bio: string;
    avatarFile?: File | Blob | null;
    removeAvatar?: boolean;
  }): Promise<{ name: string; bio: string; avatarUrl: string | null }> {
    const cleanName = params.fullName.replace(/\s+/g, ' ').trim();
    const cleanBio = params.bio.trim();

    if (!isSupabaseConfigured) {
      let localAvatarUrl: string | null = null;
      if (params.avatarFile && typeof FileReader !== 'undefined' && params.avatarFile instanceof Blob) {
        localAvatarUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(params.avatarFile as Blob);
        });
      }
      return {
        name: cleanName,
        bio: cleanBio,
        avatarUrl: localAvatarUrl,
      };
    }

    // 1. Obter o usuário por supabase.auth.getUser() e confirmar sessão válida
    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !authUser) {
      logger.error('Erro ao autenticar para salvar perfil:', userError);
      throw new Error('Sua sessão expirou. Faça login novamente para continuar.');
    }

    const userId = authUser.id;

    // 2. Salvar nome e biografia na tabela 'profiles' via upsert
    const upsertPayload: Record<string, any> = {
      id: userId,
      full_name: cleanName,
      display_name: cleanName,
      bio: cleanBio,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(upsertPayload, { onConflict: 'id' });

    if (upsertError) {
      logger.warn('[supabaseUserService] Profiles upsert notice:', upsertError);
      // Se o erro não for de schema cache ou tabela ausente, registrar
      if (!upsertError.message?.includes('schema cache') && upsertError.code !== 'PGRST204' && upsertError.code !== 'PGRST205') {
        logger.error('Erro ao salvar perfil na tabela:', upsertError);
      }
    }

    let finalAvatarUrl: string | null = undefined as any;

    // 3. Se existir uma nova foto, enviar ao bucket 'avatars'
    if (params.avatarFile) {
      const timestamp = Date.now();
      const avatarPath = `${userId}/avatar-${timestamp}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(avatarPath, params.avatarFile, {
          contentType: 'image/webp',
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) {
        logger.error('Erro ao enviar foto de perfil para o storage:', uploadError);
        throw new Error(uploadError.message || 'Não foi possível enviar a imagem.');
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
      finalAvatarUrl = `${urlData.publicUrl}?t=${timestamp}`;

      const { error: avatarUpdateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (avatarUpdateError) {
        logger.warn('[supabaseUserService] avatar update error:', avatarUpdateError);
      }

      await supabase.auth.updateUser({
        data: {
          full_name: cleanName,
          name: cleanName,
          bio: cleanBio,
          avatar_url: finalAvatarUrl,
        },
      }).catch(() => {});
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
        logger.warn('[supabaseUserService] avatar removal notice:', removeError);
      }

      try {
        await supabase.storage.from('avatars').remove([
          `${userId}/avatar.webp`,
          `${userId}/avatar.jpg`,
          `${userId}/avatar.png`,
        ]);
      } catch (_e) {}

      await supabase.auth.updateUser({
        data: {
          full_name: cleanName,
          name: cleanName,
          bio: cleanBio,
          avatar_url: null,
        },
      }).catch(() => {});
    } else {
      await supabase.auth.updateUser({
        data: {
          full_name: cleanName,
          name: cleanName,
          bio: cleanBio,
        },
      }).catch(() => {});
    }

    // 4. Buscar o perfil atualizado para confirmação
    let refreshedProfile: any = null;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      refreshedProfile = data;
    } catch (_e) {}

    const confirmedName = refreshedProfile?.full_name || refreshedProfile?.display_name || cleanName;
    const confirmedBio = refreshedProfile?.bio !== undefined ? refreshedProfile.bio : cleanBio;
    const confirmedAvatar =
      finalAvatarUrl !== undefined
        ? finalAvatarUrl
        : refreshedProfile?.avatar_url || authUser.user_metadata?.avatar_url || null;

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

      const cleanName = updates.name ? updates.name.replace(/\s+/g, ' ').trim() : updates.displayName ? updates.displayName.replace(/\s+/g, ' ').trim() : undefined;

      // Sincronizar Auth User Metadata
      if (cleanName || updates.bio !== undefined || updates.avatarUrl !== undefined) {
        await supabase.auth.updateUser({
          data: {
            ...(cleanName ? { full_name: cleanName, name: cleanName, display_name: cleanName } : {}),
            ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
            ...(updates.avatarUrl !== undefined ? { avatar_url: updates.avatarUrl } : {}),
          },
        }).catch(() => {});
      }

      const payload: Record<string, any> = {
        id: targetId,
        updated_at: new Date().toISOString(),
      };

      if (cleanName) {
        payload.full_name = cleanName;
        payload.display_name = cleanName;
      }
      if (updates.bio !== undefined) payload.bio = updates.bio.trim();
      if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.birthDate !== undefined) payload.birth_date = updates.birthDate;

      await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .catch(() => {});

      return true;
    } catch (err: any) {
      logger.error('Erro ao salvar perfil:', err);
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
      logger.error('[supabaseUserService] Storage upload error:', uploadError);
      throw new Error(uploadError.message || 'Não foi possível enviar a imagem.');
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const finalUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase.auth.updateUser({
      data: { avatar_url: finalUrl },
    }).catch(() => {});

    await supabase
      .from('profiles')
      .upsert(
        {
          id: targetId,
          avatar_url: finalUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .catch(() => {});

    return finalUrl;
  }

  async updateAvatar(userId: string, avatarUrl: string | null): Promise<boolean> {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      const targetId = authUser?.id || userId;

      if (avatarUrl === null) {
        try {
          await supabase.storage.from('avatars').remove([
            `${targetId}/avatar.webp`,
            `${targetId}/avatar.jpg`,
            `${targetId}/avatar.png`,
          ]);
        } catch (_e) {}
      }

      await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      }).catch(() => {});

      try {
        await supabase
          .from('profiles')
          .upsert(
            {
              id: targetId,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
      } catch (_e) {}

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
      if (prefs.reminderTime) payload.daily_reminder_time = prefs.reminderTime;
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

  async getDevices(userId: string): Promise<DeviceInfo[]> {
    if (!isSupabaseConfigured) {
      return [
        {
          id: 'dev-current',
          deviceId: 'local-device',
          name: Platform.OS === 'web' ? 'Navegador Web' : 'Dispositivo Móvel',
          type: Platform.OS === 'web' ? 'web' : 'mobile',
          browser: Platform.OS === 'web' ? 'Chrome/Edge/Safari' : undefined,
          operatingSystem: Platform.OS,
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isCurrent: true,
        },
      ];
    }

    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_seen_at', { ascending: false });

      if (error || !data) return [];

      return data.map((d: any) => ({
        id: d.id,
        deviceId: d.device_id,
        name: d.name || 'Dispositivo',
        type: d.type || 'web',
        browser: d.browser,
        operatingSystem: d.operating_system,
        firstSeenAt: d.first_seen_at || d.created_at,
        lastSeenAt: d.last_seen_at || d.updated_at,
        isCurrent: Boolean(d.is_current),
      }));
    } catch {
      return [];
    }
  }

  async syncCurrentDevice(userId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const now = Date.now();
    if (now - this.lastDeviceSync < 60000) return;
    this.lastDeviceSync = now;

    try {
      const deviceId = `dev-${userId.slice(0, 8)}`;
      const deviceName = Platform.OS === 'web' ? 'Navegador Web' : 'Dispositivo Móvel';

      await supabase.from('user_devices').upsert(
        {
          user_id: userId,
          device_id: deviceId,
          name: deviceName,
          type: Platform.OS === 'web' ? 'web' : 'mobile',
          operating_system: Platform.OS,
          last_seen_at: new Date().toISOString(),
          is_current: true,
        },
        { onConflict: 'user_id,device_id' }
      ).catch(() => {});
    } catch {}
  }
}

export const supabaseUserService = new SupabaseUserService();
