import React, { useState, useMemo } from 'react';
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
  BookMarked,
  Bookmark,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { ContentCard } from '../../src/components/content/ContentCard';
import { useContentStore } from '../../src/store/contentStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { ArticleContourLines } from '../../src/components/illustrations/ArticleContourLines';
import { Article } from '../../src/types';

export default function ContentScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();

  const { articles, toggleFavorite } = useContentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Categories corresponding to the design
  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'Ansiedade', label: 'Ansiedade' },
    { id: 'Sono', label: 'Sono' },
    { id: 'Bem-estar', label: 'Bem-estar' },
    { id: 'Regulação', label: 'Regulação' },
  ];

  // Calculate completed / read articles this week
  const weeklyReadCount = useMemo(() => {
    const completed = articles.filter((a) => (a.readProgress || 0) >= 90).length;
    return Math.max(3, completed);
  }, [articles]);

  const recommendedArticle: Article =
    articles.find((a) => a.slug === 'entendendo-a-ansiedade') || articles[0];

  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return articles.filter((item) => {
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)));

      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;

      const itemCat = (item.category || item.categoryName || '').toLowerCase();
      const targetCat = selectedCategory.toLowerCase();

      if (targetCat === 'ansiedade') return itemCat.includes('ansiedade');
      if (targetCat === 'sono') return itemCat.includes('sono');
      if (targetCat === 'regulação') return itemCat.includes('regulação') || itemCat.includes('atenção');
      if (targetCat === 'bem-estar') return itemCat.includes('bem-estar') || itemCat.includes('rotina');

      return itemCat === targetCat;
    });
  }, [articles, searchQuery, selectedCategory]);

  return (
    <AppShell>
      {/* 1. Cabeçalho com Título, Subtítulo e Indicador de Leitura Semanal */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.title, { color: '#173D3B' }]}>Conteúdos</Text>
          <Text style={[styles.subtitle, { color: '#667775' }]}>
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
          <BookMarked size={18} color="#2F7F7C" style={{ marginRight: 6 }} />
          <View>
            <Text style={[styles.weeklyBadgeCount, { color: '#173D3B' }]}>
              {weeklyReadCount} lidos
            </Text>
            <Text style={[styles.weeklyBadgeLabel, { color: '#667775' }]}>
              esta semana
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Campo de Busca ("Buscar artigos") */}
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
          placeholder="Buscar artigos"
          placeholderTextColor="#8C9E9B"
          style={[styles.searchInput, { color: colors.text }]}
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

      {/* 3. Navegação por Abas com Linha Inferior */}
      <View style={styles.categoriesTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesTabsRow}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Categoria ${cat.label}`}
                style={[styles.tabItem, isSelected && styles.tabItemActive]}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    {
                      color: isSelected ? '#2F7F7C' : '#667775',
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

      {/* 4. Card "LEITURA RECOMENDADA" */}
      {recommendedArticle && !searchQuery && selectedCategory === 'all' && (
        <View
          style={[
            styles.heroRecCard,
            {
              backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
              borderColor: isDark ? colors.border : '#D8EBE4',
            },
          ]}
        >
          {/* Ilustração Abstrata em Linhas SVG */}
          <ArticleContourLines
            width={160}
            height={140}
            style={styles.heroLinesBg}
          />

          <View style={styles.heroRecContent}>
            {/* Topo: LEITURA RECOMENDADA + Bookmark */}
            <View style={styles.heroTopRow}>
              <Text style={styles.heroBadgeText}>LEITURA RECOMENDADA</Text>

              <TouchableOpacity
                onPress={() => toggleFavorite(recommendedArticle.id)}
                accessibilityRole="button"
                accessibilityLabel="Favoritar artigo recomendado"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Bookmark
                  size={18}
                  color="#2F7F7C"
                  fill={recommendedArticle.isFavorite ? '#2F7F7C' : 'transparent'}
                />
              </TouchableOpacity>
            </View>

            {/* Título do Artigo */}
            <Text style={[styles.heroRecTitle, { color: '#173D3B' }]}>
              {recommendedArticle.title}
            </Text>

            {/* Tempo de Leitura */}
            <View style={styles.heroReadTimeRow}>
              <Clock size={12} color="#567571" style={{ marginRight: 4 }} />
              <Text style={styles.heroReadTimeText}>
                {recommendedArticle.readingTimeMinutes || recommendedArticle.readTimeMinutes || 4} min de leitura
              </Text>
            </View>

            {/* Descrição / Resumo */}
            <Text style={[styles.heroRecDesc, { color: '#567571' }]} numberOfLines={3}>
              {recommendedArticle.summary}
            </Text>

            {/* Botão Ler Artigo */}
            <TouchableOpacity
              onPress={() =>
                router.push(`/contents/${recommendedArticle.slug || recommendedArticle.id}` as any)
              }
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Ler artigo ${recommendedArticle.title}`}
              style={styles.readArticleBtn}
            >
              <Text style={styles.readArticleBtnText}>Ler artigo</Text>
              <ArrowRight size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 5. Seção "Para você" com Linhas Editoriais */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: '#173D3B' }]}>Para você</Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Filtrar conteúdos"
          style={styles.filterBtn}
        >
          <Filter size={13} color="#2F7F7C" style={{ marginRight: 4 }} />
          <Text style={styles.filterBtnText}>Filtrar</Text>
        </TouchableOpacity>
      </View>

      {/* Lista Editorial de Artigos */}
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
          <Text style={[styles.emptyTitle, { color: '#173D3B' }]}>
            Nenhum artigo encontrado
          </Text>
          <Text style={[styles.emptySubtitle, { color: '#667775' }]}>
            Tente buscar por outro termo ou selecione todas as categorias.
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            style={styles.emptyResetBtn}
          >
            <Text style={styles.emptyResetBtnText}>Ver todos os artigos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={[
            styles.articlesListCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#EBF1EF',
            },
          ]}
        >
          {filteredArticles.map((article) => (
            <ContentCard
              key={article.id}
              article={article}
              onPress={() =>
                router.push(`/contents/${article.slug || article.id}` as any)
              }
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  // Cabeçalho
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingTop: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  weeklyBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  weeklyBadgeCount: {
    fontSize: 12,
    fontWeight: '800',
  },
  weeklyBadgeLabel: {
    fontSize: 10,
  },

  // Campo de Busca
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
    padding: 0,
  },

  // Abas de Categorias com Linha Inferior
  categoriesTabsWrapper: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBF1EF',
  },
  categoriesTabsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 4,
  },
  tabItem: {
    paddingVertical: 10,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {},
  tabItemText: {
    fontSize: 14,
  },
  activeUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#2F7F7C',
    borderRadius: 2,
  },

  // Card Recomendado
  heroRecCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  heroLinesBg: {
    position: 'absolute',
    right: -10,
    top: 0,
    zIndex: 0,
  },
  heroRecContent: {
    zIndex: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2F7F7C',
    letterSpacing: 0.6,
  },
  heroRecTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: -0.2,
  },
  heroReadTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    marginBottom: 6,
  },
  heroReadTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#567571',
  },
  heroRecDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
    maxWidth: '82%',
  },
  readArticleBtn: {
    backgroundColor: '#2F7F7C',
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    shadowColor: '#2F7F7C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  readArticleBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Cabeçalho da Seção "Para você"
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2F7F7C',
  },

  // Lista Editorial
  articlesListCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },

  // Estado Vazio
  emptyWrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginVertical: 10,
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
  emptyResetBtn: {
    backgroundColor: '#2F7F7C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
