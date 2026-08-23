import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Bookmark, CheckCircle2, ListOrdered } from 'lucide-react-native';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { AudioPlayer } from '../../../src/components/practices/AudioPlayer';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { usePracticeStore } from '../../../src/store/practiceStore';
import { useTheme } from '../../../src/hooks/useTheme';
import { Practice } from '../../../src/types';

export default function MeditationPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { practices, toggleFavorite, recordCompletion } = usePracticeStore();

  const [practice, setPractice] = useState<Practice | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (id && practices.length > 0) {
      const found = practices.find((p) => p.id === id);
      if (found) setPractice(found);
    }
  }, [id, practices]);

  if (!practice) {
    return (
      <ScreenContainer>
        <AppHeader showBack title="Carregando Prática" />
        <LoadingState message="Buscando detalhes da prática..." />
      </ScreenContainer>
    );
  }

  const handleComplete = async () => {
    setCompleted(true);
    await recordCompletion(practice.id);
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader
        showBack
        title={practice.title}
        rightAction={
          <TouchableOpacity
            onPress={() => toggleFavorite(practice.id)}
            accessibilityRole="button"
            accessibilityLabel={practice.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
            style={[styles.favBtn, { backgroundColor: colors.surfaceSubtle }]}
          >
            <Bookmark
              size={20}
              color={practice.isFavorite ? colors.primary : colors.textLight}
              fill={practice.isFavorite ? colors.primary : 'none'}
            />
          </TouchableOpacity>
        }
      />

      {/* Capa Acolhedora da Prática */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: isDark ? colors.surfaceSubtle : colors.highlight,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>{practice.level}</Text>
        </View>

        <Text style={[styles.heroTitle, { color: colors.text }]}>{practice.title}</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>{practice.subtitle}</Text>
      </View>

      {/* Player de Áudio Interativo */}
      <AudioPlayer
        audioUrl={practice.audioUrl}
        title={practice.title}
        durationMinutes={practice.durationMinutes}
        onComplete={handleComplete}
      />

      {/* Alerta de Prática Concluída */}
      {completed && (
        <View style={[styles.completedBanner, { backgroundColor: colors.highlight }]}>
          <CheckCircle2 size={22} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.completedText, { color: colors.primaryDark }]}>
            Parabéns! Você concluiu esta prática com presença.
          </Text>
        </View>
      )}

      {/* Guia Passo a Passo da Prática */}
      {practice.instructions && practice.instructions.length > 0 && (
        <View
          style={[
            styles.instructionsCard,
            {
              backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.instructionsHeader}>
            <ListOrdered size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.instructionsTitle, { color: colors.text }]}>
              Orientações do Exercício
            </Text>
          </View>

          {practice.instructions.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={[styles.stepNumberCircle, { backgroundColor: colors.highlight }]}>
                <Text style={[styles.stepNumber, { color: colors.primary }]}>{index + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.disclaimerBox, { backgroundColor: isDark ? colors.surfaceSubtle : '#F8FAFC' }]}>
        <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
          Lembre-se de respeitar o seu próprio ritmo. Se sentir qualquer desconforto, retome sua respiração natural.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  favBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  completedText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  instructionsCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  disclaimerBox: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 24,
  },
  disclaimerText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
