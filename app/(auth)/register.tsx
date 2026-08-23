import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserPlus } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { AppInput } from '../../src/components/ui/AppInput';
import { PasswordInput } from '../../src/components/ui/PasswordInput';
import { AppButton } from '../../src/components/ui/AppButton';
import { ConsentCard } from '../../src/components/ui/ConsentCard';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';

const registerSchema = z
  .object({
    name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
    email: z.string().min(1, 'Informe seu e-mail').email('Insira um e-mail válido'),
    password: z
      .string()
      .min(6, 'A senha deve conter no mínimo 6 caracteres')
      .regex(/[A-Za-z]/, 'A senha deve conter letras')
      .regex(/[0-9]/, 'A senha deve conter números'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'Você precisa aceitar os Termos de Uso e Política de Privacidade',
    }),
    personalizationAccepted: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { register: registerUser, isLoading, error, clearError } = useAuth();
  const { colors, isDark } = useTheme();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
      personalizationAccepted: true,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setFormError(null);
      clearError();
      await registerUser(data);
      router.replace('/(tabs)');
    } catch (err: any) {
      setFormError(err.message || 'Erro ao realizar cadastro.');
    }
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader showBack title="Criar Conta" />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Comece sua jornada de cuidado</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Preencha seus dados para criar sua conta segura e privada.
        </Text>
      </View>

      {(formError || error) && (
        <View
          style={[styles.errorBox, { backgroundColor: isDark ? '#3A1F1E' : '#FDF2F2' }]}
          accessibilityRole="alert"
        >
          <Text style={[styles.errorText, { color: colors.error }]}>{formError || error}</Text>
        </View>
      )}

      <View style={styles.form}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Nome completo"
              placeholder="Como gostaria de ser chamado(a)?"
              autoCapitalize="words"
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
              label="Senha"
              placeholder="Mínimo 6 caracteres com letras e números"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <PasswordInput
              label="Confirmar senha"
              placeholder="Digite a senha novamente"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        {/* Consentimentos */}
        <View style={styles.consentsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Consentimentos e Privacidade</Text>

          <Controller
            control={control}
            name="termsAccepted"
            render={({ field: { onChange, value } }) => (
              <ConsentCard
                title="Termos e Privacidade"
                description="Li e concordo com os Termos de Uso e Política de Privacidade. Reconheço que o app não substitui atendimento médico."
                required
                value={value}
                onValueChange={onChange}
              />
            )}
          />
          {errors.termsAccepted && (
            <Text style={[styles.errorInline, { color: colors.error }]}>
              {errors.termsAccepted.message}
            </Text>
          )}

          <Controller
            control={control}
            name="personalizationAccepted"
            render={({ field: { onChange, value } }) => (
              <ConsentCard
                title="Personalização de Conteúdos"
                description="Permitir recomendações de práticas e artigos baseadas no meu histórico de humor."
                value={value}
                onValueChange={onChange}
              />
            )}
          />

          <View style={styles.linksRow}>
            <TouchableOpacity onPress={() => router.push('/(auth)/terms')}>
              <Text style={[styles.legalLink, { color: colors.primary }]}>Ver Termos de Uso</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.textMuted }}>•</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/privacy')}>
              <Text style={[styles.legalLink, { color: colors.primary }]}>Política de Privacidade</Text>
            </TouchableOpacity>
          </View>
        </View>

        <AppButton
          title="Cadastrar e Começar"
          rightIcon={<UserPlus size={18} color="#FFFFFF" />}
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          size="lg"
          style={{ marginTop: 16 }}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>Já possui uma conta? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={[styles.loginLink, { color: colors.primary }]}>Fazer login</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginVertical: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
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
  consentsSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorInline: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  legalLink: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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
