import { supabase } from '../supabase/client';
import { User } from '../../types';
import { logger } from '../../utils/logger';

export interface SupabaseAuthResult {
  user: User | null;
  session?: any;
  error?: string | null;
  message?: string | null;
  requiresVerification?: boolean;
  isEmailNotConfirmed?: boolean;
  email?: string;
}

export type LogoutScope = 'local' | 'others' | 'global';

class SupabaseAuthService {
  /**
   * Cadastro Real no Supabase Auth.
   * Não libera sessão falsa e envia código de verificação para o e-mail.
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

    if (!password || password.length < 10) {
      return { user: null, error: 'A senha deve ter pelo menos 10 caracteres.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: displayName || normalizedEmail.split('@')[0],
            terms_accepted_at: consents?.termsAccepted ? new Date().toISOString() : null,
            privacy_accepted_at: consents?.privacyAccepted ? new Date().toISOString() : null,
            personalized_suggestions_consent: consents?.personalizationAccepted ?? false,
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered') || error.message.includes('already exists')) {
          return { user: null, error: 'Este e-mail já está cadastrado. Tente entrar ou recuperar sua senha.' };
        }
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Não foi possível concluir o cadastro.' };
      }

      return {
        user: null,
        requiresVerification: true,
        email: normalizedEmail,
        message: 'Cadastro realizado. Verifique o código enviado ao seu e-mail para ativar sua conta.',
      };
    } catch (err: any) {
      logger.error('Erro no cadastro do Supabase:', err);
      return { user: null, error: 'Não foi possível conectar ao servidor. Verifique sua conexão.' };
    }
  }

  /**
   * Confirmação de E-mail por Código OTP no Supabase Auth.
   */
  async verifyOtp(email: string, token: string): Promise<SupabaseAuthResult> {
    const normalizedEmail = email.toLowerCase().trim();
    const cleanToken = token.trim();

    if (!cleanToken || cleanToken.length < 6) {
      return { user: null, error: 'Digite o código de 6 dígitos completo.' };
    }

    try {
      // 1. Tentar verificar código OTP do tipo 'signup'
      let { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: cleanToken,
        type: 'signup',
      });

      // 2. Se falhar, tentar com o tipo 'email' (usado em reautenticação / login OTP)
      if (error) {
        const fallbackAttempt = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: cleanToken,
          type: 'email',
        });
        if (!fallbackAttempt.error) {
          data = fallbackAttempt.data;
          error = null;
        }
      }

      if (error) {
        if (error.message.includes('expired') || error.message.includes('Token has expired')) {
          return { user: null, error: 'Este código expirou. Solicite um novo código.' };
        }
        if (error.message.includes('rate limit') || error.message.includes('Too many requests')) {
          return { user: null, error: 'Muitas tentativas foram realizadas. Aguarde alguns minutos e tente novamente.' };
        }
        return { user: null, error: 'Código incorreto. Confira os números e tente novamente.' };
      }

      if (!data.user) {
        return { user: null, error: 'Não foi possível validar o código de confirmação.' };
      }

      // Garantir existência do perfil na tabela 'profiles'
      const user = await this.mapUserWithProfile(data.user);
      return { user, session: data.session, message: 'E-mail confirmado com sucesso!' };
    } catch (err: any) {
      logger.error('Erro na validação do OTP:', err);
      return { user: null, error: 'Não foi possível validar o código no momento. Tente novamente.' };
    }
  }

  /**
   * Reenvio de Código OTP pelo Supabase Auth.
   */
  async resendVerificationCode(email: string): Promise<{ success: boolean; message: string; error?: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
      });

      if (error) {
        if (error.message.includes('rate limit') || error.message.includes('Too many requests')) {
          return {
            success: false,
            message: 'Aguarde antes de solicitar um novo código.',
            error: 'Muitas tentativas foram realizadas. Aguarde alguns minutos e tente novamente.',
          };
        }
        return { success: false, message: error.message, error: error.message };
      }

      return {
        success: true,
        message: 'Se o endereço estiver correto, você receberá um novo código em instantes.',
      };
    } catch (err: any) {
      logger.error('Erro no reenvio de código:', err);
      return {
        success: false,
        message: 'Não foi possível reenviar o código.',
        error: 'Erro de conexão.',
      };
    }
  }

  /**
   * Login Real no Supabase Auth.
   * Valida credenciais reais e exige e-mail confirmado.
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
        // Mensagem de e-mail não confirmado
        if (
          error.message.includes('Email not confirmed') ||
          error.message.includes('email_not_confirmed')
        ) {
          return {
            user: null,
            isEmailNotConfirmed: true,
            email: normalizedEmail,
            error: 'Seu e-mail ainda não foi confirmado.',
          };
        }

        // Mensagem segura e neutra para credenciais incorretas ou conta inexistente
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('invalid_grant') ||
          error.message.includes('User not found')
        ) {
          return { user: null, error: 'E-mail ou senha inválidos.' };
        }

        return { user: null, error: 'E-mail ou senha inválidos.' };
      }

      if (!data.user || !data.session) {
        return { user: null, error: 'E-mail ou senha inválidos.' };
      }

      // Validar se o e-mail está confirmado
      if (!data.user.email_confirmed_at) {
        return {
          user: null,
          isEmailNotConfirmed: true,
          email: normalizedEmail,
          error: 'Seu e-mail ainda não foi confirmado.',
        };
      }

      const user = await this.mapUserWithProfile(data.user);
      return { user, session: data.session };
    } catch (err: any) {
      logger.error('Erro no signIn do Supabase:', err);
      return {
        user: null,
        error: 'Não foi possível entrar no momento. Verifique sua conexão e tente novamente.',
      };
    }
  }

  /**
   * Solicitação de Recuperação de Senha no Supabase Auth.
   */
  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    try {
      await supabase.auth.resetPasswordForEmail(normalizedEmail);
      // Sempre retornar mensagem neutra para proteção de privacidade
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
    if (!newPassword || newPassword.length < 10) {
      return { success: false, error: 'A nova senha deve ter no mínimo 10 caracteres.' };
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
   * Obtém a sessão e usuário atual autenticado e verificado.
   */
  async getCurrentSession(): Promise<{ user: User | null; session: any }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session || !data.session.user) {
        return { user: null, session: null };
      }

      const rawUser = data.session.user;
      if (!rawUser.email_confirmed_at) {
        return { user: null, session: data.session };
      }

      const user = await this.mapUserWithProfile(rawUser);
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
  private async mapUserWithProfile(authUser: any): Promise<User> {
    try {
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!profile) {
        const defaultName =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split('@')[0] ||
          'Usuário';

        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            full_name: defaultName,
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
        name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
        email: authUser.email || '',
        avatarUrl: profile?.avatar_url,
        role: authUser.email?.includes('admin') ? 'admin' : 'user',
        isEmailVerified: Boolean(authUser.email_confirmed_at),
        createdAt: authUser.created_at,
        updatedAt: profile?.updated_at || authUser.updated_at || authUser.created_at,
        consents: {
          termsAccepted: Boolean(profile?.terms_accepted_at),
          privacyAccepted: Boolean(profile?.privacy_accepted_at),
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
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
        email: authUser.email || '',
        role: 'user',
        isEmailVerified: Boolean(authUser.email_confirmed_at),
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
