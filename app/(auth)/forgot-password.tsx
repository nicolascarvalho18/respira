import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { AppInput } from '../../src/components/ui/AppInput';
import { AppButton } from '../../src/components/ui/AppButton';
import { authService } from '../../src/services/auth/authService';
import { useTheme } from '../../src/hooks/useTheme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors, isDark } = useTheme();

  const handleSend = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, insira um e-mail válido');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      await authService.forgotPassword(email);
      setIsSent(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail de recuperação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader showBack title="Recuperar Senha" />

      {!isSent ? (
        <View style={styles.content}>
          <View style={[styles.iconBox, { backgroundColor: colors.highlight }]}>
            <Mail size={40} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Redefinir sua senha</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>
            Digite o e-mail cadastrado na sua conta. Nós enviaremos um link seguro para você
            redefinir sua senha com tranquilidade.
          </Text>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: isDark ? '#3A1F1E' : '#FDF2F2' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <AppInput
            label="E-mail cadastrado"
            placeholder="seuemail@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(null);
            }}
          />

          <AppButton
            title="Enviar instruções"
            rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
            onPress={handleSend}
            isLoading={isLoading}
            size="lg"
            style={{ marginTop: 8 }}
          />
        </View>
      ) : (
        <View style={styles.successContent}>
          <View style={[styles.successIconBox, { backgroundColor: colors.highlight }]}>
            <CheckCircle2 size={56} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Instruções enviadas!</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>
            Enviamos um e-mail de recuperação para <Text style={{ fontWeight: '700' }}>{email}</Text>.
            Verifique também a caixa de spam ou lixo eletrônico.
          </Text>

          <View style={[styles.infoBox, { backgroundColor: colors.surfaceSubtle }]}>
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              Em ambiente simulado/demonstração, você pode retornar ao login e usar a senha cadastrada.
            </Text>
          </View>

          <AppButton
            title="Voltar para o Login"
            variant="outline"
            size="lg"
            onPress={() => {
              setIsSent(false);
              setEmail('');
            }}
            style={{ marginTop: 24 }}
          />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 24,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
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
  successContent: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 12,
  },
  successIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  infoBox: {
    padding: 14,
    borderRadius: 14,
    marginTop: 16,
    width: '100%',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
