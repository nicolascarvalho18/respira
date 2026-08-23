import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { HeartHandshake, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

export const SupportBanner: React.FC = () => {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push('/support')}
      accessibilityRole="button"
      accessibilityLabel="Apoio Imediato: Precisa de suporte ou escuta agora? Toque para ver contatos."
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#2D221F' : '#FFF7F4',
          borderColor: colors.warning,
        },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: isDark ? '#4A2A20' : '#FFEBE4' }]}>
        <HeartHandshake size={22} color={colors.warning} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 12 }}>
        <Text style={[styles.title, { color: colors.text }]}>Precisa de apoio ou escuta?</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Acesse contatos gratuitos e orientações de acolhimento imediato.
        </Text>
      </View>

      <ChevronRight size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginVertical: 10,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
