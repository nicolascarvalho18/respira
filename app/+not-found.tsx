import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Compass, Home, ArrowLeft } from 'lucide-react-native';
import { AppShell } from '../src/components/layout/AppShell';
import { AppButton } from '../src/components/ui/AppButton';
import { Card } from '../src/components/ui/Card';
import { useTheme } from '../src/hooks/useTheme';

export default function NotFoundScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Página não encontrada — Respira';
    }
  }, []);

  return (
    <AppShell>
      <View style={styles.container}>
        <Card
          variant="bordered"
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#DCE5E2',
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF' },
            ]}
          >
            <Compass size={38} color="#2F7F7C" />
          </View>

          <Text
            accessibilityRole="header"
            aria-level={1}
            style={[styles.title, { color: isDark ? colors.text : '#173D3B' }]}
          >
            Página não encontrada
          </Text>

          <Text
            style={[styles.message, { color: isDark ? colors.textMuted : '#667775' }]}
          >
            O caminho que você tentou acessar não existe ou foi movido. Você pode retornar à página inicial e continuar sua jornada de bem-estar com calma.
          </Text>

          <View style={styles.actionsRow}>
            <AppButton
              title="Voltar ao Início"
              leftIcon={<Home size={16} color="#FFFFFF" />}
              onPress={() => router.replace('/(tabs)')}
              size="md"
            />
          </View>
        </Card>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionsRow: {
    width: '100%',
    maxWidth: 240,
  },
});
