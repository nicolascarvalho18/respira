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
  TrendingUp,
  Star,
  Bookmark,
  Play,
  Filter,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { PracticeCard } from '../../src/components/practices/PracticeCard';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { HarmonicWaves } from '../../src/components/illustrations/HarmonicWaves';
import { Practice, PracticeCategory } from '../../src/types';

export default function PracticesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();

  const { practices, toggleFavorite } = usePracticeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFilterType, setSelectedFilterType] = useState<'all' | 'physical' | 'mental' | 'breathing' | 'sound'>('all');

  // Filter tabs with 7 requested categories + Todas + Favoritas
  const filterTabs = [
    { id: 'all', label: 'Todas' },
    { id: 'breathing', label: 'Respiração' },
    { id: 'body_movement', label: 'Corpo e movimento' },
    { id: 'mindfulness', label: 'Atenção e foco' },
    { id: 'relaxation', label: 'Relaxamento' },
    { id: 'creative', label: 'Atividades criativas' },
    { id: 'quick_pauses', label: 'Pausas rápidas' },
    { id: 'soundscapes', label: 'Sons e ambientes' },
    { id: 'favorites', label: 'Favoritas' },
  ];

  // Calculate weekly completed count from practice completions
  const totalWeeklyCompleted = useMemo(() => {
    const sum = practices.reduce((acc, p) => acc + (p.completedCount || 0), 0);
    return Math.max(3, Math.min(sum, 24));
  }, [practices]);

  const recommendedPractice: Practice =
    practices.find((p) => p.id === 'practice-breathing-478') || practices[0];

  const filteredPractices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return practices.filter((item) => {
      // 1. Busca textual
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.level.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // 2. Filtro por Categoria
      if (selectedCategory === 'favorites') {
        if (!item.isFavorite) return false;
      } else if (selectedCategory !== 'all') {
        if (selectedCategory === 'soundscapes' && item.category !== 'soundscapes') return false;
        if (item.category !== selectedCategory) return false;
      }

      // 3. Filtro por Tipo de Atividade (Física / Mental / Som)
      if (selectedFilterType !== 'all') {
        if (item.activityType && item.activityType !== selectedFilterType) return false;
      }

      return true;
    });
  }, [practices, searchQuery, selectedCategory, selectedFilterType]);

  const handlePracticeNavigation = (practice: Practice) => {
    if (practice.category === 'soundscapes') {
      router.push('/practices/soundscapes' as any);
    } else {
      router.push(`/practices/player/${practice.id}` as any);
    }
  };

  const getCategoryTitle = () => {
    const match = filterTabs.find((t) => t.id === selectedCategory);
    return match ? match.label : 'Todas as práticas';
  };

  return (
    <AppShell>
      {/* 1. Cabeçalho com Título, Subtítulo e Indicador Semanal */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.title, { color: isDark ? colors.text : '#173D3B' }]}>
            Relaxar & Práticas
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
            Exercícios físicos e mentais para desacelerar, respirar e recuperar o equilíbrio.
          </Text>
        </View>

        {/* Indicador de Práticas da Semana */}
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
              {totalWeeklyCompleted > 0
                ? `${totalWeeklyCompleted} práticas`
                : 'Nenhuma prática'}
            </Text>
            <Text style={[styles.weeklyBadgeLabel, { color: isDark ? colors.textMuted : '#667775' }]}>
              esta semana
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Card "RECOMENDADO PARA HOJE" */}
      {recommendedPractice && !searchQuery && selectedCategory === 'all' && (
        <View
          style={[
            styles.heroRecCard,
            {
              backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
              borderColor: isDark ? colors.border : '#D8EBE4',
            },
          ]}
        >
          {/* Ilustração Ondulada em SVG */}
          <HarmonicWaves
            width={160}
            height={135}
            style={styles.heroWavesBg}
          />

          <View style={styles.heroRecContent}>
            {/* Topo: Estrela + RECOMENDADO PARA HOJE + Bookmark */}
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadgeLabelRow}>
                <Star size={13} color="#2F7F7C" fill="#2F7F7C" style={{ marginRight: 5 }} />
                <Text style={styles.heroBadgeLabelText}>RECOMENDADO PARA HOJE</Text>
              </View>

              <TouchableOpacity
                onPress={() => toggleFavorite(recommendedPractice.id)}
                accessibilityRole="button"
                accessibilityLabel="Favoritar recomendação"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Bookmark
                  size={18}
                  color="#2F7F7C"
                  fill={recommendedPractice.isFavorite ? '#2F7F7C' : 'transparent'}
                />
              </TouchableOpacity>
            </View>

            {/* Título da Prática */}
            <Text style={[styles.heroRecTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              {recommendedPractice.title}
            </Text>

            {/* Metadados: Duração e Nível */}
            <Text style={[styles.heroRecMeta, { color: isDark ? colors.textMuted : '#567571' }]}>
              {recommendedPractice.durationMinutes} min • {recommendedPractice.level}
            </Text>

            {/* Descrição Curta */}
            <Text
              style={[styles.heroRecDesc, { color: isDark ? colors.textMuted : '#567571' }]}
              numberOfLines={2}
            >
              {recommendedPractice.description}
            </Text>

            {/* Botão Começar */}
            <TouchableOpacity
              onPress={() => handlePracticeNavigation(recommendedPractice)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Começar ${recommendedPractice.title}`}
              style={styles.startHeroBtn}
            >
              <Play size={13} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.startHeroBtnText}>Começar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3. Campo de Busca ("Buscar práticas") */}
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
          placeholder="Buscar práticas ou atividades..."
          placeholderTextColor="#8C9E9B"
          style={[styles.searchInput, { color: isDark ? colors.text : '#173D3B' }]}
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

      {/* 4. Categorias com Scroll Horizontal */}
      <View style={styles.filterTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsRow}
        >
          {filterTabs.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setSelectedCategory(tab.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Filtrar por ${tab.label}`}
                style={[
                  styles.tabItem,
                  isSelected && styles.tabItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    {
                      color: isSelected ? '#2F7F7C' : isDark ? colors.textMuted : '#667775',
                      fontWeight: isSelected ? '800' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                {isSelected && <View style={styles.activeUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. Título da Seção e Contagem de Exercícios */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#173D3B' }]}>
          {getCategoryTitle()}
        </Text>
        <Text style={[styles.sectionCountText, { color: isDark ? colors.textMuted : '#8C9E9B' }]}>
          {filteredPractices.length} {filteredPractices.length === 1 ? 'atividade' : 'atividades'}
        </Text>
      </View>

      {/* 6. Lista de Práticas */}
      {filteredPractices.length === 0 ? (
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
            Nenhuma atividade encontrada
          </Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
            Tente buscar por outro termo ou escolha outra categoria.
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            style={styles.emptyResetBtn}
          >
            <Text style={styles.emptyResetBtnText}>Ver todas as atividades</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.practicesList}>
          {filteredPractices.map((practice) => (
            <PracticeCard
              key={practice.id}
              practice={practice}
              onPress={() => handlePracticeNavigation(practice)}
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
    marginBottom: 16,
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

  // Card Recomendado
  heroRecCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  heroWavesBg: {
    position: 'absolute',
    right: -10,
    top: 5,
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
  heroBadgeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBadgeLabelText: {
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
  heroRecMeta: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 6,
  },
  heroRecDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
    maxWidth: '80%',
  },
  startHeroBtn: {
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
  startHeroBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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

  // Abas de Filtros com Linha Inferior
  filterTabsWrapper: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBF1EF',
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 18,
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
    fontSize: 13,
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

  // Cabeçalho da Lista
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Lista
  practicesList: {
    paddingBottom: 24,
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
