import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  X,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  Bookmark,
  TrendingUp,
  Sparkles,
  ChevronDown,
  RotateCcw,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { ContentCard } from '../../src/components/content/ContentCard';
import { useContentStore, ArticleFilterOption } from '../../src/store/contentStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { ArticleContourLines } from '../../src/components/illustrations/ArticleContourLines';
import { Article } from '../../src/types';
import { getCategoryMetas, getRecommendedArticles } from '../../src/data/articles';

export default function ContentScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Conteúdos — Respira';
    }
  }, []);

  const {
    articles,
    selectedCategory,
    searchQuery,
    selectedFilter,
    setSelectedCategory,
    setSearchQuery,
    setSelectedFilter,
    clearFilters,
    loadMoreArticles,
    toggleFavorite,
    getFilteredArticles,
    getVisibleArticles,
  } = useContentStore();

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Dynamic category metas with counts (e.g. Todos (40), Ansiedade (10), etc.)
  const categoryMetas = useMemo(() => getCategoryMetas(articles), [articles]);

  // Weekly read count
  const weeklyReadCount = useMemo(() => {
    return articles.filter((a) => (a.readProgress || 0) >= 90).length;
  }, [articles]);

  // Curated recommended hero article
  const recommendedHeroArticle: Article = useMemo(() => {
    return (
      articles.find((a) => a.slug === 'o-que-e-ansiedade-e-como-ela-funciona') ||
      articles[0]
    );
  }, [articles]);

  // "Para você" recommendations
  const forYouArticles = useMemo(() => {
    return getRecommendedArticles(articles);
  }, [articles]);

  const filteredArticles = getFilteredArticles();
  const visibleArticles = getVisibleArticles();

  const hasActiveFilters =
    selectedCategory !== 'all' || searchQuery.trim().length > 0 || selectedFilter !== 'all';

  const hasMoreToLoad =
    selectedCategory === 'all' &&
    !searchQuery &&
    selectedFilter === 'all' &&
    visibleArticles.length < filteredArticles.length;

  const filterOptions: { id: ArticleFilterOption; label: string }[] = [
    { id: 'all', label: 'Todos os status' },
    { id: 'not_started', label: 'Não iniciados' },
    { id: 'in_progress', label: 'Em andamento' },
    { id: 'completed', label: 'Lidos (100%)' },
    { id: 'favorites', label: 'Favoritos' },
    { id: 'shortest', label: 'Menor tempo de leitura' },
    { id: 'longest', label: 'Maior tempo de leitura' },
    { id: 'recent', label: 'Mais recentes' },
  ];

  const currentFilterLabel =
    filterOptions.find((f) => f.id === selectedFilter)?.label || 'Filtrar';

  return (
    <AppShell>
      {/* 1. Cabeçalho com Título, Subtítulo e Indicador Semanal */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text
            accessibilityRole="header"
            aria-level={1}
            style={[styles.title, { color: isDark ? colors.text : '#173D3B' }]}
          >
            Conteúdos
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
            Informação confiável para cuidar da mente e da rotina.
          </Text>
        </View>

        {/* Indicador de Leitura Semanal */}
        <View
          style={[
            styles.weeklyBadgeBox,
            {
              backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
            },
          ]}
        >
          <TrendingUp size={16} color="#2F7F7C" style={{ marginRight: 6 }} />
          <View>
            <Text style={[styles.weeklyBadgeCount, { color: isDark ? colors.text : '#173D3B' }]}>
              {weeklyReadCount > 0 ? `${weeklyReadCount} lidos` : '0 lidos'}
            </Text>
            <Text style={[styles.weeklyBadgeLabel, { color: isDark ? colors.textMuted : '#667775' }]}>
              esta semana
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Campo de Busca e Botão de Filtro */}
      <View style={styles.searchFilterRow}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#DCE5E2',
            },
          ]}
        >
          <Search size={18} color="#8C9E9B" style={{ marginLeft: 12, marginRight: 8 }} />
          <TextInput
            placeholder="Buscar por título, assunto, palavra..."
            placeholderTextColor="#8C9E9B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: isDark ? colors.text : '#173D3B' }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ paddingRight: 12 }}
            >
              <X size={16} color="#8C9E9B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Botão de Filtro com Badge se ativo */}
        <TouchableOpacity
          onPress={() => setIsFilterModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Abrir filtros de conteúdo"
          style={[
            styles.filterButton,
            selectedFilter !== 'all' && {
              backgroundColor: '#2F7F7C',
              borderColor: '#2F7F7C',
            },
            {
              backgroundColor: isDark
                ? colors.surface
                : selectedFilter !== 'all'
                ? '#2F7F7C'
                : '#FFFFFF',
              borderColor: isDark ? colors.border : '#DCE5E2',
            },
          ]}
        >
          <Filter
            size={18}
            color={selectedFilter !== 'all' ? '#FFFFFF' : isDark ? colors.text : '#173D3B'}
          />
        </TouchableOpacity>
      </View>

      {/* Badges de Filtros Ativos + Botão Limpar Filtros */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersRow}>
          <Text style={[styles.activeFiltersLabel, { color: isDark ? colors.textMuted : '#667775' }]}>
            Filtros ativos:
          </Text>

          {selectedCategory !== 'all' && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterChipText}>Categoria: {selectedCategory}</Text>
              <TouchableOpacity onPress={() => setSelectedCategory('all')}>
                <X size={12} color="#2F7F7C" />
              </TouchableOpacity>
            </View>
          )}

          {selectedFilter !== 'all' && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterChipText}>{currentFilterLabel}</Text>
              <TouchableOpacity onPress={() => setSelectedFilter('all')}>
                <X size={12} color="#2F7F7C" />
              </TouchableOpacity>
            </View>
          )}

          {searchQuery.trim().length > 0 && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterChipText}>{`Busca: "${searchQuery}"`}</Text>
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={12} color="#2F7F7C" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersBtn}>
            <RotateCcw size={12} color="#D9534F" style={{ marginRight: 4 }} />
            <Text style={styles.clearFiltersBtnText}>Limpar filtros</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Categorias com Contagens Dinâmicas Reais */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categoryMetas.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                style={[styles.categoryTab, isSelected && styles.categoryTabActive]}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    {
                      color: isSelected ? '#2F7F7C' : isDark ? colors.textMuted : '#667775',
                      fontWeight: isSelected ? '800' : '500',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
                {isSelected && <View style={styles.activeUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Card "LEITURA RECOMENDADA" (Apenas quando não houver busca ativa e na aba Todos) */}
      {!searchQuery && selectedCategory === 'all' && selectedFilter === 'all' && recommendedHeroArticle && (
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#DCE5E2',
            },
          ]}
        >
          <View style={styles.heroLeftCol}>
            <Text style={styles.heroBadgeText}>LEITURA RECOMENDADA</Text>
            <Text
              style={[styles.heroTitle, { color: isDark ? colors.text : '#173D3B' }]}
              numberOfLines={2}
            >
              {recommendedHeroArticle.title}
            </Text>
            <Text
              style={[styles.heroSummary, { color: isDark ? colors.textMuted : '#667775' }]}
              numberOfLines={3}
            >
              {recommendedHeroArticle.summary}
            </Text>

            <View style={styles.heroFooter}>
              <View style={styles.heroReadTimeRow}>
                <Clock size={12} color="#8C9E9B" style={{ marginRight: 4 }} />
                <Text style={styles.heroReadTimeText}>
                  {recommendedHeroArticle.readingTimeMinutes || 5} min de leitura
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  router.push(`/contents/${recommendedHeroArticle.slug || recommendedHeroArticle.id}` as any)
                }
                style={styles.heroReadButton}
                accessibilityRole="button"
                accessibilityLabel="Ler artigo recomendado"
              >
                <Text style={styles.heroReadButtonText}>Ler artigo</Text>
                <ArrowRight size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Ilustração Editorial SVG */}
          <View style={styles.heroRightIllustration}>
            <ArticleContourLines width={140} height={140} />
          </View>
        </View>
      )}

      {/* 5. Seção "Para Você" (Recomendações Variadas) */}
      {!searchQuery && selectedCategory === 'all' && selectedFilter === 'all' && forYouArticles.length > 0 && (
        <View style={styles.forYouSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Sparkles size={16} color="#2F7F7C" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#173D3B' }]}>
                Para você
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: isDark ? colors.textMuted : '#8C9E9B' }]}>
              Baseado nos seus interesses
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.forYouScroll}
          >
            {forYouArticles.map((art) => (
              <TouchableOpacity
                key={art.id}
                onPress={() => router.push(`/contents/${art.slug || art.id}` as any)}
                activeOpacity={0.85}
                style={[
                  styles.forYouCard,
                  {
                    backgroundColor: isDark ? colors.surface : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#EBF1EF',
                  },
                ]}
              >
                <Text style={styles.forYouCatLabel}>{art.category.toUpperCase()}</Text>
                <Text
                  style={[styles.forYouTitle, { color: isDark ? colors.text : '#173D3B' }]}
                  numberOfLines={2}
                >
                  {art.title}
                </Text>
                <View style={styles.forYouFooter}>
                  <Clock size={11} color="#8C9E9B" style={{ marginRight: 4 }} />
                  <Text style={styles.forYouTime}>{art.readingTimeMinutes || 5} min</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 6. Seção "Todos os conteúdos" / Lista Principal */}
      <View style={styles.articlesListSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#173D3B' }]}>
            {selectedCategory === 'all' ? 'Todos os conteúdos' : `Artigos de ${selectedCategory}`}
          </Text>
          <Text style={[styles.sectionCountText, { color: isDark ? colors.textMuted : '#8C9E9B' }]}>
            {filteredArticles.length} {filteredArticles.length === 1 ? 'artigo' : 'artigos'}
          </Text>
        </View>

        {/* Estado Vazio de Busca */}
        {filteredArticles.length === 0 ? (
          <View
            style={[
              styles.emptyWrap,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: isDark ? colors.border : '#DCE5E2',
              },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Nenhum conteúdo encontrado
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
              Tente buscar por outro assunto ou limpar os filtros.
            </Text>
            <TouchableOpacity onPress={clearFilters} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Limpar filtros</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.articlesCardWrap,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: isDark ? colors.border : '#DCE5E2',
              },
            ]}
          >
            {visibleArticles.map((article) => (
              <ContentCard
                key={article.id}
                article={article}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </View>
        )}

        {/* Botão "Carregar Mais Conteúdos" (10 em 10 na aba Todos) */}
        {hasMoreToLoad && (
          <TouchableOpacity
            onPress={loadMoreArticles}
            activeOpacity={0.8}
            style={[
              styles.loadMoreButton,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
                borderColor: isDark ? colors.border : '#D4E8E2',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Carregar mais 10 conteúdos"
          >
            <Text style={styles.loadMoreButtonText}>
              + Carregar mais conteúdos ({visibleArticles.length} de {filteredArticles.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de Filtros Avançados */}
      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? colors.text : '#173D3B' }]}>
                Filtrar Artigos
              </Text>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)}>
                <X size={20} color="#8C9E9B" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptionsList}>
              {filterOptions.map((opt) => {
                const isSelected = selectedFilter === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => {
                      setSelectedFilter(opt.id);
                      setIsFilterModalOpen(false);
                    }}
                    style={[
                      styles.filterOptionItem,
                      isSelected && {
                        backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        {
                          color: isSelected
                            ? '#2F7F7C'
                            : isDark
                            ? colors.text
                            : '#173D3B',
                          fontWeight: isSelected ? '700' : '400',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && <CheckCircle2 size={16} color="#2F7F7C" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingTop: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  weeklyBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  weeklyBadgeCount: {
    fontSize: 12,
    fontWeight: '800',
  },
  weeklyBadgeLabel: {
    fontSize: 10,
  },

  // Search and Filter
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  activeFiltersLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E7F3EF',
    borderColor: '#2F7F7C',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2F7F7C',
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  clearFiltersBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D9534F',
  },

  // Category Tabs
  categoriesWrapper: {
    marginBottom: 16,
  },
  categoriesScroll: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 2,
  },
  categoryTab: {
    paddingVertical: 6,
    position: 'relative',
  },
  categoryTabActive: {},
  categoryTabText: {
    fontSize: 13,
  },
  activeUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#2F7F7C',
    borderRadius: 2,
  },

  // Hero Card
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroLeftCol: {
    flex: 1,
    paddingRight: 10,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2F7F7C',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 6,
  },
  heroSummary: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroReadTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroReadTimeText: {
    fontSize: 11,
    color: '#8C9E9B',
  },
  heroReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2F7F7C',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  heroReadButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroRightIllustration: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // For You Section
  forYouSection: {
    marginBottom: 20,
  },
  forYouScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  forYouCard: {
    width: 170,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  forYouCatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2F7F7C',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  forYouTitle: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    height: 32,
    marginBottom: 8,
  },
  forYouFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forYouTime: {
    fontSize: 10,
    color: '#8C9E9B',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Articles List Card
  articlesListSection: {
    paddingBottom: 40,
  },
  articlesCardWrap: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  loadMoreButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreButtonText: {
    color: '#2F7F7C',
    fontSize: 13,
    fontWeight: '700',
  },

  // Empty State
  emptyWrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  emptyButton: {
    backgroundColor: '#2F7F7C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  filterOptionsList: {
    gap: 4,
  },
  filterOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  filterOptionText: {
    fontSize: 13,
  },
});
