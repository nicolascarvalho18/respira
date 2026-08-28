import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  SlidersHorizontal,
  Bookmark,
  X,
  RotateCcw,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { PracticeCard } from '../../src/components/practices/PracticeCard';
import {
  usePracticeStore,
  DurationFilter,
  LevelFilter,
  FormatFilter,
} from '../../src/store/practiceStore';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { Practice } from '../../src/types';
import { getPracticeImage, getPracticeAltText } from '../../src/utils/practiceImages';

export default function PracticesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();
  const { user } = useAuth();
  const userId = user?.id || 'demo-user-1';

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Práticas — Respira';
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
    setSearchQuery,
    resetFilters,
    toggleFavorite,
    fetchPractices,
    fetchUserProgress,
    getFilteredPractices,
  } = usePracticeStore();

  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    fetchPractices();
    fetchUserProgress(userId);
  }, [userId]);

  // Abas de categorias conforme o design de referência
  const categoryTabs = [
    { id: 'all', label: 'Todas' },
    { id: 'breathing', label: 'Respiração' },
    { id: 'guided_meditation', label: 'Meditação' },
    { id: 'body_movement', label: 'Corpo e movimento' },
  ];

  // Identificação das práticas principais
  const heroPractice = useMemo(() => {
    return (
      practices.find((p) => p.id === 'practice-breathing-478') ||
      practices[0]
    );
  }, [practices]);

  const inProgressPractice = useMemo(() => {
    return (
      practices.find((p) => p.id === 'practice-breathing-box') ||
      practices[1]
    );
  }, [practices]);

  const quickPracticesList = useMemo(() => {
    const list: Practice[] = [];
    const p1 = practices.find((p) => p.id === 'practice-heart-coherence');
    const p2 = practices.find((p) => p.id === 'practice-quick-conscious-pause');
    const p3 = practices.find((p) => p.id === 'practice-grounding-54321');

    if (p1) list.push(p1);
    if (p2) list.push(p2);
    if (p3) list.push(p3);

    return list.length > 0 ? list : practices.slice(2, 5);
  }, [practices]);

  const newPractice = useMemo(() => {
    return (
      practices.find((p) => p.id === 'practice-pmr-relaxation') ||
      practices[5] ||
      practices[0]
    );
  }, [practices]);

  // Lista filtrada para busca ou abas específicas
  const filteredList = getFilteredPractices();
  const isDefaultView =
    selectedCategory === 'all' &&
    selectedDuration === 'all' &&
    selectedLevel === 'all' &&
    selectedFormat === 'all' &&
    selectedObjective === 'all' &&
    !searchQuery.trim();

  const hasActiveFilters =
    selectedDuration !== 'all' ||
    selectedLevel !== 'all' ||
    selectedFormat !== 'all' ||
    selectedObjective !== 'all';

  const handleOpenPractice = (practiceId: string) => {
    router.push(`/practices/${practiceId}` as any);
  };

  return (
    <AppShell>
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        {/* 1. Cabeçalho */}
        <View style={styles.header}>
          <Text
            accessibilityRole="header"
            aria-level={1}
            style={[styles.pageTitle, { color: isDark ? colors.text : '#1F2927' }]}
          >
            Práticas
          </Text>
          <Text style={[styles.pageSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
            Exercícios guiados para respirar, relaxar e retomar o foco.
          </Text>
        </View>

        {/* 2. Barra de Busca com Botão de Filtros */}
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: isDark ? colors.border : '#DFE4E1',
              },
            ]}
          >
            <Search size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} style={{ marginRight: 10 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar uma prática"
              placeholderTextColor={isDark ? colors.textMuted : '#8F9B97'}
              style={[styles.searchInput, { color: isDark ? colors.text : '#1F2927' }]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
                style={{ padding: 4 }}
              >
                <X size={16} color="#68736F" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Filtros avançados"
            style={[
              styles.filterBtn,
              hasActiveFilters && styles.filterBtnActive,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: hasActiveFilters ? '#247B74' : isDark ? colors.border : '#DFE4E1',
              },
            ]}
          >
            <SlidersHorizontal
              size={20}
              color={hasActiveFilters ? '#247B74' : isDark ? colors.text : '#1F2927'}
              strokeWidth={1.75}
            />
          </TouchableOpacity>
        </View>

        {/* 3. Categorias em Abas com Linha Inferior */}
        <View style={[styles.tabsRow, { borderBottomColor: isDark ? colors.border : '#E7EBE9' }]}>
          {categoryTabs.map((tab) => {
            const isActive = selectedCategory === tab.id;

            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setSelectedCategory(tab.id as any)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.tabItem,
                  isActive && styles.tabItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive && [styles.tabTextActive, { color: '#247B74' }],
                    !isActive && { color: isDark ? colors.textMuted : '#68736F' },
                  ]}
                >
                  {tab.label}
                </Text>
                {isActive && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. CONTEÚDO PRINCIPAL: MODO PADRÃO (TODAS) VS MODO FILTRADO */}
        {isDefaultView ? (
          <View style={styles.sectionsContainer}>
            {/* SEÇÃO 1: Para começar agora (Card Editorial Hero) */}
            {heroPractice && (
              <View style={styles.sectionBlock}>
                <Text style={[styles.heroSectionTitle, { color: '#247B74' }]}>
                  Para começar agora
                </Text>

                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => handleOpenPractice(heroPractice.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Destaque: ${heroPractice.title}. 4 minutos, iniciante, áudio. Clique para começar.`}
                  style={styles.heroCard}
                >
                  <Image
                    source={getPracticeImage('respiracao-4-7-8')}
                    accessibilityLabel={getPracticeAltText('respiracao-4-7-8')}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />

                  {/* Gradiente / Sombra escura atrás do texto */}
                  <View style={styles.heroScrim}>
                    <Text style={styles.heroTitle}>
                      {heroPractice.title}
                    </Text>

                    <Text style={styles.heroMeta}>
                      4 min · Iniciante · Áudio
                    </Text>

                    <View style={styles.heroActionRow}>
                      <View style={styles.heroStartBtn}>
                        <Text style={styles.heroStartBtnText}>Começar</Text>
                      </View>
                    </View>
                  </View>

                  {/* Bookmark Hero */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleFavorite(heroPractice.id);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={heroPractice.isFavorite ? 'Remover favorito' : 'Salvar favorito'}
                    style={styles.heroBookmarkBtn}
                  >
                    <Bookmark
                      size={22}
                      color="#FFFFFF"
                      fill={heroPractice.isFavorite ? '#FFFFFF' : 'transparent'}
                      strokeWidth={1.75}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            )}

            {/* SEÇÃO 2: Continue de onde parou */}
            {inProgressPractice && (
              <View style={styles.sectionBlock}>
                <Text
                  accessibilityRole="header"
                  aria-level={2}
                  style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
                >
                  Continue de onde parou
                </Text>

                <PracticeCard
                  practice={inProgressPractice}
                  progress={{
                    practiceId: inProgressPractice.id,
                    userId,
                    status: 'started',
                    progressPercent: 45,
                    playbackPositionSeconds: 80,
                    completedCount: 0,
                    lastPlayedAt: new Date().toISOString(),
                  }}
                  variant="horizontal"
                  onPress={() => handleOpenPractice(inProgressPractice.id)}
                  onToggleFavorite={toggleFavorite}
                />
              </View>
            )}

            {/* SEÇÃO 3: Práticas rápidas (Carrossel Horizontal) */}
            <View style={styles.sectionBlock}>
              <Text
                accessibilityRole="header"
                aria-level={2}
                style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
              >
                Práticas rápidas
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickHorizontalScroll}
              >
                {quickPracticesList.map((prat) => (
                  <PracticeCard
                    key={prat.id}
                    practice={prat}
                    variant="vertical"
                    onPress={() => handleOpenPractice(prat.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </ScrollView>
            </View>

            {/* SEÇÃO 4: Novidades */}
            {newPractice && (
              <View style={styles.sectionBlock}>
                <Text
                  accessibilityRole="header"
                  aria-level={2}
                  style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
                >
                  Novidades
                </Text>

                <PracticeCard
                  practice={newPractice}
                  variant="horizontal"
                  onPress={() => handleOpenPractice(newPractice.id)}
                  onToggleFavorite={toggleFavorite}
                />
              </View>
            )}
          </View>
        ) : (
          /* LISTAGEM QUANDO FILTRADO OU EM OUTRA ABA */
          <View style={styles.filteredContainer}>
            <View style={styles.filterSummaryRow}>
              <Text style={[styles.filterSummaryCount, { color: isDark ? colors.textMuted : '#68736F' }]}>
                {filteredList.length} {filteredList.length === 1 ? 'prática encontrada' : 'práticas encontradas'}
              </Text>
              {(searchQuery.trim().length > 0 || hasActiveFilters) && (
                <TouchableOpacity
                  onPress={resetFilters}
                  style={styles.resetFiltersBtn}
                >
                  <RotateCcw size={14} color="#247B74" strokeWidth={1.75} style={{ marginRight: 4 }} />
                  <Text style={styles.resetFiltersBtnText}>Limpar filtros</Text>
                </TouchableOpacity>
              )}
            </View>

            {filteredList.length > 0 ? (
              <View style={isDesktop ? styles.gridDesktop : styles.listMobile}>
                {filteredList.map((prat) => (
                  <PracticeCard
                    key={prat.id}
                    practice={prat}
                    progress={userProgress[prat.id]}
                    variant="horizontal"
                    onPress={() => handleOpenPractice(prat.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptySearchContainer}>
                <Text style={[styles.emptySearchTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Nenhuma prática encontrada
                </Text>
                <Text style={[styles.emptySearchDesc, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  Tente alterar os termos da busca ou redefinir os filtros selecionados.
                </Text>
                <TouchableOpacity
                  onPress={resetFilters}
                  style={styles.emptyResetBtn}
                >
                  <Text style={styles.emptyResetBtnText}>Ver todas as práticas</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Modal de Filtros Avançados */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
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
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                Filtrar práticas
              </Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar filtros"
                style={{ padding: 4 }}
              >
                <X size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* Duração */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterGroupTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Duração
                </Text>
                <View style={styles.filterChipsWrap}>
                  {[
                    { id: 'all', label: 'Todas' },
                    { id: 'up_to_5', label: 'Até 5 min' },
                    { id: '5_to_10', label: '5 a 10 min' },
                    { id: '10_to_20', label: '10 a 20 min' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setSelectedDuration(item.id as DurationFilter)}
                      style={[
                        styles.filterChip,
                        selectedDuration === item.id && styles.filterChipActive,
                        { borderColor: selectedDuration === item.id ? '#247B74' : isDark ? colors.border : '#DFE4E1' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedDuration === item.id && { color: '#247B74', fontWeight: '600' },
                          selectedDuration !== item.id && { color: isDark ? colors.text : '#1F2927' },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Nível */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterGroupTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Nível
                </Text>
                <View style={styles.filterChipsWrap}>
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'Iniciante', label: 'Iniciante' },
                    { id: 'Intermediário', label: 'Intermediário' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setSelectedLevel(item.id as LevelFilter)}
                      style={[
                        styles.filterChip,
                        selectedLevel === item.id && styles.filterChipActive,
                        { borderColor: selectedLevel === item.id ? '#247B74' : isDark ? colors.border : '#DFE4E1' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedLevel === item.id && { color: '#247B74', fontWeight: '600' },
                          selectedLevel !== item.id && { color: isDark ? colors.text : '#1F2927' },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Formato */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterGroupTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Formato
                </Text>
                <View style={styles.filterChipsWrap}>
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'audio', label: 'Áudio' },
                    { id: 'video', label: 'Vídeo' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setSelectedFormat(item.id as FormatFilter)}
                      style={[
                        styles.filterChip,
                        selectedFormat === item.id && styles.filterChipActive,
                        { borderColor: selectedFormat === item.id ? '#247B74' : isDark ? colors.border : '#DFE4E1' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedFormat === item.id && { color: '#247B74', fontWeight: '600' },
                          selectedFormat !== item.id && { color: isDark ? colors.text : '#1F2927' },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                onPress={() => {
                  resetFilters();
                  setShowFilterModal(false);
                }}
                style={[styles.modalSecondaryBtn, { borderColor: '#DFE4E1' }]}
              >
                <Text style={[styles.modalSecondaryBtnText, { color: '#68736F' }]}>Limpar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.modalPrimaryBtn}
              >
                <Text style={styles.modalPrimaryBtnText}>Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  containerDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',
  },

  // Cabeçalho
  header: {
    marginBottom: 20,
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
  },

  // Busca e Filtros
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchBox: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#EDF7F5',
  },

  // Categorias em Abas
  tabsRow: {
    flexDirection: 'row',
    gap: 20,
    borderBottomWidth: 1,
    marginBottom: 24,
  },
  tabItem: {
    paddingVertical: 10,
    position: 'relative',
  },
  tabItemActive: {},
  tabText: {
    fontSize: 15,
    fontWeight: '400',
  },
  tabTextActive: {
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#247B74',
    borderRadius: 1,
  },

  // Seções Padrão
  sectionsContainer: {
    gap: 28,
  },
  sectionBlock: {
    width: '100%',
  },
  heroSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 14,
  },

  // Hero Card 16:9
  heroCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1F2927',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 18,
    backgroundColor: 'rgba(20, 30, 28, 0.48)',
    justifyContent: 'flex-end',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroMeta: {
    color: '#E0EAE7',
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 12,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStartBtn: {
    backgroundColor: '#247B74',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStartBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  heroBookmarkBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 8,
  },

  // Práticas Rápidas (Carrossel Horizontal)
  quickHorizontalScroll: {
    paddingRight: 8,
  },

  // Listagem Filtrada
  filteredContainer: {
    width: '100%',
  },
  filterSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterSummaryCount: {
    fontSize: 14,
  },
  resetFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetFiltersBtnText: {
    fontSize: 14,
    color: '#247B74',
    fontWeight: '600',
  },
  listMobile: {
    width: '100%',
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  emptySearchContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptySearchTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySearchDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyResetBtn: {
    backgroundColor: '#247B74',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  emptyResetBtnText: {
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
  filterChipsWrap: {
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
    fontSize: 15,
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
    fontSize: 15,
    fontWeight: '600',
  },
});
