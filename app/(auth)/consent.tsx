import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { ConsentCard } from '../../src/components/ui/ConsentCard';
import { AppButton } from '../../src/components/ui/AppButton';
import { useAuth } from '../../src/hooks/useAuth';
import { userService } from '../../src/services/user/userService';
import { useTheme } from '../../src/hooks/useTheme';

export default function ConsentScreen() {
  const { user, updateUser } = useAuth();
  const { colors } = useTheme();

  const [personalization, setPersonalization] = useState(
    user?.consents?.personalizationAccepted ?? true
  );
  const [analytics, setAnalytics] = useState(user?.consents?.analyticsAccepted ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      const updated = await userService.updateConsents(user.id, {
        personalizationAccepted: personalization,
        analyticsAccepted: analytics,
      });
      updateUser(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader showBack title="Gerenciar Consentimentos" />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Seu Controle e Escolhas</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Você tem autonomia para decidir como suas informações são utilizadas no Respira.
        </Text>
      </View>

      {savedSuccess && (
        <View style={[styles.successBox, { backgroundColor: colors.highlight }]}>
          <Text style={[styles.successText, { color: colors.primaryDark }]}>
            Preferências salvas
          </Text>
        </View>
      )}

      <ConsentCard
        title="Termos de Uso e Política de Privacidade"
        description="Reconhecimento dos termos gerais de serviço e normas éticas de saúde digital."
        required
        value={true}
        onValueChange={() => {}}
      />

      <ConsentCard
        title="Personalização de Conteúdo"
        description="Permite que o Respira sugira exercícios e artigos embasados de acordo com seus registros de humor e ansiedade."
        value={personalization}
        onValueChange={setPersonalization}
      />

      <ConsentCard
        title="Melhoria Contínua Anônima"
        description="Compartilha dados anonimizados de estabilidade e navegação para melhorias técnicas no app."
        value={analytics}
        onValueChange={setAnalytics}
      />

      <AppButton
        title="Salvar Preferências"
        onPress={handleSave}
        isLoading={isSaving}
        size="lg"
        style={{ marginTop: 24 }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  successBox: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  successText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
