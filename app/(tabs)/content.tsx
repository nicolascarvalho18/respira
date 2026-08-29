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
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  X,
  Clock,
  Bookmark,
  SlidersHorizontal,
  ChevronRight,
  Check,
  Sparkles,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { ContentCard } from '../../src/components/content/ContentCard';
import { useContentStore, ArticleFilterOption } from '../../src/store/contentStore';
import { useTheme } from '../../src/hooks/useTheme';
import { ArticleCoverImage } from '../../src/components/illustrations/ArticleCovers';
import { Article } from '../../src/types';
import { normalizeText } from '../../src/data/articles';
import { useToast } from '../../src/components/ui/Toast';

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'Ansiedade', label: 'Ansiedade' },
  { id: 'Sono', label: 'Sono' },
  { id: 'Bem-estar', label: 'Bem-estar' },
  { id: 'Regulação', label: 'Regulação' },
];

export default function ContentScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const { showToast } = useToast();

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

  const handleToggleFavorite = async (articleId: string) => {
    try {
      const isFav = await toggleFavorite(articleId);
      showToast({
        message: isFav ? 'Adicionado aos salvos' : 'Removido dos salvos',
        type: 'info',
      });
    } catch {
      showToast({
        message: 'Não foi possível atualizar os salvos. Tente novamente.',
        type: 'error',
      });
    }
  };

  // Artigo de Destaque Editorial por Categoria (ou geral)
  const featuredArticle: Article | undefined = useMemo(() => {
    if (searchQuery.trim().length > 0) return undefined; // Oculta destaque durante busca

    if (selectedCategory === 'Sono') {
      return (
        articles.find((a) => a.slug === 'como-desacelerar-a-mente-antes-de-dormir') ||
        articles.find((a) => normalizeText(a.category).includes('sono'))
      );
    }
    if (selectedCategory === 'Bem-estar') {
      return (
        articles.find((a) => a.slug === 'a-importancia-das-pequenas-pausas-durante-o-dia') ||
        articles.find((a) => normalizeText(a.category).includes('bem-estar'))
      );
    }
    if (selectedCategory === 'Regulação') {
      return (
        articles.find((a) => a.slug === 'o-que-e-regulacao-emocional') ||
        articles.find((a) => normalizeText(a.category).includes('regulacao'))
      );
    }
    if (selectedCategory === 'Ansiedade') {
      return (
        articles.find((a) => a.slug === 'o-que-e-ansiedade-e-como-ela-funciona') ||
        articles.find((a) => normalizeText(a.category).includes('ansiedade'))
      );
    }

    // Todos: Destaque Principal
    return articles.find((a) => a.slug === 'o-que-e-ansiedade-e-como-ela-funciona') || articles[0];
  }, [articles, selectedCategory, searchQuery]);

  const filteredArticles = getFilteredArticles();
  const visibleArticles = getVisibleArticles();

  // Para não repetir o artigo em destaque na lista principal quando em "Todos"
  const displayArticles = useMemo(() => {
    if (!featuredArticle || searchQuery.trim().length > 0 || selectedFilter !== 'all') {
      return visibleArticles;
    }
    return visibleArticles.filter((a) => a.id !== featuredArticle.id);
  }, [visibleArticles, featuredArticle, searchQuery, selectedFilter]);

  const hasMoreToLoad = visibleArticles.length < filteredArticles.length;

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

  // Grid responsiveness:
  // Mobile (< 580px): 1 card por linha
  // Tablet (580px - 860px): 2 cards por linha
  // Desktop (>= 860px): 3 cards por linha
  const isDesktop = width >= 860;
  const isTablet = width >= 580 && width < 860;
  const numColumns = isDesktop ? 3 : isTablet ? 2 : 1;

  const getCategoryBadgeColor = (catName: string) => {
    const norm = normalizeText(catName || '');
    if (norm.includes('sono')) return isDark ? '#A78BFA' : '#5A489B';
    if (norm.includes('ansiedade')) return isDark ? '#FB923C' : '#C85A32';
    if (norm.includes('regulacao') || norm.includes('atencao')) return isDark ? '#60A5FA' : '#2D6A9F';
    return isDark ? '#68D391' : '#2E7D5B';
  };

  return (
    <AppShell>
      <View
        style={[
          styles.contentContainer,
          { paddingHorizontal: width < 380 ? 16 : 20 },
        ]}
      >
        {/* 1. Cabeçalho Equilibrado */}
        <View style={styles.headerBlock}>
          <Text
            accessibilityRole="header"
            aria-level={1}
            style={[
              styles.headerTitle,
              {
                fontSize: width < 380 ? 24 : 26,
                color: isDark ? '#FFFFFF' : '#17332F',
              },
            ]}
          >
            Conteúdos
          </Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? '#F1F5F9' : '#5F706C' }]}>
            Informação confiável para cuidar da mente e da rotina.
          </Text>
        </View>

        {/* 2. Barra de Busca e Botão Quadrado de Filtro */}
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E5EAE8',
              },
            ]}
          >
            <Search size={18} color={isDark ? '#CBD5E1' : '#708885'} strokeWidth={2} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar conteúdos"
              placeholderTextColor={isDark ? '#94A3B8' : '#8C9E9B'}
              style={[
                styles.searchInput,
                {
                  color: isDark ? '#FFFFFF' : '#17332F',
                },
              ]}
              accessibilityLabel="Buscar conteúdos por título, tema ou palavra-chave"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Limpar busca"
              >
                <X size={16} color={isDark ? '#CBD5E1' : '#708885'} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setIsFilterModalOpen(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Abrir opções de filtro"
            style={[
              styles.filterSquareBtn,
              {
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                borderColor:
                  selectedFilter !== 'all'
                    ? isDark
                      ? '#5ECFC3'
                      : '#247B74'
                    : isDark
                    ? '#334155'
                    : '#E5EAE8',
              },
            ]}
          >
            <SlidersHorizontal
              size={18}
              color={
                selectedFilter !== 'all'
                  ? isDark
                    ? '#5ECFC3'
                    : '#247B74'
                  : isDark
                  ? '#F1F5F9'
                  : '#5F706C'
              }
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        {/* 3. Categorias em Linha Única com Rolagem Horizontal Suave */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Filtrar por categoria ${cat.label}`}
                  style={[
                    styles.categoryChip,
                    isActive && {
                      backgroundColor: isDark ? '#5ECFC3' : '#247B74',
                    },
                    !isActive && {
                      backgroundColor: isDark ? '#1F2937' : '#F0F4F3',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      {
                        color: isActive
                          ? isDark
                            ? '#111827'
                            : '#FFFFFF'
                          : isDark
                          ? '#E2E8F0'
                          : '#5F706C',
                        fontWeight: isActive ? '700' : '600',
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Seção "Em destaque" */}
        {featuredArticle && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.badgeSectionTitleWrap}>
                <Sparkles size={16} color={isDark ? '#5ECFC3' : '#247B74'} strokeWidth={2.2} />
                <Text
                  accessibilityRole="header"
                  aria-level={2}
                  style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#17332F' }]}
                >
                  Em destaque
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() =>
                router.push(`/contents/${featuredArticle.slug || featuredArticle.id}` as any)
              }
              style={[
                styles.featuredCard,
                {
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#E5EAE8',
                },
              ]}
              accessibilityRole="link"
              accessibilityLabel={`Destaque: ${featuredArticle.title}`}
            >
              {/* Capa Ampla Superior */}
              <View style={styles.featuredCoverBox}>
                <ArticleCoverImage
                  slug={featuredArticle.slug || featuredArticle.id}
                  category={featuredArticle.category}
                  height={180}
                  borderRadius={0}
                />
              </View>

              {/* Informações do Destaque */}
              <View style={styles.featuredBody}>
                <View style={styles.featuredTopMeta}>
                  <Text
                    style={[
                      styles.featuredCategory,
                      { color: getCategoryBadgeColor(featuredArticle.category) },
                    ]}
                  >
                    {featuredArticle.category.toUpperCase()}
                  </Text>
                  <View style={styles.dotSeparator} />
                  <View style={styles.timeInlineWrap}>
                    <Clock size={12} color={isDark ? '#CBD5E1' : '#708885'} strokeWidth={1.8} />
                    <Text
                      style={[styles.timeInlineText, { color: isDark ? '#CBD5E1' : '#708885' }]}
                    >
                      {featuredArticle.readingTimeMinutes ||
                        featuredArticle.readTimeMinutes ||
                        5}{' '}
                      min de leitura
                    </Text>
                  </View>
                </View>

                <Text
                  numberOfLines={2}
                  style={[styles.featuredTitle, { color: isDark ? '#FFFFFF' : '#17332F' }]}
                >
                  {featuredArticle.title}
                </Text>

                <Text
                  numberOfLines={3}
                  style={[styles.featuredSummary, { color: isDark ? '#F1F5F9' : '#5F706C' }]}
                >
                  {featuredArticle.summary}
                </Text>

                <View style={styles.featuredFooter}>
                  <Text
                    style={[
                      styles.readPromptText,
                      { color: isDark ? '#5ECFC3' : '#247B74' },
                    ]}
                  >
                    Ler artigo completo
                  </Text>

                  <TouchableOpacity
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={() => handleToggleFavorite(featuredArticle.id)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      featuredArticle.isFavorite
                        ? `Remover ${featuredArticle.title} dos favoritos`
                        : `Salvar ${featuredArticle.title} nos favoritos`
                    }
                    style={styles.favBtn}
                  >
                    <Bookmark
                      size={18}
                      color={
                        featuredArticle.isFavorite
                          ? isDark
                            ? '#5ECFC3'
                            : '#247B74'
                          : isDark
                          ? '#CBD5E1'
                          : '#8C9E9B'
                      }
                      fill={
                        featuredArticle.isFavorite
                          ? isDark
                            ? '#5ECFC3'
                            : '#247B74'
                          : 'none'
                      }
                      strokeWidth={1.8}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 5. Seção "Todos os conteúdos" */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#17332F' }]}
            >
              Todos os conteúdos
            </Text>
            <Text style={[styles.sectionCountText, { color: isDark ? '#E2E8F0' : '#5F706C' }]}>
              {filteredArticles.length} artigos
            </Text>
          </View>

          {/* Grade de Cards: 1 por linha no celular, 2 no tablet, 3 no desktop */}
          {displayArticles.length === 0 ? (
            <View
              style={[
                styles.emptyStateBox,
                {
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#E5EAE8',
                },
              ]}
            >
              <Text style={[styles.emptyStateTitle, { color: isDark ? '#FFFFFF' : '#17332F' }]}>
                Nenhum conteúdo encontrado
              </Text>
              <Text style={[styles.emptyStateDesc, { color: isDark ? '#F1F5F9' : '#5F706C' }]}>
                Tente buscar com outros termos ou selecione outra categoria.
              </Text>
              <TouchableOpacity
                onPress={clearFilters}
                style={[
                  styles.clearFilterBtn,
                  { backgroundColor: isDark ? '#5ECFC3' : '#247B74' },
                ]}
              >
                <Text
                  style={{
                    color: isDark ? '#111827' : '#FFFFFF',
                    fontWeight: '700',
                    fontSize: 13.5,
                  }}
                >
                  Ver todos os conteúdos
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.articlesGrid}>
              {displayArticles.map((article) => (
                <View
                  key={article.id}
                  style={[
                    styles.gridCol,
                    {
                      width:
                        numColumns === 1
                          ? '100%'
                          : numColumns === 2
                          ? '48.5%'
                          : '32%',
                    },
                  ]}
                >
                  <ContentCard
                    article={article}
                    onToggleFavorite={handleToggleFavorite}
                    coverHeight={numColumns === 1 ? 165 : 135}
                    showSummary
                  />
                </View>
              ))}
            </View>
          )}

          {/* 6. Botão "Ver mais conteúdos" */}
          {hasMoreToLoad && (
            <TouchableOpacity
              onPress={loadMoreArticles}
              activeOpacity={0.8}
              style={[
                styles.loadMoreBtn,
                {
                  backgroundColor: isDark ? '#183B38' : '#EAF7F3',
                  borderColor: isDark ? '#2C5D58' : '#D1ECE5',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Carregar mais conteúdos da lista"
            >
              <Text style={[styles.loadMoreText, { color: isDark ? '#5ECFC3' : '#247B74' }]}>
                Ver mais conteúdos ({visibleArticles.length} de {filteredArticles.length})
              </Text>
              <ChevronRight size={16} color={isDark ? '#5ECFC3' : '#247B74'} strokeWidth={2.2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modal de Filtros Rápidos */}
      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.filterModalCard,
              {
                backgroundColor: isDark ? '#172033' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#DDE6E3',
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#17332F' }]}>
                Filtrar conteúdos
              </Text>
              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color={isDark ? '#F1F5F9' : '#5F706C'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
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
                        backgroundColor: isDark ? '#183B38' : '#EAF7F3',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        {
                          color: isSelected
                            ? isDark
                              ? '#5ECFC3'
                              : '#247B74'
                            : isDark
                            ? '#FFFFFF'
                            : '#17332F',
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <Check size={18} color={isDark ? '#5ECFC3' : '#247B74'} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 110,
    gap: 16,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  headerBlock: {
    gap: 3,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  filterSquareBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesSection: {
    marginTop: -2,
    marginBottom: 4,
  },
  categoriesScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipText: {
    fontSize: 13.5,
  },
  sectionBlock: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeSectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionCountText: {
    fontSize: 13,
    fontWeight: '500',
  },
  featuredCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  featuredCoverBox: {
    width: '100%',
    height: 180,
    backgroundColor: '#F8FAF9',
  },
  featuredBody: {
    padding: 16,
    gap: 6,
  },
  featuredTopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredCategory: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#8C9E9B',
  },
  timeInlineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeInlineText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  featuredTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  featuredSummary: {
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 2,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5EAE8',
  },
  readPromptText: {
    fontSize: 13,
    fontWeight: '700',
  },
  favBtn: {
    padding: 4,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCol: {
    marginBottom: 0,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyStateBox: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateDesc: {
    fontSize: 13.5,
    textAlign: 'center',
  },
  clearFilterBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  filterModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDE6E3',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  filterOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  filterOptionText: {
    fontSize: 14,
  },
});
