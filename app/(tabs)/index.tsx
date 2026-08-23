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
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { useAuth } from '../../src/hooks/useAuth';
import { useMoodStore } from '../../src/store/moodStore';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useContentStore } from '../../src/store/contentStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { getGreeting, formatDate, getRelativeDateLabel } from '../../src/utils/date';
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
      desc: 'Técnica 4-7-8 para alívio imediato',
      icon: Wind,
      color: colors.primary,
      bg: isDark ? colors.highlight : '#EBF6F4',
      onPress: () => router.push('/practices/breathing'),
    },
    {
      title: 'Relaxar',
      desc: 'Relaxamento muscular progressivo',
      icon: Layers,
      color: colors.secondary,
      bg: isDark ? colors.surfaceSecondary : '#EBF6F0',
      onPress: () => router.push('/practices/relaxation' as any),
    },
    {
      title: 'Registrar humor',
      desc: 'Check-in de emoções do momento',
      icon: Smile,
      color: '#D47754',
      bg: isDark ? colors.surfaceSecondary : '#FDF2EC',
      onPress: () => router.push('/mood/new'),
    },
    {
      title: 'Assistente IA',
      desc: 'Dúvidas, psicoeducação e acolhimento',
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
      <Card variant="bordered" padding="sm" style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Clock size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.sideCardHeading, { color: colors.text }]}>Lembrete de Cuidado</Text>
        </View>
        <Text style={[styles.sideCardText, { color: colors.textMuted }]}>
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
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <HeartHandshake size={16} color={colors.warning} style={{ marginRight: 6 }} />
          <Text style={[styles.sideCardHeading, { color: colors.warning }]}>Precisa de Escuta?</Text>
        </View>
        <Text style={[styles.sideCardText, { color: isDark ? '#F5DDD6' : '#733722' }]}>
          O CVV oferece apoio emocional gratuito pelo número{' '}
          <Text style={{ fontWeight: '800' }}>188</Text> (24h).
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/support')}
          style={{ marginTop: 8 }}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Calendar size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.sideCardHeading, { color: colors.text }]}>Registros no Mês</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.primary }}>
          {records.length} <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textMuted }}>check-ins realizados</Text>
        </Text>
      </Card>
    </View>
  );

  return (
    <AppShell rightPanel={renderDesktopRightPanel()}>
      {/* 1. Cabeçalho Superior */}
      <View style={styles.topHeader}>
        <View style={styles.userGreetingRow}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarLetter}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </Text>
          </View>
          <View>
            <Text style={[styles.greetingTitle, { color: colors.text }]}>
              {getGreeting(user?.name || 'Ana')}
            </Text>
            <Text style={[styles.dateSubtitle, { color: colors.textMuted }]}>
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
            <HeartHandshake size={16} color={colors.warning} />
            <Text style={[styles.sosHeaderText, { color: colors.warning }]}>Apoio Imediato</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Notificações"
            style={[styles.bellBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <Bell size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Bloco Principal: "Como você está agora?" */}
      <Card variant="bordered" style={styles.checkinHeroCard}>
        <View style={styles.heroContent}>
          <View style={styles.heroTextCol}>
            <Badge label="Momento Atual" variant="primary" size="sm" style={{ marginBottom: 8 }} />
            <Text style={[styles.heroQuestion, { color: colors.text }]}>
              Como você está agora?
            </Text>

            {lastRecord ? (
              <View style={styles.lastRecordRow}>
                <CheckCircle2 size={15} color={colors.success} style={{ marginRight: 6 }} />
                <Text style={[styles.lastRecordText, { color: colors.textMuted }]}>
                  Último registro: {getRelativeDateLabel(lastRecord.createdAt)} (Humor{' '}
                  {lastRecord.mood}/5 • Ansiedade {lastRecord.anxietyLevel}/10)
                </Text>
              </View>
            ) : (
              <Text style={[styles.lastRecordText, { color: colors.textMuted }]}>
                Faça seu primeiro check-in para acompanhar suas tendências.
              </Text>
            )}
          </View>

          <View style={styles.heroActionsCol}>
            <AppButton
              title="Registrar meu momento"
              leftIcon={<Smile size={18} color="#FFFFFF" />}
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

      {/* 3. Ações Rápidas */}
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
                  backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                  borderColor: colors.border,
                },
                Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined,
              ]}
            >
              <View style={[styles.quickActionIconWrap, { backgroundColor: action.bg }]}>
                <Icon size={22} color={action.color} />
              </View>
              <Text style={[styles.quickActionTitle, { color: colors.text }]}>{action.title}</Text>
              <Text style={[styles.quickActionDesc, { color: colors.textMuted }]} numberOfLines={2}>
                {action.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. Recomendação do Dia */}
      {recommendedPractice && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Sparkles size={18} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recomendação para Hoje
              </Text>
            </View>
            <Badge label="Personalizado" variant="success" size="sm" />
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
                  size={18}
                  color={recommendedPractice.isFavorite ? colors.primary : colors.textMuted}
                  fill={recommendedPractice.isFavorite ? colors.primary : 'none'}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.recTitle, { color: colors.text }]}>
              {recommendedPractice.title}
            </Text>
            <Text style={[styles.recSubtitle, { color: colors.textMuted }]}>
              {recommendedPractice.subtitle}
            </Text>

            <View
              style={[
                styles.recReasonBox,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : colors.highlight,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.recReasonText, { color: colors.primaryDark }]}>
                💡 <Text style={{ fontWeight: '700' }}>Por que fazer agora:</Text> Ajuda a regular
                a respiração e diminuir o ritmo cardíaco em momentos de sobrecarga.
              </Text>
            </View>

            <View style={styles.recActionRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <ProgressBar progress={(recommendedPractice.completedCount || 0) > 0 ? 100 : 0} height={6} />
              </View>
              <AppButton
                title="Iniciar Prática"
                onPress={() => {
                  if (recommendedPractice.category === 'breathing') {
                    router.push('/practices/breathing');
                  } else {
                    router.push(`/practices/player/${recommendedPractice.id}`);
                  }
                }}
                size="md"
              />
            </View>
          </Card>
        </View>
      )}

      {/* 5. Conteúdo em Destaque */}
      {featuredArticle && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Conteúdo Educativo em Destaque
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
            <View style={styles.editorialRow}>
              <View style={styles.editorialTextCol}>
                <View style={styles.articleBadgeRow}>
                  <Badge label={featuredArticle.categoryName} variant="info" size="sm" />
                  <Text style={[styles.readTimeText, { color: colors.textMuted }]}>
                    {featuredArticle.readTimeMinutes} min de leitura
                  </Text>
                </View>

                <Text style={[styles.editorialTitle, { color: colors.text }]}>
                  {featuredArticle.title}
                </Text>
                <Text
                  style={[styles.editorialSummary, { color: colors.textMuted }]}
                  numberOfLines={2}
                >
                  {featuredArticle.summary}
                </Text>

                <View style={styles.editorialFooter}>
                  <TouchableOpacity
                    onPress={() => router.push(`/content/${featuredArticle.id}`)}
                    style={styles.continueReadBtn}
                    accessibilityRole="link"
                    accessibilityLabel={`Ler artigo ${featuredArticle.title}`}
                  >
                    <Text style={[styles.continueReadText, { color: colors.primary }]}>
                      Continuar leitura
                    </Text>
                    <ChevronRight size={16} color={colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => toggleArticleFavorite(featuredArticle.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Favoritar artigo"
                    style={styles.favBtn}
                  >
                    <Bookmark
                      size={18}
                      color={featuredArticle.isFavorite ? colors.primary : colors.textMuted}
                      fill={featuredArticle.isFavorite ? colors.primary : 'none'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* 6. Aviso Institucional Médico */}
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
    marginBottom: 20,
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  dateSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sosHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  sosHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinHeroCard: {
    marginBottom: 24,
  },
  heroContent: {
    gap: 14,
  },
  heroTextCol: {
    gap: 4,
  },
  heroQuestion: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  lastRecordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lastRecordText: {
    fontSize: 13,
    lineHeight: 18,
  },
  heroActionsCol: {
    marginTop: 6,
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
    marginBottom: 12,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickActionsGridDesktop: {
    flexWrap: 'nowrap',
  },
  quickActionItem: {
    width: '48%',
    flexGrow: 1,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 6,
  },
  quickActionItemDesktop: {
    width: '23%',
    flexGrow: 1,
  },
  quickActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  quickActionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  recommendationCard: {
    gap: 10,
  },
  recHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  favBtn: {
    padding: 6,
  },
  recTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  recSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  recReasonBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  recReasonText: {
    fontSize: 13,
    lineHeight: 18,
  },
  recActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  editorialCard: {
    gap: 8,
  },
  editorialRow: {
    flexDirection: 'row',
  },
  editorialTextCol: {
    flex: 1,
    gap: 6,
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
    fontSize: 17,
    fontWeight: '800',
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
    marginTop: 8,
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
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 24,
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  sidePanelWrap: {
    gap: 8,
  },
  sidePanelTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  sideCardHeading: {
    fontSize: 13,
    fontWeight: '700',
  },
  sideCardText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
