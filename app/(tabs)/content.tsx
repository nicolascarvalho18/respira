import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Search } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { AppInput } from '../../src/components/ui/AppInput';
import { ContentCard } from '../../src/components/content/ContentCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useContentStore } from '../../src/store/contentStore';
import { useTheme } from '../../src/hooks/useTheme';

export default function ContentScreen() {
  const { colors, isDark } = useTheme();
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    toggleFavorite,
    getFilteredArticles,
  } = useContentStore();

  const filteredArticles = getFilteredArticles();

  return (
    <ScreenContainer scrollable>
      <AppHeader
        title="Conteúdos Educativos"
        subtitle="Psicoeducação baseada em ciência e acolhimento"
      />

      {/* Busca */}
      <AppInput
        placeholder="Buscar artigos por tema ou palavra-chave..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftIcon={<Search size={18} color={colors.textMuted} />}
        containerStyle={{ marginBottom: 12 }}
      />

      {/* Categorias */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : isDark
                      ? colors.surfaceSubtle
                      : '#FFFFFF',
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Categoria: ${cat.name}`}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: isSelected ? '#FFFFFF' : colors.text,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Lista de Artigos */}
      <View style={styles.listSection}>
        {filteredArticles.length === 0 ? (
          <EmptyState
            title="Nenhum artigo encontrado"
            description="Tente pesquisar com outros termos ou selecione outra categoria de conteúdo."
            actionTitle="Ver todos os conteúdos"
            onActionPress={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
          />
        ) : (
          filteredArticles.map((article) => (
            <ContentCard
              key={article.id}
              article={article}
              onToggleFavorite={toggleFavorite}
            />
          ))
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 13,
  },
  listSection: {
    paddingBottom: 24,
  },
});
