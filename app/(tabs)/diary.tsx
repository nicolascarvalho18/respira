import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  Heart,
  Smile,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { AppButton } from '../../src/components/ui/AppButton';
import { AccessibleChart } from '../../src/components/mood/AccessibleChart';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useToast } from '../../src/components/ui/Toast';
import { useMoodStore } from '../../src/store/moodStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { MoodRecord } from '../../src/types';
import { formatDateTime } from '../../src/utils/date';
import { calculateMoodStats } from '../../src/utils/stats';

export default function DiaryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();
  const { showToast } = useToast();

  const { records, deleteRecord } = useMoodStore();
  const [selectedFilterDays, setSelectedFilterDays] = useState<7 | 30 | 90>(7);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const stats = calculateMoodStats(records);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    try {
      setIsDeleting(true);
      await deleteRecord(recordToDelete);
      showToast({ message: 'Registro removido.', type: 'success' });
      setRecordToDelete(null);
    } catch {
      showToast({ message: 'Erro ao remover registro.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getMoodLabel = (score: number) => {
    switch (score) {
      case 5:
        return 'Muito bem';
      case 4:
        return 'Bem';
      case 3:
        return 'Neutro';
      case 2:
        return 'Difícil';
      default:
        return 'Muito difícil';
    }
  };

  const visibleRecords = records.slice(0, visibleCount);

  // Painel lateral de métricas para Desktop
  const renderDesktopMetricsSidebar = () => (
    <View style={styles.metricsSidebar}>
      <Text style={[styles.sidebarHeading, { color: colors.text }]}>Painel de Evolução</Text>

      {/* Card Média de Humor */}
      <Card variant="bordered" padding="sm" style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Smile size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.metricTitle, { color: colors.text }]}>Média de Humor</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary }}>
          {stats.averageMood.toFixed(1)}{' '}
          <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textMuted }}>de 5.0</Text>
        </Text>
      </Card>

      {/* Card Média de Ansiedade */}
      <Card variant="bordered" padding="sm" style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Activity size={16} color={colors.warning} style={{ marginRight: 6 }} />
          <Text style={[styles.metricTitle, { color: colors.text }]}>Média de Ansiedade</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.warning }}>
          {stats.averageAnxiety.toFixed(1)}{' '}
          <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textMuted }}>de 10.0</Text>
        </Text>
      </Card>

      {/* Emoções Recorrentes */}
      <Card variant="bordered" padding="sm" style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Heart size={15} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.metricTitle, { color: colors.text }]}>Emoções Recorrentes</Text>
        </View>
        <View style={styles.chipsWrap}>
          {stats.topEmotions.map((emo, idx) => (
            <Badge key={idx} label={emo.emotion} variant="primary" size="sm" style={{ marginRight: 4, marginBottom: 4 }} />
          ))}
        </View>
      </Card>

      {/* Botão Novo Registro */}
      <AppButton
        title="Novo Registro"
        leftIcon={<Plus size={16} color="#FFFFFF" />}
        onPress={() => router.push('/mood/new')}
        size="sm"
        style={{ marginTop: 4 }}
      />
    </View>
  );

  return (
    <AppShell rightPanel={renderDesktopMetricsSidebar()}>
      {/* Cabeçalho da Página */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Diário de Humor</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
            Acompanhe suas emoções e níveis de ansiedade ao longo dos dias.
          </Text>
        </View>

        {!isDesktop && (
          <AppButton
            title="Novo"
            leftIcon={<Plus size={16} color="#FFFFFF" />}
            onPress={() => router.push('/mood/new')}
            size="sm"
          />
        )}
      </View>

      {/* Card do Gráfico de Evolução com Filtros em Segmented Control */}
      <Card variant="bordered" style={styles.chartCard}>
        <View style={styles.chartTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TrendingUp size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.chartTitle, { color: colors.text }]}>Evolução Recente</Text>
          </View>
        </View>

        {/* 3 Botões de Filtro Iguais Dispostos Abaixo do Título */}
        <View
          style={[
            styles.filterSegmentedRow,
            {
              backgroundColor: isDark ? colors.surfaceSecondary : '#F0F5F4',
              borderColor: colors.border,
            },
          ]}
        >
          {([7, 30, 90] as const).map((days) => {
            const isSelected = selectedFilterDays === days;
            return (
              <TouchableOpacity
                key={days}
                onPress={() => setSelectedFilterDays(days)}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por ${days} dias`}
                style={[
                  styles.filterSegmentBtn,
                  isSelected && {
                    backgroundColor: isDark ? colors.surface : '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                    elevation: 2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterSegmentText,
                    {
                      color: isSelected ? colors.primary : colors.textMuted,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {days} dias
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Gráfico Acessível com Tooltip */}
        <AccessibleChart records={records} days={selectedFilterDays} />
      </Card>

      {/* Seção do Histórico Compacto */}
      <View style={styles.historySectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Histórico ({records.length})
        </Text>
      </View>

      {visibleRecords.length === 0 ? (
        <Card variant="bordered" style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Nenhum check-in registrado ainda
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Registre como você está se sentindo hoje para começar a acompanhar seu histórico.
          </Text>
          <AppButton
            title="Fazer Primeiro Registro"
            leftIcon={<Plus size={16} color="#FFFFFF" />}
            onPress={() => router.push('/mood/new')}
            size="sm"
            style={{ marginTop: 12 }}
          />
        </Card>
      ) : (
        <View style={styles.recordsList}>
          {visibleRecords.map((item: MoodRecord) => {
            const isExpanded = !!expandedIds[item.id];

            return (
              <Card key={item.id} variant="bordered" style={styles.recordCard}>
                {/* Linha Superior: Data, Humor e Nível de Ansiedade */}
                <View style={styles.recordHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.recordDate, { color: colors.text }]}>
                      {formatDateTime(item.createdAt)}
                    </Text>
                    <Text style={[styles.recordMoodSummary, { color: colors.primary }]}>
                      {getMoodLabel(item.mood)} • Nível informado: {item.anxietyLevel}/10
                    </Text>
                  </View>
                </View>

                {/* Emoções do Registro */}
                {item.emotions && item.emotions.length > 0 && (
                  <Text style={[styles.emotionsSummary, { color: colors.textSecondary }]} numberOfLines={isExpanded ? undefined : 1}>
                    {item.emotions.join(', ')}
                  </Text>
                )}

                {/* Área Expandida (Anotações, Atividades e Ações) */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {item.activities && item.activities.length > 0 && (
                      <View style={styles.activitiesRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Atividades: </Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                          {item.activities.join(', ')}
                        </Text>
                      </View>
                    )}

                    {item.notes && (
                      <View
                        style={[
                          styles.notesBox,
                          {
                            backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.notesText, { color: colors.text }]}>{item.notes}</Text>
                      </View>
                    )}

                    <View style={styles.recordActionsRow}>
                      <TouchableOpacity
                        onPress={() => router.push(`/mood/edit/${item.id}`)}
                        accessibilityRole="button"
                        accessibilityLabel="Editar registro"
                        style={[styles.recordActionBtn, { backgroundColor: colors.surfaceSecondary }]}
                      >
                        <Edit2 size={13} color={colors.primary} />
                        <Text style={[styles.recordActionText, { color: colors.primary }]}>Editar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setRecordToDelete(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel="Excluir registro"
                        style={[styles.recordActionBtn, { backgroundColor: isDark ? '#3D1C1C' : '#FDF0F0' }]}
                      >
                        <Trash2 size={13} color={colors.error} />
                        <Text style={[styles.recordActionText, { color: colors.error }]}>Excluir</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Botão Ver Detalhes / Recolher */}
                <TouchableOpacity
                  onPress={() => toggleExpand(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={isExpanded ? 'Recolher detalhes' : 'Ver detalhes do registro'}
                  style={styles.expandBtn}
                >
                  <Text style={[styles.expandBtnText, { color: colors.primary }]}>
                    {isExpanded ? 'Recolher' : 'Ver detalhes'}
                  </Text>
                  {isExpanded ? (
                    <ChevronUp size={14} color={colors.primary} />
                  ) : (
                    <ChevronDown size={14} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </Card>
            );
          })}

          {/* Carregar mais */}
          {records.length > visibleCount && (
            <TouchableOpacity
              onPress={() => setVisibleCount((prev) => prev + 5)}
              style={[styles.loadMoreBtn, { borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Carregar mais registros anteriores"
            >
              <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                Carregar registros anteriores
              </Text>
              <ChevronDown size={15} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Diálogo de Confirmação */}
      <ConfirmDialog
        visible={!!recordToDelete}
        title="Excluir registro?"
        message="Tem certeza que deseja apagar este check-in? Esta ação não pode ser desfeita."
        confirmTitle="Excluir"
        cancelTitle="Cancelar"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setRecordToDelete(null)}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  pageSubtitle: {
    fontSize: 15,
    marginTop: 4,
    lineHeight: 22,
  },
  chartCard: {
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  filterSegmentedRow: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 4,
    marginVertical: 4,
  },
  filterSegmentBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSegmentText: {
    fontSize: 12,
  },
  historySectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  recordsList: {
    gap: 10,
    marginBottom: 24,
  },
  recordCard: {
    padding: 14,
    gap: 6,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  recordDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  recordMoodSummary: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  emotionsSummary: {
    fontSize: 13,
    lineHeight: 18,
  },
  expandedContent: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F4',
    gap: 8,
  },
  activitiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
  },
  notesBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
  },
  recordActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  recordActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  recordActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 4,
    marginTop: 2,
  },
  expandBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginVertical: 8,
    gap: 6,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  metricsSidebar: {
    gap: 6,
  },
  sidebarHeading: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
