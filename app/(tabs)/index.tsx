import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Wind,
  Smile,
  Bot,
  HeartHandshake,
  Sparkles,
  ChevronRight,
  Bookmark,
  Bell,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { AppButton } from '../../src/components/ui/AppButton';
import { useAuth } from '../../src/hooks/useAuth';
import { useMoodStore } from '../../src/store/moodStore';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useContentStore } from '../../src/store/contentStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { getGreeting, formatDate, getRelativeDateLabel } from '../../src/utils/date';
import { formatPracticesCompleted, formatTimesRealized } from '../../src/utils/grammar';
import { LEGAL_TEXTS } from '../../src/constants/legal';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { isDesktop, isTablet } = useBreakpoint();

  const { records } = useMoodStore();
  const { practices, toggleFavorite: togglePracticeFavorite } = usePracticeStore();
  const { articles, toggleFavorite: toggleArticleFavorite } = useContentStore();

  const lastRecord = records.length > 0 ? records[0] : null;
  const recommendedPractice = practices[0] || null;
  const featuredArticle = articles[0] || null;

  const quickActions = [
    {
      title: 'Respirar',
      desc: 'Técnica 4-7-8 guiada',
      icon: Wind,
      color: colors.primary,
      bg: isDark ? colors.highlight : '#EBF6F4',
      onPress: () => router.push('/practices/breathing'),
    },
    {
      title: 'Relaxar',
      desc: 'Relaxamento muscular guiado',
      icon: Layers,
      color: colors.secondary,
      bg: isDark ? colors.surfaceSecondary : '#EBF6F0',
      onPress: () => router.push('/practices/relaxation' as any),
    },
    {
      title: 'Registrar humor',
      desc: 'Check-in do seu momento',
      icon: Smile,
      color: '#D47754',
      bg: isDark ? colors.surfaceSecondary : '#FDF2EC',
      onPress: () => router.push('/mood/new'),
    },
    {
      title: 'Assistente IA',
      desc: 'Acolhimento e orientações',
      icon: Bot,
      color: '#426E91',
      bg: isDark ? colors.surfaceSecondary : '#EDF4F9',
      onPress: () => router.push('/chat'),
    },
  ];

  // Painel lateral direito contextual exclusivo do Desktop
  const renderDesktopRightPanel = () => (
    <View style={styles.sidePanelWrap}>
      <Text style={[styles.sidePanelTitle, { color: colors.text }]}>Resumo do Dia</Text>

      {/* Card de Lembrete Ativo */}
      <Card variant="bordered" padding="sm" style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Clock size={15} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.sideCardHeading, { color: colors.text }]}>Lembrete de Cuidado</Text>
        </View>
        <Text style={[styles.sideCardText, { color: colors.textSecondary }]}>
          Seu momento diário de reflexão está configurado para às{' '}
          <Text style={{ fontWeight: '700', color: colors.text }}>20:30</Text>.
        </Text>
      </Card>

      {/* Card de Apoio SOS */}
      <Card
        variant="bordered"
        padding="sm"
        style={{
          backgroundColor: isDark ? '#2D1F1A' : '#FFF4EE',
          borderColor: colors.warning,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <HeartHandshake size={15} color={colors.warning} style={{ marginRight: 6 }} />
          <Text style={[styles.sideCardHeading, { color: colors.warning }]}>Precisa de Escuta?</Text>
        </View>
        <Text style={[styles.sideCardText, { color: isDark ? '#F5DDD6' : '#733722' }]}>
          O CVV oferece apoio emocional gratuito pelo número{' '}
          <Text style={{ fontWeight: '800' }}>188</Text> (24h).
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/support')}
          style={{ marginTop: 6 }}
          accessibilityRole="button"
          accessibilityLabel="Ver canais de apoio"
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.warning }}>
            Ver canais de apoio →
          </Text>
        </TouchableOpacity>
      </Card>

      {/* Estatística Rápida */}
      <Card variant="bordered" padding="sm">
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Calendar size={15} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.sideCardHeading, { color: colors.text }]}>Registros no Mês</Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primary }}>
          {records.length} <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textMuted }}>check-ins realizados</Text>
        </Text>
      </Card>
    </View>
  );

  const userName = user?.name === 'ama' ? 'Ana' : user?.name || 'Ana';

  return (
    <AppShell rightPanel={renderDesktopRightPanel()}>
      {/* 1. Cabeçalho Superior Compacto */}
      <View style={styles.topHeader}>
        <View style={styles.userGreetingRow}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarLetter}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.greetingTitle, { color: colors.text }]}>
              {getGreeting(userName)}
            </Text>
            <Text style={[styles.dateSubtitle, { color: colors.textSecondary }]}>
              {formatDate(new Date().toISOString())}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={() => router.push('/support')}
            accessibilityRole="button"
            accessibilityLabel="Canais de apoio e escuta humana"
            style={[
              styles.sosHeaderBtn,
              {
                backgroundColor: isDark ? '#3D251C' : '#FFF2EB',
                borderColor: colors.warning,
              },
            ]}
          >
            <HeartHandshake size={15} color={colors.warning} />
            <Text style={[styles.sosHeaderText, { color: colors.warning }]}>Apoio Imediato</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Bloco Principal: "Como você está agora?" */}
      <Card variant="bordered" style={styles.checkinHeroCard}>
        <View style={styles.heroContent}>
          <View style={styles.heroTextCol}>
            <Badge label="Momento Atual" variant="primary" size="sm" style={{ marginBottom: 6 }} />
            <Text style={[styles.heroQuestion, { color: colors.text }]}>
              Como você está agora?
            </Text>

            {lastRecord ? (
              <View style={styles.lastRecordRow}>
                <CheckCircle2 size={14} color={colors.success} style={{ marginRight: 6 }} />
                <Text style={[styles.lastRecordText, { color: colors.textSecondary }]}>
                  Último registro: {getRelativeDateLabel(lastRecord.createdAt)} (Humor{' '}
                  {lastRecord.mood}/5 • Ansiedade {lastRecord.anxietyLevel}/10)
                </Text>
              </View>
            ) : (
              <Text style={[styles.lastRecordText, { color: colors.textSecondary }]}>
                Registre suas emoções para acompanhar sua rotina com mais clareza.
              </Text>
            )}
          </View>

          <View style={styles.heroActionsCol}>
            <AppButton
              title="Registrar meu momento"
              leftIcon={<Smile size={16} color="#FFFFFF" />}
              onPress={() => router.push('/mood/new')}
              size="md"
            />
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/diary')}
              accessibilityRole="link"
              accessibilityLabel="Ver histórico completo do diário"
              style={styles.historyLinkBtn}
            >
              <Text style={[styles.historyLinkText, { color: colors.primary }]}>
                Ver histórico de evolução →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* 3. Ações Rápidas (Grid 2x2 no mobile, 4 cols no desktop) */}
      <View style={styles.sectionHeaderWrap}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ações Rápidas</Text>
      </View>

      <View
        style={[
          styles.quickActionsGrid,
          (isDesktop || isTablet) && styles.quickActionsGridDesktop,
        ]}
      >
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${action.title}: ${action.desc}`}
              style={[
                styles.quickActionItem,
                (isDesktop || isTablet) && styles.quickActionItemDesktop,
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: colors.border,
                },
                Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined,
              ]}
            >
              <View style={[styles.quickActionIconWrap, { backgroundColor: action.bg }]}>
                <Icon size={20} color={action.color} />
              </View>
              <Text style={[styles.quickActionTitle, { color: colors.text }]}>{action.title}</Text>
              <Text style={[styles.quickActionDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                {action.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. Recomendação do Dia Compacta */}
      {recommendedPractice && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Sparkles size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recomendação para Hoje
              </Text>
            </View>
            <Badge label="Sugerido" variant="success" size="sm" />
          </View>

          <Card variant="bordered" style={styles.recommendationCard}>
            <View style={styles.recHeaderRow}>
              <Badge
                label={`${recommendedPractice.durationMinutes} min • ${recommendedPractice.level}`}
                variant="primary"
                size="sm"
              />
              <TouchableOpacity
                onPress={() => togglePracticeFavorite(recommendedPractice.id)}
                accessibilityRole="button"
                accessibilityLabel="Favoritar prática recomendada"
                style={styles.favBtn}
              >
                <Bookmark
                  size={17}
                  color={recommendedPractice.isFavorite ? colors.primary : colors.textMuted}
                  fill={recommendedPractice.isFavorite ? colors.primary : 'none'}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.recTitle, { color: colors.text }]}>
              {recommendedPractice.title}
            </Text>
            <Text style={[styles.recSubtitle, { color: colors.textSecondary }]}>
              {recommendedPractice.subtitle || recommendedPractice.description}
            </Text>

            <View style={styles.recActionRow}>
              <Text style={[styles.recCompletedText, { color: colors.textMuted }]}>
                {formatTimesRealized(recommendedPractice.completedCount || 0)}
              </Text>
              <AppButton
                title="Iniciar Prática"
                onPress={() => {
                  if (recommendedPractice.category === 'breathing') {
                    router.push('/practices/breathing');
                  } else {
                    router.push(`/practices/player/${recommendedPractice.id}`);
                  }
                }}
                size="sm"
              />
            </View>
          </Card>
        </View>
      )}

      {/* 5. Conteúdo em Destaque Compacto */}
      {featuredArticle && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Conteúdo em Destaque
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/content')}
              accessibilityRole="button"
              accessibilityLabel="Ver todos os artigos"
            >
              <Text style={[styles.seeAllLink, { color: colors.primary }]}>Ver todos →</Text>
            </TouchableOpacity>
          </View>

          <Card variant="bordered" style={styles.editorialCard}>
            <View style={styles.articleBadgeRow}>
              <Badge label={featuredArticle.category || featuredArticle.categoryName || 'Artigo'} variant="info" size="sm" />
              <Text style={[styles.readTimeText, { color: colors.textMuted }]}>
                {featuredArticle.readingTimeMinutes || featuredArticle.readTimeMinutes || 4} min de leitura
              </Text>
            </View>

            <Text style={[styles.editorialTitle, { color: colors.text }]}>
              {featuredArticle.title}
            </Text>
            <Text
              style={[styles.editorialSummary, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {featuredArticle.summary}
            </Text>

            <View style={styles.editorialFooter}>
              <TouchableOpacity
                onPress={() => router.push(`/contents/${featuredArticle.slug || featuredArticle.id}` as any)}
                style={styles.continueReadBtn}
                accessibilityRole="link"
                accessibilityLabel={`Ler artigo ${featuredArticle.title}`}
              >
                <Text style={[styles.continueReadText, { color: colors.primary }]}>
                  Ler artigo
                </Text>
                <ChevronRight size={15} color={colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => toggleArticleFavorite(featuredArticle.id)}
                accessibilityRole="button"
                accessibilityLabel="Favoritar artigo"
                style={styles.favBtn}
              >
                <Bookmark
                  size={17}
                  color={featuredArticle.isFavorite ? colors.primary : colors.textMuted}
                  fill={featuredArticle.isFavorite ? colors.primary : 'none'}
                />
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      )}

      {/* 6. Aviso Institucional */}
      <View
        style={[
          styles.disclaimerBox,
          {
            backgroundColor: isDark ? colors.surfaceSecondary : '#F0F5F4',
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
          {LEGAL_TEXTS.MEDICAL_DISCLAIMER}
        </Text>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  dateSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sosHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  sosHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  checkinHeroCard: {
    padding: 16,
    marginBottom: 20,
  },
  heroContent: {
    gap: 10,
  },
  heroTextCol: {
    gap: 4,
  },
  heroQuestion: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  lastRecordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  lastRecordText: {
    fontSize: 13,
    lineHeight: 18,
  },
  heroActionsCol: {
    marginTop: 4,
    gap: 8,
  },
  historyLinkBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  historyLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeaderWrap: {
    marginBottom: 10,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  quickActionsGridDesktop: {
    flexWrap: 'nowrap',
  },
  quickActionItem: {
    width: '48%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
  },
  quickActionItemDesktop: {
    width: '23%',
    flexGrow: 1,
  },
  quickActionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  quickActionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  recommendationCard: {
    padding: 16,
    gap: 8,
  },
  recHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  favBtn: {
    padding: 4,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  recSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  recActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F4',
  },
  recCompletedText: {
    fontSize: 12,
  },
  editorialCard: {
    padding: 16,
    gap: 8,
  },
  articleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readTimeText: {
    fontSize: 12,
  },
  editorialTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  editorialSummary: {
    fontSize: 13,
    lineHeight: 18,
  },
  editorialFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F4',
  },
  continueReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  continueReadText: {
    fontSize: 13,
    fontWeight: '700',
  },
  disclaimerBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  sidePanelWrap: {
    gap: 6,
  },
  sidePanelTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  sideCardHeading: {
    fontSize: 12,
    fontWeight: '700',
  },
  sideCardText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
