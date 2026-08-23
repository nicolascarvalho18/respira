import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Wind, Search, Bookmark, Play, Sparkles } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { AppInput } from '../../src/components/ui/AppInput';
import { PracticeCard } from '../../src/components/practices/PracticeCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useTheme } from '../../src/hooks/useTheme';
import { PracticeCategory } from '../../src/types';

const CATEGORIES: { id: PracticeCategory | 'all' | 'favorites'; name: string }[] = [
  { id: 'all', name: 'Todas' },
  { id: 'breathing', name: 'Respiração' },
  { id: 'relaxation', name: 'Relaxamento' },
  { id: 'mindfulness', name: 'Atenção Plena' },
  { id: 'quick_routine', name: 'Rotinas Rápidas' },
  { id: 'favorites', name: 'Favoritas' },
];

export default function PracticesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    toggleFavorite,
    getFilteredPractices,
  } = usePracticeStore();

  const filteredPractices = getFilteredPractices();

  return (
    <ScreenContainer scrollable>
      <AppHeader
        title="Práticas e Ferramentas"
        subtitle="Exercícios guiados para acalmar o corpo e a mente"
      />

      {/* Destaque: Exercício de Respiração Imersivo */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/practices/breathing')}
        accessibilityRole="button"
        accessibilityLabel="Iniciar Exercício de Respiração Imersivo"
        style={[
          styles.breathingHero,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <View style={styles.heroBadge}>
            <Sparkles size={12} color={colors.primary} />
            <Text style={[styles.heroBadgeText, { color: colors.primary }]}>Destaque Interativo</Text>
          </View>
          <Text style={styles.heroTitle}>Exercício de Respiração</Text>
          <Text style={styles.heroSubtitle}>
            Animação guiada com as técnicas 4-7-8, Respiração Quadrada e Coerência Cardíaca.
          </Text>
        </View>

        <View style={styles.heroPlayCircle}>
          <Play size={22} color={colors.primary} fill={colors.primary} style={{ marginLeft: 3 }} />
        </View>
      </TouchableOpacity>

      {/* Campo de Busca */}
      <AppInput
        placeholder="Buscar prática por nome ou objetivo..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftIcon={<Search size={18} color={colors.textMuted} />}
        containerStyle={{ marginBottom: 12 }}
      />

      {/* Barra de Categorias */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
      >
        {CATEGORIES.map((cat) => {
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

      {/* Lista de Práticas */}
      <View style={styles.listSection}>
        {filteredPractices.length === 0 ? (
          <EmptyState
            title="Nenhuma prática encontrada"
            description="Tente buscar com outras palavras ou selecione outra categoria."
            actionTitle="Ver todas as práticas"
            onActionPress={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
          />
        ) : (
          filteredPractices.map((practice) => (
            <PracticeCard
              key={practice.id}
              practice={practice}
              onToggleFavorite={toggleFavorite}
            />
          ))
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  breathingHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#DDEFE9',
    fontSize: 12,
    lineHeight: 16,
  },
  heroPlayCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
