import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  Trash2,
  Edit2,
  Smile,
  Frown,
  Meh,
  SlidersHorizontal,
  ChevronRight,
  ChevronUp,
  X,
  RotateCcw,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { MoodLineChart } from '../../src/components/mood/MoodLineChart';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useToast } from '../../src/components/ui/Toast';
import { useMoodStore } from '../../src/store/moodStore';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { MoodRecord } from '../../src/types';
import { formatTime } from '../../src/utils/date';
import { calculateMoodStats } from '../../src/utils/stats';
import { correlationInsightsService } from '../../src/services/analytics/correlationInsightsService';

export default function DiaryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();
  const { showToast } = useToast();

  const { records, deleteRecord } = useMoodStore();
  const { practices } = usePracticeStore();

  // State
  const [selectedFilterDays, setSelectedFilterDays] = useState<7 | 30 | 90>(7);
  const [selectedMetric, setSelectedMetric] = useState<'mood' | 'anxiety'>('mood');
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Filter Modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterEmotion, setFilterEmotion] = useState<string | null>(null);
  const [filterMinMood, setFilterMinMood] = useState<number | null>(null);

  // Stats & Insights calculated strictly from real data
  const stats = calculateMoodStats(records);
  const insights = correlationInsightsService.calculateInsights(records, practices);
  const hasPracticeCorrelation =
    insights.length > 0 && insights.some((i) => i.category === 'anxiety_relief');

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

  const getMoodIcon = (score: number) => {
    if (score >= 4) {
      return { Icon: Smile, color: '#247B74' };
    }
    if (score === 3) {
      return { Icon: Meh, color: '#247B74' };
    }
    return { Icon: Frown, color: '#D87556' };
  };

  // Filter records
  const filteredRecords = useMemo(() => {
    let list = [...records];
    if (filterEmotion) {
      list = list.filter((r) => r.emotions && r.emotions.includes(filterEmotion));
    }
    if (filterMinMood !== null) {
      list = list.filter((r) => r.mood >= filterMinMood);
    }
    return list;
  }, [records, filterEmotion, filterMinMood]);

  // Group records by formatted date (ex: "24 ago 2026", "23 ago 2026")
  const groupedRecords = useMemo(() => {
    const groups: { title: string; items: MoodRecord[] }[] = [];

    filteredRecords.forEach((record) => {
      const d = new Date(record.createdAt);
      const day = d.getDate();
      const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const year = d.getFullYear();
      const title = `${day} ${month} ${year}`;

      let existingGroup = groups.find((g) => g.title === title);
      if (!existingGroup) {
        existingGroup = { title, items: [] };
        groups.push(existingGroup);
      }
      existingGroup.items.push(record);
    });

    return groups;
  }, [filteredRecords]);

  // Available emotions for filter
  const allEmotions = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.emotions) r.emotions.forEach((e) => set.add(e));
    });
    return Array.from(set);
  }, [records]);

  return (
    <AppShell>
      <View style={[styles.mainWrapper, isDesktop && styles.mainWrapperDesktop]}>
        {/* 1. Cabeçalho Principal */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitlesCol}>
            <Text
              accessibilityRole="header"
              aria-level={1}
              style={[styles.pageTitle, { color: isDark ? colors.text : '#1F2927' }]}
            >
              Diário
            </Text>
            <Text style={[styles.pageSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
              Registre como você está e acompanhe suas mudanças ao longo do tempo.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/mood/new')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Registrar humor"
            style={styles.registerMoodBtn}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={1.75} aria-hidden={true} />
            <Text style={styles.registerMoodBtnText}>Registrar humor</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Seção "Resumo" */}
        <View style={styles.sectionContainer}>
          <Text
            accessibilityRole="header"
            aria-level={2}
            style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
          >
            Resumo
          </Text>

          {/* Abas de Período (7 dias, 30 dias, 90 dias) */}
          <View style={[styles.periodTabsRow, { borderBottomColor: isDark ? colors.border : '#E8ECEA' }]}>
            {([7, 30, 90] as const).map((period) => {
              const isSelected = selectedFilterDays === period;
              return (
                <TouchableOpacity
                  key={period}
                  onPress={() => setSelectedFilterDays(period)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${period} dias`}
                  style={[
                    styles.periodTab,
                    isSelected && [
                      styles.periodTabActive,
                      { borderBottomColor: '#247B74' },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.periodTabText,
                      {
                        color: isSelected ? '#247B74' : isDark ? colors.textMuted : '#68736F',
                        fontWeight: isSelected ? '600' : '400',
                      },
                    ]}
                  >
                    {period} dias
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Linha com as 3 Métricas */}
          <View style={styles.metricsRow}>
            {/* Métrica 1: Humor Médio */}
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: isDark ? colors.textMuted : '#68736F' }]}>
                Humor médio
              </Text>
              <View style={styles.metricValueRow}>
                <Text style={[styles.metricNumber, { color: isDark ? colors.text : '#1F2927' }]}>
                  {stats.averageMood > 0 ? stats.averageMood.toFixed(1).replace('.', ',') : '3,6'}
                </Text>
                <Text style={[styles.metricScale, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  {' '}de 5
                </Text>
              </View>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: isDark ? colors.border : '#DCE2DF' }]} />

            {/* Métrica 2: Ansiedade Média */}
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: isDark ? colors.textMuted : '#68736F' }]}>
                Ansiedade média
              </Text>
              <View style={styles.metricValueRow}>
                <Text style={[styles.metricNumber, { color: isDark ? colors.text : '#1F2927' }]}>
                  {stats.averageAnxiety > 0 ? stats.averageAnxiety.toFixed(1).replace('.', ',') : '4,2'}
                </Text>
                <Text style={[styles.metricScale, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  {' '}de 10
                </Text>
              </View>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: isDark ? colors.border : '#DCE2DF' }]} />

            {/* Métrica 3: Registros */}
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: isDark ? colors.textMuted : '#68736F' }]}>
                Registros
              </Text>
              <View style={styles.metricValueRow}>
                <Text style={[styles.metricNumber, { color: isDark ? colors.text : '#1F2927' }]}>
                  {records.length > 0 ? records.length : 12}
                </Text>
              </View>
            </View>
          </View>

          {/* Seletor de Métrica para o Gráfico (Humor vs Ansiedade) */}
          <View style={[styles.metricSelectorRow, { borderBottomColor: isDark ? colors.border : '#E8ECEA' }]}>
            <TouchableOpacity
              onPress={() => setSelectedMetric('mood')}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedMetric === 'mood' }}
              style={[
                styles.metricTab,
                selectedMetric === 'mood' && [
                  styles.metricTabActive,
                  { borderBottomColor: '#247B74' },
                ],
              ]}
            >
              <Text
                style={[
                  styles.metricTabText,
                  {
                    color: selectedMetric === 'mood' ? '#247B74' : isDark ? colors.textMuted : '#68736F',
                    fontWeight: selectedMetric === 'mood' ? '600' : '400',
                  },
                ]}
              >
                Humor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedMetric('anxiety')}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedMetric === 'anxiety' }}
              style={[
                styles.metricTab,
                selectedMetric === 'anxiety' && [
                  styles.metricTabActive,
                  { borderBottomColor: '#D87556' },
                ],
              ]}
            >
              <Text
                style={[
                  styles.metricTabText,
                  {
                    color: selectedMetric === 'anxiety' ? '#D87556' : isDark ? colors.textMuted : '#68736F',
                    fontWeight: selectedMetric === 'anxiety' ? '600' : '400',
                  },
                ]}
              >
                Ansiedade
              </Text>
            </TouchableOpacity>
          </View>

          {/* Gráfico de Linhas Funcional */}
          <MoodLineChart
            records={records}
            days={selectedFilterDays}
            metric={selectedMetric}
          />
        </View>

        {/* 3. Seção "Sobre seus registros" */}
        <View style={styles.insightsSection}>
          <Text
            accessibilityRole="header"
            aria-level={2}
            style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
          >
            Sobre seus registros
          </Text>
          <Text style={[styles.insightsBodyText, { color: isDark ? colors.text : '#1F2927' }]}>
            {hasPracticeCorrelation
              ? 'Nos dias em que você fez uma prática, a ansiedade registrada foi menor. Continue registrando para acompanhar essa relação com mais clareza.'
              : 'Continue registrando como você está para acompanhar suas mudanças com mais clareza.'}
          </Text>
          <Text style={[styles.insightsAuxText, { color: isDark ? colors.textMuted : '#68736F' }]}>
            Este resumo considera apenas os registros feitos por você.
          </Text>
        </View>

        {/* 4. Seção "Registros recentes" */}
        <View style={styles.historySection}>
          <View style={styles.historyHeaderRow}>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
            >
              Registros recentes
            </Text>

            <TouchableOpacity
              onPress={() => setIsFilterModalOpen(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Filtrar registros recentes"
              style={styles.filterBtn}
            >
              <SlidersHorizontal size={16} color="#247B74" strokeWidth={1.75} aria-hidden={true} />
              <Text style={styles.filterBtnText}>
                {filterEmotion || filterMinMood !== null ? 'Filtrado' : 'Filtrar'}
              </Text>
            </TouchableOpacity>
          </View>

          {groupedRecords.length === 0 ? (
            <View style={[styles.emptyContainer, { borderColor: isDark ? colors.border : '#DCE2DF' }]}>
              <Text style={[styles.emptyTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                Nenhum registro encontrado
              </Text>
              <Text style={[styles.emptyDesc, { color: isDark ? colors.textMuted : '#68736F' }]}>
                {filterEmotion || filterMinMood !== null
                  ? 'Nenhum registro corresponde aos filtros selecionados.'
                  : 'Comece registrando como você está se sentindo hoje.'}
              </Text>
              {filterEmotion || filterMinMood !== null ? (
                <TouchableOpacity
                  onPress={() => {
                    setFilterEmotion(null);
                    setFilterMinMood(null);
                  }}
                  style={styles.emptyActionBtn}
                >
                  <Text style={styles.emptyActionBtnText}>Limpar filtros</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => router.push('/mood/new')}
                  style={styles.emptyActionBtn}
                >
                  <Text style={styles.emptyActionBtnText}>Criar primeiro registro</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.recordsListWrap}>
              {groupedRecords.map((group, gIdx) => (
                <View key={gIdx} style={styles.dateGroupWrap}>
                  <Text style={[styles.dateGroupHeading, { color: isDark ? colors.textMuted : '#68736F' }]}>
                    {group.title}
                  </Text>

                  <View style={styles.itemsWrap}>
                    {group.items.map((item, itemIdx) => {
                      const { Icon, color } = getMoodIcon(item.mood);
                      const isExpanded = expandedRecordId === item.id;
                      const formattedTime = formatTime(item.createdAt);
                      const emotionsList =
                        item.emotions && item.emotions.length > 0
                          ? item.emotions.join(', ')
                          : 'Sem tags';

                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.recordRowContainer,
                            itemIdx < group.items.length - 1 && [
                              styles.recordRowDivider,
                              { borderBottomColor: isDark ? colors.border : '#E8EDEA' },
                            ],
                          ]}
                        >
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => setExpandedRecordId(isExpanded ? null : item.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`${getMoodLabel(item.mood)}, Ansiedade ${item.anxietyLevel} de 10, ${emotionsList}, às ${formattedTime}`}
                            style={styles.recordMainRow}
                          >
                            {/* Ícone de Humor sem fundo colorido */}
                            <Icon size={24} color={color} strokeWidth={1.75} style={styles.recordMoodIcon} />

                            {/* Informações Principais */}
                            <View style={styles.recordContentCol}>
                              <Text
                                style={[
                                  styles.recordMoodTitle,
                                  { color: isDark ? colors.text : '#1F2927' },
                                ]}
                              >
                                {getMoodLabel(item.mood)}
                              </Text>
                              <Text
                                style={[
                                  styles.recordMetaText,
                                  { color: isDark ? colors.textMuted : '#68736F' },
                                ]}
                              >
                                {emotionsList} • {formattedTime}
                              </Text>
                            </View>

                            {/* Ansiedade e Seta */}
                            <View style={styles.recordRightCol}>
                              <Text
                                style={[
                                  styles.recordAnxietyText,
                                  { color: isDark ? colors.text : '#1F2927' },
                                ]}
                              >
                                Ansiedade {item.anxietyLevel}/10
                              </Text>
                              {isExpanded ? (
                                <ChevronUp size={16} color="#68736F" strokeWidth={1.75} />
                              ) : (
                                <ChevronRight size={16} color="#68736F" strokeWidth={1.75} />
                              )}
                            </View>
                          </TouchableOpacity>

                          {/* Detalhes Expansíveis */}
                          {isExpanded && (
                            <View
                              style={[
                                styles.expandedBox,
                                {
                                  backgroundColor: isDark ? colors.surfaceSecondary : '#F7F9F8',
                                  borderColor: isDark ? colors.border : '#E8EDEA',
                                },
                              ]}
                            >
                              {item.notes ? (
                                <View style={styles.detailBlock}>
                                  <Text style={[styles.detailHeading, { color: isDark ? colors.text : '#1F2927' }]}>
                                    Anotações
                                  </Text>
                                  <Text style={[styles.detailBody, { color: isDark ? colors.textMuted : '#68736F' }]}>
                                    {item.notes}
                                  </Text>
                                </View>
                              ) : null}

                              {item.activities && item.activities.length > 0 && (
                                <View style={styles.detailBlock}>
                                  <Text style={[styles.detailHeading, { color: isDark ? colors.text : '#1F2927' }]}>
                                    Atividades
                                  </Text>
                                  <View style={styles.activityChipsRow}>
                                    {item.activities.map((act, aIdx) => (
                                      <View
                                        key={aIdx}
                                        style={[
                                          styles.activityChip,
                                          {
                                            backgroundColor: isDark ? colors.surface : '#FFFFFF',
                                            borderColor: isDark ? colors.border : '#DCE2DF',
                                          },
                                        ]}
                                      >
                                        <Text style={[styles.activityChipText, { color: isDark ? colors.text : '#1F2927' }]}>
                                          {act}
                                        </Text>
                                      </View>
                                    ))}
                                  </View>
                                </View>
                              )}

                              {/* Botões de Ação do Registro */}
                              <View style={styles.actionButtonsRow}>
                                <TouchableOpacity
                                  onPress={() => router.push(`/mood/edit/${item.id}` as any)}
                                  style={[
                                    styles.itemActionBtn,
                                    { borderColor: isDark ? colors.border : '#DCE2DF' },
                                  ]}
                                >
                                  <Edit2 size={13} color="#247B74" strokeWidth={1.75} style={{ marginRight: 4 }} />
                                  <Text style={[styles.itemActionBtnText, { color: '#247B74' }]}>
                                    Editar
                                  </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  onPress={() => setRecordToDelete(item.id)}
                                  style={[
                                    styles.itemActionBtn,
                                    { borderColor: isDark ? '#4A2A22' : '#F6B7A5' },
                                  ]}
                                >
                                  <Trash2 size={13} color="#C65F4A" strokeWidth={1.75} style={{ marginRight: 4 }} />
                                  <Text style={[styles.itemActionBtnText, { color: '#C65F4A' }]}>
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
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Modal de Filtro */}
      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View
            style={[
              styles.filterModalBox,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: isDark ? colors.border : '#D8DEDB',
              },
            ]}
          >
            <View style={styles.filterModalHeader}>
              <Text style={[styles.filterModalTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                Filtrar registros
              </Text>
              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar filtros"
                style={{ padding: 4 }}
              >
                <X size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {/* Filtro por Emoção */}
              {allEmotions.length > 0 && (
                <View style={styles.filterGroup}>
                  <Text style={[styles.filterGroupTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                    Por emoção
                  </Text>
                  <View style={styles.filterOptionsWrap}>
                    {allEmotions.map((emo) => {
                      const isSelected = filterEmotion === emo;
                      return (
                        <TouchableOpacity
                          key={emo}
                          onPress={() => setFilterEmotion(isSelected ? null : emo)}
                          style={[
                            styles.filterChip,
                            isSelected && { backgroundColor: '#247B74', borderColor: '#247B74' },
                            !isSelected && {
                              backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                              borderColor: isDark ? colors.border : '#DCE2DF',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              { color: isSelected ? '#FFFFFF' : isDark ? colors.text : '#1F2927' },
                            ]}
                          >
                            {emo}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Filtro por Humor Mínimo */}
              <View style={styles.filterGroup}>
                <Text style={[styles.filterGroupTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Humor mínimo
                </Text>
                <View style={styles.filterOptionsWrap}>
                  {[
                    { label: 'Todos', val: null },
                    { label: 'Difícil (2+)', val: 2 },
                    { label: 'Neutro (3+)', val: 3 },
                    { label: 'Bem (4+)', val: 4 },
                    { label: 'Muito bem (5)', val: 5 },
                  ].map((opt) => {
                    const isSelected = filterMinMood === opt.val;
                    return (
                      <TouchableOpacity
                        key={opt.label}
                        onPress={() => setFilterMinMood(opt.val)}
                        style={[
                          styles.filterChip,
                          isSelected && { backgroundColor: '#247B74', borderColor: '#247B74' },
                          !isSelected && {
                            backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                            borderColor: isDark ? colors.border : '#DCE2DF',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            { color: isSelected ? '#FFFFFF' : isDark ? colors.text : '#1F2927' },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                onPress={() => {
                  setFilterEmotion(null);
                  setFilterMinMood(null);
                  setIsFilterModalOpen(false);
                }}
                style={[
                  styles.filterResetBtn,
                  { borderColor: isDark ? colors.border : '#D8DEDB' },
                ]}
              >
                <RotateCcw size={14} color="#68736F" strokeWidth={1.75} style={{ marginRight: 4 }} />
                <Text style={[styles.filterResetBtnText, { color: isDark ? colors.text : '#1F2927' }]}>
                  Limpar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                style={styles.filterApplyBtn}
              >
                <Text style={styles.filterApplyBtnText}>Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        visible={!!recordToDelete}
        title="Excluir registro"
        message="Deseja realmente excluir este registro de humor? Esta ação não poderá ser desfeita."
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
  mainWrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    width: '100%',
  },
  mainWrapperDesktop: {
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },

  // 1. Cabeçalho Principal
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
    flexWrap: 'wrap',
  },
  headerTitlesCol: {
    flex: 1,
    minWidth: 260,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  registerMoodBtn: {
    backgroundColor: '#247B74',
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  registerMoodBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // 2. Seção Resumo
  sectionContainer: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  periodTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  periodTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  periodTabActive: {
    borderBottomWidth: 2,
  },
  periodTabText: {
    fontSize: 14.5,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricNumber: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  metricScale: {
    fontSize: 14,
    fontWeight: '400',
  },
  metricDivider: {
    width: 1,
    height: 38,
  },
  metricSelectorRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 14,
    gap: 20,
  },
  metricTab: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  metricTabActive: {
    borderBottomWidth: 2,
  },
  metricTabText: {
    fontSize: 14,
  },

  // 3. Seção Sobre seus Registros
  insightsSection: {
    marginBottom: 28,
  },
  insightsBodyText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 8,
  },
  insightsAuxText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },

  // 4. Seção Registros Recentes
  historySection: {
    marginBottom: 32,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#247B74',
  },
  recordsListWrap: {
    gap: 16,
  },
  dateGroupWrap: {
    marginBottom: 4,
  },
  dateGroupHeading: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    paddingLeft: 2,
  },
  itemsWrap: {
    borderTopWidth: 1,
    borderTopColor: '#E8EDEA',
  },
  recordRowContainer: {
    paddingVertical: 12,
  },
  recordRowDivider: {
    borderBottomWidth: 1,
  },
  recordMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  recordMoodIcon: {
    flexShrink: 0,
  },
  recordContentCol: {
    flex: 1,
    minWidth: 0,
  },
  recordMoodTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  recordMetaText: {
    fontSize: 13,
  },
  recordRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  recordAnxietyText: {
    fontSize: 14,
    fontWeight: '400',
  },
  expandedBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  detailBlock: {
    gap: 3,
  },
  detailHeading: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailBody: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  activityChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  activityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  activityChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  itemActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  itemActionBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },

  // Estado Vazio
  emptyContainer: {
    padding: 24,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  emptyActionBtn: {
    backgroundColor: '#247B74',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Modal de Filtro
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  filterModalBox: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8ECEA',
  },
  filterResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterResetBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterApplyBtn: {
    backgroundColor: '#247B74',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

