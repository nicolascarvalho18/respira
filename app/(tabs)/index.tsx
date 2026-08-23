import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Wind,
  Smile,
  Bot,
  Heart,
  Bookmark,
  CheckCircle2,
  Play,
  Layers,
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
import { getGreeting, formatDate, getRelativeDateLabel } from '../../src/utils/date';
import { BotanicalLeaves } from '../../src/components/illustrations/BotanicalLeaves';
import { PeacefulLandscape } from '../../src/components/illustrations/PeacefulLandscape';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { isDesktop, isTablet } = useBreakpoint();

  const { records } = useMoodStore();
  const { practices, toggleFavorite: togglePracticeFavorite } = usePracticeStore();

  const lastRecord = records.length > 0 ? records[0] : null;
  const recommendedPractice = practices.find((p) => p.id === 'practice-breathing-478') || practices[0] || null;

  const quickActions = [
    {
      title: 'Respirar',
      desc: 'Técnica 4-7-8',
      icon: Wind,
      color: '#2F7F7C',
      bg: isDark ? colors.surfaceSecondary : '#E2F4F2',
      onPress: () => router.push('/practices/breathing'),
    },
    {
      title: 'Relaxar',
      desc: 'Relaxamento guiado',
      icon: Layers,
      color: '#2F7F7C',
      bg: isDark ? colors.surfaceSecondary : '#E2F4ED',
      onPress: () => router.push('/practices/relaxation' as any),
    },
    {
      title: 'Humor',
      desc: 'Check-in do seu momento',
      icon: Smile,
      color: '#D98968',
      bg: isDark ? colors.surfaceSecondary : '#FDECE5',
      onPress: () => router.push('/mood/new'),
    },
    {
      title: 'Assistente IA',
      desc: 'Acolhimento e orientações',
      icon: Bot,
      color: '#426E91',
      bg: isDark ? colors.surfaceSecondary : '#E8EEF5',
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
          borderColor: '#E8A58C',
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <HeartHandshake size={15} color="#D98968" style={{ marginRight: 6 }} />
          <Text style={[styles.sideCardHeading, { color: '#D98968' }]}>Precisa de Escuta?</Text>
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
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#D98968' }}>
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

  const userName = user?.name || 'Ana';
  const userInitial = userName.trim().charAt(0).toUpperCase() || 'A';

  return (
    <AppShell rightPanel={renderDesktopRightPanel()}>
      {/* 1. Cabeçalho Superior Redesenhado */}
      <View style={styles.topHeader}>
        <View style={styles.userGreetingRow}>
          <View style={[styles.avatarCircle, { backgroundColor: '#173D3B' }]}>
            <Text style={styles.avatarLetter}>{userInitial}</Text>
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.greetingTitle, { color: '#173D3B' }]}>
              {getGreeting(userName)}
            </Text>
            <Text style={[styles.dateSubtitle, { color: '#607174' }]}>
              {formatDate(new Date().toISOString())}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/support')}
          accessibilityRole="button"
          accessibilityLabel="Apoio imediato e escuta gratuita"
          style={[
            styles.sosHeaderBtn,
            {
              backgroundColor: isDark ? '#3D251C' : '#FFF5F0',
              borderColor: '#F2B5A0',
            },
          ]}
        >
          <Heart size={15} color="#D98968" strokeWidth={2.2} />
          <Text style={[styles.sosHeaderText, { color: '#D98968' }]}>Apoio imediato</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Card "Momento atual" com Ilustração Botânica */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
            borderColor: isDark ? colors.border : '#D8EBE4',
          },
        ]}
      >
        {/* Ilustração Botânica sutil à direita */}
        <BotanicalLeaves
          width={135}
          height={145}
          style={styles.botanicalBg}
        />

        <View style={styles.heroCardContent}>
          {/* Badge MOMENTO ATUAL */}
          <View style={[styles.heroBadge, { backgroundColor: '#D4EAE3' }]}>
            <Text style={styles.heroBadgeText}>MOMENTO ATUAL</Text>
          </View>

          {/* Pergunta Principal */}
          <Text style={[styles.heroQuestion, { color: '#173D3B' }]}>
            Como você está agora?
          </Text>

          {/* Último Registro */}
          <View style={styles.lastRecordRow}>
            <CheckCircle2 size={16} color="#2F7F7C" style={{ marginRight: 6, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.lastRecordTitle, { color: '#173D3B' }]}>
                Último registro: {lastRecord ? getRelativeDateLabel(lastRecord.createdAt) : 'Nenhum ainda hoje'}
              </Text>
              <Text style={[styles.lastRecordMeta, { color: '#567571' }]}>
                {lastRecord
                  ? `(Humor ${lastRecord.mood}/5 • Ansiedade ${lastRecord.anxietyLevel}/10)`
                  : 'Faça um check-in para registrar suas emoções'}
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
            <Smile size={18} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.primaryActionText}>Registrar meu momento</Text>
          </TouchableOpacity>

          {/* Link para o Diário */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/diary')}
            accessibilityRole="link"
            accessibilityLabel="Ver histórico de evolução"
            style={styles.historyLinkBtn}
          >
            <Text style={styles.historyLinkText}>Ver histórico de evolução →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Ações Rápidas (4 Cards Compactos) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: '#173D3B' }]}>Ações rápidas</Text>
      </View>

      {isDesktop ? (
        <View style={styles.quickActionsGridDesktop}>
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
                  styles.quickActionCard,
                  {
                    backgroundColor: isDark ? colors.surface : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#EEF3F1',
                    flex: 1,
                  },
                ]}
              >
                <View style={[styles.quickActionIconCircle, { backgroundColor: action.bg }]}>
                  <Icon size={20} color={action.color} strokeWidth={2} />
                </View>
                <Text style={[styles.quickActionTitle, { color: '#173D3B' }]}>{action.title}</Text>
                <Text style={[styles.quickActionDesc, { color: '#687E7B' }]}>{action.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.quickActionsRowMobile}>
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
                  styles.quickActionCard,
                  {
                    backgroundColor: isDark ? colors.surface : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#EEF3F1',
                  },
                ]}
              >
                <View style={[styles.quickActionIconCircle, { backgroundColor: action.bg }]}>
                  <Icon size={20} color={action.color} strokeWidth={2} />
                </View>
                <Text style={[styles.quickActionTitle, { color: '#173D3B' }]}>{action.title}</Text>
                <Text style={[styles.quickActionDesc, { color: '#687E7B' }]}>{action.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* 4. Recomendação para Hoje */}
      {recommendedPractice && (
        <View style={styles.recSectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: '#173D3B' }]}>
              Recomendação para hoje
            </Text>
          </View>

          <View
            style={[
              styles.recommendationCard,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: isDark ? colors.border : '#EEF3F1',
              },
            ]}
          >
            {/* Ilustração Artística da Paisagem */}
            <PeacefulLandscape
              width={88}
              height={88}
              borderRadius={14}
              style={{ alignSelf: 'center' }}
            />

            {/* Conteúdo da Recomendação */}
            <View style={styles.recContentCol}>
              <View style={styles.recTopLine}>
                <Text style={[styles.recTitle, { color: '#173D3B' }]}>
                  {recommendedPractice.title}
                </Text>
                <TouchableOpacity
                  onPress={() => togglePracticeFavorite(recommendedPractice.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Favoritar prática recomendada"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Bookmark
                    size={18}
                    color="#2F7F7C"
                    fill={recommendedPractice.isFavorite ? '#2F7F7C' : 'transparent'}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.recMetaText}>
                {recommendedPractice.durationMinutes} min • {recommendedPractice.level}
              </Text>

              <Text style={[styles.recDesc, { color: '#687E7B' }]} numberOfLines={2}>
                {recommendedPractice.description}
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/practices/breathing')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Iniciar ${recommendedPractice.title}`}
                style={styles.startPracticeBtn}
              >
                <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
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
  // 1. Header Superior
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 4,
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '800',
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dateSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  sosHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  sosHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // 2. Card "Momento Atual"
  heroCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  botanicalBg: {
    position: 'absolute',
    right: -8,
    top: 10,
    zIndex: 0,
  },
  heroCardContent: {
    zIndex: 1,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2F7F7C',
    letterSpacing: 0.6,
  },
  heroQuestion: {
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  lastRecordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    maxWidth: '75%',
  },
  lastRecordTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  lastRecordMeta: {
    fontSize: 12,
    marginTop: 1,
  },
  primaryActionButton: {
    backgroundColor: '#2F7F7C',
    borderRadius: 14,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2F7F7C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  historyLinkBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  historyLinkText: {
    color: '#2F7F7C',
    fontSize: 13,
    fontWeight: '700',
  },

  // 3. Ações Rápidas
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  quickActionsRowMobile: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  quickActionsGridDesktop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  quickActionDesc: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 13,
  },

  // 4. Recomendação para Hoje
  recSectionWrap: {
    marginBottom: 16,
  },
  recommendationCard: {
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  recContentCol: {
    flex: 1,
  },
  recTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  recMetaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F7F7C',
    marginTop: 2,
    marginBottom: 4,
  },
  recDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  startPracticeBtn: {
    backgroundColor: '#2F7F7C',
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  startPracticeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Desktop Side Panel
  sidePanelWrap: {
    gap: 12,
  },
  sidePanelTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  sideCardHeading: {
    fontSize: 13,
    fontWeight: '700',
  },
  sideCardText: {
    fontSize: 12,
    lineHeight: 17,
  },
});
