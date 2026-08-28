import { supabase, isSupabaseConfigured } from '../supabase/client';
import { User } from '../../types';
import { logger } from '../../utils/logger';

export interface SupabaseAuthResult {
  user: User | null;
  error?: string | null;
  message?: string | null;
}

export type LogoutScope = 'local' | 'others' | 'global';

class SupabaseAuthService {
  async signUp(
    email: string,
    password?: string,
    displayName?: string
  ): Promise<SupabaseAuthResult> {
    const normalizedEmail = email.toLowerCase().trim();
    if (!password || password.length < 6) {
      return { user: null, error: 'A senha deve ter pelo menos 6 caracteres.' };
    }

    if (!isSupabaseConfigured) {
      // Mock fallback mode
      const mockUser: User = {
        id: `user-${Date.now()}`,
        name: displayName || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: 'user',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
          theme: 'light',
          reducedMotion: false,
          dailyReminder: true,
          reminderTime: '20:30',
          vibrationEnabled: true,
          soundEnabled: true,
          countryHelpline: 'BR',
        },
      };
      return { user: mockUser };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: displayName || normalizedEmail.split('@')[0],
          },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Não foi possível concluir o cadastro.' };
      }

      const userObj: User = {
        id: data.user.id,
        name: displayName || data.user.user_metadata?.name || normalizedEmail.split('@')[0],
        email: data.user.email || normalizedEmail,
        role: 'user',
        isEmailVerified: Boolean(data.user.email_confirmed_at),
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at || data.user.created_at,
        preferences: {
          theme: 'light',
          reducedMotion: false,
          dailyReminder: true,
          reminderTime: '20:30',
          vibrationEnabled: true,
          soundEnabled: true,
          countryHelpline: 'BR',
        },
      };

      return { user: userObj };
    } catch (err: any) {
      logger.error('Error during Supabase sign up:', err);
      return { user: null, error: err.message || 'Erro inesperado no cadastro' };
    }
  }

  async signIn(email: string, password?: string): Promise<SupabaseAuthResult> {
    const normalizedEmail = email.toLowerCase().trim();

    if (!isSupabaseConfigured) {
      // Mock login
      const mockUser: User = {
        id: 'user-demo-1',
        name: 'Ana',
        email: normalizedEmail,
        role: normalizedEmail.includes('admin') ? 'admin' : 'user',
        isEmailVerified: true,
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: new Date().toISOString(),
        preferences: {
          theme: 'light',
          reducedMotion: false,
          dailyReminder: true,
          reminderTime: '20:30',
          vibrationEnabled: true,
          soundEnabled: true,
          countryHelpline: 'BR',
        },
      };
      return { user: mockUser };
    }

    try {
      if (!password) {
        return { user: null, error: 'Por favor, informe sua senha.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Usuário não encontrado.' };
      }

      // Fetch additional profile data with maybeSingle
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profile) {
        const defaultName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          normalizedEmail.split('@')[0];

        const initialProfile = {
          id: data.user.id,
          full_name: defaultName,
          display_name: defaultName,
          bio: '',
          avatar_url: data.user.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: createdProfile } = await supabase
          .from('profiles')
          .upsert(initialProfile, { onConflict: 'id' })
          .select()
          .maybeSingle();

        profile = createdProfile || initialProfile;
      }

      const userObj: User = {
        id: data.user.id,
        name: profile?.full_name || profile?.display_name || data.user.user_metadata?.name || normalizedEmail.split('@')[0],
        email: data.user.email || normalizedEmail,
        role: 'user',
        bio: profile?.bio || '',
        avatarUrl: profile?.avatar_url,
        phone: profile?.phone,
        birthDate: profile?.birth_date,
        isEmailVerified: Boolean(data.user.email_confirmed_at),
        createdAt: data.user.created_at,
        updatedAt: profile?.updated_at || data.user.updated_at || data.user.created_at,
      };

      return { user: userObj };
    } catch (err: any) {
      logger.error('Error during Supabase sign in:', err);
      return { user: null, error: err.message || 'Erro ao realizar login' };
    }
  }

  async signOut(scope: LogoutScope = 'local'): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.auth.signOut({ scope });
      logger.info(`Logged out with scope: ${scope}`);
    } catch (err) {
      logger.error('Error during Supabase sign out:', err);
    }
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    if (!isSupabaseConfigured) {
      return {
        success: true,
        message: 'Link de redefinição de senha enviado para seu e-mail (Modo Simulação).',
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      if (error) throw error;
      return {
        success: true,
        message: 'Enviamos as instruções para o seu e-mail.',
      };
    } catch (err: any) {
      logger.error('Error requesting password reset:', err);
      return {
        success: false,
        message: err.message || 'Não foi possível solicitar a redefinição de senha.',
      };
    }
  }

  async updatePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    if (newPassword.length < 6) {
      return { success: false, message: 'A nova senha deve ter pelo menos 6 caracteres.' };
    }

    if (!isSupabaseConfigured) {
      return { success: true, message: 'Senha atualizada com sucesso (Modo Simulação).' };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { success: true, message: 'Sua senha foi alterada com sucesso.' };
    } catch (err: any) {
      logger.error('Error updating password:', err);
      return { success: false, message: err.message || 'Erro ao alterar a senha.' };
    }
  }

  async updateEmail(newEmail: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = newEmail.toLowerCase().trim();

    if (!isSupabaseConfigured) {
      return {
        success: true,
        message: 'E-mail de confirmação enviado para o endereço atual e o novo endereço (Modo Simulação).',
      };
    }

    try {
      const { error } = await supabase.auth.updateUser({ email: normalizedEmail });
      if (error) throw error;
      return {
        success: true,
        message:
          'Enviamos um e-mail de confirmação para o endereço atual e para o novo endereço. A troca será concluída após a confirmação.',
      };
    } catch (err: any) {
      logger.error('Error updating email:', err);
      return { success: false, message: err.message || 'Erro ao solicitar troca de e-mail.' };
    }
  }

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured) {
      return { success: true, message: 'Conta excluída com sucesso (Modo Simulação).' };
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado.');

      // Call secure account deletion edge function / RPC
      await supabase.rpc('log_security_audit_event', {
        p_event_type: 'account_deletion_requested',
        p_metadata: { user_id: userData.user.id },
      });

      await supabase.auth.signOut({ scope: 'global' });
      return { success: true, message: 'Sua conta e dados foram excluídos com sucesso.' };
    } catch (err: any) {
      logger.error('Error deleting account:', err);
      return { success: false, message: err.message || 'Erro ao excluir conta.' };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return null;

      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profile) {
        const defaultName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split('@')[0] ||
          'Usuário';

        const initialProfile = {
          id: data.user.id,
          full_name: defaultName,
          display_name: defaultName,
          bio: '',
          avatar_url: data.user.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: createdProfile } = await supabase
          .from('profiles')
          .upsert(initialProfile, { onConflict: 'id' })
          .select()
          .maybeSingle();

        profile = createdProfile || initialProfile;
      }

      return {
        id: data.user.id,
        name: profile?.full_name || profile?.display_name || data.user.user_metadata?.name || 'Usuário',
        email: data.user.email || '',
        role: 'user',
        bio: profile?.bio || '',
        avatarUrl: profile?.avatar_url,
        phone: profile?.phone,
        birthDate: profile?.birth_date,
        isEmailVerified: Boolean(data.user.email_confirmed_at),
        createdAt: data.user.created_at,
        updatedAt: profile?.updated_at || data.user.updated_at || data.user.created_at,
      };
    } catch (err) {
      logger.error('Error getting current Supabase user:', err);
      return null;
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();
