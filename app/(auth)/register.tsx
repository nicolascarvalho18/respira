import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wind, UserPlus, CheckCircle2, XCircle } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppInput } from '../../src/components/ui/AppInput';
import { PasswordInput } from '../../src/components/ui/PasswordInput';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppCheckbox } from '../../src/components/ui/AppCheckbox';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { useToast } from '../../src/components/ui/Toast';

const registerSchema = z
  .object({
    name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
    email: z.string().min(1, 'Informe seu e-mail').email('Insira um e-mail válido'),
    password: z
      .string()
      .min(10, 'A senha deve ter pelo menos 10 caracteres')
      .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula')
      .regex(/[a-z]/, 'Inclua pelo menos uma letra minúscula')
      .regex(/[0-9]/, 'Inclua pelo menos um número')
      .regex(/[^A-Za-z0-9]/, 'Inclua pelo menos um caractere especial (!@#$%)'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'Você precisa aceitar os Termos e Política de Privacidade' }),
    }),
    personalizationAccepted: z.boolean().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { register: registerUser, isLoading, error, clearError } = useAuth();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false as any,
      personalizationAccepted: false,
    },
  });

  const passwordValue = watch('password') || '';

  // Medidor de força de senha
  const passwordCriteria = useMemo(() => {
    return {
      length: passwordValue.length >= 10,
      hasUpper: /[A-Z]/.test(passwordValue),
      hasLower: /[a-z]/.test(passwordValue),
      hasNumber: /[0-9]/.test(passwordValue),
      hasSpecial: /[^A-Za-z0-9]/.test(passwordValue),
    };
  }, [passwordValue]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.length) score += 20;
    if (passwordCriteria.hasUpper) score += 20;
    if (passwordCriteria.hasLower) score += 20;
    if (passwordCriteria.hasNumber) score += 20;
    if (passwordCriteria.hasSpecial) score += 20;
    return score;
  }, [passwordCriteria]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setFormError(null);
      clearError();
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        termsAccepted: data.termsAccepted,
        personalizationAccepted: data.personalizationAccepted,
      });
      showToast({ message: 'Conta criada com sucesso! Bem-vindo(a) ao Respira.', type: 'success' });
      router.replace('/(tabs)');
    } catch (err: any) {
      setFormError(err.message || 'Erro ao realizar cadastro.');
    }
  };

  return (
    <ScreenContainer scrollable>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: colors.highlight }]}>
          <Wind size={36} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Criar sua conta</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Seu espaço seguro de acolhimento e práticas de bem-estar.
        </Text>
      </View>

      {/* Erro Geral */}
      {(formError || error) && (
        <View style={[styles.errorBox, { backgroundColor: isDark ? '#3A1F1E' : '#FDF2F2' }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{formError || error}</Text>
        </View>
      )}

      {/* Formulário */}
      <View style={styles.form}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Nome completo"
              placeholder="Como gostaria de ser chamado(a)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
            />
          )}
        />

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
              label="Senha (mínimo 10 caracteres)"
              placeholder="Crie uma senha forte"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        {/* Indicador de Força de Senha em Tempo Real */}
        {passwordValue.length > 0 && (
          <View style={styles.passwordStrengthBox}>
            <ProgressBar
              progress={passwordScore}
              height={6}
              color={
                passwordScore < 60
                  ? colors.error
                  : passwordScore < 100
                    ? colors.warning
                    : colors.success
              }
              label={`Força da senha: ${
                passwordScore < 60 ? 'Fraca' : passwordScore < 100 ? 'Média' : 'Forte'
              }`}
              showLabel
            />

            <View style={styles.criteriaGrid}>
              <View style={styles.criteriaItem}>
                {passwordCriteria.length ? (
                  <CheckCircle2 size={13} color={colors.success} />
                ) : (
                  <XCircle size={13} color={colors.textMuted} />
                )}
                <Text style={[styles.criteriaText, { color: colors.textMuted }]}>10+ caracteres</Text>
              </View>
              <View style={styles.criteriaItem}>
                {passwordCriteria.hasUpper ? (
                  <CheckCircle2 size={13} color={colors.success} />
                ) : (
                  <XCircle size={13} color={colors.textMuted} />
                )}
                <Text style={[styles.criteriaText, { color: colors.textMuted }]}>Letra maiúscula</Text>
              </View>
              <View style={styles.criteriaItem}>
                {passwordCriteria.hasLower ? (
                  <CheckCircle2 size={13} color={colors.success} />
                ) : (
                  <XCircle size={13} color={colors.textMuted} />
                )}
                <Text style={[styles.criteriaText, { color: colors.textMuted }]}>Letra minúscula</Text>
              </View>
              <View style={styles.criteriaItem}>
                {passwordCriteria.hasNumber ? (
                  <CheckCircle2 size={13} color={colors.success} />
                ) : (
                  <XCircle size={13} color={colors.textMuted} />
                )}
                <Text style={[styles.criteriaText, { color: colors.textMuted }]}>Número</Text>
              </View>
              <View style={styles.criteriaItem}>
                {passwordCriteria.hasSpecial ? (
                  <CheckCircle2 size={13} color={colors.success} />
                ) : (
                  <XCircle size={13} color={colors.textMuted} />
                )}
                <Text style={[styles.criteriaText, { color: colors.textMuted }]}>Caractere especial</Text>
              </View>
            </View>
          </View>
        )}

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <PasswordInput
              label="Confirme sua senha"
              placeholder="Digite a senha novamente"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        {/* Consentimento Obrigatório LGPD (Termos & Privacidade) */}
        <Controller
          control={control}
          name="termsAccepted"
          render={({ field: { onChange, value } }) => (
            <View style={styles.consentWrap}>
              <AppCheckbox
                checked={value}
                onChange={onChange}
                label="Li e concordo com os Termos de Uso e Política de Privacidade *"
              />
              <View style={styles.legalLinksRow}>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/terms')}
                  accessibilityRole="link"
                  accessibilityLabel="Ler Termos de Uso"
                >
                  <Text style={[styles.legalLink, { color: colors.primary }]}>Termos de Uso</Text>
                </TouchableOpacity>
                <Text style={{ color: colors.textMuted }}>•</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/privacy')}
                  accessibilityRole="link"
                  accessibilityLabel="Ler Política de Privacidade"
                >
                  <Text style={[styles.legalLink, { color: colors.primary }]}>
                    Política de Privacidade
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.termsAccepted && (
                <Text style={[styles.consentError, { color: colors.error }]}>
                  {errors.termsAccepted.message}
                </Text>
              )}
            </View>
          )}
        />

        {/* Consentimento Opcional (Personalização) - Inicia Desmarcado */}
        <Controller
          control={control}
          name="personalizationAccepted"
          render={({ field: { onChange, value } }) => (
            <AppCheckbox
              checked={value}
              onChange={onChange}
              label="Desejo receber sugestões de práticas personalizadas (opcional)"
              sublabel="Você pode revogar este consentimento a qualquer momento nas configurações."
            />
          )}
        />

        <AppButton
          title="Criar Minha Conta"
          rightIcon={<UserPlus size={18} color="#FFFFFF" />}
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          size="lg"
          style={{ marginTop: 16 }}
        />
      </View>

      {/* Link de Login */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Já possui uma conta cadastrada?{' '}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          accessibilityRole="link"
          accessibilityLabel="Fazer login com conta existente"
        >
          <Text style={[styles.loginLink, { color: colors.primary }]}>Fazer login</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginVertical: 24,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  passwordStrengthBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginVertical: 6,
  },
  criteriaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  criteriaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  consentWrap: {
    marginVertical: 8,
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 32,
    marginTop: -2,
    marginBottom: 6,
  },
  legalLink: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  consentError: {
    fontSize: 12,
    fontWeight: '600',
    paddingLeft: 32,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
