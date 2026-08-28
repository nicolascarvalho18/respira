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
  Circle,
  Play,
  Leaf,
  Clock,
  Calendar,
  HeartHandshake,
  Check,
  ChevronRight,
  Sun,
  Moon,
  Sunset,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { Card } from '../../src/components/ui/Card';
import { useAuth } from '../../src/hooks/useAuth';
import { useMoodStore } from '../../src/store/moodStore';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { useToast } from '../../src/components/ui/Toast';
import { getGreeting, formatDate, formatDateTime } from '../../src/utils/date';
import { getPracticeImage } from '../../src/utils/practiceImages';
import { PlannedExercise } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();
  const { showToast } = useToast();

  const { records, updateExerciseStatus } = useMoodStore();
  const { practices, toggleFavorite: togglePracticeFavorite } = usePracticeStore();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Início — Respira';
    }
  }, []);

  const lastRecord = records.length > 0 ? records[0] : null;
  const plannedExercises: PlannedExercise[] = lastRecord?.plannedExercises || [];

  const recommendedPractice =
    practices.find((p) => p.id === 'practice-breathing-478') || practices[0] || null;

  // Formatação de data da barra superior
  const formattedToday = useMemo(() => {
    try {
      return formatDate(new Date().toISOString());
    } catch {
      return 'Hoje';
    }
  }, []);

  const userName = user?.name || 'Nicolas';
  const userInitial = userName.trim().charAt(0).toUpperCase() || 'N';

  // Alternar conclusão de atividade do dia
  const handleToggleActivity = async (recordId: string, exId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await updateExerciseStatus(recordId, exId, nextStatus);
      showToast({
        message: nextStatus === 'completed' ? 'Prática marcada como concluída!' : 'Prática marcada como pendente.',
        type: 'info',
      });
    } catch {
      showToast({
        message: 'Não foi possível atualizar o status da prática.',
        type: 'error',
      });
    }
  };

  // Ícone e rótulo do período
  const getPeriodMeta = (period?: string) => {
    switch (period) {
      case 'morning':
        return { label: 'Manhã', icon: Sun };
      case 'afternoon':
        return { label: 'Tarde', icon: Sunset };
      case 'night':
        return { label: 'Noite', icon: Moon };
      default:
        return { label: 'Hoje', icon: Clock };
    }
  };

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
      onPress: () => router.push('/practices/player/practice-pmr-relaxation' as any),
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
        style={[styles.sidePanelTitle, { color: isDark ? colors.text : '#1F2927' }]}
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
            borderColor: isDark ? colors.border : '#E0E5E2',
          },
        ]}
      >
        <View style={styles.sideCardHeaderRow}>
          <Clock size={16} color="#247B74" strokeWidth={2} style={{ marginRight: 8 }} aria-hidden={true} />
          <Text style={[styles.sideCardHeading, { color: isDark ? colors.text : '#1F2927' }]}>
            Lembrete de cuidado
          </Text>
        </View>
        <Text style={[styles.sideCardText, { color: isDark ? colors.textMuted : '#68736F' }]}>
          Seu momento diário de reflexão está configurado para às{' '}
          <Text style={{ fontWeight: '600', color: isDark ? colors.text : '#1F2927' }}>20:30</Text>.
        </Text>
      </Card>

      {/* Card de Apoio SOS */}
      <Card
        variant="bordered"
        padding="md"
        style={[
          styles.sideCard,
          {
            backgroundColor: isDark ? '#2D1B18' : '#FFF7F5',
            borderColor: isDark ? '#5C2D24' : '#F6B7A5',
          },
        ]}
      >
        <View style={styles.sideCardHeaderRow}>
          <HeartHandshake
            size={16}
            color="#D87556"
            strokeWidth={2}
            style={{ marginRight: 8 }}
            aria-hidden={true}
          />
          <Text style={[styles.sideCardHeading, { color: '#D87556' }]}>Precisa de escuta?</Text>
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
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#D87556' }}>
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
            borderColor: isDark ? colors.border : '#E0E5E2',
          },
        ]}
      >
        <View style={styles.sideCardHeaderRow}>
          <Calendar size={16} color="#247B74" strokeWidth={2} style={{ marginRight: 8 }} aria-hidden={true} />
          <Text style={[styles.sideCardHeading, { color: isDark ? colors.text : '#1F2927' }]}>
            Registros no mês
          </Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#247B74', marginTop: 2 }}>
          {records.length}{' '}
          <Text style={{ fontSize: 13, fontWeight: '400', color: isDark ? colors.textMuted : '#68736F' }}>
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
          <View style={[styles.avatarCircle, { backgroundColor: '#247B74' }]}>
            <Text style={styles.avatarLetter}>{userInitial}</Text>
          </View>
          <View style={styles.headerTextGroup}>
            <Text
              accessibilityRole="header"
              aria-level={1}
              style={[styles.greetingTitle, { color: isDark ? colors.text : '#1F2927' }]}
            >
              {getGreeting(userName)}
            </Text>
            <Text style={[styles.dateSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
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
              backgroundColor: isDark ? '#2D1B18' : '#FFF7F5',
              borderColor: isDark ? '#5C2D24' : '#F6B7A5',
            },
          ]}
        >
          <Heart size={15} color="#D87556" strokeWidth={1.8} aria-hidden={true} />
          <Text style={styles.sosHeaderText}>Apoio imediato</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Card Momento Atual */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#E0E5E2',
          },
        ]}
      >
        {/* Badge Sóbria */}
        <View
          style={[
            styles.heroBadge,
            { backgroundColor: isDark ? '#1C3833' : '#EDF7F5' },
          ]}
        >
          <Text style={[styles.heroBadgeText, { color: '#247B74' }]}>
            Momento atual
          </Text>
        </View>

        {/* Pergunta Principal */}
        <Text
          accessibilityRole="header"
          aria-level={2}
          style={[styles.heroQuestion, { color: isDark ? colors.text : '#1F2927' }]}
        >
          Como você está agora?
        </Text>

        {/* Último Registro com Linha e Métricas */}
        <View style={styles.lastRecordRow}>
          <CheckCircle2
            size={18}
            color="#247B74"
            strokeWidth={1.8}
            style={{ marginTop: 2 }}
            aria-hidden={true}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.lastRecordTitle, { color: isDark ? colors.text : '#1F2927' }]}>
              Último registro: {lastRecord ? formatDateTime(lastRecord.createdAt) : 'Nenhum ainda hoje'}
            </Text>
            <Text style={[styles.lastRecordMeta, { color: isDark ? colors.textMuted : '#68736F' }]}>
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

      {/* 3. Atividades do Dia (Práticas Planejadas) */}
      {plannedExercises.length > 0 && lastRecord && (
        <View style={styles.dailyActivitiesSection}>
          <View style={styles.sectionHeaderWrap}>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
            >
              Atividades do dia
            </Text>
          </View>

          <View
            style={[
              styles.activitiesCard,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: isDark ? colors.border : '#E0E5E2',
              },
            ]}
          >
            {plannedExercises.map((exercise, idx) => {
              const isCompleted = exercise.status === 'completed';
              const targetPracticeId = exercise.practiceId || 'practice-breathing-478';
              const periodInfo = getPeriodMeta(exercise.scheduledPeriod);
              const PeriodIcon = periodInfo.icon;
              const isLast = idx === plannedExercises.length - 1;

              return (
                <View
                  key={exercise.id}
                  style={[
                    styles.activityItemRow,
                    !isLast && {
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? colors.border : '#EAEFECE0',
                    },
                  ]}
                >
                  {/* Thumbnail */}
                  <Image
                    source={getPracticeImage(targetPracticeId)}
                    style={styles.activityThumbnail}
                    resizeMode="cover"
                  />

                  {/* Informações da Prática */}
                  <View style={styles.activityInfoCol}>
                    <Text
                      style={[
                        styles.activityTitle,
                        {
                          color: isDark ? colors.text : '#1F2927',
                          textDecorationLine: isCompleted ? 'line-through' : 'none',
                          opacity: isCompleted ? 0.7 : 1,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {exercise.title}
                    </Text>

                    <View style={styles.activityMetaRow}>
                      <PeriodIcon size={12} color={isDark ? colors.textMuted : '#68736F'} />
                      <Text style={[styles.activityMetaText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                        {exercise.scheduledTime || periodInfo.label} • {exercise.durationMinutes} min
                      </Text>
                    </View>
                  </View>

                  {/* Ações: Iniciar & Concluir */}
                  <View style={styles.activityActionsRow}>
                    <TouchableOpacity
                      onPress={() => router.push(`/practices/player/${targetPracticeId}` as any)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Iniciar ${exercise.title}`}
                      style={styles.activityStartBtn}
                    >
                      <Play size={11} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={styles.activityStartBtnText}>Iniciar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleToggleActivity(lastRecord.id, exercise.id, exercise.status)}
                      activeOpacity={0.75}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isCompleted }}
                      accessibilityLabel={isCompleted ? `Desmarcar ${exercise.title}` : `Concluir ${exercise.title}`}
                      style={[
                        styles.activityCheckBtn,
                        isCompleted && { backgroundColor: '#247B74', borderColor: '#247B74' },
                        !isCompleted && { borderColor: isDark ? colors.border : '#CBD3D0' },
                      ]}
                    >
                      {isCompleted && <Check size={13} color="#FFFFFF" strokeWidth={2.5} />}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 4. Ações Rápidas — Grade 2x2 no Celular */}
      <View style={styles.sectionHeaderWrap}>
        <Text
          accessibilityRole="header"
          aria-level={2}
          style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
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
                    borderColor: isDark ? colors.border : '#E0E5E2',
                    flex: 1,
                  },
                ]}
              >
                <Icon
                  size={24}
                  color="#247B74"
                  strokeWidth={1.8}
                  style={styles.quickActionIcon}
                  aria-hidden={true}
                />
                <Text style={[styles.quickActionTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  {action.title}
                </Text>
                <Text style={[styles.quickActionDesc, { color: isDark ? colors.textMuted : '#68736F' }]}>
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
                    borderColor: isDark ? colors.border : '#E0E5E2',
                  },
                ]}
              >
                <Icon
                  size={24}
                  color="#247B74"
                  strokeWidth={1.8}
                  style={styles.quickActionIcon}
                  aria-hidden={true}
                />
                <Text style={[styles.quickActionTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  {action.title}
                </Text>
                <Text style={[styles.quickActionDesc, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  {action.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* 5. Recomendação para Hoje — Card Editorial Realista */}
      {recommendedPractice && (
        <View style={styles.recSectionWrap}>
          <View style={styles.sectionHeaderWrap}>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
            >
              Recomendação para hoje
            </Text>
          </View>

          <View
            style={[
              styles.recommendationCard,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: isDark ? colors.border : '#E0E5E2',
              },
            ]}
          >
            {/* Foto real e acolhedora da prática */}
            <Image
              source={getPracticeImage('respiracao-4-7-8')}
              style={styles.recImage}
              resizeMode="cover"
            />

            {/* Conteúdo à direita */}
            <View style={styles.recContentCol}>
              <View style={styles.recTopLine}>
                <Text
                  accessibilityRole="header"
                  aria-level={3}
                  style={[styles.recTitle, { color: isDark ? colors.text : '#1F2927' }]}
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
                    size={18}
                    color="#247B74"
                    fill={recommendedPractice.isFavorite ? '#247B74' : 'transparent'}
                    strokeWidth={1.8}
                    aria-hidden={true}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.recMetaText}>
                {recommendedPractice.durationMinutes} min  •  {recommendedPractice.level}
              </Text>

              <Text
                style={[styles.recDesc, { color: isDark ? colors.textMuted : '#68736F' }]}
                numberOfLines={2}
              >
                {recommendedPractice.description}
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/practices/player/practice-breathing-478' as any)}
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
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 38,
  },
  sosHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D87556',
  },

  // 2. Card Momento Atual
  heroCard: {
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
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
    backgroundColor: '#247B74',
    borderRadius: 10,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
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
    color: '#247B74',
    fontSize: 14,
    fontWeight: '600',
  },

  // 3. Atividades do Dia
  dailyActivitiesSection: {
    marginBottom: 24,
  },
  activitiesCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  activityThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  activityInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  activityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  activityMetaText: {
    fontSize: 12,
    fontWeight: '400',
  },
  activityActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityStartBtn: {
    backgroundColor: '#247B74',
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activityStartBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  activityCheckBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 4. Ações Rápidas
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
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    minHeight: 105,
    justifyContent: 'center',
  },
  quickActionCardMobile: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    minHeight: 105,
    justifyContent: 'center',
  },
  quickActionIcon: {
    marginBottom: 2,
  },
  quickActionTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    marginTop: 8,
  },
  quickActionDesc: {
    fontSize: 12.5,
    fontWeight: '400',
    marginTop: 3,
    lineHeight: 16,
  },

  // 5. Recomendação para Hoje
  recSectionWrap: {
    marginBottom: 20,
  },
  recommendationCard: {
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
  },
  recImage: {
    width: 96,
    height: 104,
    borderRadius: 10,
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
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  recMetaText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#247B74',
    marginTop: 2,
    marginBottom: 4,
  },
  recDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  startPracticeBtn: {
    backgroundColor: '#247B74',
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  startPracticeBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
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
    borderRadius: 12,
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
