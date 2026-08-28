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

  // 2. Resumo Analítico Real
  const dynamicSummaryInsight = useMemo(() => {
    if (periodRecords.length === 0) {
      return {
        statusText: 'Ainda não há registros neste período.',
        detailText: 'Adicione check-ins diários para acompanhar suas mudanças de humor.',
      };
    }

    if (periodRecords.length === 1) {
      return {
        statusText: 'Você possui 1 registro neste período.',
        detailText: '1 registro em 1 dia.',
      };
    }

    // Calcular variância real dos registros
    const sum = periodRecords.reduce((acc, r) => acc + r.mood, 0);
    const mean = sum / periodRecords.length;
    const variance =
      periodRecords.reduce((acc, r) => acc + Math.pow(r.mood - mean, 2), 0) /
      periodRecords.length;
    const stdDev = Math.sqrt(variance);

    let statusText = 'Seu humor ficou estável neste período.';
    if (stdDev > 1.25) {
      statusText = 'Seu humor oscilou ao longo deste período.';
    } else if (stdDev >= 0.75) {
      statusText = 'Seu humor apresentou variações moderadas neste período.';
    } else {
      statusText = 'Seu humor ficou estável neste período.';
    }

    const detailText = `${periodMetrics.totalRecords} ${
      periodMetrics.totalRecords === 1 ? 'registro' : 'registros'
    } em ${periodMetrics.uniqueDays} ${
      periodMetrics.uniqueDays === 1 ? 'dia' : 'dias'
    }.`;

    return { statusText, detailText };
  }, [periodRecords, periodMetrics]);

  // 3. Filtro dos registros recentes
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

  // 4. Agrupar registros por data (ex: "27 ago 2026")
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
      const monthStr = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const year = d.getFullYear();
      const dateLabel = `${day} ${monthStr} ${year}`;

      groups.push({
        dateLabel,
        items: map[dateKey],
      });
    });

    return groups;
  }, [filteredRecentRecords]);

  // Helpers Visuais de Humor
  const getMoodVisual = (score: number) => {
    switch (score) {
      case 5:
        return { label: 'Muito bem', color: '#238C82', bg: isDark ? '#1C3833' : '#EAF5F2', Icon: Smile };
      case 4:
        return { label: 'Bem', color: '#238C82', bg: isDark ? '#1C3833' : '#EAF5F2', Icon: Smile };
      case 3:
        return { label: 'Neutro', color: '#D98968', bg: isDark ? '#3D2820' : '#FDF3EE', Icon: Meh };
      case 2:
        return { label: 'Mal', color: '#C86242', bg: isDark ? '#3D201A' : '#FCECE8', Icon: Frown };
      case 1:
        return { label: 'Muito mal', color: '#BA4328', bg: isDark ? '#3A1914' : '#FAE7E3', Icon: Frown };
      default:
        return { label: 'Neutro', color: '#66726F', bg: isDark ? '#2D3835' : '#F0F3F2', Icon: Meh };
    }
  };

  const openFilterModal = () => {
    setTempMoodFilter(appliedMoodFilter);
    setTempAnxietyFilter(appliedAnxietyFilter);
    setTempEmotions([...appliedEmotions]);
    setTempActivities([...appliedActivities]);
    setIsFilterModalOpen(true);
  };

  const applyFilters = () => {
    setAppliedMoodFilter(tempMoodFilter);
    setAppliedAnxietyFilter(tempAnxietyFilter);
    setAppliedEmotions(tempEmotions);
    setAppliedActivities(tempActivities);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
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

  const toggleTempEmotion = (emotion: string) => {
    if (tempEmotions.includes(emotion)) {
      setTempEmotions(tempEmotions.filter((e) => e !== emotion));
    } else {
      setTempEmotions([...tempEmotions, emotion]);
    }
  };

  const toggleTempActivity = (activity: string) => {
    if (tempActivities.includes(activity)) {
      setTempActivities(tempActivities.filter((a) => a !== activity));
    } else {
      setTempActivities([...tempActivities, activity]);
    }
  };

  const confirmDeleteRecord = (id: string) => {
    setRecordToDelete(id);
  };

  const executeDelete = async () => {
    if (!recordToDelete) return;
    try {
      setIsDeleting(true);
      await deleteRecord(recordToDelete);
      showToast({ message: 'Registro excluído.', type: 'success' });
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
        <View style={styles.headerBlock}>
          <Text
            accessibilityRole="header"
            aria-level={1}
            style={[styles.pageTitle, { color: isDark ? '#FFFFFF' : '#17211F' }]}
          >
            Diário
          </Text>
          <Text style={[styles.pageSubtitle, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
            Acompanhe como você tem se sentido ao longo do tempo.
          </Text>

          {/* Botão de Largura Total, 48px de Altura e Cantos de 12px */}
          <TouchableOpacity
            onPress={() => router.push('/mood/new' as any)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Registrar novo momento de humor"
            style={[
              styles.newRecordBtnFull,
              { backgroundColor: isDark ? '#5ECFC3' : '#238C82' },
            ]}
          >
            <Plus size={18} color={isDark ? '#111827' : '#FFFFFF'} strokeWidth={2.2} style={{ marginRight: 6 }} />
            <Text
              style={[
                styles.newRecordBtnFullText,
                { color: isDark ? '#111827' : '#FFFFFF' },
              ]}
            >
              + Registrar momento
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. PAINEL ÚNICO: PERÍODO E INDICADORES */}
        <View
          style={[
            styles.indicatorsPanel,
            {
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E7E5',
            },
          ]}
        >
          {/* Abas de Período (7 dias, 30 dias, 90 dias) */}
          <View
            style={[
              styles.periodTabsPillContainer,
              {
                backgroundColor: isDark ? '#111827' : '#F7F8F5',
              },
            ]}
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
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  style={[
                    styles.periodTabPill,
                    isActive && [
                      styles.periodTabPillActive,
                      { backgroundColor: isDark ? '#1C3833' : '#EAF5F2' },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.periodTabPillText,
                      isActive && { color: isDark ? '#5ECFC3' : '#238C82', fontWeight: '700' },
                      !isActive && { color: isDark ? '#F1F5F9' : '#66726F', fontWeight: '500' },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 3 Colunas com Números Destacados e Separadores Discretos */}
          <View style={styles.metricsRow}>
            {/* Humor Médio */}
            <View style={styles.metricColumn}>
              <Text style={[styles.metricLabel, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                Humor médio
              </Text>
              <View style={styles.metricValueWrap}>
                <Text style={[styles.metricValueBold, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
                  {periodMetrics.avgMood}
                </Text>
                <Text style={[styles.metricValueUnit, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                  /5
                </Text>
              </View>
            </View>

            {/* Separador Discreto 1 */}
            <View style={[styles.metricDivider, { backgroundColor: isDark ? '#334155' : '#E2E7E5' }]} />

            {/* Ansiedade Média */}
            <View style={styles.metricColumn}>
              <Text style={[styles.metricLabel, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                Ansiedade média
              </Text>
              <View style={styles.metricValueWrap}>
                <Text style={[styles.metricValueBold, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
                  {periodMetrics.avgAnxiety}
                </Text>
                <Text style={[styles.metricValueUnit, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                  /10
                </Text>
              </View>
            </View>

            {/* Separador Discreto 2 */}
            <View style={[styles.metricDivider, { backgroundColor: isDark ? '#334155' : '#E2E7E5' }]} />

            {/* Total de Registros */}
            <View style={styles.metricColumn}>
              <Text style={[styles.metricLabel, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                {periodMetrics.totalRecords === 1 ? '1 registro' : 'Registros'}
              </Text>
              <View style={styles.metricValueWrap}>
                <Text style={[styles.metricValueBold, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
                  {periodMetrics.totalRecords}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3 & 4. CARD DO GRÁFICO (240px com fundo branco e borda suave) */}
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E7E5',
            },
          ]}
        >
          {/* Seletor de Métrica: [Humor] [Ansiedade] com linha verde curta */}
          <View style={[styles.metricSelectorRow, { borderBottomColor: isDark ? '#334155' : '#E2E7E5' }]}>
            <TouchableOpacity
              onPress={() => setSelectedMetric('mood')}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedMetric === 'mood' }}
              style={styles.metricTabItem}
            >
              <Text
                style={[
                  styles.metricTabText,
                  selectedMetric === 'mood'
                    ? { color: isDark ? '#5ECFC3' : '#238C82', fontWeight: '700' }
                    : { color: isDark ? '#F1F5F9' : '#66726F', fontWeight: '500' },
                ]}
              >
                Humor
              </Text>
              {selectedMetric === 'mood' && (
                <View
                  style={[
                    styles.activeMetricLine,
                    { backgroundColor: isDark ? '#5ECFC3' : '#238C82' },
                  ]}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedMetric('anxiety')}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedMetric === 'anxiety' }}
              style={styles.metricTabItem}
            >
              <Text
                style={[
                  styles.metricTabText,
                  selectedMetric === 'anxiety'
                    ? { color: isDark ? '#F69D7A' : '#D87556', fontWeight: '700' }
                    : { color: isDark ? '#F1F5F9' : '#66726F', fontWeight: '500' },
                ]}
              >
                Ansiedade
              </Text>
              {selectedMetric === 'anxiety' && (
                <View
                  style={[
                    styles.activeMetricLine,
                    { backgroundColor: isDark ? '#F69D7A' : '#D87556' },
                  ]}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Cabeçalho do Gráfico + Ação Discreta “Ver detalhes” */}
          <View style={styles.chartHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chartHeading, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
                {selectedMetric === 'mood' ? 'Evolução do humor' : 'Evolução da ansiedade'}
              </Text>
              <Text style={[styles.chartSubheading, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                {selectedPeriod === 90 ? 'Média semanal dos registros' : 'Média diária dos registros'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/diary/history' as any)}
              activeOpacity={0.7}
              accessibilityRole="link"
              accessibilityLabel="Ver detalhes do histórico completo"
              style={styles.viewDetailsBtn}
            >
              <Text
                style={[
                  styles.viewDetailsBtnText,
                  { color: isDark ? '#5ECFC3' : '#238C82' },
                ]}
              >
                Ver detalhes
              </Text>
            </TouchableOpacity>
          </View>

          {/* Gráfico Real com Altura de 240px */}
          <MoodLineChart
            records={records}
            days={selectedPeriod}
            metric={selectedMetric}
            onNavigateNew={() => router.push('/mood/new' as any)}
          />

          {/* 6. Resumo com Linha Verde à Esquerda e Dados Reais */}
          <View
            style={[
              styles.summaryInsightBox,
              {
                backgroundColor: isDark ? '#111827' : '#F7F8F5',
                borderLeftColor: isDark ? '#5ECFC3' : '#238C82',
              },
            ]}
          >
            <Text
              style={[
                styles.summaryInsightStatus,
                { color: isDark ? '#FFFFFF' : '#17211F' },
              ]}
            >
              {dynamicSummaryInsight.statusText}
            </Text>
            <Text
              style={[
                styles.summaryInsightDetail,
                { color: isDark ? '#F1F5F9' : '#66726F' },
              ]}
            >
              {dynamicSummaryInsight.detailText}
            </Text>
          </View>
        </View>

        {/* 5. SEÇÃO REGISTROS RECENTES */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeaderRow}>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#17211F' }]}
            >
              Registros recentes
            </Text>

            <TouchableOpacity
              onPress={openFilterModal}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Filtrar registros do diário"
              style={styles.filterBtn}
            >
              <SlidersHorizontal size={15} color={isDark ? '#5ECFC3' : '#238C82'} style={{ marginRight: 6 }} />
              <Text style={[styles.filterBtnText, { color: isDark ? '#5ECFC3' : '#238C82' }]}>
                Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lista de Registros Agrupados por Dia */}
          {groupedRecords.length === 0 ? (
            <View
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#E2E7E5',
                },
              ]}
            >
              <Text style={[styles.emptyStateTitle, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
                {records.length === 0 ? 'Nenhum registro no diário' : 'Nenhum registro corresponde aos filtros'}
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                {records.length === 0
                  ? 'Você ainda não registrou como se sente. Faça o seu primeiro check-in agora!'
                  : 'Tente limpar ou ajustar os filtros aplicados para visualizar mais registros.'}
              </Text>
              {records.length > 0 && activeFiltersCount > 0 && (
                <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersBtn}>
                  <Text style={styles.clearFiltersBtnText}>Limpar filtros</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            groupedRecords.map((group) => (
              <View key={group.dateLabel} style={styles.dateGroupWrap}>
                <Text style={[styles.dateGroupHeading, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                  {group.dateLabel}
                </Text>

                {group.items.map((record) => {
                  const moodInfo = getMoodVisual(record.mood);
                  const Icon = moodInfo.Icon;
                  const timeStr = new Date(record.createdAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <TouchableOpacity
                      key={record.id}
                      activeOpacity={0.7}
                      onPress={() => setSelectedRecordForDetail(record)}
                      accessibilityRole="button"
                      accessibilityLabel={`Registro: ${moodInfo.label}, ansiedade ${record.anxietyLevel} de 10, às ${timeStr}`}
                      style={[
                        styles.recordItemCard,
                        {
                          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                          borderColor: isDark ? '#334155' : '#E2E7E5',
                        },
                      ]}
                    >
                      {/* Ícone de Humor */}
                      <View style={[styles.recordMoodIconWrap, { backgroundColor: moodInfo.bg }]}>
                        <Icon size={20} color={moodInfo.color} strokeWidth={2} />
                      </View>

                      {/* Informações Principais */}
                      <View style={styles.recordContentCol}>
                        <View style={styles.recordTopRow}>
                          <Text style={[styles.recordMoodLabel, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
                            {moodInfo.label}
                          </Text>
                          <Text style={[styles.recordTimeText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                            {timeStr}
                          </Text>
                        </View>

                        <View style={styles.recordMetaRow}>
                          <Text
                            style={[
                              styles.recordAnxietyText,
                              { color: record.anxietyLevel >= 4 ? '#D87556' : (isDark ? '#5ECFC3' : '#238C82') },
                            ]}
                          >
                            Ansiedade {record.anxietyLevel}/10
                          </Text>
                          {record.activities && record.activities.length > 0 && (
                            <Text style={[styles.recordActivityCountText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                              • {record.activities.length} {record.activities.length === 1 ? 'atividade' : 'atividades'}
                            </Text>
                          )}
                        </View>

                        {/* Emoções */}
                        {record.emotions && record.emotions.length > 0 && (
                          <View style={styles.recordChipsRow}>
                            {record.emotions.slice(0, 3).map((emo) => (
                              <View
                                key={emo}
                                style={[
                                  styles.recordMiniChip,
                                  { backgroundColor: isDark ? '#111827' : '#F7F8F5' },
                                ]}
                              >
                                <Text style={[styles.recordMiniChipText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                                  {emo}
                                </Text>
                              </View>
                            ))}
                            {record.emotions.length > 3 && (
                              <Text style={[styles.recordMoreChipsText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                                +{record.emotions.length - 3}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>

                      <ChevronRight size={18} color={isDark ? '#F1F5F9' : '#66726F'} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </View>

        {/* MODAL DE FILTRO */}
        <Modal
          visible={isFilterModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsFilterModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.filterModalContent,
                {
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#E2E7E5',
                },
              ]}
            >
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
                  Filtrar registros
                </Text>
                <TouchableOpacity
                  onPress={() => setIsFilterModalOpen(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar filtros"
                >
                  <X size={20} color={isDark ? '#F1F5F9' : '#66726F'} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollArea}>
                {/* 1. Humor */}
                <Text style={[styles.filterSectionTitle, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
                  Nível de humor
                </Text>
                <View style={styles.filterOptionsRow}>
                  {[
                    { score: 5, label: 'Muito bem' },
                    { score: 4, label: 'Bem' },
                    { score: 3, label: 'Neutro' },
                    { score: 2, label: 'Mal' },
                    { score: 1, label: 'Muito mal' },
                  ].map((item) => {
                    const isSelected = tempMoodFilter === item.score;
                    return (
                      <TouchableOpacity
                        key={item.score}
                        onPress={() => setTempMoodFilter(isSelected ? null : item.score)}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: isSelected
                              ? (isDark ? '#1C3833' : '#EAF5F2')
                              : (isDark ? '#111827' : '#F7F8F5'),
                            borderColor: isSelected
                              ? (isDark ? '#5ECFC3' : '#238C82')
                              : (isDark ? '#334155' : '#E2E7E5'),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            {
                              color: isSelected
                                ? (isDark ? '#5ECFC3' : '#238C82')
                                : (isDark ? '#F1F5F9' : '#66726F'),
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 2. Ansiedade */}
                <Text style={[styles.filterSectionTitle, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
                  Nível de ansiedade
                </Text>
                <View style={styles.filterOptionsRow}>
                  {[
                    { key: 'mild', label: 'Leve (0-3)' },
                    { key: 'moderate', label: 'Moderada (4-7)' },
                    { key: 'intense', label: 'Intensa (8-10)' },
                  ].map((item) => {
                    const isSelected = tempAnxietyFilter === item.key;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        onPress={() => setTempAnxietyFilter(isSelected ? null : (item.key as any))}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: isSelected
                              ? (isDark ? '#1C3833' : '#EAF5F2')
                              : (isDark ? '#111827' : '#F7F8F5'),
                            borderColor: isSelected
                              ? (isDark ? '#5ECFC3' : '#238C82')
                              : (isDark ? '#334155' : '#E2E7E5'),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            {
                              color: isSelected
                                ? (isDark ? '#5ECFC3' : '#238C82')
                                : (isDark ? '#F1F5F9' : '#66726F'),
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 3. Emoções */}
                <Text style={[styles.filterSectionTitle, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
                  Sentimentos
                </Text>
                <View style={styles.filterOptionsWrap}>
                  {AVAILABLE_EMOTIONS.slice(0, 10).map((emo) => {
                    const isSelected = tempEmotions.includes(emo);
                    return (
                      <TouchableOpacity
                        key={emo}
                        onPress={() => toggleTempEmotion(emo)}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: isSelected
                              ? (isDark ? '#1C3833' : '#EAF5F2')
                              : (isDark ? '#111827' : '#F7F8F5'),
                            borderColor: isSelected
                              ? (isDark ? '#5ECFC3' : '#238C82')
                              : (isDark ? '#334155' : '#E2E7E5'),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            {
                              color: isSelected
                                ? (isDark ? '#5ECFC3' : '#238C82')
                                : (isDark ? '#F1F5F9' : '#66726F'),
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {emo}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 4. Atividades */}
                <Text style={[styles.filterSectionTitle, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
                  Atividades
                </Text>
                <View style={styles.filterOptionsWrap}>
                  {AVAILABLE_ACTIVITIES.slice(0, 10).map((act) => {
                    const isSelected = tempActivities.includes(act);
                    return (
                      <TouchableOpacity
                        key={act}
                        onPress={() => toggleTempActivity(act)}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: isSelected
                              ? (isDark ? '#1C3833' : '#EAF5F2')
                              : (isDark ? '#111827' : '#F7F8F5'),
                            borderColor: isSelected
                              ? (isDark ? '#5ECFC3' : '#238C82')
                              : (isDark ? '#334155' : '#E2E7E5'),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            {
                              color: isSelected
                                ? (isDark ? '#5ECFC3' : '#238C82')
                                : (isDark ? '#F1F5F9' : '#66726F'),
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {act}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Botões do Modal */}
              <View style={[styles.modalActionsRow, { borderTopColor: isDark ? '#334155' : '#E2E7E5' }]}>
                <TouchableOpacity onPress={clearFilters} style={styles.modalSecondaryBtn}>
                  <Text style={[styles.modalSecondaryBtnText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                    Limpar tudo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={applyFilters}
                  style={[styles.modalPrimaryBtn, { backgroundColor: isDark ? '#5ECFC3' : '#238C82' }]}
                >
                  <Text style={[styles.modalPrimaryBtnText, { color: isDark ? '#111827' : '#FFFFFF' }]}>
                    Aplicar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL DE DETALHES DO REGISTRO */}
        {selectedRecordForDetail && (
          <Modal
            visible={!!selectedRecordForDetail}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setSelectedRecordForDetail(null)}
          >
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.detailModalCard,
                  {
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E7E5',
                  },
                ]}
              >
                <View style={styles.modalHeaderRow}>
                  <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
                    Detalhes do registro
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedRecordForDetail(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar detalhes"
                  >
                    <X size={20} color={isDark ? '#F1F5F9' : '#66726F'} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailModalBody}>
                  {/* Data e Hora */}
                  <Text style={[styles.detailDateText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                    {new Date(selectedRecordForDetail.createdAt).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    às{' '}
                    {new Date(selectedRecordForDetail.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>

                  {/* Humor e Ansiedade */}
                  <View style={styles.detailScoresRow}>
                    <View
                      style={[
                        styles.detailScoreBox,
                        {
                          backgroundColor: isDark ? '#111827' : '#F7F8F5',
                          borderColor: isDark ? '#334155' : '#E2E7E5',
                        },
                      ]}
                    >
                      <Text style={[styles.detailScoreLabel, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                        Humor
                      </Text>
                      <Text style={[styles.detailScoreValue, { color: isDark ? '#5ECFC3' : '#238C82' }]}>
                        {getMoodVisual(selectedRecordForDetail.mood).label} ({selectedRecordForDetail.mood}/5)
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.detailScoreBox,
                        {
                          backgroundColor: isDark ? '#111827' : '#F7F8F5',
                          borderColor: isDark ? '#334155' : '#E2E7E5',
                        },
                      ]}
                    >
                      <Text style={[styles.detailScoreLabel, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                        Ansiedade
                      </Text>
                      <Text
                        style={[
                          styles.detailScoreValue,
                          { color: selectedRecordForDetail.anxietyLevel >= 4 ? '#D87556' : (isDark ? '#5ECFC3' : '#238C82') },
                        ]}
                      >
                        {selectedRecordForDetail.anxietyLevel}/10
                      </Text>
                    </View>
                  </View>

                  {/* Emoções */}
                  {selectedRecordForDetail.emotions && selectedRecordForDetail.emotions.length > 0 && (
                    <View style={styles.detailSectionBlock}>
                      <Text style={[styles.detailSectionHeading, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
                        Sentimentos
                      </Text>
                      <View style={styles.filterOptionsWrap}>
                        {selectedRecordForDetail.emotions.map((emo) => (
                          <View
                            key={emo}
                            style={[
                              styles.detailChip,
                              {
                                backgroundColor: isDark ? '#1C3833' : '#EAF5F2',
                                borderColor: isDark ? '#5ECFC3' : '#238C82',
                              },
                            ]}
                          >
                            <Text style={[styles.detailChipText, { color: isDark ? '#5ECFC3' : '#238C82' }]}>
                              {emo}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Atividades */}
                  {selectedRecordForDetail.activities && selectedRecordForDetail.activities.length > 0 && (
                    <View style={styles.detailSectionBlock}>
                      <Text style={[styles.detailSectionHeading, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
                        Atividades
                      </Text>
                      <View style={styles.filterOptionsWrap}>
                        {selectedRecordForDetail.activities.map((act) => (
                          <View
                            key={act}
                            style={[
                              styles.detailChip,
                              {
                                backgroundColor: isDark ? '#111827' : '#F7F8F5',
                                borderColor: isDark ? '#334155' : '#E2E7E5',
                              },
                            ]}
                          >
                            <Text style={[styles.detailChipText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
                              {act}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Notas */}
                  {selectedRecordForDetail.notes ? (
                    <View style={styles.detailSectionBlock}>
                      <Text style={[styles.detailSectionHeading, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
                        Anotações
                      </Text>
                      <Text style={[styles.detailNotesText, { color: isDark ? '#F1F5F9' : '#17211F' }]}>
                        {selectedRecordForDetail.notes}
                      </Text>
                    </View>
                  ) : null}
                </ScrollView>

                {/* Ações do Modal de Detalhes */}
                <View style={[styles.modalActionsRow, { borderTopColor: isDark ? '#334155' : '#E2E7E5' }]}>
                  <TouchableOpacity
                    onPress={() => confirmDeleteRecord(selectedRecordForDetail.id)}
                    style={styles.deleteRecordBtn}
                  >
                    <Trash2 size={16} color="#BA4328" style={{ marginRight: 6 }} />
                    <Text style={styles.deleteRecordBtnText}>Excluir registro</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSelectedRecordForDetail(null)}
                    style={[styles.modalPrimaryBtn, { backgroundColor: isDark ? '#5ECFC3' : '#238C82' }]}
                  >
                    <Text style={[styles.modalPrimaryBtnText, { color: isDark ? '#111827' : '#FFFFFF' }]}>
                      Fechar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO */}
        <ConfirmDialog
          visible={!!recordToDelete}
          title="Excluir este registro?"
          message="Esta ação não pode ser desfeita e os dados deste momento serão removidos do seu histórico."
          confirmTitle={isDeleting ? 'Excluindo...' : 'Excluir'}
          cancelTitle="Cancelar"
          isDestructive={true}
          isLoading={isDeleting}
          onConfirm={executeDelete}
          onCancel={() => setRecordToDelete(null)}
        />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  containerDesktop: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },

  // 1. Cabeçalho
  headerBlock: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 16,
  },
  newRecordBtnFull: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  newRecordBtnFullText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // 2. Painel de Indicadores Único
  indicatorsPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  periodTabsPillContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 4,
    marginBottom: 18,
  },
  periodTabPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  periodTabPillActive: {},
  periodTabPillText: {
    fontSize: 13.5,
  },

  // Métricas
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 38,
    marginHorizontal: 4,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '400',
  },
  metricValueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValueBold: {
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  metricValueUnit: {
    fontSize: 13,
    fontWeight: '400',
    marginLeft: 2,
  },

  // 3 & 4. Card do Gráfico
  chartCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  metricSelectorRow: {
    flexDirection: 'row',
    gap: 20,
    borderBottomWidth: 1,
    marginBottom: 16,
    paddingBottom: 2,
  },
  metricTabItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: 'relative',
  },
  metricTabText: {
    fontSize: 14.5,
  },
  activeMetricLine: {
    position: 'absolute',
    bottom: -1,
    left: 4,
    right: 4,
    height: 2.5,
    borderRadius: 1.5,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartHeading: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  chartSubheading: {
    fontSize: 12.5,
    marginTop: 2,
  },
  viewDetailsBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewDetailsBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },

  // 6. Resumo com Linha Verde à Esquerda
  summaryInsightBox: {
    borderLeftWidth: 3.5,
    paddingLeft: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 14,
  },
  summaryInsightStatus: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: 2,
  },
  summaryInsightDetail: {
    fontSize: 12.5,
    lineHeight: 18,
  },

  // 5. Seção Registros Recentes
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
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  filterBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  emptyStateCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 300,
  },
  clearFiltersBtn: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearFiltersBtnText: {
    color: '#238C82',
    fontSize: 13,
    fontWeight: '600',
  },
  dateGroupWrap: {
    marginBottom: 16,
  },
  dateGroupHeading: {
    fontSize: 12.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  recordItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  recordMoodIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordContentCol: {
    flex: 1,
    minWidth: 0,
  },
  recordTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  recordMoodLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  recordTimeText: {
    fontSize: 12,
  },
  recordMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordAnxietyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  recordActivityCountText: {
    fontSize: 12,
    marginLeft: 6,
  },
  recordChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  recordMiniChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recordMiniChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  recordMoreChipsText: {
    fontSize: 11,
    marginLeft: 2,
  },

  // Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  filterModalContent: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalScrollArea: {
    maxHeight: 400,
  },
  filterSectionTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 16,
  },
  modalSecondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  modalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalPrimaryBtn: {
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Modal Detalhes
  detailModalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  detailModalBody: {
    maxHeight: 400,
  },
  detailDateText: {
    fontSize: 13,
    marginBottom: 14,
  },
  detailScoresRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  detailScoreBox: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  detailScoreLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailScoreValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  detailSectionBlock: {
    marginBottom: 14,
  },
  detailSectionHeading: {
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  detailChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  detailChipText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  detailNotesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  deleteRecordBtnText: {
    color: '#BA4328',
    fontSize: 13.5,
    fontWeight: '600',
  },
});
