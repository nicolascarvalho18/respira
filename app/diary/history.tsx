import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
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

  const { records, deleteRecord } = useMoodStore();
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

  const getMoodIcon = (score: number) => {
    if (score >= 4) return <Smile size={18} color={colors.primary} />;
    if (score === 3) return <Meh size={18} color={colors.warning} />;
    return <Frown size={18} color={colors.error} />;
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
        title="Histórico de Evolução"
        subtitle="Acompanhe sua trajetória e padrões emocionais"
      />

      {/* 1. Métricas Gerais em Destaque */}
      <View style={styles.metricsRow}>
        <Card variant="bordered" style={styles.metricCard}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Média de Humor</Text>
          <Text style={[styles.metricValue, { color: colors.primary }]}>
            {stats.averageMood > 0 ? stats.averageMood.toFixed(1) : '—'}
            <Text style={{ fontSize: 13, color: colors.textMuted }}> / 5</Text>
          </Text>
        </Card>

        <Card variant="bordered" style={styles.metricCard}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Nível de Ansiedade</Text>
          <Text style={[styles.metricValue, { color: colors.secondaryDark }]}>
            {stats.averageAnxiety > 0 ? stats.averageAnxiety.toFixed(1) : '—'}
            <Text style={{ fontSize: 13, color: colors.textMuted }}> / 10</Text>
          </Text>
        </Card>

        <Card variant="bordered" style={styles.metricCard}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total de Check-ins</Text>
          <Text style={[styles.metricValue, { color: colors.accentDark }]}>
            {stats.totalCheckins}
          </Text>
        </Card>
      </View>

      {/* 2. Filtros de Período e Gráfico */}
      <Card variant="bordered" style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={18} color={colors.primary} />
            <Text style={[styles.chartTitle, { color: colors.text }]}>Evolução no Período</Text>
          </View>

          <View style={styles.filterPills}>
            {([7, 30, 90] as const).map((days) => (
              <TouchableOpacity
                key={days}
                onPress={() => setSelectedFilterDays(days)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: selectedFilterDays === days ? colors.primary : 'transparent',
                    borderColor: selectedFilterDays === days ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: selectedFilterDays === days ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: selectedFilterDays === days ? '700' : '500',
                    },
                  ]}
                >
                  {days}d
                </Text>
              </TouchableOpacity>
            ))}
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

      {/* 4. Lista Completa de Registros Anteriores */}
      <View style={styles.recordsSection}>
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Registros Detalhados</Text>

        {records.length === 0 ? (
          <Card variant="bordered" style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum registro ainda</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Seus check-ins diários aparecerão listados aqui com detalhes de emoções e notas.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {records.map((rec) => {
              const isExpanded = expandedRecordId === rec.id;

              return (
                <Card key={rec.id} variant="bordered" style={styles.recordItemCard}>
                  <TouchableOpacity
                    onPress={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                    style={styles.recordRowTop}
                    activeOpacity={0.7}
                  >
                    <View style={styles.recordMoodCol}>
                      {getMoodIcon(rec.mood)}
                      <View>
                        <Text style={[styles.recordDateText, { color: colors.text }]}>
                          {formatDate(rec.createdAt)} às {formatTime(rec.createdAt)}
                        </Text>
                        <Text style={[styles.recordMoodText, { color: colors.textSecondary }]}>
                          Humor: <Text style={{ fontWeight: '700' }}>{getMoodLabel(rec.mood)}</Text> • Ansiedade: <Text style={{ fontWeight: '700' }}>{rec.anxietyLevel}/10</Text>
                        </Text>
                      </View>
                    </View>

                    {isExpanded ? (
                      <ChevronDown size={18} color={colors.textMuted} />
                    ) : (
                      <ChevronRight size={18} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>

                  {/* Conteúdo Expandido */}
                  {isExpanded && (
                    <View style={[styles.expandedBody, { borderTopColor: colors.border }]}>
                      {rec.emotions && rec.emotions.length > 0 && (
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Emoções:</Text>
                          <View style={styles.tagsWrap}>
                            {rec.emotions.map((emo, idx) => (
                              <View
                                key={idx}
                                style={[styles.tagBadge, { backgroundColor: colors.surfaceSecondary }]}
                              >
                                <Text style={[styles.tagText, { color: colors.primary }]}>{emo}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {rec.activities && rec.activities.length > 0 && (
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Atividades:</Text>
                          <View style={styles.tagsWrap}>
                            {rec.activities.map((act, idx) => (
                              <View
                                key={idx}
                                style={[styles.tagBadge, { backgroundColor: colors.surfaceSubtle }]}
                              >
                                <Text style={[styles.tagText, { color: colors.secondaryDark }]}>{act}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {rec.notes ? (
                        <View style={styles.notesBox}>
                          <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>Observações:</Text>
                          <Text style={[styles.notesContent, { color: colors.text }]}>{rec.notes}</Text>
                        </View>
                      ) : null}

                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          onPress={() => router.push(`/mood/edit/${rec.id}` as any)}
                          style={[styles.smallActionBtn, { borderColor: colors.border }]}
                        >
                          <Edit2 size={14} color={colors.textSecondary} />
                          <Text style={[styles.smallActionText, { color: colors.textSecondary }]}>Editar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setRecordToDelete(rec.id)}
                          style={[styles.smallActionBtn, { borderColor: colors.errorLight }]}
                        >
                          <Trash2 size={14} color={colors.error} />
                          <Text style={[styles.smallActionText, { color: colors.error }]}>Excluir</Text>
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
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
  recordItemCard: {
    padding: 14,
    borderRadius: 16,
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
    fontWeight: '600',
  },
  notesBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.02)',
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
    gap: 8,
    marginTop: 4,
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  smallActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
