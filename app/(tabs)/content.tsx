import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../src/components/layout/AppShell';
import { SearchInput } from '../../src/components/ui/SearchInput';
import { Chip } from '../../src/components/ui/Chip';
import { ContentCard } from '../../src/components/content/ContentCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useContentStore } from '../../src/store/contentStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';

export default function ContentScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isDesktop, isTablet } = useBreakpoint();

  const { articles, toggleFavorite } = useContentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'Entendendo a ansiedade', label: 'Entendendo a ansiedade' },
    { id: 'Bem-estar emocional', label: 'Bem-estar emocional' },
    { id: 'Sono', label: 'Sono' },
    { id: 'Rotina', label: 'Rotina' },
    { id: 'Mitos e verdades', label: 'Mitos e verdades' },
    { id: 'favorites', label: 'Favoritos' },
  ];

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
      if (selectedCategory === 'favorites') return item.isFavorite;
      return (
        (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase()) ||
        (item.categoryName && item.categoryName.toLowerCase() === selectedCategory.toLowerCase())
      );
    });
  }, [articles, searchQuery, selectedCategory]);

  return (
    <AppShell>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Conteúdos</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Informações práticas para entender melhor a ansiedade e cuidar da sua rotina.
        </Text>
      </View>

      {/* Busca com Debounce de 300ms */}
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar por assunto"
        debounceMs={300}
      />

      {/* Chips Horizontais de Categorias (Altura ~38px, espaçamento 8px, sem quebra) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.label}
            selected={selectedCategory === cat.id}
            onPress={() => setSelectedCategory(cat.id)}
          />
        ))}
      </ScrollView>

      {/* Grid de Artigos */}
      {filteredArticles.length === 0 ? (
        <EmptyState
          title="Nenhum artigo encontrado"
          description="Tente buscar por outro termo ou selecione a categoria 'Todos' acima."
          actionTitle="Limpar Filtros"
          onActionPress={() => {
            setSearchQuery('');
            setSelectedCategory('all');
          }}
        />
      ) : (
        <View
          style={[
            styles.articlesGrid,
            (isDesktop || isTablet) && styles.articlesGridDesktop,
          ]}
        >
          {filteredArticles.map((article) => (
            <View
              key={article.id}
              style={[
                styles.gridCol,
                (isDesktop || isTablet) && styles.gridColDesktop,
              ]}
            >
              <ContentCard
                article={article}
                onPress={() => router.push(`/contents/${article.slug || article.id}` as any)}
                onToggleFavorite={() => toggleFavorite(article.id)}
              />
            </View>
          ))}
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
    lineHeight: 22,
  },
  categoriesScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  articlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  articlesGridDesktop: {
    flexWrap: 'wrap',
  },
  gridCol: {
    width: '100%',
  },
  gridColDesktop: {
    width: '48%',
    flexGrow: 1,
  },
});
