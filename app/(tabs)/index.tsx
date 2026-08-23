import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Wind,
  Plus,
  Bot,
  Sparkles,
  ArrowRight,
  Compass,
  Heart,
  ChevronRight,
} from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { SupportBanner } from '../../src/components/ui/SupportBanner';
import { PracticeCard } from '../../src/components/practices/PracticeCard';
import { ContentCard } from '../../src/components/content/ContentCard';
import { AppButton } from '../../src/components/ui/AppButton';
import { useAuth } from '../../src/hooks/useAuth';
import { useMoodStore } from '../../src/store/moodStore';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useContentStore } from '../../src/store/contentStore';
import { useTheme } from '../../src/hooks/useTheme';
import { getGreeting, getRelativeDateLabel } from '../../src/utils/date';
import { getMoodColor, getMoodEmoji, getMoodLabel } from '../../src/utils/format';
import { LEGAL_TEXTS } from '../../src/constants/legal';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { records } = useMoodStore();
  const { practices, toggleFavorite: togglePracticeFav } = usePracticeStore();
  const { articles, toggleFavorite: toggleArticleFav } = useContentStore();

  const recentRecord = records.length > 0 ? records[0] : null;
  const recommendedPractice = practices.length > 0 ? practices[0] : null;
  const continueArticle = articles.find((a) => (a.readProgress ?? 0) > 0) || articles[0];

  return (
    <ScreenContainer scrollable>
      {/* Topo com Saudação e Avatar */}
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {getGreeting(user?.name)}
          </Text>
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            Como está seu momento hoje?
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          accessibilityRole="button"
          accessibilityLabel="Acessar seu perfil"
          style={[styles.profileAvatar, { backgroundColor: colors.highlight, borderColor: colors.border }]}
        >
          <Text style={{ fontSize: 16 }}>🌿</Text>
        </TouchableOpacity>
      </View>

      {/* Banner de Apoio Imediato / SOS */}
      <SupportBanner />

      {/* Card: Como você está agora? / Registro Rápido */}
      <View
        style={[
          styles.checkinCard,
          {
            backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.checkinHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.checkinQuestion, { color: colors.text }]}>
              Como você está agora?
            </Text>
            <Text style={[styles.checkinSubtitle, { color: colors.textMuted }]}>
              {recentRecord
                ? `Último registro: ${getRelativeDateLabel(recentRecord.createdAt)}`
                : 'Faça uma pausa de 1 minuto para se escutar.'}
            </Text>
          </View>

          {recentRecord && (
            <View
              style={[
                styles.recentMoodBadge,
                { backgroundColor: colors.highlight, borderColor: getMoodColor(recentRecord.mood) },
              ]}
            >
              <Text style={{ fontSize: 20 }}>{getMoodEmoji(recentRecord.mood)}</Text>
              <Text style={[styles.recentMoodText, { color: getMoodColor(recentRecord.mood) }]}>
                {getMoodLabel(recentRecord.mood)}
              </Text>
            </View>
          )}
        </View>

        <AppButton
          title="Registrar Meu Momento"
          leftIcon={<Plus size={18} color="#FFFFFF" />}
          onPress={() => router.push('/mood/new')}
          size="md"
          style={{ marginTop: 12 }}
        />
      </View>

      {/* Destaque do Chat Educativo com IA (Proeminente) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/chat')}
        accessibilityRole="button"
        accessibilityLabel="Conversar com o Assistente Educativo do Respira"
        style={[
          styles.chatAssistantBanner,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
      >
        <View style={styles.chatBannerLeft}>
          <View style={styles.chatIconBox}>
            <Bot size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.chatBannerTitle}>Assistente Educativo</Text>
              <View style={styles.aiTag}>
                <Sparkles size={10} color="#FFFFFF" />
                <Text style={styles.aiTagText}>IA</Text>
              </View>
            </View>
            <Text style={styles.chatBannerSubtitle}>
              Tire dúvidas sobre ansiedade e receba sugestões de práticas no seu tempo.
            </Text>
          </View>
        </View>

        <View style={styles.chatBannerAction}>
          <ArrowRight size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* Ações Rápidas em Linha: Respiração e Ancoragem */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          onPress={() => router.push('/practices/breathing')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Iniciar Respiração Guiada 4-7-8"
          style={[
            styles.quickActionBox,
            {
              backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: colors.highlight }]}>
            <Wind size={22} color={colors.primary} />
          </View>
          <Text style={[styles.quickActionTitle, { color: colors.text }]}>Respirar 4-7-8</Text>
          <Text style={[styles.quickActionDesc, { color: colors.textMuted }]}>
            Alívio rápido em 3 min
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/support')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Praticar Ancoragem Sensorial 5-4-3-2-1"
          style={[
            styles.quickActionBox,
            {
              backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: '#FFF5F0' }]}>
            <Compass size={22} color={colors.warning} />
          </View>
          <Text style={[styles.quickActionTitle, { color: colors.text }]}>Ancoragem 5-4-3-2-1</Text>
          <Text style={[styles.quickActionDesc, { color: colors.textMuted }]}>
            Aterramento sensorial
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recomendação do Dia */}
      {recommendedPractice && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recomendação do Dia</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/practices')}>
              <Text style={[styles.seeAllLink, { color: colors.primary }]}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          <PracticeCard
            practice={recommendedPractice}
            onToggleFavorite={togglePracticeFav}
          />
        </View>
      )}

      {/* Continuar Aprendendo / Conteúdo */}
      {continueArticle && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Conteúdo em Destaque</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/content')}>
              <Text style={[styles.seeAllLink, { color: colors.primary }]}>Explorar</Text>
            </TouchableOpacity>
          </View>
          <ContentCard
            article={continueArticle}
            onToggleFavorite={toggleArticleFav}
          />
        </View>
      )}

      {/* Aviso Discreto de Não Substituição Profissional */}
      <View style={[styles.disclaimerBox, { backgroundColor: isDark ? colors.surfaceSubtle : '#F1F5F9' }]}>
        <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
          {LEGAL_TEXTS.MEDICAL_DISCLAIMER}
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 13,
    marginTop: 2,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinCard: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  checkinHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  checkinQuestion: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  checkinSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  recentMoodBadge: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginLeft: 8,
  },
  recentMoodText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  chatAssistantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 22,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  chatBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  aiTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  chatBannerSubtitle: {
    color: '#DDEFE9',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  chatBannerAction: {
    marginLeft: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionBox: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  quickIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  quickActionDesc: {
    fontSize: 11,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  disclaimerBox: {
    padding: 14,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
