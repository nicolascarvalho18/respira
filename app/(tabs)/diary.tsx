import React, { useState } from 'react';
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
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  Smile,
  Activity,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Frown,
  Meh,
  FileText,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { AppButton } from '../../src/components/ui/AppButton';
import { MoodLineChart } from '../../src/components/mood/MoodLineChart';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useToast } from '../../src/components/ui/Toast';
import { useMoodStore } from '../../src/store/moodStore';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { MoodRecord } from '../../src/types';
import { formatDate, formatTime } from '../../src/utils/date';
import { calculateMoodStats } from '../../src/utils/stats';
import { correlationInsightsService } from '../../src/services/analytics/correlationInsightsService';
import { CorrelationInsightsCard } from '../../src/components/mood/CorrelationInsightsCard';

export default function DiaryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();
  const { showToast } = useToast();

  const { records, deleteRecord } = useMoodStore();
  const { practices } = usePracticeStore();
  const [selectedFilterDays, setSelectedFilterDays] = useState<7 | 30 | 90>(7);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const stats = calculateMoodStats(records);
  const insights = correlationInsightsService.calculateInsights(records, practices);

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    try {
      setIsDeleting(true);
      await deleteRecord(recordToDelete);
      showToast({ message: 'Registro removido com sucesso.', type: 'success' });
      setRecordToDelete(null);
      setExpandedRecordId(null);
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

  const getMoodFaceIcon = (score: number) => {
    switch (score) {
      case 5:
      case 4:
        return {
          icon: Smile,
          color: '#2F7F7C',
          bg: '#E2F4F2',
        };
      case 3:
        return {
          icon: Meh,
          color: '#D98968',
          bg: '#FDECE5',
        };
      default:
        return {
          icon: Frown,
          color: '#2C5C58',
          bg: '#DEEBE8',
        };
    }
  };

  // Group records by relative date header (Hoje, Ontem, etc.)
  const groupRecordsByDate = () => {
    const groups: { title: string; items: MoodRecord[] }[] = [];
    const now = new Date();

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    records.forEach((record) => {
      const recordDate = new Date(record.createdAt);
      let title = formatDate(record.createdAt);

      if (isSameDay(recordDate, now)) {
        title = `Hoje • ${formatDate(record.createdAt)}`;
      } else if (isSameDay(recordDate, yesterday)) {
        title = `Ontem • ${formatDate(record.createdAt)}`;
      }

      let existingGroup = groups.find((g) => g.title === title);
      if (!existingGroup) {
        existingGroup = { title, items: [] };
        groups.push(existingGroup);
      }
      existingGroup.items.push(record);
    });

    return groups;
  };

  const groupedRecords = groupRecordsByDate();

  // Desktop right panel
  const renderDesktopSidebar = () => (
    <View style={styles.metricsSidebar}>
      <Text style={[styles.sidebarHeading, { color: '#173D3B' }]}>Painel de Evolução</Text>

      <Card variant="bordered" padding="sm" style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Smile size={16} color="#2F7F7C" style={{ marginRight: 6 }} />
          <Text style={[styles.metricTitle, { color: '#173D3B' }]}>Média de Humor</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#2F7F7C' }}>
          {stats.averageMood.toFixed(1).replace('.', ',')}{' '}
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#667775' }}>de 5.0</Text>
        </Text>
      </Card>

      <Card variant="bordered" padding="sm" style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Activity size={16} color="#D98968" style={{ marginRight: 6 }} />
          <Text style={[styles.metricTitle, { color: '#173D3B' }]}>Média de Ansiedade</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#D98968' }}>
          {stats.averageAnxiety.toFixed(1).replace('.', ',')}{' '}
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#667775' }}>de 10.0</Text>
        </Text>
      </Card>
    </View>
  );

  return (
    <AppShell rightPanel={renderDesktopSidebar()}>
      {/* 1. Cabeçalho Superior */}
      <View style={styles.pageHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: '#173D3B' }]}>Diário de Humor</Text>
          <Text style={[styles.pageSubtitle, { color: '#667775' }]}>
            Acompanhe como você tem se sentido
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/mood/new')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Criar novo registro de humor"
          style={styles.newRecordBtn}
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.newRecordBtnText}>Novo registro</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Card "Evolução recente" */}
      <View
        style={[
          styles.evolutionCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#DCE5E2',
          },
        ]}
      >
        {/* Título do Card */}
        <View style={styles.evolutionHeaderRow}>
          <TrendingUp size={18} color="#2F7F7C" style={{ marginRight: 8 }} />
          <Text style={[styles.evolutionTitle, { color: '#173D3B' }]}>
            Evolução recente
          </Text>
        </View>

        {/* Filtros em Segmented Control (7 dias, 30 dias, 90 dias) */}
        <View
          style={[
            styles.segmentedControlWrap,
            { backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5' },
          ]}
        >
          {([7, 30, 90] as const).map((period) => {
            const isSelected = selectedFilterDays === period;
            return (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedFilterDays(period)}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por ${period} dias`}
                style={[
                  styles.segmentBtn,
                  isSelected && [
                    styles.segmentBtnActive,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      shadowColor: '#173D3B',
                    },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    {
                      color: isSelected ? '#2F7F7C' : '#667775',
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {period} dias
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3 Indicadores Compactos */}
        <View style={styles.indicatorsRow}>
          {/* 1. Humor Médio */}
          <View
            style={[
              styles.indicatorCard,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F9FBFA',
                borderColor: isDark ? colors.border : '#EEF3F1',
              },
            ]}
          >
            <View style={styles.indicatorHeader}>
              <View style={[styles.dotIndicator, { backgroundColor: '#2F7F7C' }]} />
              <Text style={styles.indicatorLabel}>Humor médio</Text>
            </View>
            <Text style={[styles.indicatorBigVal, { color: '#173D3B' }]}>
              {stats.averageMood > 0 ? stats.averageMood.toFixed(1).replace('.', ',') : '0,0'}
              <Text style={styles.indicatorSubVal}> /5</Text>
            </Text>
          </View>

          {/* 2. Ansiedade Média */}
          <View
            style={[
              styles.indicatorCard,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F9FBFA',
                borderColor: isDark ? colors.border : '#EEF3F1',
              },
            ]}
          >
            <View style={styles.indicatorHeader}>
              <View style={[styles.dotIndicator, { backgroundColor: '#D98968' }]} />
              <Text style={styles.indicatorLabel}>Ansiedade média</Text>
            </View>
            <Text style={[styles.indicatorBigVal, { color: '#173D3B' }]}>
              {stats.averageAnxiety > 0 ? stats.averageAnxiety.toFixed(1).replace('.', ',') : '0,0'}
              <Text style={styles.indicatorSubVal}> /10</Text>
            </Text>
          </View>

          {/* 3. Registros */}
          <View
            style={[
              styles.indicatorCard,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F9FBFA',
                borderColor: isDark ? colors.border : '#EEF3F1',
              },
            ]}
          >
            <View style={styles.indicatorHeader}>
              <Text style={styles.indicatorLabel}>Registros</Text>
              <FileText size={14} color="#2F7F7C" style={{ marginLeft: 'auto' }} />
            </View>
            <Text style={[styles.indicatorBigVal, { color: '#173D3B' }]}>
              {records.length}
              <Text style={styles.indicatorSubVal}> registros</Text>
            </Text>
          </View>
        </View>

        {/* Gráfico de Linhas Interativo */}
        <MoodLineChart
          records={records}
          days={selectedFilterDays}
        />
      </View>

      {/* Card de Insights de Correlação Baseados em Dados Reais */}
      <CorrelationInsightsCard insights={insights} />

      {/* 3. Seção Histórico */}
      <View style={styles.historyHeaderRow}>
        <Text style={[styles.historyTitle, { color: '#173D3B' }]}>Histórico</Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Filtrar histórico"
          style={[
            styles.filterActionBtn,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#DCE5E2',
            },
          ]}
        >
          <SlidersHorizontal size={14} color="#173D3B" />
          <Text style={[styles.filterActionBtnText, { color: '#173D3B' }]}>Filtrar</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Registros Agrupada por Data */}
      {groupedRecords.length === 0 ? (
        <View
          style={[
            styles.emptyWrap,
            { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: '#DCE5E2' },
          ]}
        >
          <Text style={[styles.emptyTitle, { color: '#173D3B' }]}>Nenhum registro ainda</Text>
          <Text style={[styles.emptySubtitle, { color: '#667775' }]}>
            Comece registrando como você está se sentindo hoje.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/mood/new')}
            style={styles.emptyButton}
          >
            <Text style={styles.emptyButtonText}>+ Criar primeiro check-in</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.historyListWrap}>
          {groupedRecords.map((group, gIdx) => (
            <View key={gIdx} style={styles.groupContainer}>
              <Text style={styles.groupHeaderLabel}>{group.title}</Text>

              {group.items.map((item) => {
                const face = getMoodFaceIcon(item.mood);
                const IconComponent = face.icon;
                const isExpanded = expandedRecordId === item.id;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.recordCard,
                      {
                        backgroundColor: isDark ? colors.surface : '#FFFFFF',
                        borderColor: isDark ? colors.border : '#EBF1EF',
                      },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        setExpandedRecordId(isExpanded ? null : item.id)
                      }
                      style={styles.recordCardMain}
                      accessibilityRole="button"
                      accessibilityLabel={`${getMoodLabel(item.mood)}, Ansiedade ${item.anxietyLevel} de 10`}
                    >
                      {/* Ícone Redondo com Expressão */}
                      <View style={[styles.faceCircle, { backgroundColor: face.bg }]}>
                        <IconComponent size={20} color={face.color} strokeWidth={2.2} />
                      </View>

                      {/* Informações Principais */}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.recordHeading, { color: '#173D3B' }]}>
                          {getMoodLabel(item.mood)} • Ansiedade {item.anxietyLevel}/10
                        </Text>
                        <Text style={[styles.recordMeta, { color: '#667775' }]}>
                          {item.emotions && item.emotions.length > 0
                            ? item.emotions.slice(0, 3).join(', ')
                            : 'Sem tags'}{' '}
                          • {formatTime(item.createdAt)}
                        </Text>
                      </View>

                      {/* Seta */}
                      {isExpanded ? (
                        <ChevronUp size={16} color="#8C9E9B" />
                      ) : (
                        <ChevronRight size={16} color="#8C9E9B" />
                      )}
                    </TouchableOpacity>

                    {/* Detalhes Expansíveis com Ações Reais de Edição e Exclusão */}
                    {isExpanded && (
                      <View
                        style={[
                          styles.expandedDetails,
                          {
                            borderTopColor: isDark ? colors.border : '#F0F4F3',
                            backgroundColor: isDark ? colors.surfaceSecondary : '#FAFDFD',
                          },
                        ]}
                      >
                        {item.notes ? (
                          <View style={{ marginBottom: 10 }}>
                            <Text style={[styles.detailSectionTitle, { color: '#173D3B' }]}>
                              Anotações
                            </Text>
                            <Text style={[styles.detailBody, { color: '#567571' }]}>
                              {item.notes}
                            </Text>
                          </View>
                        ) : null}

                        {item.activities && item.activities.length > 0 && (
                          <View style={{ marginBottom: 10 }}>
                            <Text style={[styles.detailSectionTitle, { color: '#173D3B' }]}>
                              Atividades
                            </Text>
                            <View style={styles.tagsRow}>
                              {item.activities.map((act, aIdx) => (
                                <View key={aIdx} style={styles.activityBadge}>
                                  <Text style={styles.activityBadgeText}>{act}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* Botões de Ação */}
                        <View style={styles.recordActionButtonsRow}>
                          <TouchableOpacity
                            onPress={() => router.push(`/mood/edit/${item.id}` as any)}
                            style={[
                              styles.actionBtnOutline,
                              { borderColor: isDark ? colors.border : '#DCE5E2' },
                            ]}
                          >
                            <Edit2 size={13} color="#2F7F7C" style={{ marginRight: 5 }} />
                            <Text style={[styles.actionBtnOutlineText, { color: '#2F7F7C' }]}>
                              Editar
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => setRecordToDelete(item.id)}
                            style={[
                              styles.actionBtnOutline,
                              { borderColor: isDark ? '#4D2424' : '#FCE8E8' },
                            ]}
                          >
                            <Trash2 size={13} color={colors.error} style={{ marginRight: 5 }} />
                            <Text style={[styles.actionBtnOutlineText, { color: colors.error }]}>
                              Excluir
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDialog
        visible={!!recordToDelete}
        title="Excluir Registro"
        message="Tem certeza de que deseja remover este check-in? Esta ação não pode ser desfeita."
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
  // Cabeçalho
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingTop: 4,
    gap: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  newRecordBtn: {
    backgroundColor: '#2F7F7C',
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#2F7F7C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  newRecordBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Card Evolução Recente
  evolutionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 22,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  evolutionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  evolutionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  // Segmented Control
  segmentedControlWrap: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  segmentBtnText: {
    fontSize: 12,
  },

  // 3 Indicadores
  indicatorsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  indicatorCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  indicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#567571',
  },
  indicatorBigVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  indicatorSubVal: {
    fontSize: 11,
    fontWeight: '500',
    color: '#667775',
  },

  // Histórico
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  filterActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Listagem Agrupada
  historyListWrap: {
    gap: 6,
    paddingBottom: 24,
  },
  groupContainer: {
    marginBottom: 12,
  },
  groupHeaderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667775',
    marginBottom: 8,
    paddingLeft: 2,
  },
  recordCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  recordCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  faceCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordHeading: {
    fontSize: 14,
    fontWeight: '700',
  },
  recordMeta: {
    fontSize: 12,
    marginTop: 2,
  },

  // Detalhes Expansíveis
  expandedDetails: {
    borderTopWidth: 1,
    padding: 12,
    paddingTop: 10,
  },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  activityBadge: {
    backgroundColor: '#E7F3EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2F7F7C',
  },
  recordActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnOutlineText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Estado Vazio
  emptyWrap: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  emptyButton: {
    backgroundColor: '#2F7F7C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Desktop Sidebar
  metricsSidebar: {
    gap: 12,
  },
  sidebarHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
});
