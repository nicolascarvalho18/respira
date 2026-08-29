import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Mail, CheckCircle2, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react-native';
import { ScreenContainer } from '../src/components/ui/ScreenContainer';
import { AppButton } from '../src/components/ui/AppButton';
import { useAuth } from '../src/hooks/useAuth';
import { useTheme } from '../src/hooks/useTheme';
import { useToast } from '../src/components/ui/Toast';

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { verifyOtp, resendCode, isLoading, error, clearError } = useAuth();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const emailParam = (params.email || '').trim().toLowerCase();
  const [email, setEmail] = useState(emailParam);

  // 6 dígitos OTP
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const [formError, setFormError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Mascarar e-mail para privacidade (ex: nicolas@gmail.com -> n***@gmail.com)
  const maskEmail = (rawEmail: string): string => {
    if (!rawEmail || !rawEmail.includes('@')) return 'seu e-mail';
    const [name, domain] = rawEmail.split('@');
    if (name.length <= 2) {
      return `${name[0]}***@${domain}`;
    }
    return `${name.slice(0, 2)}***@${domain}`;
  };

  // Temporizador de reenvio de 60 segundos
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  // Manipulação de digitação em cada campo
  const handleDigitChange = (index: number, text: string) => {
    setFormError(null);
    clearError();

    // Se o usuário colar um código completo (ex: 6 dígitos)
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        if (i < cleaned.length) {
          newDigits[i] = cleaned[i];
        }
      }
      setDigits(newDigits);
      const nextFocus = Math.min(cleaned.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const singleDigit = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    setDigits(newDigits);

    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Tratamento de Backspace
  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Enviar código para validação no Supabase
  const handleConfirmOtp = async () => {
    const code = digits.join('');
    if (code.length < 6) {
      setFormError('Digite os 6 dígitos do código recebido.');
      return;
    }

    if (!email) {
      setFormError('E-mail não informado. Volte ao cadastro.');
      return;
    }

    try {
      setFormError(null);
      clearError();
      setIsVerifying(true);

      await verifyOtp(email, code);

      setIsSuccess(true);
      showToast({ message: 'E-mail confirmado com sucesso!', type: 'success' });

      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1200);
    } catch (err: any) {
      setFormError(
        err.message || 'Código incorreto. Confira os números e tente novamente.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // Reenviar código OTP
  const handleResend = async () => {
    if (!canResend || !email) return;

    try {
      setFormError(null);
      clearError();
      setCanResend(false);
      setResendCooldown(60);

      const msg = await resendCode(email);
      showToast({
        message: msg || 'Se o endereço estiver correto, você receberá um novo código em instantes.',
        type: 'info',
      });
    } catch (err: any) {
      setFormError(err.message || 'Não foi possível reenviar o código no momento.');
      setCanResend(true);
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.container}>
        {/* Botão Voltar */}
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao login"
        >
          <ArrowLeft size={20} color={isDark ? '#F1F5F9' : '#183330'} />
          <Text style={[styles.backBtnText, { color: isDark ? '#F1F5F9' : '#183330' }]}>
            Voltar ao login
          </Text>
        </TouchableOpacity>

        {/* Ícone e Título */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDark ? '#1D3430' : '#E6F1EE' },
            ]}
          >
            {isSuccess ? (
              <CheckCircle2 size={36} color="#176F69" />
            ) : (
              <Mail size={36} color="#176F69" />
            )}
          </View>

          <Text style={[styles.title, { color: isDark ? '#F1F5F9' : '#183330' }]}>
            {isSuccess ? 'Conta ativada!' : 'Confirme seu e-mail'}
          </Text>

          <Text style={[styles.subtitle, { color: isDark ? '#A2B5B1' : '#647572' }]}>
            {isSuccess
              ? 'Seu e-mail foi validado com sucesso. Redirecionando...'
              : `Enviamos um código para ${maskEmail(
                  email
                )}. Digite-o abaixo para ativar sua conta.`}
          </Text>
        </View>

        {/* Mensagem de Erro */}
        {(formError || error) && !isSuccess && (
          <View
            style={[
              styles.errorBox,
              { backgroundColor: isDark ? '#3A1F1E' : '#FFF5F5', borderColor: '#F87171' },
            ]}
            accessibilityRole="alert"
          >
            <AlertCircle size={18} color="#E53E3E" style={{ marginRight: 8 }} />
            <Text style={[styles.errorText, { color: '#E53E3E' }]}>
              {formError || error}
            </Text>
          </View>
        )}

        {!isSuccess && (
          <>
            {/* Grid dos 6 dígitos */}
            <View style={styles.otpRow}>
              {digits.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  style={[
                    styles.otpInput,
                    {
                      backgroundColor: isDark ? '#192A27' : '#FFFFFF',
                      borderColor: digit
                        ? '#176F69'
                        : isDark
                        ? '#293B37'
                        : '#E2E8E5',
                      color: isDark ? '#FFFFFF' : '#183330',
                    },
                  ]}
                  value={digit}
                  onChangeText={(text) => handleDigitChange(idx, text)}
                  onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(idx, key)}
                  keyboardType="number-pad"
                  maxLength={6}
                  selectTextOnFocus
                  autoFocus={idx === 0}
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  accessibilityLabel={`Dígito ${idx + 1} do código`}
                />
              ))}
            </View>

            {/* Botão de Validação Principal */}
            <TouchableOpacity
              onPress={handleConfirmOtp}
              disabled={isVerifying || digits.join('').length < 6}
              activeOpacity={0.88}
              style={[
                styles.primaryBtn,
                (isVerifying || digits.join('').length < 6) && styles.primaryBtnDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Confirmar código"
            >
              {isVerifying ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Confirmar código</Text>
              )}
            </TouchableOpacity>

            {/* Botão de Reenvio com Countdown */}
            <View style={styles.resendSection}>
              <TouchableOpacity
                onPress={handleResend}
                disabled={!canResend}
                style={styles.resendBtn}
                accessibilityRole="button"
                accessibilityLabel="Reenviar código de confirmação"
              >
                <RefreshCw
                  size={15}
                  color={canResend ? '#176F69' : isDark ? '#6B7280' : '#9CA3AF'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.resendText,
                    { color: canResend ? '#176F69' : isDark ? '#6B7280' : '#9CA3AF' },
                  ]}
                >
                  {canResend
                    ? 'Reenviar código'
                    : `Reenviar código em ${resendCooldown}s`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Opções Secundárias */}
            <View style={styles.footerOptions}>
              <TouchableOpacity
                onPress={() => router.replace('/(auth)/register')}
                style={styles.linkButton}
              >
                <Text style={[styles.linkText, { color: '#176F69' }]}>
                  Informou o e-mail errado? Cadastrar novamente
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingVertical: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    flex: 1,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#176F69',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#176F69',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '650' as any,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerOptions: {
    alignItems: 'center',
    gap: 12,
  },
  linkButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
