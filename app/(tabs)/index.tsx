import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
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
import { getGreeting, formatDate, formatDateTime } from '../../src/utils/date';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();

  const { records } = useMoodStore();
  const { practices, toggleFavorite: togglePracticeFavorite } = usePracticeStore();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Início — Respira';
    }
  }, []);

  const lastRecord = records.length > 0 ? records[0] : null;
  const recommendedPractice =
    practices.find((p) => p.id === 'practice-breathing-478') || practices[0] || null;

  // Formatação de data da barra superior (ex: "27 de ago. de 2026")
  const formattedToday = useMemo(() => {
    try {
      return formatDate(new Date().toISOString());
    } catch {
      return 'Hoje';
    }
  }, []);

  const userName = user?.name || 'Nicolas';
  const userInitial = userName.trim().charAt(0).toUpperCase() || 'N';

  // 4 Ações Rápidas Padronizadas com Ícones Lineares Lucide
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
            borderColor: isDark ? colors.border : '#E8EDEA',
          },
        ]}
      >
        <View style={styles.sideCardHeaderRow}>
          <Clock size={16} color="#1B645D" strokeWidth={2} style={{ marginRight: 8 }} aria-hidden={true} />
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
            backgroundColor: isDark ? '#261C19' : '#FFF7F5',
            borderColor: isDark ? '#4A2A22' : '#F6B7A5',
          },
        ]}
      >
        <View style={styles.sideCardHeaderRow}>
          <HeartHandshake
            size={16}
            color="#E05638"
            strokeWidth={2}
            style={{ marginRight: 8 }}
            aria-hidden={true}
          />
          <Text style={[styles.sideCardHeading, { color: '#E05638' }]}>Precisa de escuta?</Text>
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
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#E05638' }}>
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
            borderColor: isDark ? colors.border : '#E8EDEA',
          },
        ]}
      >
        <View style={styles.sideCardHeaderRow}>
          <Calendar size={16} color="#1B645D" strokeWidth={2} style={{ marginRight: 8 }} aria-hidden={true} />
          <Text style={[styles.sideCardHeading, { color: isDark ? colors.text : '#123F3A' }]}>
            Registros no mês
          </Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#1B645D', marginTop: 2 }}>
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
      {/* 1. Cabeçalho Superior */}
      <View style={styles.topHeader}>
        <View style={styles.userGreetingRow}>
          <View style={[styles.avatarCircle, { backgroundColor: '#123F3A' }]}>
            <Text style={styles.avatarLetter}>{userInitial}</Text>
          </View>
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
              backgroundColor: isDark ? '#261C19' : '#FFF7F5',
              borderColor: isDark ? '#4A2A22' : '#F6B7A5',
            },
          ]}
        >
          <Heart size={15} color="#E05638" strokeWidth={1.8} aria-hidden={true} />
          <Text style={styles.sosHeaderText}>Apoio imediato</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Card Momento Atual */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#E8EDEA',
          },
        ]}
      >
        {/* Badge Sóbria */}
        <View
          style={[
            styles.heroBadge,
            { backgroundColor: isDark ? '#1C302D' : '#DDE9E4' },
          ]}
        >
          <Text style={[styles.heroBadgeText, { color: '#1B645D' }]}>
            Momento atual
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

        {/* Último Registro com Linha e Métricas */}
        <View style={styles.lastRecordRow}>
          <CheckCircle2
            size={18}
            color="#1B645D"
            strokeWidth={1.8}
            style={{ marginTop: 2 }}
            aria-hidden={true}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.lastRecordTitle, { color: isDark ? colors.text : '#263633' }]}>
              Último registro: {lastRecord ? formatDateTime(lastRecord.createdAt) : 'Nenhum ainda hoje'}
            </Text>
            <Text style={[styles.lastRecordMeta, { color: isDark ? colors.textMuted : '#65736F' }]}>
              {lastRecord
                ? `Humor ${lastRecord.mood}/5  •  Ansiedade ${lastRecord.anxietyLevel}/10`
                : 'Faça um check-in breve para registrar suas emoções.'}
            </Text>
          </View>
        </View>

        {/* Botão Primário "Registrar meu momento" */}
        <TouchableOpacity
          onPress={() => router.push('/mood/new')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Registrar meu momento"
          style={styles.primaryActionButton}
        >
          <Smile size={19} color="#FFFFFF" strokeWidth={1.8} aria-hidden={true} />
          <Text style={styles.primaryActionText}>Registrar meu momento</Text>
        </TouchableOpacity>

        {/* Link Secundário */}
        <TouchableOpacity
          onPress={() => router.push('/diary/history' as any)}
          accessibilityRole="link"
          accessibilityLabel="Visualizar histórico de momento atual"
          style={styles.historyLinkBtn}
        >
          <Text style={styles.historyLinkText}>
            Visualizar histórico →
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Ações Rápidas — Grade 2x2 no Celular */}
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
                    borderColor: isDark ? colors.border : '#E8EDEA',
                    flex: 1,
                  },
                ]}
              >
                <Icon
                  size={26}
                  color="#1B645D"
                  strokeWidth={1.8}
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
                    borderColor: isDark ? colors.border : '#E8EDEA',
                  },
                ]}
              >
                <Icon
                  size={26}
                  color="#1B645D"
                  strokeWidth={1.8}
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

      {/* 4. Recomendação para Hoje — Card Editorial Realista */}
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
                borderColor: isDark ? colors.border : '#E8EDEA',
              },
            ]}
          >
            {/* Foto real e acolhedora da poltrona com planta e janela */}
            <Image
              source={require('../../assets/images/practice-chair-window.jpg')}
              style={styles.recImage}
              resizeMode="cover"
            />

            {/* Conteúdo à direita */}
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
                    color="#1B645D"
                    fill={recommendedPractice.isFavorite ? '#1B645D' : 'transparent'}
                    strokeWidth={1.8}
                    aria-hidden={true}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.recMetaText}>
                {recommendedPractice.durationMinutes} min  •  {recommendedPractice.level}
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
                <Text style={styles.startPracticeBtnText}>Iniciar</Text>
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
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  greetingTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  dateSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  sosHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 38,
  },
  sosHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E05638',
  },

  // 2. Card Momento Atual
  heroCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#123F3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroQuestion: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  lastRecordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 4,
  },
  lastRecordTitle: {
    fontSize: 13.5,
    fontWeight: '500',
    lineHeight: 19,
  },
  lastRecordMeta: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 3,
    lineHeight: 18,
  },
  primaryActionButton: {
    backgroundColor: '#1B645D',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    shadowColor: '#1B645D',
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
    marginTop: 14,
    paddingVertical: 2,
  },
  historyLinkText: {
    color: '#1B645D',
    fontSize: 14,
    fontWeight: '600',
  },

  // 3. Ações Rápidas
  sectionHeaderWrap: {
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#123F3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    minHeight: 110,
    justifyContent: 'center',
  },
  quickActionCardMobile: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#123F3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    minHeight: 110,
    justifyContent: 'center',
  },
  quickActionIcon: {
    marginBottom: 2,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  quickActionDesc: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 4,
    lineHeight: 17,
  },

  // 4. Recomendação para Hoje
  recSectionWrap: {
    marginBottom: 20,
  },
  recommendationCard: {
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    shadowColor: '#123F3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  recImage: {
    width: 104,
    height: 112,
    borderRadius: 12,
  },
  recContentCol: {
    flex: 1,
    minWidth: 0,
  },
  recTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  recMetaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B645D',
    marginTop: 2,
    marginBottom: 4,
  },
  recDesc: {
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 10,
  },
  startPracticeBtn: {
    backgroundColor: '#1B645D',
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 8,
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
