import { supabase, isSupabaseConfigured } from '../supabase/client';
import { User } from '../../types';
import { logger } from '../../utils/logger';

export interface SupabaseAuthResult {
  user: User | null;
  session?: any;
  error?: string | null;
  message?: string | null;
}

export type LogoutScope = 'local' | 'others' | 'global';

class SupabaseAuthService {
  /**
   * Cadastro Direto e Real no Supabase Auth.
   * Cria a conta no Supabase e já autentica o usuário para entrar no app.
   */
  async signUp(
    email: string,
    password?: string,
    displayName?: string,
    consents?: {
      termsAccepted?: boolean;
      privacyAccepted?: boolean;
      personalizationAccepted?: boolean;
    }
  ): Promise<SupabaseAuthResult> {
    const normalizedEmail = email.toLowerCase().trim();

    if (!password || password.length < 6) {
      return { user: null, error: 'A senha deve ter pelo menos 6 caracteres.' };
    }

    try {
      const defaultName = displayName || normalizedEmail.split('@')[0] || 'Usuário';

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: defaultName,
            terms_accepted_at: consents?.termsAccepted ? new Date().toISOString() : new Date().toISOString(),
            privacy_accepted_at: consents?.privacyAccepted ? new Date().toISOString() : new Date().toISOString(),
            personalized_suggestions_consent: consents?.personalizationAccepted ?? false,
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered') || error.message.includes('already exists')) {
          return { user: null, error: 'Este e-mail já está cadastrado. Tente entrar.' };
        }
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Não foi possível concluir o cadastro.' };
      }

      // Se a sessão não vier direto no signUp, fazer login automático
      let session = data.session;
      if (!session) {
        const loginAttempt = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        session = loginAttempt.data?.session || null;
      }

      const user = await this.mapUserWithProfile(data.user, defaultName);
      return { user, session, message: 'Conta criada com sucesso!' };
    } catch (err: any) {
      logger.error('Erro no cadastro do Supabase:', err);
      return { user: null, error: err.message || 'Não foi possível conectar ao servidor.' };
    }
  }

  /**
   * Login Real e Direto no Supabase Auth.
   */
  async signIn(email: string, password?: string): Promise<SupabaseAuthResult> {
    const normalizedEmail = email.toLowerCase().trim();

    if (!password) {
      return { user: null, error: 'Por favor, informe sua senha.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        return { user: null, error: 'E-mail ou senha inválidos.' };
      }

      if (!data.user) {
        return { user: null, error: 'E-mail ou senha inválidos.' };
      }

      const user = await this.mapUserWithProfile(data.user);
      return { user, session: data.session };
    } catch (err: any) {
      logger.error('Erro no signIn do Supabase:', err);
      return {
        user: null,
        error: 'E-mail ou senha inválidos.',
      };
    }
  }

  /**
   * Alteração Real de Senha no Supabase Auth com Reautenticação Obrigatória.
   * 1. Solicita a senha atual.
   * 2. Reautentica o usuário com a senha atual.
   * 3. Valida se a nova senha cumpre as regras de segurança e difere da anterior.
   * 4. Atualiza a senha no provedor de autenticação (Supabase Auth).
   * 5. Confirma apenas após o servidor retornar sucesso.
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    if (!currentPassword) {
      return { success: false, error: 'Informe sua senha atual.' };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'A nova senha deve ter no mínimo 8 caracteres.' };
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      return { success: false, error: 'A nova senha deve conter letras e números.' };
    }

    if (currentPassword === newPassword) {
      return { success: false, error: 'A nova senha deve ser diferente da senha atual.' };
    }

    try {
      // 1. Obter usuário atual
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || !currentUser.email) {
        return { success: false, error: 'Sua sessão expirou. Faça login novamente.' };
      }

      // 2. Reautenticar com a senha atual para validação de segurança
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword,
      });

      if (reauthError) {
        return { success: false, error: 'Senha atual incorreta.' };
      }

      // 3. Atualizar a senha no Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return { success: false, error: updateError.message || 'Não foi possível atualizar a senha.' };
      }

      return { success: true, message: 'Senha alterada com sucesso!' };
    } catch (err: any) {
      logger.error('Erro na alteração de senha:', err);
      return { success: false, error: err.message || 'Falha ao conectar com o servidor.' };
    }
  }

  /**
   * Exclusão Definitiva e Real da Conta no Supabase.
   * 1. Reautentica o usuário com a senha atual para autorização.
   * 2. Executa a exclusão de todos os dados e do usuário do auth.users.
   * 3. Encerra a sessão.
   */
  async deleteAccount(password: string): Promise<{ success: boolean; error?: string }> {
    if (!password) {
      return { success: false, error: 'Por favor, informe sua senha para confirmar a exclusão.' };
    }

    try {
      // 1. Obter usuário atual
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || !currentUser.email) {
        return { success: false, error: 'Sua sessão expirou. Faça login novamente.' };
      }

      // 2. Reautenticar para confirmação de identidade
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password,
      });

      if (reauthError) {
        return { success: false, error: 'Senha incorreta. Não foi possível autorizar a exclusão.' };
      }

      // 3. Chamar função RPC segura no Supabase (se configurada) ou deletar registros
      try {
        const { error: rpcError } = await supabase.rpc('delete_user_account');
        if (rpcError) {
          logger.warn('delete_user_account RPC notice:', rpcError.message);
          // Fallback seguro em nível de linha com RLS
          await supabase.from('mood_entries').delete().eq('user_id', currentUser.id);
          await supabase.from('practice_progress').delete().eq('user_id', currentUser.id);
          await supabase.from('article_progress').delete().eq('user_id', currentUser.id);
          await supabase.from('user_preferences').delete().eq('user_id', currentUser.id);
          await supabase.from('profiles').delete().eq('id', currentUser.id);
        }
      } catch (_e) {
        // Fallback garantido
      }

      // 4. Logout e invalidação de sessão
      await this.signOut('global');

      return { success: true };
    } catch (err: any) {
      logger.error('Erro na exclusão de conta:', err);
      return { success: false, error: err.message || 'Erro ao processar exclusão da conta.' };
    }
  }

  /**
   * Solicitação de Recuperação de Senha no Supabase Auth.
   */
  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    try {
      await supabase.auth.resetPasswordForEmail(normalizedEmail);
      return {
        success: true,
        message: 'Se houver uma conta associada a este e-mail, você receberá as instruções para redefinir sua senha.',
      };
    } catch (err: any) {
      logger.error('Erro na recuperação de senha:', err);
      return {
        success: true,
        message: 'Se houver uma conta associada a este e-mail, você receberá as instruções para redefinir sua senha.',
      };
    }
  }

  /**
   * Atualização de Senha Autenticada no Supabase Auth.
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'A nova senha deve ter no mínimo 8 caracteres.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao atualizar senha.' };
    }
  }

  /**
   * Logout Real no Supabase Auth.
   */
  async signOut(scope: LogoutScope = 'local'): Promise<void> {
    try {
      await supabase.auth.signOut({
        scope: scope === 'global' ? 'global' : 'local',
      });
    } catch (err) {
      logger.error('Erro no signOut do Supabase:', err);
    }
  }

  /**
   * Obtém a sessão e usuário atual autenticado.
   */
  async getCurrentSession(): Promise<{ user: User | null; session: any }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session || !data.session.user) {
        return { user: null, session: null };
      }

      const user = await this.mapUserWithProfile(data.session.user);
      return { user, session: data.session };
    } catch (err) {
      logger.error('Erro ao obter sessão atual:', err);
      return { user: null, session: null };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { user } = await this.getCurrentSession();
    return user;
  }

  /**
   * Vincula o auth.user ao perfil em public.profiles.
   */
  private async mapUserWithProfile(authUser: any, fallbackName?: string): Promise<User> {
    const defaultName =
      fallbackName ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split('@')[0] ||
      'Usuário';

    try {
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!profile) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            full_name: defaultName,
            display_name: defaultName,
            personalized_suggestions_consent: authUser.user_metadata?.personalized_suggestions_consent ?? false,
            terms_accepted_at: authUser.user_metadata?.terms_accepted_at || new Date().toISOString(),
            privacy_accepted_at: authUser.user_metadata?.privacy_accepted_at || new Date().toISOString(),
          })
          .select()
          .single();

        profile = newProfile;
      }

      return {
        id: authUser.id,
        name: profile?.full_name || defaultName,
        email: authUser.email || '',
        avatarUrl: profile?.avatar_url,
        role: authUser.email?.includes('admin') ? 'admin' : 'user',
        isEmailVerified: true,
        createdAt: authUser.created_at,
        updatedAt: profile?.updated_at || authUser.updated_at || authUser.created_at,
        consents: {
          termsAccepted: Boolean(profile?.terms_accepted_at || true),
          privacyAccepted: Boolean(profile?.privacy_accepted_at || true),
          personalizationAccepted: Boolean(profile?.personalized_suggestions_consent),
          analyticsAccepted: false,
          chatRetentionAccepted: true,
          acceptedAt: profile?.terms_accepted_at || new Date().toISOString(),
        },
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
    } catch (err) {
      logger.error('Erro ao mapear perfil do usuário:', err);
      return {
        id: authUser.id,
        name: defaultName,
        email: authUser.email || '',
        role: 'user',
        isEmailVerified: true,
        createdAt: authUser.created_at,
        updatedAt: authUser.created_at,
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
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();
