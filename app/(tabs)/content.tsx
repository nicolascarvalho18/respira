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
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  Check,
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
  const { colors, isDark } = useTheme();
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
    pageLimit,
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

  // Cálculo de leitura semanal real
  const weeklyReadCount = useMemo(() => {
    return articles.filter((a) => (a.readProgress || 0) >= 90).length;
  }, [articles]);

  // Artigo em andamento ("Continuar lendo")
  const inProgressArticle: Article | undefined = useMemo(() => {
    // 1. Procurar artigo com progresso entre 10% e 89%
    const found = articles.find(
      (a) => (a.readProgress || 0) > 0 && (a.readProgress || 0) < 90
    );
    if (found) return found;

    // 2. Se houver o artigo específico de sono com progresso, fallback demonstrativo amigável
    const sleepDemo = articles.find(
      (a) => a.slug === 'como-desacelerar-a-mente-antes-de-dormir'
    );
    if (sleepDemo && (sleepDemo.readProgress || 0) > 0) return sleepDemo;

    return undefined;
  }, [articles]);

  // Artigo em destaque curado
  const featuredArticle: Article = useMemo(() => {
    if (selectedCategory === 'Sono') {
      return (
        articles.find((a) => a.slug === 'como-criar-uma-rotina-noturna-saudavel') ||
        articles[0]
      );
    }
    if (selectedCategory === 'Bem-estar') {
      return (
        articles.find((a) => a.slug === 'a-importancia-das-pequenas-pausas-durante-o-dia') ||
        articles[0]
      );
    }
    if (selectedCategory === 'Regulação') {
      return (
        articles.find((a) => a.slug === 'o-que-e-regulacao-emocional') ||
        articles[0]
      );
    }
    // Padrão (Todos ou Ansiedade)
    return (
      articles.find((a) => a.slug === 'o-que-e-ansiedade-e-como-ela-funciona') ||
      articles[0]
    );
  }, [articles, selectedCategory]);

  const filteredArticles = getFilteredArticles();
  const visibleArticles = getVisibleArticles();

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

  // Grid responsiveness: 3 colunas em telas maiores ou 320-430px (2 a 3 colunas compactas)
  const isDesktop = width >= 860;
  const isTablet = width >= 580 && width < 860;
  const numColumns = isDesktop ? 3 : isTablet ? 3 : width < 360 ? 1 : 3;

  const getCategoryColor = (catId: string, isActive: boolean) => {
    if (isActive) {
      if (catId === 'Ansiedade') return { bg: isDark ? '#FB923C' : '#C85A32', text: '#FFFFFF' };
      if (catId === 'Sono') return { bg: isDark ? '#A78BFA' : '#5A489B', text: '#FFFFFF' };
      if (catId === 'Bem-estar') return { bg: isDark ? '#68D391' : '#2E7D5B', text: '#FFFFFF' };
      if (catId === 'Regulação') return { bg: isDark ? '#60A5FA' : '#2D6A9F', text: '#FFFFFF' };
      return { bg: isDark ? '#5ECFC3' : '#247B74', text: isDark ? '#111827' : '#FFFFFF' };
    }
    // Inativo
    if (catId === 'Ansiedade') return { bg: isDark ? '#2D1F1B' : '#FDF0E9', text: isDark ? '#FDBA74' : '#C85A32' };
    if (catId === 'Sono') return { bg: isDark ? '#231E38' : '#F0EDF9', text: isDark ? '#C4B5FD' : '#5A489B' };
    if (catId === 'Bem-estar') return { bg: isDark ? '#1C2E24' : '#EDF7F1', text: isDark ? '#86EFAC' : '#2E7D5B' };
    if (catId === 'Regulação') return { bg: isDark ? '#1E2838' : '#EBF2F9', text: isDark ? '#93C5FD' : '#2D6A9F' };
    return { bg: isDark ? '#1F2937' : '#F0F4F3', text: isDark ? '#E2E8F0' : '#5F706C' };
  };

  const getCategoryBadgeColor = (catName: string) => {
    const norm = normalizeText(catName);
    if (norm.includes('sono')) return isDark ? '#A78BFA' : '#5A489B';
    if (norm.includes('ansiedade')) return isDark ? '#FB923C' : '#C85A32';
    if (norm.includes('regulacao') || norm.includes('atencao')) return isDark ? '#60A5FA' : '#2D6A9F';
    return isDark ? '#68D391' : '#2E7D5B';
  };

  return (
    <AppShell>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Cabeçalho com Título, Subtítulo e Indicador de Leitura Semanal */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text
              accessibilityRole="header"
              aria-level={1}
              style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#17332F' }]}
            >
              Conteúdos
            </Text>
            <Text style={[styles.headerSubtitle, { color: isDark ? '#F1F5F9' : '#5F706C' }]}>
              Informação confiável para cuidar da mente e da rotina.
            </Text>
          </View>

          {/* Indicador de progresso semanal (Oculto se 0 lidos) */}
          {weeklyReadCount > 0 && (
            <View
              style={[
                styles.weeklyBadge,
                {
                  backgroundColor: isDark ? '#183B38' : '#EAF7F3',
                  borderColor: isDark ? '#2C5D58' : '#D1ECE5',
                },
              ]}
            >
              <TrendingUp size={16} color={isDark ? '#5ECFC3' : '#247B74'} strokeWidth={2.2} />
              <View>
                <Text style={[styles.weeklyCountText, { color: isDark ? '#5ECFC3' : '#176B61' }]}>
                  {weeklyReadCount} lidos
                </Text>
                <Text style={[styles.weeklySubText, { color: isDark ? '#E2E8F0' : '#5F706C' }]}>
                  esta semana
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* 2. Barra de Busca e Botão de Filtros */}
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
              styles.filterBtn,
              {
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                borderColor: selectedFilter !== 'all' ? (isDark ? '#5ECFC3' : '#247B74') : isDark ? '#334155' : '#E5EAE8',
              },
            ]}
          >
            <SlidersHorizontal
              size={18}
              color={selectedFilter !== 'all' ? (isDark ? '#5ECFC3' : '#247B74') : isDark ? '#F1F5F9' : '#5F706C'}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        {/* 3. Chips de Categorias */}
        <View style={styles.categoriesRow}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const colorsScheme = getCategoryColor(cat.id, isActive);
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por categoria ${cat.label}`}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: colorsScheme.bg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color: colorsScheme.text,
                      fontWeight: isActive ? '700' : '600',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. Seção "CONTINUAR LENDO" (Exibida apenas quando houver artigo em andamento) */}
        {inProgressArticle && !searchQuery && selectedFilter === 'all' && (
          <View style={styles.sectionWrap}>
            <View
              style={[
                styles.continueCard,
                {
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#E5EAE8',
                },
              ]}
            >
              {/* Miniatura à esquerda */}
              <View style={styles.continueThumb}>
                <ArticleCoverImage
                  slug={inProgressArticle.slug || inProgressArticle.id}
                  category={inProgressArticle.category}
                  width="100%"
                  height="100%"
                  borderRadius={10}
                />
              </View>

              {/* Informações à direita */}
              <View style={styles.continueBody}>
                <Text style={[styles.continueBadge, { color: isDark ? '#5ECFC3' : '#247B74' }]}>
                  CONTINUAR LENDO
                </Text>
                <Text
                  numberOfLines={2}
                  style={[styles.continueTitle, { color: isDark ? '#FFFFFF' : '#17332F' }]}
                >
                  {inProgressArticle.title}
                </Text>

                {/* Barra de Progresso */}
                <View style={styles.progressRow}>
                  <View style={[styles.progressTrack, { backgroundColor: isDark ? '#334155' : '#E5EAE8' }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${inProgressArticle.readProgress || 65}%`,
                          backgroundColor: isDark ? '#5ECFC3' : '#247B74',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressPctText, { color: isDark ? '#E2E8F0' : '#5F706C' }]}>
                    {inProgressArticle.readProgress || 65}%
                  </Text>
                </View>

                {/* Botão Continuar */}
                <TouchableOpacity
                  onPress={() => router.push(`/contents/${inProgressArticle.slug || inProgressArticle.id}` as any)}
                  activeOpacity={0.85}
                  style={[
                    styles.continueBtn,
                    {
                      backgroundColor: isDark ? '#5ECFC3' : '#247B74',
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Continuar lendo ${inProgressArticle.title}`}
                >
                  <Text style={[styles.continueBtnText, { color: isDark ? '#111827' : '#FFFFFF' }]}>
                    Continuar
                  </Text>
                  <ChevronRight size={16} color={isDark ? '#111827' : '#FFFFFF'} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 5. Seção "CONTEÚDO EM DESTAQUE" */}
        {featuredArticle && !searchQuery && selectedFilter === 'all' && (
          <View style={styles.sectionWrap}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push(`/contents/${featuredArticle.slug || featuredArticle.id}` as any)}
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
              {/* Capa do Destaque */}
              <View style={styles.featuredCoverWrapper}>
                <ArticleCoverImage
                  slug={featuredArticle.slug || featuredArticle.id}
                  category={featuredArticle.category}
                  width="100%"
                  height="100%"
                  borderRadius={12}
                />
              </View>

              {/* Informações do Destaque */}
              <View style={styles.featuredContent}>
                <Text style={[styles.featuredCategory, { color: getCategoryBadgeColor(featuredArticle.category) }]}>
                  {featuredArticle.category.toUpperCase()}
                </Text>

                <Text
                  numberOfLines={2}
                  style={[styles.featuredTitle, { color: isDark ? '#FFFFFF' : '#17332F' }]}
                >
                  {featuredArticle.title}
                </Text>

                <Text
                  numberOfLines={3}
                  style={[styles.featuredSummary, { color: isDark ? '#F1F5F9' : '#5F706C' }]}>
                  {featuredArticle.summary}
                </Text>

                <View style={styles.featuredFooter}>
                  <View style={styles.timeWrap}>
                    <Clock size={14} color={isDark ? '#E2E8F0' : '#708885'} strokeWidth={1.8} />
                    <Text style={[styles.timeText, { color: isDark ? '#E2E8F0' : '#708885' }]}>
                      {featuredArticle.readingTimeMinutes || featuredArticle.readTimeMinutes || 5} min
                    </Text>
                  </View>

                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
                          ? '#E2E8F0'
                          : '#8C9E9B'
                      }
                      fill={featuredArticle.isFavorite ? (isDark ? '#5ECFC3' : '#247B74') : 'none'}
                      strokeWidth={1.8}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 6. Seção "Todos os conteúdos" */}
        <View style={styles.sectionWrap}>
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

          {/* Grade de Artigos */}
          {visibleArticles.length === 0 ? (
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
                style={[styles.clearFilterBtn, { backgroundColor: isDark ? '#5ECFC3' : '#247B74' }]}
              >
                <Text style={{ color: isDark ? '#111827' : '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                  Ver todos os conteúdos
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.articlesGrid}>
              {visibleArticles.map((article) => (
                <View
                  key={article.id}
                  style={[
                    styles.gridCol,
                    {
                      width: numColumns === 1 ? '100%' : `${100 / numColumns - 1.5}%`,
                    },
                  ]}
                >
                  <ContentCard
                    article={article}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </View>
              ))}
            </View>
          )}

          {/* 7. Botão "Ver mais conteúdos >" */}
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
      </ScrollView>

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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
    gap: 16,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 3,
    lineHeight: 20,
  },
  weeklyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  weeklyCountText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  weeklySubText: {
    fontSize: 11,
    marginTop: -1,
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
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  sectionWrap: {
    gap: 10,
    marginTop: 4,
  },
  continueCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  continueThumb: {
    width: 110,
    height: 85,
    borderRadius: 10,
    overflow: 'hidden',
  },
  continueBody: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 4,
  },
  continueBadge: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  continueTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  progressPctText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  continueBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 2,
  },
  continueBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  featuredCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  featuredCoverWrapper: {
    width: 140,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
  },
  featuredContent: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 4,
  },
  featuredCategory: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  featuredSummary: {
    fontSize: 13,
    lineHeight: 18,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionCountText: {
    fontSize: 13,
    fontWeight: '500',
  },
  articlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCol: {
    marginBottom: 2,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
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
    height: 40,
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
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  favBtn: {
    padding: 4,
  },
});
