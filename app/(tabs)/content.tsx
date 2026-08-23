import React, { useState } from 'react';
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
    { id: 'Fundamentos', label: 'Fundamentos' },
    { id: 'Regulação', label: 'Regulação' },
    { id: 'Sono', label: 'Sono' },
    { id: 'Mitos e Fatos', label: 'Mitos e Fatos' },
    { id: 'Estilo de Vida', label: 'Estilo de Vida' },
    { id: 'favorites', label: 'Favoritos' },
  ];

  const filteredArticles = articles.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'favorites') return item.isFavorite;
    return item.categoryName.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <AppShell>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Conteúdos Educativos</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Informação clara e baseada em evidências para desmistificar a ansiedade.
        </Text>
      </View>

      {/* Busca com Debounce */}
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar artigos sobre sono, fisiologia, respiração..."
      />

      {/* Chips Horizontais de Categorias (36-42px sem quebra vertical) */}
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
                onPress={() => router.push(`/content/${article.id}`)}
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
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    lineHeight: 20,
  },
  categoriesScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  articlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginVertical: 12,
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
