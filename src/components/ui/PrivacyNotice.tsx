import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

export interface PrivacyNoticeProps {
  customText?: string;
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ customText }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.highlight,
          borderColor: colors.border,
        },
      ]}
      accessibilityRole="text"
    >
      <ShieldCheck size={20} color={colors.primary} style={{ marginRight: 10, marginTop: 2 }} />
      <Text style={[styles.text, { color: colors.primaryDark }]}>
        {customText ||
          'Seus dados de diário e registros de bem-estar são protegidos com sigilo e armazenados de forma segura.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 12,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
