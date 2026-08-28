import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  SlidersHorizontal,
  ChevronRight,
  Smile,
  Meh,
  Frown,
  TrendingUp,
  X,
  Trash2,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { MoodLineChart } from '../../src/components/mood/MoodLineChart';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useToast } from '../../src/components/ui/Toast';
import { useMoodStore } from '../../src/store/moodStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { MoodRecord } from '../../src/types';
import { AVAILABLE_EMOTIONS, AVAILABLE_ACTIVITIES } from '../../src/mocks/moods.mock';

export default function DiaryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();
  const { showToast } = useToast();

  const { records, deleteRecord } = useMoodStore();

  // Estados de controle
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30 | 90>(30);
  const [selectedMetric, setSelectedMetric] = useState<'mood' | 'anxiety'>('mood');

  // Filtros
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempMoodFilter, setTempMoodFilter] = useState<number | null>(null);
  const [tempAnxietyFilter, setTempAnxietyFilter] = useState<'mild' | 'moderate' | 'intense' | null>(null);
  const [tempEmotions, setTempEmotions] = useState<string[]>([]);
  const [tempActivities, setTempActivities] = useState<string[]>([]);

  const [appliedMoodFilter, setAppliedMoodFilter] = useState<number | null>(null);
  const [appliedAnxietyFilter, setAppliedAnxietyFilter] = useState<'mild' | 'moderate' | 'intense' | null>(null);
  const [appliedEmotions, setAppliedEmotions] = useState<string[]>([]);
  const [appliedActivities, setAppliedActivities] = useState<string[]>([]);

  // Detalhes & Exclusão de Registro
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<MoodRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Diário — Respira';
    }
  }, []);

  // 1. Contagem e cálculo de métricas para o período selecionado (7, 30 ou 90 dias)
  const now = new Date();
  const periodCutoff = now.getTime() - selectedPeriod * 24 * 60 * 60 * 1000;

  const periodRecords = useMemo(() => {
    return records.filter((r) => new Date(r.createdAt).getTime() >= periodCutoff);
  }, [records, periodCutoff]);

  const periodMetrics = useMemo(() => {
    if (periodRecords.length === 0) {
      return {
        avgMood: '0,0',
        avgAnxiety: '0,0',
        totalRecords: 0,
        uniqueDays: 0,
      };
    }

    const sumMood = periodRecords.reduce((acc, r) => acc + r.mood, 0);
    const sumAnxiety = periodRecords.reduce((acc, r) => acc + r.anxietyLevel, 0);

    const avgMood = (sumMood / periodRecords.length).toFixed(1).replace('.', ',');
    const avgAnxiety = (sumAnxiety / periodRecords.length).toFixed(1).replace('.', ',');

    const uniqueDaysSet = new Set(periodRecords.map((r) => r.createdAt.slice(0, 10)));

    return {
      avgMood,
      avgAnxiety,
      totalRecords: periodRecords.length,
      uniqueDays: uniqueDaysSet.size,
    };
  }, [periodRecords]);

  // 2. Filtro dos registros recentes
  const filteredRecentRecords = useMemo(() => {
    return records.filter((r) => {
      if (appliedMoodFilter !== null && r.mood !== appliedMoodFilter) {
        return false;
      }
      if (appliedAnxietyFilter !== null) {
        if (appliedAnxietyFilter === 'mild' && r.anxietyLevel > 3) return false;
        if (appliedAnxietyFilter === 'moderate' && (r.anxietyLevel < 4 || r.anxietyLevel > 7)) return false;
        if (appliedAnxietyFilter === 'intense' && r.anxietyLevel < 8) return false;
      }
      if (appliedEmotions.length > 0) {
        const hasEmotion = r.emotions && r.emotions.some((e) => appliedEmotions.includes(e));
        if (!hasEmotion) return false;
      }
      if (appliedActivities.length > 0) {
        const hasActivity = r.activities && r.activities.some((a) => appliedActivities.includes(a));
        if (!hasActivity) return false;
      }
      return true;
    });
  }, [records, appliedMoodFilter, appliedAnxietyFilter, appliedEmotions, appliedActivities]);

  // Contagem de filtros ativos
  const activeFiltersCount =
    (appliedMoodFilter !== null ? 1 : 0) +
    (appliedAnxietyFilter !== null ? 1 : 0) +
    appliedEmotions.length +
    appliedActivities.length;

  // 3. Agrupar registros por data (ex: "27 ago 2026")
  const groupedRecords = useMemo(() => {
    const groups: { dateLabel: string; items: MoodRecord[] }[] = [];
    const map: Record<string, MoodRecord[]> = {};

    filteredRecentRecords.forEach((r) => {
      const dateKey = r.createdAt.slice(0, 10);
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(r);
    });

    const sortedDates = Object.keys(map).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    sortedDates.forEach((dateKey) => {
      const d = new Date(dateKey + 'T12:00:00');
      const day = d.getDate();
      const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const year = d.getFullYear();
      const dateLabel = `${day} ${month} ${year}`;

      groups.push({
        dateLabel,
        items: map[dateKey].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      });
    });

    return groups;
  }, [filteredRecentRecords]);

  const getMoodInfo = (score: number) => {
    switch (score) {
      case 5:
        return { label: 'Muito bem', Icon: Smile, color: '#247B74' };
      case 4:
        return { label: 'Bem', Icon: Smile, color: '#247B74' };
      case 3:
        return { label: 'Neutro', Icon: Meh, color: '#247B74' };
      case 2:
        return { label: 'Difícil', Icon: Frown, color: '#D87556' };
      default:
        return { label: 'Muito difícil', Icon: Frown, color: '#D87556' };
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleOpenFilterModal = () => {
    setTempMoodFilter(appliedMoodFilter);
    setTempAnxietyFilter(appliedAnxietyFilter);
    setTempEmotions([...appliedEmotions]);
    setTempActivities([...appliedActivities]);
    setIsFilterModalOpen(true);
  };

  const handleApplyFilters = () => {
    setAppliedMoodFilter(tempMoodFilter);
    setAppliedAnxietyFilter(tempAnxietyFilter);
    setAppliedEmotions([...tempEmotions]);
    setAppliedActivities([...tempActivities]);
    setIsFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    setTempMoodFilter(null);
    setTempAnxietyFilter(null);
    setTempEmotions([]);
    setTempActivities([]);
    setAppliedMoodFilter(null);
    setAppliedAnxietyFilter(null);
    setAppliedEmotions([]);
    setAppliedActivities([]);
    setIsFilterModalOpen(false);
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    try {
      setIsDeleting(true);
      await deleteRecord(recordToDelete);
      showToast({ message: 'Registro removido com sucesso.', type: 'success' });
      setRecordToDelete(null);
      setSelectedRecordForDetail(null);
    } catch {
      showToast({ message: 'Erro ao remover registro.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell>
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        {/* 1. CABEÇALHO */}
        <View style={[styles.headerRow, isDesktop && styles.headerRowDesktop]}>
          <View style={{ flex: 1, paddingRight: isDesktop ? 16 : 0 }}>
            <Text
              accessibilityRole="header"
              aria-level={1}
              style={[styles.pageTitle, { color: isDark ? colors.text : '#1F2927' }]}
            >
              Diário
            </Text>
            <Text style={[styles.pageSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
              Acompanhe seus registros ao longo do tempo.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/mood/new' as any)}
            accessibilityRole="button"
            accessibilityLabel="Registrar novo momento de humor"
            style={styles.newRecordBtn}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2} style={{ marginRight: 6 }} />
            <Text style={styles.newRecordBtnText}>Registrar momento</Text>
          </TouchableOpacity>
        </View>

        {/* 2. CARD RESUMO ANALÍTICO ÚNICO */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E0E5E2',
            },
          ]}
        >
          {/* Abas de Período (7 dias, 30 dias, 90 dias) */}
          <View
            style={[styles.periodTabsRow, { borderBottomColor: isDark ? colors.border : '#E7EBE9' }]}
            {...(Platform.OS === 'web' ? ({ role: 'tablist', 'aria-label': 'Período do resumo' } as any) : {})}
          >
            {[
              { days: 7, label: '7 dias' },
              { days: 30, label: '30 dias' },
              { days: 90, label: '90 dias' },
            ].map((p) => {
              const isActive = selectedPeriod === p.days;
              return (
                <TouchableOpacity
                  key={p.days}
                  onPress={() => setSelectedPeriod(p.days as any)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  style={[styles.periodTabItem, isActive && styles.periodTabItemActive]}
                >
                  <Text
                    style={[
                      styles.periodTabText,
                      isActive && [styles.periodTabTextActive, { color: '#247B74' }],
                      !isActive && { color: isDark ? colors.textMuted : '#68736F' },
                    ]}
                  >
                    {p.label}
                  </Text>
                  {isActive && <View style={styles.activePeriodIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Linha das 3 Métricas com Divisores Verticais */}
          <View style={styles.metricsRow}>
            {/* Humor Médio */}
            <View style={styles.metricColumn}>
              <Text style={[styles.metricLabel, { color: isDark ? colors.textMuted : '#68736F' }]}>
                Humor médio
              </Text>
              <View style={styles.metricValueWrap}>
                <Text style={[styles.metricValueBold, { color: isDark ? colors.text : '#1F2927' }]}>
                  {periodMetrics.avgMood}
                </Text>
                <Text style={[styles.metricValueUnit, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  /5
                </Text>
              </View>
            </View>

            {/* Divisor Vertical 1 */}
            <View style={[styles.metricDivider, { backgroundColor: isDark ? colors.border : '#E7EBE9' }]} />

            {/* Ansiedade Média */}
            <View style={styles.metricColumn}>
              <Text style={[styles.metricLabel, { color: isDark ? colors.textMuted : '#68736F' }]}>
                Ansiedade média
              </Text>
              <View style={styles.metricValueWrap}>
                <Text style={[styles.metricValueBold, { color: isDark ? colors.text : '#1F2927' }]}>
                  {periodMetrics.avgAnxiety}
                </Text>
                <Text style={[styles.metricValueUnit, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  /10
                </Text>
              </View>
            </View>

            {/* Divisor Vertical 2 */}
            <View style={[styles.metricDivider, { backgroundColor: isDark ? colors.border : '#E7EBE9' }]} />

            {/* Total de Registros */}
            <View style={styles.metricColumn}>
              <Text style={[styles.metricLabel, { color: isDark ? colors.textMuted : '#68736F' }]}>
                {periodMetrics.totalRecords} {periodMetrics.totalRecords === 1 ? 'registro' : 'registros'}
              </Text>
              <View style={styles.metricValueWrap}>
                <Text style={[styles.metricValueBold, { color: isDark ? colors.text : '#1F2927' }]}>
                  {periodMetrics.totalRecords}
                </Text>
              </View>
            </View>
          </View>

          {/* Abas Seletoras de Métrica (Humor vs Ansiedade) */}
          <View style={styles.metricSelectorRow}>
            <TouchableOpacity
              onPress={() => setSelectedMetric('mood')}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedMetric === 'mood' }}
              style={[
                styles.metricTabItem,
                selectedMetric === 'mood' && styles.metricTabItemActiveMood,
              ]}
            >
              <Text
                style={[
                  styles.metricTabText,
                  selectedMetric === 'mood'
                    ? { color: '#247B74', fontWeight: '600' }
                    : { color: isDark ? colors.textMuted : '#68736F' },
                ]}
              >
                Humor
              </Text>
              {selectedMetric === 'mood' && <View style={[styles.activeMetricLine, { backgroundColor: '#247B74' }]} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedMetric('anxiety')}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedMetric === 'anxiety' }}
              style={[
                styles.metricTabItem,
                selectedMetric === 'anxiety' && styles.metricTabItemActiveAnxiety,
              ]}
            >
              <Text
                style={[
                  styles.metricTabText,
                  selectedMetric === 'anxiety'
                    ? { color: '#D87556', fontWeight: '600' }
                    : { color: isDark ? colors.textMuted : '#68736F' },
                ]}
              >
                Ansiedade
              </Text>
              {selectedMetric === 'anxiety' && <View style={[styles.activeMetricLine, { backgroundColor: '#D87556' }]} />}
            </TouchableOpacity>
          </View>

          {/* Título & Subtítulo Interno do Gráfico */}
          <View style={styles.chartTitleBlock}>
            <Text style={[styles.chartHeading, { color: isDark ? colors.text : '#1F2927' }]}>
              {selectedMetric === 'mood' ? 'Humor no período' : 'Ansiedade no período'}
            </Text>
            <Text style={[styles.chartSubheading, { color: isDark ? colors.textMuted : '#68736F' }]}>
              {selectedPeriod === 90 ? 'Média semanal dos registros' : 'Média diária dos registros'}
            </Text>
          </View>

          {/* O Gráfico Real */}
          <MoodLineChart
            records={records}
            days={selectedPeriod}
            metric={selectedMetric}
            onNavigateNew={() => router.push('/mood/new' as any)}
          />

          {/* Texto Descritivo Dinâmico Abaixo do Gráfico */}
          <View
            style={[
              styles.chartBottomInsight,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F7F8F5',
                borderColor: isDark ? colors.border : '#E7EBE9',
              },
            ]}
          >
            <TrendingUp size={20} color="#247B74" strokeWidth={1.75} style={{ marginRight: 12 }} />
            <Text style={[styles.chartBottomInsightText, { color: isDark ? colors.text : '#1F2927' }]}>
              Você fez {periodMetrics.totalRecords} {periodMetrics.totalRecords === 1 ? 'registro' : 'registros'} em{' '}
              {periodMetrics.uniqueDays} {periodMetrics.uniqueDays === 1 ? 'dia' : 'dias'}. Continue registrando para
              acompanhar suas mudanças ao longo do tempo.
            </Text>
          </View>
        </View>

        {/* 3. SEÇÃO REGISTROS RECENTES */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeaderRow}>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
            >
              Registros recentes
            </Text>

            <TouchableOpacity
              onPress={handleOpenFilterModal}
              accessibilityRole="button"
              accessibilityLabel={`Filtrar registros recentes. ${activeFiltersCount} filtros ativos.`}
              style={styles.filterBtn}
            >
              <SlidersHorizontal size={18} color="#247B74" strokeWidth={1.75} style={{ marginRight: 6 }} />
              <Text style={styles.filterBtnText}>Filtrar</Text>
              {activeFiltersCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Lista de Registros Agrupados por Data */}
          {groupedRecords.length > 0 ? (
            <View style={styles.recordsListBlock}>
              {groupedRecords.map((group) => (
                <View key={group.dateLabel} style={styles.dateGroupBlock}>
                  <Text style={[styles.dateGroupHeader, { color: isDark ? colors.textMuted : '#68736F' }]}>
                    {group.dateLabel}
                  </Text>

                  <View
                    style={[
                      styles.dateGroupCard,
                      {
                        backgroundColor: isDark ? colors.surface : '#FFFFFF',
                        borderColor: isDark ? colors.border : '#E0E5E2',
                      },
                    ]}
                  >
                    {group.items.map((record, index) => {
                      const moodInfo = getMoodInfo(record.mood);
                      const MoodIcon = moodInfo.Icon;
                      const timeStr = formatTime(record.createdAt);
                      const emotionsList = (record.emotions || []).join(', ');
                      const isLast = index === group.items.length - 1;

                      return (
                        <TouchableOpacity
                          key={record.id}
                          onPress={() => setSelectedRecordForDetail(record)}
                          accessibilityRole="button"
                          accessibilityLabel={`Registro: ${moodInfo.label}, ansiedade ${record.anxietyLevel} de 10, às ${timeStr}`}
                          style={[
                            styles.recordRow,
                            !isLast && { borderBottomWidth: 1, borderBottomColor: isDark ? colors.border : '#E7EBE9' },
                          ]}
                        >
                          {/* Ícone de Humor (24px, sem círculos atrás) */}
                          <View style={styles.recordIconWrap}>
                            <MoodIcon size={24} color={moodInfo.color} strokeWidth={1.75} />
                          </View>

                          {/* Centro: Nome do estado e horário/tags */}
                          <View style={styles.recordInfoCenter}>
                            <Text style={[styles.recordMoodName, { color: isDark ? colors.text : '#1F2927' }]}>
                              {moodInfo.label}
                            </Text>

                            <Text
                              style={[styles.recordMetaSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}
                              numberOfLines={1}
                            >
                              {emotionsList ? `${emotionsList} · ${timeStr}` : timeStr}
                            </Text>
                          </View>

                          {/* Direita: Ansiedade e Chevron */}
                          <View style={styles.recordRightWrap}>
                            <Text
                              style={[
                                styles.recordAnxietyText,
                                { color: record.anxietyLevel >= 4 ? '#D87556' : isDark ? colors.textMuted : '#68736F' },
                              ]}
                            >
                              Ansiedade {record.anxietyLevel}/10
                            </Text>
                            <ChevronRight size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: isDark ? colors.border : '#E0E5E2',
                },
              ]}
            >
              <Text style={[styles.emptyStateTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                Nenhum registro encontrado
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                {activeFiltersCount > 0
                  ? 'Nenhum registro corresponde aos filtros selecionados.'
                  : 'Comece a registrar como você está se sentindo para visualizar o histórico.'}
              </Text>

              {activeFiltersCount > 0 ? (
                <TouchableOpacity onPress={handleClearFilters} style={styles.emptyActionBtn}>
                  <Text style={styles.emptyActionBtnText}>Limpar filtros</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => router.push('/mood/new' as any)} style={styles.emptyActionBtn}>
                  <Text style={styles.emptyActionBtnText}>Registrar momento</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* 4. MODAL / BOTTOM SHEET DE FILTROS */}
      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: isDark ? colors.border : '#DFE4E1',
              },
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text
                accessibilityRole="header"
                aria-level={2}
                style={[styles.modalTitle, { color: isDark ? colors.text : '#1F2927' }]}
              >
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

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {/* Filtro: Humor */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterGroupTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Estado de humor
                </Text>
                <View style={styles.chipsWrap}>
                  {[
                    { id: 5, label: 'Muito bem' },
                    { id: 4, label: 'Bem' },
                    { id: 3, label: 'Neutro' },
                    { id: 2, label: 'Difícil' },
                    { id: 1, label: 'Muito difícil' },
                  ].map((item) => {
                    const isSelected = tempMoodFilter === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setTempMoodFilter(isSelected ? null : item.id)}
                        style={[
                          styles.filterChip,
                          isSelected && styles.filterChipActive,
                          { borderColor: isSelected ? '#247B74' : isDark ? colors.border : '#DFE4E1' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            isSelected && { color: '#247B74', fontWeight: '600' },
                            !isSelected && { color: isDark ? colors.text : '#1F2927' },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Filtro: Nível de Ansiedade */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterGroupTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Nível de ansiedade
                </Text>
                <View style={styles.chipsWrap}>
                  {[
                    { id: 'mild', label: 'Leve (0 a 3)' },
                    { id: 'moderate', label: 'Moderada (4 a 7)' },
                    { id: 'intense', label: 'Intensa (8 a 10)' },
                  ].map((item) => {
                    const isSelected = tempAnxietyFilter === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setTempAnxietyFilter(isSelected ? null : (item.id as any))}
                        style={[
                          styles.filterChip,
                          isSelected && styles.filterChipActive,
                          { borderColor: isSelected ? '#247B74' : isDark ? colors.border : '#DFE4E1' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            isSelected && { color: '#247B74', fontWeight: '600' },
                            !isSelected && { color: isDark ? colors.text : '#1F2927' },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Filtro: Emoções */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterGroupTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Emoções
                </Text>
                <View style={styles.chipsWrap}>
                  {AVAILABLE_EMOTIONS.slice(0, 10).map((emo) => {
                    const isSelected = tempEmotions.includes(emo);
                    return (
                      <TouchableOpacity
                        key={emo}
                        onPress={() => {
                          if (isSelected) {
                            setTempEmotions(tempEmotions.filter((e) => e !== emo));
                          } else {
                            setTempEmotions([...tempEmotions, emo]);
                          }
                        }}
                        style={[
                          styles.filterChip,
                          isSelected && styles.filterChipActive,
                          { borderColor: isSelected ? '#247B74' : isDark ? colors.border : '#DFE4E1' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            isSelected && { color: '#247B74', fontWeight: '600' },
                            !isSelected && { color: isDark ? colors.text : '#1F2927' },
                          ]}
                        >
                          {emo}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Filtro: Atividades */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterGroupTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Atividades
                </Text>
                <View style={styles.chipsWrap}>
                  {AVAILABLE_ACTIVITIES.map((act) => {
                    const isSelected = tempActivities.includes(act);
                    return (
                      <TouchableOpacity
                        key={act}
                        onPress={() => {
                          if (isSelected) {
                            setTempActivities(tempActivities.filter((a) => a !== act));
                          } else {
                            setTempActivities([...tempActivities, act]);
                          }
                        }}
                        style={[
                          styles.filterChip,
                          isSelected && styles.filterChipActive,
                          { borderColor: isSelected ? '#247B74' : isDark ? colors.border : '#DFE4E1' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            isSelected && { color: '#247B74', fontWeight: '600' },
                            !isSelected && { color: isDark ? colors.text : '#1F2927' },
                          ]}
                        >
                          {act}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Botões do Modal */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                onPress={handleClearFilters}
                style={[styles.modalSecondaryBtn, { borderColor: '#DFE4E1' }]}
              >
                <Text style={[styles.modalSecondaryBtnText, { color: '#68736F' }]}>Limpar filtros</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleApplyFilters}
                style={styles.modalPrimaryBtn}
              >
                <Text style={styles.modalPrimaryBtnText}>Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. MODAL DE DETALHES DO REGISTRO */}
      {selectedRecordForDetail && (
        <Modal
          visible={!!selectedRecordForDetail}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedRecordForDetail(null)}
        >
          <View style={styles.modalOverlayCenter}>
            <View
              style={[
                styles.detailCard,
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: isDark ? colors.border : '#E0E5E2',
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text
                  accessibilityRole="header"
                  aria-level={2}
                  style={[styles.modalTitle, { color: isDark ? colors.text : '#1F2927' }]}
                >
                  Detalhes do registro
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedRecordForDetail(null)}
                  style={{ padding: 4 }}
                >
                  <X size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />
                </TouchableOpacity>
              </View>

              <View style={styles.detailBody}>
                {/* Humor & Ansiedade */}
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: isDark ? colors.textMuted : '#68736F' }]}>Humor:</Text>
                  <Text style={[styles.detailValue, { color: isDark ? colors.text : '#1F2927', fontWeight: '600' }]}>
                    {getMoodInfo(selectedRecordForDetail.mood).label} ({selectedRecordForDetail.mood}/5)
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: isDark ? colors.textMuted : '#68736F' }]}>Ansiedade:</Text>
                  <Text style={[styles.detailValue, { color: '#D87556', fontWeight: '600' }]}>
                    {selectedRecordForDetail.anxietyLevel}/10
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: isDark ? colors.textMuted : '#68736F' }]}>Horário:</Text>
                  <Text style={[styles.detailValue, { color: isDark ? colors.text : '#1F2927' }]}>
                    {new Date(selectedRecordForDetail.createdAt).toLocaleString('pt-BR')}
                  </Text>
                </View>

                {selectedRecordForDetail.emotions && selectedRecordForDetail.emotions.length > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: isDark ? colors.textMuted : '#68736F' }]}>Emoções:</Text>
                    <Text style={[styles.detailValue, { color: isDark ? colors.text : '#1F2927' }]}>
                      {selectedRecordForDetail.emotions.join(', ')}
                    </Text>
                  </View>
                )}

                {selectedRecordForDetail.activities && selectedRecordForDetail.activities.length > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: isDark ? colors.textMuted : '#68736F' }]}>Atividades:</Text>
                    <Text style={[styles.detailValue, { color: isDark ? colors.text : '#1F2927' }]}>
                      {selectedRecordForDetail.activities.join(', ')}
                    </Text>
                  </View>
                )}

                {selectedRecordForDetail.notes && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[styles.detailLabel, { color: isDark ? colors.textMuted : '#68736F', marginBottom: 4 }]}>
                      Anotações:
                    </Text>
                    <Text style={[styles.detailNotesText, { color: isDark ? colors.text : '#1F2927' }]}>
                      {selectedRecordForDetail.notes}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.detailActionsRow}>
                <TouchableOpacity
                  onPress={() => {
                    const id = selectedRecordForDetail.id;
                    setRecordToDelete(id);
                  }}
                  style={styles.detailDeleteBtn}
                >
                  <Trash2 size={16} color="#C84E45" strokeWidth={1.75} style={{ marginRight: 6 }} />
                  <Text style={styles.detailDeleteBtnText}>Excluir registro</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedRecordForDetail(null)}
                  style={styles.detailCloseBtn}
                >
                  <Text style={styles.detailCloseBtnText}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 6. DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <ConfirmDialog
        visible={!!recordToDelete}
        title="Excluir registro"
        message="Tem certeza de que deseja excluir este registro do diário? Esta ação não poderá ser desfeita."
        confirmTitle="Excluir"
        cancelTitle="Cancelar"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteRecord}
        onCancel={() => setRecordToDelete(null)}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 48,
  },
  containerDesktop: {
    maxWidth: 960,
    alignSelf: 'center',
  },

  // Cabeçalho
  headerRow: {
    marginBottom: 20,
  },
  headerRowDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 14,
  },
  newRecordBtn: {
    height: 44,
    backgroundColor: '#247B74',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  newRecordBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Card Resumo Analítico Único
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 28,
  },
  periodTabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    paddingBottom: 4,
    marginBottom: 18,
  },
  periodTabItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    position: 'relative',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabItemActive: {},
  periodTabText: {
    fontSize: 14,
    fontWeight: '400',
  },
  periodTabTextActive: {
    fontWeight: '600',
  },
  activePeriodIndicator: {
    position: 'absolute',
    bottom: -5,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#247B74',
    borderRadius: 1,
  },

  // Métricas
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 44,
    marginHorizontal: 8,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValueBold: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  metricValueUnit: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 2,
  },

  // Seletor de Métrica (Humor vs Ansiedade)
  metricSelectorRow: {
    flexDirection: 'row',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EBE9',
    marginBottom: 16,
  },
  metricTabItem: {
    paddingVertical: 8,
    position: 'relative',
  },
  metricTabItemActiveMood: {},
  metricTabItemActiveAnxiety: {},
  metricTabText: {
    fontSize: 14,
  },
  activeMetricLine: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },

  // Título Interno do Gráfico
  chartTitleBlock: {
    marginBottom: 8,
  },
  chartHeading: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  chartSubheading: {
    fontSize: 12,
    marginTop: 2,
  },

  // Texto Descritivo Abaixo do Gráfico
  chartBottomInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
  },
  chartBottomInsightText: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },

  // Seção Registros Recentes
  recentSection: {
    width: '100%',
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  filterBtnText: {
    color: '#247B74',
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: '#247B74',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Lista de Registros
  recordsListBlock: {
    gap: 16,
  },
  dateGroupBlock: {
    marginBottom: 8,
  },
  dateGroupHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateGroupCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
  },
  recordIconWrap: {
    marginRight: 14,
  },
  recordInfoCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  recordMoodName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  recordMetaSubtitle: {
    fontSize: 13,
  },
  recordRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordAnxietyText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Estado Vazio
  emptyStateCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    maxWidth: 300,
  },
  emptyActionBtn: {
    backgroundColor: '#247B74',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal de Filtros
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 18,
  },
  filterGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    backgroundColor: '#EDF7F5',
  },
  filterChipText: {
    fontSize: 13,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#247B74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal de Detalhes
  detailCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignSelf: 'center',
  },
  detailBody: {
    marginVertical: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 14,
  },
  detailNotesText: {
    fontSize: 13,
    lineHeight: 19,
    padding: 10,
    backgroundColor: '#F7F8F5',
    borderRadius: 8,
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  detailDeleteBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F8D7DA',
    backgroundColor: '#FDF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailDeleteBtnText: {
    color: '#C84E45',
    fontSize: 13,
    fontWeight: '600',
  },
  detailCloseBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#247B74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
