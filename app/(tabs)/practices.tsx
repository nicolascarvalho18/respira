import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Wind,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { SearchInput } from '../../src/components/ui/SearchInput';
import { Chip } from '../../src/components/ui/Chip';
import { PracticeCard } from '../../src/components/practices/PracticeCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { AppButton } from '../../src/components/ui/AppButton';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';

export default function PracticesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isDesktop, isTablet } = useBreakpoint();

  const { practices, toggleFavorite } = usePracticeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Todas as Práticas' },
    { id: 'breathing', label: 'Respiração' },
    { id: 'relaxation', label: 'Relaxamento' },
    { id: 'mindfulness', label: 'Atenção Plena' },
    { id: 'quick', label: 'Rotinas Rápidas' },
    { id: 'favorites', label: 'Favoritas' },
  ];

  const filteredPractices = practices.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'favorites') return item.isFavorite;
    return item.category === selectedCategory;
  });

  const featured = practices[0] || null;

  return (
    <AppShell>
      {/* Cabeçalho da Página */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Práticas e Ferramentas</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Exercícios guiados com base científica para regulação e relaxamento.
        </Text>
      </View>

      {/* Destaque Principal Único */}
      {featured && selectedCategory === 'all' && !searchQuery && (
        <Card variant="bordered" style={styles.heroFeaturedCard}>
          <View style={styles.heroBadgeRow}>
            <Badge label="Destaque do Dia" variant="primary" size="sm" />
            <Text style={[styles.heroDuration, { color: colors.textMuted }]}>
              {featured.durationMinutes} min • {featured.level}
            </Text>
          </View>

          <Text style={[styles.heroTitle, { color: colors.text }]}>{featured.title}</Text>
          <Text style={[styles.heroDesc, { color: colors.textMuted }]}>{featured.description}</Text>

          <View style={styles.heroActionRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroCompletions, { color: colors.primary }]}>
                ✓ Concluído {featured.completedCount || 0} vezes
              </Text>
            </View>
            <AppButton
              title="Praticar Agora"
              leftIcon={<Wind size={18} color="#FFFFFF" />}
              onPress={() => {
                if (featured.category === 'breathing') {
                  router.push('/practices/breathing');
                } else {
                  router.push(`/practices/player/${featured.id}`);
                }
              }}
              size="md"
            />
          </View>
        </Card>
      )}

      {/* Barra de Busca com Debounce */}
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar exercícios, meditação, 4-7-8..."
      />

      {/* Filtros Horizontais com Rolagem no Mobile e Inline no Desktop */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
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

      {/* Grid de Práticas (2 a 3 colunas no desktop) */}
      {filteredPractices.length === 0 ? (
        <EmptyState
          title="Nenhuma prática encontrada"
          description="Tente ajustar sua busca ou selecionar outra categoria acima."
          actionTitle="Limpar Filtros"
          onActionPress={() => {
            setSearchQuery('');
            setSelectedCategory('all');
          }}
        />
      ) : (
        <View
          style={[
            styles.practiceGrid,
            (isDesktop || isTablet) && styles.practiceGridDesktop,
          ]}
        >
          {filteredPractices.map((practice) => (
            <View
              key={practice.id}
              style={[
                styles.gridCol,
                (isDesktop || isTablet) && styles.gridColDesktop,
              ]}
            >
              <PracticeCard
                practice={practice}
                onPress={() => {
                  if (practice.category === 'breathing') {
                    router.push('/practices/breathing');
                  } else if (practice.id === 'practice-grounding-54321') {
                    router.push('/practices/grounding' as any);
                  } else if (practice.id === 'practice-pmr-relaxation') {
                    router.push('/practices/relaxation' as any);
                  } else {
                    router.push(`/practices/player/${practice.id}`);
                  }
                }}
                onToggleFavorite={() => toggleFavorite(practice.id)}
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
  heroFeaturedCard: {
    gap: 10,
    marginBottom: 20,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroDuration: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  heroCompletions: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryScroll: {
    flexDirection: 'row',
    paddingVertical: 10,
    gap: 4,
  },
  practiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginVertical: 14,
  },
  practiceGridDesktop: {
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
