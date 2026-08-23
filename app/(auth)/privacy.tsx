import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { PrivacyNotice } from '../../src/components/ui/PrivacyNotice';
import { LEGAL_TEXTS } from '../../src/constants/legal';
import { useTheme } from '../../src/hooks/useTheme';

export default function PrivacyScreen() {
  const { colors, isDark } = useTheme();

  return (
    <ScreenContainer scrollable>
      <AppHeader showBack title="Política de Privacidade" />

      <PrivacyNotice />

      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.topRow}>
          <ShieldCheck size={24} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Compromisso com a Privacidade
          </Text>
        </View>

        <Text style={[styles.body, { color: colors.text }]}>{LEGAL_TEXTS.PRIVACY_POLICY}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginVertical: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
  },
});
