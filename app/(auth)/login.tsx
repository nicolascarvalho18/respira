import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wind, LogIn } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppInput } from '../../src/components/ui/AppInput';
import { PasswordInput } from '../../src/components/ui/PasswordInput';
import { AppButton } from '../../src/components/ui/AppButton';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';

const loginSchema = z.object({
  email: z.string().min(1, 'Informe seu e-mail').email('Insira um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  rememberMe: z.boolean().default(true),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  const { colors, isDark } = useTheme();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const { resendCode } = useAuth();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setFormError(null);
      setUnconfirmedEmail(null);
      clearError();
      const normalizedEmail = data.email.trim().toLowerCase();
      await login({
        email: normalizedEmail,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      if (err.isEmailNotConfirmed || (err.message && err.message.includes('não foi confirmado'))) {
        setUnconfirmedEmail(data.email.trim().toLowerCase());
        setFormError('Seu e-mail ainda não foi confirmado.');
      } else {
        setFormError(err.message || 'E-mail ou senha inválidos.');
      }
    }
  };

  const handleResendFromLogin = async () => {
    if (!unconfirmedEmail) return;
    try {
      await resendCode(unconfirmedEmail);
      router.push({
        pathname: '/(auth)/confirmar-email',
        params: { email: unconfirmedEmail },
      } as any);
    } catch (err: any) {
      setFormError(err.message || 'Não foi possível reenviar o código.');
    }
  };

  return (
    <ScreenContainer scrollable>
      {/* Cabeçalho de Boas-vindas */}
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: colors.highlight }]}>
          <Wind size={36} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Bem-vindo(a) de volta</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Acesse seu espaço de acolhimento e autocuidado.
        </Text>
      </View>

      {/* Mensagem de Erro Geral ou E-mail Não Confirmado */}
      {(formError || error) && (
        <View
          style={[
            styles.errorBox,
            { backgroundColor: isDark ? '#3A1F1E' : '#FDF2F2' },
          ]}
          accessibilityRole="alert"
        >
          <Text style={[styles.errorText, { color: colors.error }]}>
            {formError || error}
          </Text>

          {unconfirmedEmail && (
            <View style={{ marginTop: 10, flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/confirmar-email',
                    params: { email: unconfirmedEmail },
                  } as any)
                }
                style={{
                  backgroundColor: '#176F69',
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                  Confirmar agora
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleResendFromLogin}
                style={{
                  borderWidth: 1,
                  borderColor: '#176F69',
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#176F69', fontSize: 12, fontWeight: '600' }}>
                  Reenviar código
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Formulário */}
      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="E-mail"
              placeholder="seuemail@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <PasswordInput
              label="Senha"
              placeholder="Sua senha de acesso"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        {/* Manter conectado e Esqueci a senha */}
        <View style={styles.optionsRow}>
          <Controller
            control={control}
            name="rememberMe"
            render={({ field: { onChange, value } }) => (
              <View style={styles.rememberRow}>
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: '#CBD5E1', true: colors.secondary }}
                  thumbColor={value ? colors.primary : '#FFFFFF'}
                  accessibilityLabel="Manter conectado"
                />
                <Text style={[styles.rememberText, { color: colors.text }]}>Lembrar de mim</Text>
              </View>
            )}
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="link"
            accessibilityLabel="Esqueci minha senha"
          >
            <Text style={[styles.forgotLink, { color: colors.primary }]}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        <AppButton
          title="Entrar"
          rightIcon={<LogIn size={18} color="#FFFFFF" />}
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          size="lg"
          style={{ marginTop: 12 }}
        />
      </View>

      {/* Rodapé com Link de Cadastro */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Ainda não possui uma conta?{' '}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          accessibilityRole="link"
          accessibilityLabel="Criar nova conta no Respira"
        >
          <Text style={[styles.signupLink, { color: colors.primary }]}>Criar conta</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginVertical: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberText: {
    fontSize: 13,
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
