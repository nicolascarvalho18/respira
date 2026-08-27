import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  X,
  Play,
  Leaf,
  Bookmark,
  TrendingUp,
  SlidersHorizontal,
  Clock,
  Video,
  Headphones,
  Volume2,
  RotateCcw,
  Compass,
  Heart,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { PracticeCard } from '../../src/components/practices/PracticeCard';
import { usePracticeStore, DurationFilter, LevelFilter, FormatFilter, ObjectiveFilter } from '../../src/store/practiceStore';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { HarmonicWaves } from '../../src/components/illustrations/HarmonicWaves';
import { Practice, PracticeCategory } from '../../src/types';

export default function PracticesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();
  const { user } = useAuth();
  const userId = user?.id || 'demo-user-1';

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Práticas Guiadas — Respira';
    }
  }, []);

  const {
    practices,
    userProgress,
    selectedCategory,
    selectedDuration,
    selectedLevel,
    selectedFormat,
    selectedObjective,
    searchQuery,
    setSelectedCategory,
    setSelectedDuration,
    setSelectedLevel,
    setSelectedFormat,
    setSelectedObjective,
    setSearchQuery,
    resetFilters,
    toggleFavorite,
    fetchPractices,
    fetchUserProgress,
    getFilteredPractices,
    getRecommendedPractices,
    getInProgressPractices,
    getQuickPractices,
    getNewPractices,
    getMostCompletedPractices,
  } = usePracticeStore();

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    fetchPractices();
    fetchUserProgress(userId);
  }, [userId]);

  // As 9 Categorias Solicitadas + Todas + Favoritas
  const categoryTabs = [
    { id: 'all', label: 'Todas' },
    { id: 'breathing', label: 'Respiração' },
    { id: 'guided_meditation', label: 'Meditação guiada' },
    { id: 'body_movement', label: 'Corpo e movimento' },
    { id: 'relaxation', label: 'Relaxamento' },
    { id: 'sleep', label: 'Sono' },
    { id: 'mindfulness_focus', label: 'Atenção e foco' },
    { id: 'quick_pauses', label: 'Pausas rápidas' },
    { id: 'morning_routine', label: 'Rotina da manhã' },
    { id: 'bedtime_prep', label: 'Preparação para dormir' },
    { id: 'favorites', label: 'Favoritas' },
  ];

  // Filtros de Duração
  const durationOptions: { id: DurationFilter; label: string }[] = [
    { id: 'all', label: 'Qualquer duração' },
    { id: 'up_to_5', label: 'Até 5 min' },
    { id: '5_to_10', label: '5 a 10 min' },
    { id: '10_to_20', label: '10 a 20 min' },
    { id: 'more_than_20', label: 'Mais de 20 min' },
  ];

  // Filtros de Nível
  const levelOptions: { id: LevelFilter; label: string }[] = [
    { id: 'all', label: 'Todos os níveis' },
    { id: 'Iniciante', label: 'Iniciante' },
    { id: 'Intermediário', label: 'Intermediário' },
    { id: 'Avançado', label: 'Avançado' },
  ];

  // Filtros de Formato
  const formatOptions: { id: FormatFilter; label: string }[] = [
    { id: 'all', label: 'Todos os formatos' },
    { id: 'video', label: 'Vídeo' },
    { id: 'audio', label: 'Áudio' },
    { id: 'interactive', label: 'Interativo' },
  ];

  // Filtros de Objetivo
  const objectiveOptions: { id: ObjectiveFilter; label: string }[] = [
    { id: 'all', label: 'Todos os objetivos' },
    { id: 'relax', label: 'Relaxar' },
    { id: 'sleep_better', label: 'Dormir melhor' },
    { id: 'regain_focus', label: 'Recuperar o foco' },
    { id: 'relieve_tension', label: 'Aliviar a tensão' },
    { id: 'take_a_pause', label: 'Fazer uma pausa' },
  ];

  const filteredPractices = getFilteredPractices();
  const recommendedPractices = getRecommendedPractices();
  const inProgressPractices = getInProgressPractices();
  const quickPractices = getQuickPractices();
  const newPractices = getNewPractices();
  const mostCompletedPractices = getMostCompletedPractices();

  const heroPractice: Practice = recommendedPractices[0] || practices[0];

  // Garantir curadoria sem repetição de práticas entre seções (QA-015)
  const alreadyShownIds = new Set<string>();
  if (heroPractice?.id) {
    alreadyShownIds.add(heroPractice.id);
  }
  inProgressPractices.forEach((p) => alreadyShownIds.add(p.id));

  const uniqueQuick = quickPractices
    .filter((p) => !alreadyShownIds.has(p.id))
    .slice(0, 3);
  uniqueQuick.forEach((p) => alreadyShownIds.add(p.id));

  const uniqueNew = newPractices
    .filter((p) => !alreadyShownIds.has(p.id))
    .slice(0, 3);
  uniqueNew.forEach((p) => alreadyShownIds.add(p.id));

  const uniqueMostCompleted = mostCompletedPractices
    .filter((p) => !alreadyShownIds.has(p.id))
    .slice(0, 3);

  const hasActiveAdvancedFilters =
    selectedDuration !== 'all' ||
    selectedLevel !== 'all' ||
    selectedFormat !== 'all' ||
    selectedObjective !== 'all';

  const isDefaultView =
    selectedCategory === 'all' &&
    !hasActiveAdvancedFilters &&
    !searchQuery.trim();

  const handleNavigatePractice = (practice: Practice) => {
    router.push(`/practices/player/${practice.id}` as any);
  };

  return (
    <AppShell>
      {/* 1. Cabeçalho com Título e Subtítulo Acolhedor */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text
            accessibilityRole="header"
            aria-level={1}
            style={[styles.title, { color: isDark ? colors.text : '#173D3B' }]}
          >
            Biblioteca de Práticas
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
            Atividades guiadas em vídeo e áudio para acolher, relaxar e recuperar o equilíbrio.
          </Text>
        </View>
      </View>

      {/* 2. Campo de Busca com Botão de Filtros */}
      <View style={styles.searchFilterRow}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#DCE5E2',
            },
          ]}
        >
          <Search size={18} color="#8C9E9B" style={{ marginRight: 10 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por título, categoria, objetivo..."
            placeholderTextColor="#8C9E9B"
            style={[styles.searchInput, { color: isDark ? colors.text : '#173D3B' }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
            >
              <X size={16} color="#8C9E9B" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
          accessibilityRole="button"
          accessibilityLabel="Filtros avançados"
          style={[
            styles.filterToggleBtn,
            (hasActiveAdvancedFilters || showAdvancedFilters) && styles.filterToggleBtnActive,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#DCE5E2',
            },
          ]}
        >
          <SlidersHorizontal
            size={18}
            color={hasActiveAdvancedFilters || showAdvancedFilters ? '#2F7F7C' : isDark ? colors.text : '#173D3B'}
          />
        </TouchableOpacity>
      </View>

      {/* 3. Abas de Categorias com Scroll Horizontal */}
      <View
        style={styles.categoriesWrapper}
        {...(Platform.OS === 'web' ? ({ role: 'tablist', 'aria-label': 'Categorias de práticas' } as any) : {})}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {categoryTabs.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setSelectedCategory(tab.id as any)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                aria-selected={isSelected}
                aria-controls="practices-tabpanel"
                accessibilityLabel={`Categoria ${tab.label}`}
                {...(Platform.OS === 'web' ? ({ type: 'button' } as any) : {})}
                style={[
                  styles.categoryTabItem,
                  isSelected && styles.categoryTabItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    {
                      color: isSelected ? '#2F7F7C' : isDark ? colors.textMuted : '#667775',
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                {isSelected && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View
        style={{ width: '100%' }}
        {...(Platform.OS === 'web' ? ({ id: 'practices-tabpanel', role: 'tabpanel', 'aria-label': 'Lista de práticas' } as any) : {})}
      >

      {/* 4. Painel de Filtros Avançados Expansível */}
      {showAdvancedFilters && (
        <View
          style={[
            styles.filtersDrawer,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#DCE5E2',
            },
          ]}
        >
          <View style={styles.filterDrawerHeader}>
            <Text style={[styles.filterDrawerTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Filtros da Biblioteca
            </Text>
            {hasActiveAdvancedFilters && (
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.resetFiltersText}>Limpar filtros</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Duração */}
          <Text style={[styles.filterSectionLabel, { color: isDark ? colors.textMuted : '#667775' }]}>
            Duração
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {durationOptions.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setSelectedDuration(opt.id)}
                style={[
                  styles.filterChip,
                  selectedDuration === opt.id && styles.filterChipActive,
                  { backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5' },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedDuration === opt.id && styles.filterChipTextActive,
                    { color: isDark ? colors.text : '#173D3B' },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Nível */}
          <Text style={[styles.filterSectionLabel, { color: isDark ? colors.textMuted : '#667775' }]}>
            Nível
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {levelOptions.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setSelectedLevel(opt.id)}
                style={[
                  styles.filterChip,
                  selectedLevel === opt.id && styles.filterChipActive,
                  { backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5' },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedLevel === opt.id && styles.filterChipTextActive,
                    { color: isDark ? colors.text : '#173D3B' },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Formato */}
          <Text style={[styles.filterSectionLabel, { color: isDark ? colors.textMuted : '#667775' }]}>
            Formato
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {formatOptions.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setSelectedFormat(opt.id)}
                style={[
                  styles.filterChip,
                  selectedFormat === opt.id && styles.filterChipActive,
                  { backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5' },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFormat === opt.id && styles.filterChipTextActive,
                    { color: isDark ? colors.text : '#173D3B' },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Objetivo */}
          <Text style={[styles.filterSectionLabel, { color: isDark ? colors.textMuted : '#667775' }]}>
            Objetivo
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {objectiveOptions.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setSelectedObjective(opt.id)}
                style={[
                  styles.filterChip,
                  selectedObjective === opt.id && styles.filterChipActive,
                  { backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5' },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedObjective === opt.id && styles.filterChipTextActive,
                    { color: isDark ? colors.text : '#173D3B' },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 5. VISÃO PADRÃO COM DESTAQUES E CARROSSÉIS */}
      {isDefaultView && (
        <View style={styles.discoverySections}>
          {/* A. Recomendado para o seu momento (Hero Card) */}
          {heroPractice && (
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
                  borderColor: isDark ? colors.border : '#D8EBE4',
                },
              ]}
            >
              <HarmonicWaves width={160} height={135} style={styles.heroWavesBg} />

              <View style={styles.heroContent}>
                <View style={styles.heroTopRow}>
                  <View style={styles.heroBadgeRow}>
                    <Activity size={13} color="#2F7F7C" style={{ marginRight: 5 }} aria-hidden={true} />
                    <Text style={styles.heroBadgeText}>RECOMENDADO PARA O SEU MOMENTO</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => toggleFavorite(heroPractice.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Favoritar recomendação"
                  >
                    <Bookmark
                      size={18}
                      color="#2F7F7C"
                      fill={heroPractice.isFavorite ? '#2F7F7C' : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.heroTitle, { color: isDark ? colors.text : '#173D3B' }]}>
                  {heroPractice.title}
                </Text>

                <Text style={[styles.heroMeta, { color: isDark ? colors.textMuted : '#567571' }]}>
                  {heroPractice.durationMinutes} min • {heroPractice.level} • {heroPractice.format === 'video' ? 'Vídeo Guiado' : 'Áudio Guiado'}
                </Text>

                <Text style={[styles.heroDesc, { color: isDark ? colors.textMuted : '#567571' }]} numberOfLines={2}>
                  {heroPractice.description}
                </Text>

                <TouchableOpacity
                  onPress={() => handleNavigatePractice(heroPractice)}
                  style={styles.heroStartBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Iniciar ${heroPractice.title}`}
                >
                  <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.heroStartBtnText}>Iniciar prática</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* B. Continue de onde parou */}
          {inProgressPractices.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionTitleRow}>
                <RotateCcw size={16} color="#2F7F7C" />
                <Text style={[styles.sectionHeading, { color: isDark ? colors.text : '#173D3B' }]}>
                  Continue de onde parou
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                {inProgressPractices.map((prac) => (
                  <PracticeCard
                    key={prac.id}
                    practice={prac}
                    progress={userProgress[prac.id]}
                    onPress={() => handleNavigatePractice(prac)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </View>
            </View>
          )}

          {/* C. Práticas Rápidas (até 5 minutos) */}
          {uniqueQuick.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionTitleRow}>
                <Clock size={16} color="#2F7F7C" />
                <Text style={[styles.sectionHeading, { color: isDark ? colors.text : '#173D3B' }]}>
                  Práticas rápidas (até 5 min)
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                {uniqueQuick.map((prac) => (
                  <PracticeCard
                    key={prac.id}
                    practice={prac}
                    progress={userProgress[prac.id]}
                    onPress={() => handleNavigatePractice(prac)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </View>
            </View>
          )}

          {/* D. Novidades na Biblioteca */}
          {uniqueNew.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionTitleRow}>
                <Leaf size={16} color="#2F7F7C" aria-hidden={true} />
                <Text style={[styles.sectionHeading, { color: isDark ? colors.text : '#173D3B' }]}>
                  Novidades
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                {uniqueNew.map((prac) => (
                  <PracticeCard
                    key={prac.id}
                    practice={prac}
                    progress={userProgress[prac.id]}
                    onPress={() => handleNavigatePractice(prac)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </View>
            </View>
          )}

          {/* E. Mais Realizadas por Você */}
          {uniqueMostCompleted.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionTitleRow}>
                <TrendingUp size={16} color="#2F7F7C" />
                <Text style={[styles.sectionHeading, { color: isDark ? colors.text : '#173D3B' }]}>
                  Mais realizadas por você
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                {uniqueMostCompleted.map((prac) => (
                  <PracticeCard
                    key={prac.id}
                    practice={prac}
                    progress={userProgress[prac.id]}
                    onPress={() => handleNavigatePractice(prac)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Botão Ver Todas as Práticas */}
          <View style={{ paddingVertical: 14, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setSelectedCategory('breathing')}
              accessibilityRole="button"
              accessibilityLabel="Ver catálogo completo de práticas"
              {...(Platform.OS === 'web' ? ({ type: 'button' } as any) : {})}
              style={{
                backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
                borderColor: isDark ? colors.border : '#D8EBE4',
                borderWidth: 1,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 14,
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#2F7F7C', fontWeight: '700', fontSize: 13 }}>
                Explorar catálogo completo ({practices.length} práticas disponíveis)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 6. LISTAGEM FILTRADA QUANDO HOUVER BUSCA OU FILTROS ATIVOS */}
      {!isDefaultView && (
        <View style={styles.filteredListSection}>
          <View style={styles.resultsHeaderRow}>
            <Text style={[styles.resultsTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              {filteredPractices.length} {filteredPractices.length === 1 ? 'prática encontrada' : 'práticas encontradas'}
            </Text>

            {(hasActiveAdvancedFilters || selectedCategory !== 'all' || searchQuery) && (
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.clearAllFiltersText}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredPractices.length === 0 ? (
            <View
              style={[
                styles.emptyStateContainer,
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: isDark ? colors.border : '#DCE5E2',
                },
              ]}
            >
              <Compass size={36} color="#2F7F7C" style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyStateTitle, { color: isDark ? colors.text : '#173D3B' }]}>
                Nenhuma prática encontrada
              </Text>
              <Text style={[styles.emptyStateMessage, { color: isDark ? colors.textMuted : '#667775' }]}>
                Não encontramos uma prática com esses filtros. Experimente ajustar a duração ou escolher outra categoria.
              </Text>
              <TouchableOpacity
                onPress={resetFilters}
                style={styles.emptyStateBtn}
                accessibilityRole="button"
                accessibilityLabel="Redefinir filtros"
              >
                <Text style={styles.emptyStateBtnText}>Ver todas as práticas</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 10, paddingBottom: 30 }}>
              {filteredPractices.map((prac) => (
                <PracticeCard
                  key={prac.id}
                  practice={prac}
                  progress={userProgress[prac.id]}
                  onPress={() => handleNavigatePractice(prac)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </View>
          )}
        </View>
      )}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    marginBottom: 14,
    paddingTop: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
    padding: 0,
  },
  filterToggleBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterToggleBtnActive: {
    borderColor: '#2F7F7C',
    backgroundColor: '#E7F3EF',
  },
  categoriesWrapper: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBF1EF',
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 2,
  },
  categoryTabItem: {
    paddingVertical: 10,
    position: 'relative',
    alignItems: 'center',
  },
  categoryTabItemActive: {},
  categoryTabText: {
    fontSize: 13,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#2F7F7C',
    borderRadius: 2,
  },
  filtersDrawer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  filterDrawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  filterDrawerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  resetFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F7F7C',
  },
  filterSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterChipActive: {
    backgroundColor: '#2F7F7C',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  discoverySections: {
    paddingBottom: 30,
    gap: 20,
  },
  heroCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  heroWavesBg: {
    position: 'absolute',
    right: -10,
    top: 5,
    zIndex: 0,
  },
  heroContent: {
    zIndex: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2F7F7C',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroMeta: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
    maxWidth: '85%',
  },
  heroStartBtn: {
    backgroundColor: '#2F7F7C',
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  heroStartBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionBlock: {
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  filteredListSection: {
    paddingBottom: 30,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  clearAllFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F7F7C',
  },
  emptyStateContainer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginVertical: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyStateMessage: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: '90%',
  },
  emptyStateBtn: {
    backgroundColor: '#2F7F7C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyStateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
