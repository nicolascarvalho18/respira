import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
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
import { useDailyRoutineStore } from '../../src/store/dailyRoutineStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { useToast } from '../../src/components/ui/Toast';
import { getGreeting, formatHeaderDate, formatDateTime } from '../../src/utils/date';
import { getPracticeImage } from '../../src/utils/practiceImages';
import { PlannedExercise, DailyExercise } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();
  const { width } = useWindowDimensions();
  const { showToast } = useToast();

  const isSmallScreen = width < 360;
  const avatarSize = isDesktop ? 64 : 56;
  const greetingFontSize = isDesktop ? 26 : isSmallScreen ? 21 : 24;

  const { records, updateExerciseStatus, fetchRecords } = useMoodStore();
  const { practices, toggleFavorite: togglePracticeFavorite, fetchPractices } = usePracticeStore();
  const { routine: dailyRoutine, fetchDailyRoutine, toggleExerciseCompletion } = useDailyRoutineStore();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Início — Respira';
    }
    fetchRecords(user?.id);
    fetchPractices(user?.id);
    fetchDailyRoutine(user?.id);
  }, [user?.id, fetchRecords, fetchPractices, fetchDailyRoutine]);

  const lastRecord = records.length > 0 ? records[0] : null;
  const plannedExercises: PlannedExercise[] = lastRecord?.plannedExercises || [];

  const recommendedPractice =
    practices.find((p) => p.id === 'practice-breathing-478') || practices[0] || null;

  // Formatação de data natural e acolhedora: "Sexta-feira, 28 de agosto"
  const formattedToday = useMemo(() => {
    try {
      return formatHeaderDate(new Date());
    } catch {
      return 'Hoje';
    }
  }, []);

  const userName = user?.name || 'Nicolas';
  const userInitial = userName.trim().charAt(0).toUpperCase() || 'N';

  // Alternar conclusão de exercício da rotina diária
  const handleToggleDailyExercise = async (exerciseId: string) => {
    try {
      const result = await toggleExerciseCompletion(exerciseId, user?.id);
      if (result.isAllCompleted) {
        showToast({
          message: '🎉 Rotina de hoje concluída! Ótimo momento de autocuidado.',
          type: 'success',
        });
      } else {
        showToast({
          message:
            result.status === 'completed'
              ? 'Exercício marcado como concluído!'
              : 'Exercício marcado como pendente.',
          type: 'info',
        });
      }
    } catch {
      showToast({
        message: 'Não foi possível atualizar o exercício.',
        type: 'error',
      });
    }
  };

  // Alternar favorito da recomendação diária com feedback
  const handleToggleRecommendationFavorite = async () => {
    if (!recommendedPractice) return;
    if (!user?.id) {
      showToast({
        message: 'Entre na sua conta para salvar favoritos.',
        type: 'info',
      });
      return;
    }
    try {
      const res = await togglePracticeFavorite(recommendedPractice.id, user.id);
      showToast({
        message: res?.message || (recommendedPractice.isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos'),
        type: 'info',
      });
    } catch {
      showToast({
        message: 'Não foi possível atualizar os favoritos.',
        type: 'error',
      });
    }
  };

  // Alternar conclusão de atividade do dia planejada pelo humor
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
    <AppShell>
      {/* 1. Cabeçalho Superior Compacto e Natural */}
      <View style={styles.topHeader}>
        <View style={styles.userGreetingRow}>
          {/* Avatar / Foto */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/profile')}
            accessibilityRole="link"
            accessibilityLabel={`Perfil de ${userName}`}
            style={[
              styles.avatarContainer,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                borderColor: isDark ? '#334155' : 'transparent',
                borderWidth: isDark ? 1.5 : 0,
              },
            ]}
          >
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                accessibilityLabel={`Foto de perfil de ${userName}`}
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                  backgroundColor: '#EDF7F5',
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.avatarCircle,
                  {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    backgroundColor: '#247B74',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarLetter,
                    { fontSize: isDesktop ? 26 : 22 },
                  ]}
                >
                  {userInitial}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Saudação e Data */}
          <View style={styles.headerTextGroup}>
            <Text
              accessibilityRole="header"
              aria-level={1}
              numberOfLines={1}
              style={[
                styles.greetingTitle,
                {
                  fontSize: greetingFontSize,
                  color: isDark ? '#FFFFFF' : '#17332F',
                },
              ]}
            >
              {getGreeting(userName)}
            </Text>
            <Text
              style={[
                styles.dateSubtitle,
                { color: isDark ? '#F1F5F9' : '#5F706C' },
              ]}
            >
              {formattedToday}
            </Text>
          </View>
        </View>

        {/* Botão Apoio Imediato Abaixo */}
        <TouchableOpacity
          onPress={() => router.push('/support')}
          activeOpacity={0.85}
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
          <Heart size={14} color="#D87556" strokeWidth={1.8} aria-hidden={true} />
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

      {/* 5. Exercícios de Hoje — Rotina Diária de 3 Atividades */}
      <View style={styles.dailyExercisesSectionWrap}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
            >
              Exercícios de hoje
            </Text>
            <Text style={[styles.sectionSubTitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
              Rotina curta de 3 momentos para equilíbrio e bem-estar
            </Text>
          </View>

          <View
            style={[
              styles.routineProgressBadge,
              { backgroundColor: isDark ? '#1C3833' : '#EDF7F5' },
            ]}
          >
            <Text style={[styles.routineProgressBadgeText, { color: '#247B74' }]}>
              {dailyRoutine.completedCount} de {dailyRoutine.totalCount} concluídos
            </Text>
          </View>
        </View>

        {/* Barra de Progresso Diária */}
        <View style={styles.routineProgressBarContainer}>
          <View
            style={[
              styles.routineProgressBarTrack,
              { backgroundColor: isDark ? '#2D3748' : '#DFE4E1' },
            ]}
          >
            <View
              style={[
                styles.routineProgressBarFill,
                {
                  width: `${Math.min(
                    100,
                    Math.round(
                      (dailyRoutine.completedCount / (dailyRoutine.totalCount || 1)) * 100
                    )
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Banner comemorativo quando todas as 3 atividades forem concluídas */}
        {dailyRoutine.isAllCompleted && (
          <View
            style={[
              styles.allCompletedBanner,
              {
                backgroundColor: isDark ? '#1C3833' : '#EDF7F5',
                borderColor: isDark ? '#2D5950' : '#BFE3DC',
              },
            ]}
          >
            <CheckCircle2 size={20} color="#247B74" strokeWidth={2} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.allCompletedTitle, { color: isDark ? '#FFFFFF' : '#17332F' }]}>
                Rotina de hoje concluída
              </Text>
              <Text style={[styles.allCompletedDesc, { color: isDark ? '#A3D0C7' : '#47635D' }]}>
                Parabéns por dedicar este momento ao seu autocuidado e bem-estar.
              </Text>
            </View>
          </View>
        )}

        {/* Grade/Lista dos 3 Exercícios Diários */}
        <View style={styles.dailyExercisesList}>
          {dailyRoutine.exercises.map((exercise) => {
            const isCompleted = exercise.status === 'completed';
            const isInProgress = exercise.status === 'in_progress';

            const TypeIcon =
              exercise.type === 'breathing'
                ? Wind
                : exercise.type === 'mindfulness'
                ? Leaf
                : Smile;

            const typeLabel =
              exercise.type === 'breathing'
                ? 'Respiração'
                : exercise.type === 'mindfulness'
                ? 'Atenção plena'
                : 'Reflexão';

            const statusLabel = isCompleted
              ? 'Concluído'
              : isInProgress
              ? 'Em andamento'
              : 'Não iniciado';

            return (
              <View
                key={exercise.id}
                style={[
                  styles.dailyExerciseCard,
                  {
                    backgroundColor: isDark ? colors.surface : '#FFFFFF',
                    borderColor: isCompleted
                      ? '#247B74'
                      : isDark
                      ? colors.border
                      : '#E0E5E2',
                  },
                ]}
              >
                <View style={styles.dailyExerciseTopRow}>
                  {/* Ícone com fundo temático */}
                  <View
                    style={[
                      styles.exerciseIconCircle,
                      {
                        backgroundColor: isCompleted
                          ? '#247B74'
                          : isDark
                          ? '#1C3833'
                          : '#EDF7F5',
                      },
                    ]}
                  >
                    <TypeIcon
                      size={18}
                      color={isCompleted ? '#FFFFFF' : '#247B74'}
                      strokeWidth={2}
                      aria-hidden={true}
                    />
                  </View>

                  <View style={styles.exerciseHeaderInfo}>
                    <View style={styles.exercisePillsRow}>
                      <View
                        style={[
                          styles.exerciseTypePill,
                          { backgroundColor: isDark ? '#2D3748' : '#F0F4F3' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.exerciseTypePillText,
                            { color: isDark ? colors.textMuted : '#526662' },
                          ]}
                        >
                          {typeLabel}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.exerciseDurationPill,
                          { backgroundColor: isDark ? '#2D3748' : '#F0F4F3' },
                        ]}
                      >
                        <Clock size={11} color="#247B74" style={{ marginRight: 4 }} />
                        <Text style={styles.exerciseDurationText}>
                          {exercise.durationLabel}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.exerciseDifficultyPill,
                          { backgroundColor: isDark ? '#2D3748' : '#F0F4F3' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.exerciseDifficultyText,
                            { color: isDark ? colors.textMuted : '#526662' },
                          ]}
                        >
                          {exercise.difficulty}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.exerciseStatusPill,
                          isCompleted && { backgroundColor: '#247B74' },
                          isInProgress && { backgroundColor: '#D87556' },
                          !isCompleted &&
                            !isInProgress && {
                              backgroundColor: isDark ? '#1C2926' : '#ECEFEF',
                            },
                        ]}
                      >
                        <Text
                          style={[
                            styles.exerciseStatusPillText,
                            isCompleted || isInProgress
                              ? { color: '#FFFFFF', fontWeight: '700' }
                              : { color: isDark ? '#94A3B8' : '#68736F' },
                          ]}
                        >
                          {statusLabel}
                        </Text>
                      </View>
                    </View>

                    <Text
                      accessibilityRole="header"
                      aria-level={3}
                      style={[
                        styles.exerciseTitle,
                        {
                          color: isDark ? colors.text : '#1F2927',
                          textDecorationLine: isCompleted ? 'line-through' : 'none',
                          opacity: isCompleted ? 0.75 : 1,
                        },
                      ]}
                    >
                      {exercise.title}
                    </Text>

                    <Text
                      style={[
                        styles.exerciseDesc,
                        { color: isDark ? colors.textMuted : '#68736F' },
                      ]}
                    >
                      {exercise.description}
                    </Text>
                  </View>
                </View>

                {/* Linha de Ações: Botão Iniciar e Checkbox Concluir */}
                <View style={styles.exerciseFooterRow}>
                  <TouchableOpacity
                    onPress={() => router.push(exercise.actionUrl as any)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Iniciar ${exercise.title}`}
                    style={[
                      styles.exerciseActionBtn,
                      isCompleted && { backgroundColor: isDark ? '#2D3748' : '#EAEFECE0' },
                    ]}
                  >
                    <Play
                      size={12}
                      color={isCompleted ? (isDark ? '#CBD5E1' : '#475569') : '#FFFFFF'}
                      fill={isCompleted ? (isDark ? '#CBD5E1' : '#475569') : '#FFFFFF'}
                      aria-hidden={true}
                    />
                    <Text
                      style={[
                        styles.exerciseActionBtnText,
                        isCompleted && { color: isDark ? '#CBD5E1' : '#475569' },
                      ]}
                    >
                      {isCompleted ? 'Refazer' : isInProgress ? 'Continuar' : 'Iniciar'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleToggleDailyExercise(exercise.id)}
                    activeOpacity={0.75}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isCompleted }}
                    accessibilityLabel={
                      isCompleted
                        ? `Desmarcar ${exercise.title}`
                        : `Marcar ${exercise.title} como concluído`
                    }
                    style={[
                      styles.exerciseToggleCheckBtn,
                      isCompleted && {
                        backgroundColor: '#247B74',
                        borderColor: '#247B74',
                      },
                      !isCompleted && {
                        borderColor: isDark ? colors.border : '#CBD3D0',
                      },
                    ]}
                  >
                    {isCompleted ? (
                      <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                    ) : (
                      <Circle size={14} color={isDark ? colors.textMuted : '#8F9B97'} />
                    )}
                    <Text
                      style={[
                        styles.exerciseToggleCheckText,
                        isCompleted
                          ? { color: '#FFFFFF', fontWeight: '700' }
                          : { color: isDark ? colors.textMuted : '#5F736E' },
                      ]}
                    >
                      {isCompleted ? 'Concluído' : 'Marcar concluído'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 6. Recomendação para Hoje — Card Editorial Realista */}
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
                  onPress={handleToggleRecommendationFavorite}
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
  // 1. Cabeçalho Superior Compacto e Natural
  topHeader: {
    marginBottom: 24,
    paddingTop: 8,
    gap: 12,
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerTextGroup: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  greetingTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  dateSubtitle: {
    fontSize: 14.5,
    fontWeight: '400',
    marginTop: 4,
    lineHeight: 20,
  },
  sosHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  heroQuestion: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  lastRecordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 18,
  },
  lastRecordTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  lastRecordMeta: {
    fontSize: 12.5,
    marginTop: 2,
    lineHeight: 17,
  },
  primaryActionButton: {
    backgroundColor: '#247B74',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#247B74',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  historyLinkBtn: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  historyLinkText: {
    color: '#247B74',
    fontSize: 13.5,
    fontWeight: '600',
  },

  // 3. Atividades do Dia
  dailyActivitiesSection: {
    marginBottom: 24,
  },
  sectionHeaderWrap: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubTitle: {
    fontSize: 13,
    marginTop: 2,
  },
  activitiesCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
    marginBottom: 3,
  },
  activityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activityMetaText: {
    fontSize: 12,
  },
  activityActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityStartBtn: {
    backgroundColor: '#247B74',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
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
  quickActionsGridDesktop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionsGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  quickActionCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    minHeight: 110,
    justifyContent: 'center',
  },
  quickActionCardMobile: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    minHeight: 110,
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

  // 5. Exercícios de Hoje (Rotina Diária)
  dailyExercisesSectionWrap: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  routineProgressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  routineProgressBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  routineProgressBarContainer: {
    width: '100%',
    marginBottom: 12,
  },
  routineProgressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  routineProgressBarFill: {
    height: '100%',
    backgroundColor: '#247B74',
    borderRadius: 3,
  },
  allCompletedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  allCompletedTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  allCompletedDesc: {
    fontSize: 12.5,
    marginTop: 2,
    lineHeight: 16,
  },
  dailyExercisesList: {
    gap: 10,
  },
  dailyExerciseCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  dailyExerciseTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  exerciseIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  exerciseHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },
  exercisePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  exerciseTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exerciseTypePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  exerciseDurationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exerciseDurationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#247B74',
  },
  exerciseDifficultyPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exerciseDifficultyText: {
    fontSize: 11,
  },
  exerciseStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exerciseStatusPillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  exerciseTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  exerciseDesc: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  exerciseFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EAEFECE0',
  },
  exerciseActionBtn: {
    backgroundColor: '#247B74',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  exerciseActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  exerciseToggleCheckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  exerciseToggleCheckText: {
    fontSize: 12,
  },

  // 6. Recomendação para Hoje
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
