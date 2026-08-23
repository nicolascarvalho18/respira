import React, { useState } from 'react';
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
import { KeyRound, ArrowLeft, MailCheck } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppInput } from '../../src/components/ui/AppInput';
import { AppButton } from '../../src/components/ui/AppButton';
import { useTheme } from '../../src/hooks/useTheme';
import { useToast } from '../../src/components/ui/Toast';

const forgotSchema = z.object({
  email: z.string().min(1, 'Informe seu e-mail').email('Insira um e-mail válido'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      // Simula chamada segura de recuperação
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsSubmitted(true);
      showToast({
        message: 'Instruções enviadas se o e-mail estiver cadastrado.',
        type: 'info',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      {/* Botão Voltar */}
      <TouchableOpacity
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Voltar para a tela de login"
        style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}
      >
        <ArrowLeft size={20} color={colors.text} />
      </TouchableOpacity>

      {!isSubmitted ? (
        <View style={styles.content}>
          <View style={[styles.iconCircle, { backgroundColor: colors.highlight }]}>
            <KeyRound size={36} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Recuperar Acesso</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Informe seu e-mail cadastrado para receber as orientações seguras de redefinição de
            senha.
          </Text>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="E-mail cadastrado"
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

            <AppButton
              title="Enviar Instruções de Recuperação"
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
              size="lg"
              style={{ marginTop: 14 }}
            />
          </View>
        </View>
      ) : (
        /* Resposta Neutra de Segurança */
        <View style={styles.submittedCard}>
          <View style={[styles.iconCircle, { backgroundColor: colors.highlight }]}>
            <MailCheck size={36} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Verifique sua Caixa de Entrada</Text>
          <Text style={[styles.neutralMessage, { color: colors.text }]}>
            Se existir uma conta associada a este endereço de e-mail, enviamos as instruções
            detalhadas com um link seguro de redefinição válido por 30 minutos.
          </Text>
          <Text style={[styles.tipMessage, { color: colors.textMuted }]}>
            Lembre-se de checar também sua pasta de spam ou lixo eletrônico.
          </Text>

          <AppButton
            title="Voltar para o Login"
            variant="primary"
            size="lg"
            onPress={() => router.replace('/(auth)/login')}
            style={{ width: '100%', marginTop: 24 }}
          />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  content: {
    alignItems: 'center',
    marginVertical: 24,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  form: {
    width: '100%',
  },
  submittedCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 8,
  },
  neutralMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 12,
  },
  tipMessage: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
