import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Wind,
  Sparkles,
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
import { formatPracticesCompleted } from '../../src/utils/grammar';

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
    { id: 'quick_routine', label: 'Rotinas Rápidas' },
    { id: 'favorites', label: 'Favoritas' },
  ];

  const filteredPractices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return practices.filter((item) => {
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'favorites') return item.isFavorite;
      return item.category === selectedCategory;
    });
  }, [practices, searchQuery, selectedCategory]);

  const featured = practices[0] || null;

  return (
    <AppShell>
      {/* Cabeçalho com Texto Natural */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Práticas</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Práticas de respiração, relaxamento e atenção.
        </Text>
      </View>

      {/* Destaque do Dia Compacto */}
      {featured && selectedCategory === 'all' && !searchQuery && (
        <Card variant="bordered" style={styles.heroCompactCard}>
          <View style={styles.heroTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Badge label="Destaque do Dia" variant="primary" size="sm" />
              <Text style={[styles.heroMeta, { color: colors.textMuted }]}>
                {featured.durationMinutes} min • {featured.level}
              </Text>
            </View>
          </View>

          <Text style={[styles.heroTitle, { color: colors.text }]}>{featured.title}</Text>
          <Text style={[styles.heroDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {featured.description}
          </Text>

          <View style={styles.heroActionRow}>
            <Text style={[styles.heroCompletions, { color: colors.textMuted }]}>
              {formatPracticesCompleted(featured.completedCount || 0)}
            </Text>

            <AppButton
              title="Praticar Agora"
              leftIcon={<Wind size={16} color="#FFFFFF" />}
              onPress={() => {
                if (featured.category === 'breathing') {
                  router.push('/practices/breathing');
                } else {
                  router.push(`/practices/player/${featured.id}`);
                }
              }}
              size="sm"
            />
          </View>
        </Card>
      )}

      {/* Busca com Debounce */}
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar exercícios..."
        debounceMs={300}
      />

      {/* Filtros Horizontais */}
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

      {/* Grid de Práticas Compacto */}
      {filteredPractices.length === 0 ? (
        <EmptyState
          title="Nenhuma prática encontrada"
          description="Tente buscar por outro termo ou selecione todas as práticas."
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
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
    lineHeight: 22,
  },
  heroCompactCard: {
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F4',
  },
  heroCompletions: {
    fontSize: 12,
  },
  categoryScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  practiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
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
