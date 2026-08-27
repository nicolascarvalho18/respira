import React, { useEffect, useMemo } from 'react';
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
  MessageCircle,
  Heart,
  Bookmark,
  CheckCircle2,
  Play,
  Leaf,
  Clock,
  Calendar,
  HeartHandshake,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { Card } from '../../src/components/ui/Card';
import { useAuth } from '../../src/hooks/useAuth';
import { useMoodStore } from '../../src/store/moodStore';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { getGreeting, getRelativeDateLabel } from '../../src/utils/date';
import { AnaAvatar } from '../../src/components/illustrations/AnaAvatar';
import { PracticeThumbnail } from '../../src/components/practices/PracticeThumbnail';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();

  const { records } = useMoodStore();
  const { practices, toggleFavorite: togglePracticeFavorite } = usePracticeStore();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Início & Diário — Respira';
    }
  }, []);

  const lastRecord = records.length > 0 ? records[0] : null;
  const recommendedPractice =
    practices.find((p) => p.id === 'practice-breathing-478') || practices[0] || null;

  // Formatação de data em português: "Quinta-feira, 27 de agosto"
  const formattedToday = useMemo(() => {
    try {
      const now = new Date();
      const raw = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(now);
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    } catch {
      return 'Hoje';
    }
  }, []);

  const userName = user?.name || 'Ana';

  // 4 Ações Rápidas Padronizadas
  const quickActions = [
    {
      title: 'Respirar',
      desc: 'Técnica 4-7-8',
      icon: Wind,
      onPress: () => router.push('/practices/breathing'),
    },
    {
      title: 'Relaxar',
      desc: 'Relaxamento guiado',
      icon: Leaf,
      onPress: () => router.push('/practices/relaxation' as any),
    },
    {
      title: 'Humor',
      desc: 'Check-in do seu momento',
      icon: Smile,
      onPress: () => router.push('/mood/new'),
    },
    {
      title: 'Assistente',
      desc: 'Acolhimento e orientações',
      icon: MessageCircle,
      onPress: () => router.push('/chat'),
    },
  ];

  // Painel lateral contextual exclusivo do Desktop (>= 1200px)
  const renderDesktopRightPanel = () => (
    <View style={styles.sidePanelWrap}>
      <Text
        accessibilityRole="header"
        aria-level={2}
        style={[styles.sidePanelTitle, { color: isDark ? colors.text : '#123F3A' }]}
      >
        Resumo do dia
      </Text>

      {/* Card de Lembrete Ativo */}
      <Card
        variant="bordered"
        padding="md"
        style={[
          styles.sideCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#DFE5E2',
          },
        ]}
      >
        <View style={styles.sideCardHeaderRow}>
          <Clock size={16} color="#2F817A" strokeWidth={2} style={{ marginRight: 8 }} aria-hidden={true} />
          <Text style={[styles.sideCardHeading, { color: isDark ? colors.text : '#123F3A' }]}>
            Lembrete de cuidado
          </Text>
        </View>
        <Text style={[styles.sideCardText, { color: isDark ? colors.textMuted : '#65736F' }]}>
          Seu momento diário de reflexão está configurado para às{' '}
          <Text style={{ fontWeight: '600', color: isDark ? colors.text : '#263633' }}>20:30</Text>.
        </Text>
      </Card>

      {/* Card de Apoio SOS */}
      <Card
        variant="bordered"
        padding="md"
        style={[
          styles.sideCard,
          {
            backgroundColor: isDark ? '#261C19' : '#FDF6F3',
            borderColor: isDark ? '#4A2A22' : '#F4D3C6',
          },
        ]}
      >
        <View style={styles.sideCardHeaderRow}>
          <HeartHandshake
            size={16}
            color="#C9785B"
            strokeWidth={2}
            style={{ marginRight: 8 }}
            aria-hidden={true}
          />
          <Text style={[styles.sideCardHeading, { color: '#C9785B' }]}>Precisa de escuta?</Text>
        </View>
        <Text style={[styles.sideCardText, { color: isDark ? '#F5DDD6' : '#733722' }]}>
          O CVV oferece apoio emocional gratuito pelo telefone{' '}
          <Text style={{ fontWeight: '700' }}>188</Text> (24 horas).
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/support')}
          style={{ marginTop: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Ver canais de apoio emocional"
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#C9785B' }}>
            Ver canais de apoio →
          </Text>
        </TouchableOpacity>
      </Card>

      {/* Estatística Rápida */}
      <Card
        variant="bordered"
        padding="md"
        style={[
          styles.sideCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#DFE5E2',
          },
        ]}
      >
        <View style={styles.sideCardHeaderRow}>
          <Calendar size={16} color="#2F817A" strokeWidth={2} style={{ marginRight: 8 }} aria-hidden={true} />
          <Text style={[styles.sideCardHeading, { color: isDark ? colors.text : '#123F3A' }]}>
            Registros no mês
          </Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#2F817A', marginTop: 2 }}>
          {records.length}{' '}
          <Text style={{ fontSize: 13, fontWeight: '400', color: isDark ? colors.textMuted : '#65736F' }}>
            check-ins realizados
          </Text>
        </Text>
      </Card>
    </View>
  );

  return (
    <AppShell rightPanel={renderDesktopRightPanel()}>
      {/* 1. Cabeçalho Superior Compacto e Humano */}
      <View style={styles.topHeader}>
        <View style={styles.userGreetingRow}>
          <AnaAvatar
            size={44}
            avatarUrl={user?.avatarUrl}
            name={userName}
            style={styles.avatarWrap}
          />
          <View style={styles.headerTextGroup}>
            <Text
              accessibilityRole="header"
              aria-level={1}
              style={[styles.greetingTitle, { color: isDark ? colors.text : '#123F3A' }]}
            >
              {getGreeting(userName)}
            </Text>
            <Text style={[styles.dateSubtitle, { color: isDark ? colors.textMuted : '#65736F' }]}>
              {formattedToday}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/support')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Apoio imediato e escuta gratuita pelo CVV"
          style={[
            styles.sosHeaderBtn,
            {
              backgroundColor: isDark ? '#261C19' : '#FDF6F3',
              borderColor: isDark ? '#4A2A22' : '#F4D3C6',
            },
          ]}
        >
          <Heart size={15} color="#C9785B" strokeWidth={2} aria-hidden={true} />
          <Text style={styles.sosHeaderText}>Apoio imediato</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Momento Atual — Card Branco Limpo com Barra Lateral Verde */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#DFE5E2',
          },
        ]}
      >
        {/* Barra lateral verde como detalhe visual sutil */}
        <View style={styles.heroAccentBar} />

        <View style={styles.heroCardContent}>
          {/* Badge Pequena e Sóbria */}
          <View
            style={[
              styles.heroBadge,
              { backgroundColor: isDark ? '#1C302D' : '#DDE9E4' },
            ]}
          >
            <Text style={[styles.heroBadgeText, { color: '#2F817A' }]}>
              MOMENTO ATUAL
            </Text>
          </View>

          {/* Pergunta Principal */}
          <Text
            accessibilityRole="header"
            aria-level={2}
            style={[styles.heroQuestion, { color: isDark ? colors.text : '#123F3A' }]}
          >
            Como você está agora?
          </Text>

          {/* Último Registro com Organização Clara */}
          <View style={styles.lastRecordRow}>
            <CheckCircle2
              size={17}
              color="#2F817A"
              strokeWidth={2}
              style={{ marginRight: 8, marginTop: 2 }}
              aria-hidden={true}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.lastRecordTitle, { color: isDark ? colors.text : '#263633' }]}>
                {lastRecord
                  ? `Último registro: ${getRelativeDateLabel(lastRecord.createdAt)}`
                  : 'Nenhum registro ainda hoje'}
              </Text>
              <Text style={[styles.lastRecordMeta, { color: isDark ? colors.textMuted : '#65736F' }]}>
                {lastRecord
                  ? `Humor ${lastRecord.mood}/5 • Ansiedade ${lastRecord.anxietyLevel}/10`
                  : 'Faça um check-in breve para escutar e registrar suas emoções.'}
              </Text>
            </View>
          </View>

          {/* Divisor Discreto */}
          <View
            style={[
              styles.heroDivider,
              { backgroundColor: isDark ? colors.border : '#DFE5E2' },
            ]}
          />

          {/* Ações do Card */}
          <View style={styles.heroActionsContainer}>
            <TouchableOpacity
              onPress={() => router.push('/mood/new')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Registrar meu momento"
              style={styles.primaryActionButton}
            >
              <Smile size={18} color="#FFFFFF" strokeWidth={2} aria-hidden={true} />
              <Text style={styles.primaryActionText}>Registrar meu momento</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/diary/history' as any)}
              accessibilityRole="link"
              accessibilityLabel="Visualizar histórico de momento atual"
              style={styles.historyLinkBtn}
            >
              <Text style={styles.historyLinkText}>
                Visualizar histórico de momento atual →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3. Ações Rápidas — Grade Equilibrada de 2 Colunas */}
      <View style={styles.sectionHeaderWrap}>
        <Text
          accessibilityRole="header"
          aria-level={2}
          style={[styles.sectionTitle, { color: isDark ? colors.text : '#123F3A' }]}
        >
          Ações rápidas
        </Text>
      </View>

      {isDesktop ? (
        <View style={styles.quickActionsGridDesktop}>
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.75}
                onPress={action.onPress}
                accessibilityRole="button"
                accessibilityLabel={`${action.title}: ${action.desc}`}
                style={[
                  styles.quickActionCard,
                  {
                    backgroundColor: isDark ? colors.surface : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#DFE5E2',
                    flex: 1,
                  },
                ]}
              >
                <Icon
                  size={22}
                  color="#2F817A"
                  strokeWidth={2}
                  style={styles.quickActionIcon}
                  aria-hidden={true}
                />
                <Text style={[styles.quickActionTitle, { color: isDark ? colors.text : '#123F3A' }]}>
                  {action.title}
                </Text>
                <Text style={[styles.quickActionDesc, { color: isDark ? colors.textMuted : '#65736F' }]}>
                  {action.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.quickActionsGridMobile}>
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.75}
                onPress={action.onPress}
                accessibilityRole="button"
                accessibilityLabel={`${action.title}: ${action.desc}`}
                style={[
                  styles.quickActionCardMobile,
                  {
                    backgroundColor: isDark ? colors.surface : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#DFE5E2',
                  },
                ]}
              >
                <Icon
                  size={22}
                  color="#2F817A"
                  strokeWidth={2}
                  style={styles.quickActionIcon}
                  aria-hidden={true}
                />
                <Text style={[styles.quickActionTitle, { color: isDark ? colors.text : '#123F3A' }]}>
                  {action.title}
                </Text>
                <Text style={[styles.quickActionDesc, { color: isDark ? colors.textMuted : '#65736F' }]}>
                  {action.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* 4. Recomendação para Hoje — Card Editorial e Profissional */}
      {recommendedPractice && (
        <View style={styles.recSectionWrap}>
          <View style={styles.sectionHeaderWrap}>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[styles.sectionTitle, { color: isDark ? colors.text : '#123F3A' }]}
            >
              Recomendação para hoje
            </Text>
          </View>

          <View
            style={[
              styles.recommendationCard,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: isDark ? colors.border : '#DFE5E2',
              },
            ]}
          >
            {/* Miniatura visual realista e dedicada */}
            <View style={styles.recThumbnailBox}>
              <PracticeThumbnail
                practiceId={recommendedPractice.id}
                category={recommendedPractice.category}
                title={recommendedPractice.title}
                isDark={isDark}
              />
            </View>

            {/* Conteúdo à direita com tipografia clara */}
            <View style={styles.recContentCol}>
              <View style={styles.recTopLine}>
                <Text
                  accessibilityRole="header"
                  aria-level={3}
                  style={[styles.recTitle, { color: isDark ? colors.text : '#123F3A' }]}
                >
                  {recommendedPractice.title}
                </Text>
                <TouchableOpacity
                  onPress={() => togglePracticeFavorite(recommendedPractice.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    recommendedPractice.isFavorite
                      ? 'Remover prática dos favoritos'
                      : 'Adicionar prática aos favoritos'
                  }
                >
                  <Bookmark
                    size={19}
                    color="#2F817A"
                    fill={recommendedPractice.isFavorite ? '#2F817A' : 'transparent'}
                    strokeWidth={2}
                    aria-hidden={true}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.recMetaText}>
                {recommendedPractice.durationMinutes} min • {recommendedPractice.level} • Guiado
              </Text>

              <Text
                style={[styles.recDesc, { color: isDark ? colors.textMuted : '#65736F' }]}
                numberOfLines={2}
              >
                {recommendedPractice.description}
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/practices/breathing')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Iniciar prática: ${recommendedPractice.title}`}
                style={styles.startPracticeBtn}
              >
                <Play size={12} color="#FFFFFF" fill="#FFFFFF" aria-hidden={true} />
                <Text style={styles.startPracticeBtnText}>Iniciar prática</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  // 1. Cabeçalho Superior
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 4,
    gap: 12,
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  avatarWrap: {
    marginRight: 12,
  },
  headerTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  dateSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 1,
  },
  sosHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 40,
  },
  sosHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C9785B',
  },

  // 2. Card Momento Atual
  heroCard: {
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#123F3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#2F817A',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  heroCardContent: {
    padding: 20,
    paddingLeft: 22,
  },
  heroBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroQuestion: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  lastRecordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  lastRecordTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  lastRecordMeta: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
    lineHeight: 18,
  },
  heroDivider: {
    height: 1,
    marginVertical: 16,
  },
  heroActionsContainer: {
    gap: 12,
  },
  primaryActionButton: {
    backgroundColor: '#2F817A',
    borderRadius: 12,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    shadowColor: '#123F3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  historyLinkBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  historyLinkText: {
    color: '#2F817A',
    fontSize: 14,
    fontWeight: '600',
  },

  // 3. Ações Rápidas
  sectionHeaderWrap: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '650' as any,
    letterSpacing: -0.2,
  },
  quickActionsGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickActionsGridDesktop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#123F3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    minHeight: 104,
    justifyContent: 'center',
  },
  quickActionCardMobile: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#123F3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    minHeight: 102,
    justifyContent: 'center',
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  quickActionDesc: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
    lineHeight: 17,
  },

  // 4. Recomendação para Hoje
  recSectionWrap: {
    marginBottom: 16,
  },
  recommendationCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    shadowColor: '#123F3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  recThumbnailBox: {
    alignSelf: 'center',
  },
  recContentCol: {
    flex: 1,
    minWidth: 0,
  },
  recTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  recTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    flex: 1,
  },
  recMetaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2F817A',
    marginTop: 2,
    marginBottom: 4,
  },
  recDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  startPracticeBtn: {
    backgroundColor: '#2F817A',
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  startPracticeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Painel Lateral Desktop
  sidePanelWrap: {
    gap: 12,
  },
  sidePanelTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  sideCard: {
    borderRadius: 14,
    borderWidth: 1,
  },
  sideCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sideCardHeading: {
    fontSize: 14,
    fontWeight: '600',
  },
  sideCardText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
