import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  ChevronDown,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  TrendingUp,
  SlidersHorizontal,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Play,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { AppButton } from '../../src/components/ui/AppButton';
import { MoodLineChart } from '../../src/components/mood/MoodLineChart';
import { CorrelationInsightsCard } from '../../src/components/mood/CorrelationInsightsCard';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { useToast } from '../../src/components/ui/Toast';
import { useMoodStore } from '../../src/store/moodStore';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useTheme } from '../../src/hooks/useTheme';
import { formatDate, formatTime } from '../../src/utils/date';
import { calculateMoodStats } from '../../src/utils/stats';
import { correlationInsightsService } from '../../src/services/analytics/correlationInsightsService';
import { MoodRecord } from '../../src/types';

export default function DiaryHistoryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Histórico do Diário — Respira';
    }
  }, []);

  const { records, deleteRecord, updateExerciseStatus } = useMoodStore();
  const { practices } = usePracticeStore();

  const [selectedFilterDays, setSelectedFilterDays] = useState<7 | 30 | 90>(7);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const stats = calculateMoodStats(records);
  const insights = correlationInsightsService.calculateInsights(records, practices);

  const handleDelete = async () => {
    if (!recordToDelete) return;
    try {
      await deleteRecord(recordToDelete);
      showToast({ message: 'Registro removido.', type: 'success' });
      setRecordToDelete(null);
    } catch {
      showToast({ message: 'Erro ao remover registro.', type: 'error' });
    }
  };

  const handleToggleExercise = async (recordId: string, exId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await updateExerciseStatus(recordId, exId, nextStatus);
      showToast({
        message: nextStatus === 'completed' ? 'Atividade concluída!' : 'Atividade marcada como pendente.',
        type: 'success',
      });
    } catch {
      showToast({ message: 'Erro ao atualizar atividade.', type: 'error' });
    }
  };

  const getMoodIcon = (score: number) => {
    if (score >= 4) return <Smile size={20} color="#2F7F7C" />;
    if (score === 3) return <Meh size={20} color="#D98968" />;
    return <Frown size={20} color="#D9534F" />;
  };

  const getMoodLabel = (score: number) => {
    const map: Record<number, string> = {
      5: 'Muito bem',
      4: 'Bem',
      3: 'Neutro',
      2: 'Difícil',
      1: 'Muito difícil',
    };
    return map[score] || 'Neutro';
  };

  return (
    <AppShell>
      <PageHeader
        showBack
        title="Histórico do Momento Atual"
        subtitle="Seus registros emocionais e atividades do dia em ordem cronológica"
      />

      {/* 1. Métricas Gerais em Destaque */}
      <View style={styles.metricsRow}>
        <Card
          variant="bordered"
          style={[
            styles.metricCard,
            { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
          ]}
        >
          <Text style={[styles.metricLabel, { color: isDark ? colors.textMuted : '#667775' }]}>
            Média de Humor
          </Text>
          <Text style={[styles.metricValue, { color: '#2F7F7C' }]}>
            {stats.averageMood > 0 ? stats.averageMood.toFixed(1) : '—'}
            <Text style={{ fontSize: 12, color: isDark ? colors.textMuted : '#8C9E9B' }}> / 5</Text>
          </Text>
        </Card>

        <Card
          variant="bordered"
          style={[
            styles.metricCard,
            { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
          ]}
        >
          <Text style={[styles.metricLabel, { color: isDark ? colors.textMuted : '#667775' }]}>
            Ansiedade Média
          </Text>
          <Text style={[styles.metricValue, { color: '#D98968' }]}>
            {stats.averageAnxiety > 0 ? stats.averageAnxiety.toFixed(1) : '—'}
            <Text style={{ fontSize: 12, color: isDark ? colors.textMuted : '#8C9E9B' }}> / 10</Text>
          </Text>
        </Card>

        <Card
          variant="bordered"
          style={[
            styles.metricCard,
            { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
          ]}
        >
          <Text style={[styles.metricLabel, { color: isDark ? colors.textMuted : '#667775' }]}>
            Total Check-ins
          </Text>
          <Text style={[styles.metricValue, { color: isDark ? colors.text : '#173D3B' }]}>
            {stats.totalCheckins}
          </Text>
        </Card>
      </View>

      {/* 2. Filtros de Período e Gráfico */}
      <Card
        variant="bordered"
        style={[
          styles.chartCard,
          { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
        ]}
      >
        <View style={styles.chartHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={18} color="#2F7F7C" />
            <Text style={[styles.chartTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Evolução no Período
            </Text>
          </View>

          <View
            style={styles.filterPills}
            accessibilityRole="radiogroup"
            aria-label="Filtrar período do gráfico"
          >
            {([7, 30, 90] as const).map((days) => {
              const isSelected = selectedFilterDays === days;
              const periodLabel = days === 7 ? 'Últimos 7 dias' : days === 30 ? 'Últimos 30 dias' : 'Últimos 90 dias';

              return (
                <TouchableOpacity
                  key={days}
                  onPress={() => setSelectedFilterDays(days)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected, selected: isSelected }}
                  aria-pressed={isSelected}
                  accessibilityLabel={periodLabel}
                  {...(Platform.OS === 'web' ? ({ type: 'button' } as any) : {})}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isSelected ? '#2F7F7C' : isDark ? colors.surfaceSecondary : '#F2F6F5',
                      borderColor: isSelected ? '#2F7F7C' : isDark ? colors.border : '#DCE5E2',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      {
                        color: isSelected ? '#FFFFFF' : isDark ? colors.text : '#173D3B',
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {days}d
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <MoodLineChart records={records} days={selectedFilterDays} />
      </Card>

      {/* 3. Insights e Correlações */}
      {insights.length > 0 && (
        <View style={{ marginVertical: 8 }}>
          <CorrelationInsightsCard insights={insights} />
        </View>
      )}

      {/* 4. Lista Completa de Registros Anteriores em Ordem Cronológica */}
      <View style={styles.recordsSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: isDark ? colors.text : '#173D3B' }]}>
            Registros do Momento Atual
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/mood/new')}
            style={styles.newCheckinBtn}
          >
            <Plus size={14} color="#FFFFFF" />
            <Text style={styles.newCheckinBtnText}>Novo registro</Text>
          </TouchableOpacity>
        </View>

        {records.length === 0 ? (
          <Card
            variant="bordered"
            style={[
              styles.emptyCard,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
            ]}
          >
            <Smile size={36} color="#2F7F7C" style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Nenhum registro no momento atual ainda
            </Text>
            <Text style={[styles.emptyDesc, { color: isDark ? colors.textMuted : '#667775' }]}>
              Faça seu primeiro check-in de humor para começar a acompanhar sua evolução emocional e exercícios do dia.
            </Text>
            <AppButton
              title="Registrar meu momento agora"
              leftIcon={<Plus size={18} color="#FFFFFF" />}
              onPress={() => router.push('/mood/new')}
              size="md"
              style={{ marginTop: 14 }}
            />
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {records.map((rec) => {
              const isExpanded = expandedRecordId === rec.id;

              return (
                <Card
                  key={rec.id}
                  variant="bordered"
                  style={[
                    styles.recordItemCard,
                    { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                    style={styles.recordRowTop}
                    activeOpacity={0.7}
                  >
                    <View style={styles.recordMoodCol}>
                      {getMoodIcon(rec.mood)}
                      <View>
                        <Text style={[styles.recordDateText, { color: isDark ? colors.text : '#173D3B' }]}>
                          {formatDate(rec.createdAt)} às {formatTime(rec.createdAt)}
                        </Text>
                        <Text style={[styles.recordMoodText, { color: isDark ? colors.textMuted : '#667775' }]}>
                          Humor: <Text style={{ fontWeight: '700', color: '#2F7F7C' }}>{getMoodLabel(rec.mood)}</Text> • Ansiedade: <Text style={{ fontWeight: '700', color: '#D98968' }}>{rec.anxietyLevel}/10</Text>
                        </Text>
                      </View>
                    </View>

                    {isExpanded ? (
                      <ChevronDown size={18} color="#8C9E9B" />
                    ) : (
                      <ChevronRight size={18} color="#8C9E9B" />
                    )}
                  </TouchableOpacity>

                  {/* Conteúdo Expandido com Emoções, Atividades e Exercícios do Dia */}
                  {isExpanded && (
                    <View style={[styles.expandedBody, { borderTopColor: isDark ? colors.border : '#EBF1EF' }]}>
                      {/* Emoções */}
                      {rec.emotions && rec.emotions.length > 0 && (
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: isDark ? colors.textMuted : '#667775' }]}>
                            Emoções registradas:
                          </Text>
                          <View style={styles.tagsWrap}>
                            {rec.emotions.map((emo, idx) => (
                              <View
                                key={idx}
                                style={[
                                  styles.tagBadge,
                                  { backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF' },
                                ]}
                              >
                                <Text style={styles.tagText}>{emo}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Atividades do Momento */}
                      {rec.activities && rec.activities.length > 0 && (
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: isDark ? colors.textMuted : '#667775' }]}>
                            Atividades anteriores:
                          </Text>
                          <View style={styles.tagsWrap}>
                            {rec.activities.map((act, idx) => (
                              <View
                                key={idx}
                                style={[
                                  styles.tagBadge,
                                  { backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5' },
                                ]}
                              >
                                <Text style={[styles.tagText, { color: '#567571' }]}>{act}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Exercícios Planejados para o Dia */}
                      {rec.plannedExercises && rec.plannedExercises.length > 0 && (
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: isDark ? colors.text : '#173D3B', fontWeight: '700' }]}>
                            🌿 Exercícios planejados para o dia:
                          </Text>
                          <View style={{ gap: 6, marginTop: 4 }}>
                            {rec.plannedExercises.map((ex) => {
                              const isCompleted = ex.status === 'completed';
                              return (
                                <View
                                  key={ex.id}
                                  style={[
                                    styles.plannedExCard,
                                    {
                                      backgroundColor: isCompleted
                                        ? isDark
                                          ? colors.surfaceSecondary
                                          : '#E7F3EF'
                                        : isDark
                                        ? colors.surfaceSecondary
                                        : '#F8FAFA',
                                      borderColor: isCompleted ? '#2F7F7C' : isDark ? colors.border : '#EBF1EF',
                                    },
                                  ]}
                                >
                                  <TouchableOpacity
                                    onPress={() => handleToggleExercise(rec.id, ex.id, ex.status)}
                                    style={styles.exToggleRow}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2 size={18} color="#2F7F7C" />
                                    ) : (
                                      <Circle size={18} color="#8C9E9B" />
                                    )}
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                      <Text
                                        style={[
                                          styles.exItemTitle,
                                          isCompleted && { textDecorationLine: 'line-through', color: '#2F7F7C' },
                                          { color: isDark ? colors.text : '#173D3B' },
                                        ]}
                                      >
                                        {ex.title} ({ex.durationMinutes} min)
                                      </Text>
                                      <Text style={[styles.exItemCategory, { color: isDark ? colors.textMuted : '#667775' }]}>
                                        {ex.category} • Status: {isCompleted ? 'Concluído' : 'Pendente'}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/practices')}
                                    style={styles.exOpenBtn}
                                  >
                                    <Play size={11} color="#2F7F7C" fill="#2F7F7C" />
                                    <Text style={styles.exOpenBtnText}>Abrir</Text>
                                  </TouchableOpacity>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      )}

                      {/* Observações */}
                      {rec.notes ? (
                        <View
                          style={[
                            styles.notesBox,
                            { backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFA' },
                          ]}
                        >
                          <Text style={[styles.notesLabel, { color: isDark ? colors.textMuted : '#667775' }]}>
                            Observações do usuário:
                          </Text>
                          <Text style={[styles.notesContent, { color: isDark ? colors.text : '#173D3B' }]}>
                            {rec.notes}
                          </Text>
                        </View>
                      ) : null}

                      {/* Ações: Editar e Excluir */}
                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          onPress={() => setRecordToDelete(rec.id)}
                          style={styles.smallDeleteBtn}
                        >
                          <Trash2 size={13} color="#D9534F" />
                          <Text style={styles.smallDeleteText}>Excluir registro</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        )}
      </View>

      {/* Confirmação de Exclusão */}
      <ConfirmationModal
        visible={!!recordToDelete}
        title="Excluir registro de humor?"
        message="Tem certeza de que deseja remover este check-in? Esta ação não pode ser desfeita."
        confirmTitle="Excluir"
        isDestructive
        cancelTitle="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setRecordToDelete(null)}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  chartCard: {
    padding: 16,
    borderRadius: 18,
    marginVertical: 8,
    borderWidth: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  filterPills: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
  },
  recordsSection: {
    marginTop: 16,
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  newCheckinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2F7F7C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  newCheckinBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  recordItemCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  recordRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordMoodCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  recordDateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  recordMoodText: {
    fontSize: 12,
    marginTop: 2,
  },
  expandedBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  detailRow: {
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2F7F7C',
  },
  plannedExCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  exToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exItemTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  exItemCategory: {
    fontSize: 10,
    marginTop: 1,
  },
  exOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E7F3EF',
    borderRadius: 6,
  },
  exOpenBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2F7F7C',
  },
  notesBox: {
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  notesContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  smallDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallDeleteText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D9534F',
  },
});
