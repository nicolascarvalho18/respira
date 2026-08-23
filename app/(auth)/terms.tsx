import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { LEGAL_TEXTS } from '../../src/constants/legal';
import { useTheme } from '../../src/hooks/useTheme';

export default function TermsScreen() {
  const { colors, isDark } = useTheme();

  return (
    <ScreenContainer scrollable>
      <AppHeader showBack title="Termos de Uso" />

      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.disclaimerBadge, { backgroundColor: colors.highlight, color: colors.primaryDark }]}>
          Transparência e Ética
        </Text>

        <Text style={[styles.body, { color: colors.text }]}>{LEGAL_TEXTS.TERMS_OF_USE}</Text>

        <View style={[styles.warningBox, { backgroundColor: isDark ? '#3A201A' : '#FFF4EE' }]}>
          <Text style={[styles.warningTitle, { color: colors.warning }]}>
            Aviso de Saúde Importante:
          </Text>
          <Text style={[styles.warningText, { color: isDark ? '#F0E6E4' : '#68291A' }]}>
            {LEGAL_TEXTS.MEDICAL_DISCLAIMER}
          </Text>
        </View>
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
  disclaimerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  warningBox: {
    padding: 16,
    borderRadius: 16,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
