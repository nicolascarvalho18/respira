import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  SlidersHorizontal,
  Bookmark,
  X,
  RotateCcw,
  Play,
  Pause,
  Volume2,
  Clock,
  Sparkles,
  Heart,
  SkipBack,
  SkipForward,
  Music,
  Headphones,
  Compass,
  CheckCircle2,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { PracticeCard } from '../../src/components/practices/PracticeCard';
import {
  usePracticeStore,
  DurationFilter,
  LevelFilter,
  FormatFilter,
} from '../../src/store/practiceStore';
import { useSoundscapeStore } from '../../src/store/soundscapeStore';
import { useMusicStore } from '../../src/store/musicStore';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { Practice, MusicTrack } from '../../src/types';
import { Soundscape, SOUNDSCAPES } from '../../src/constants/soundscapes';
import { MUSIC_TRACKS } from '../../src/constants/musicTracks';
import { getPracticeImage, getPracticeAltText } from '../../src/utils/practiceImages';

type MainTab = 'practices' | 'sounds' | 'music';

export default function PracticesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();
  const { user } = useAuth();
  const userId = user?.id || 'demo-user-1';

  // 1. Aba ativa principal: Práticas | Sons | Músicas
  const [activeTab, setActiveTab] = useState<MainTab>('practices');

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const titles = {
        practices: 'Práticas Guiadas — Respira',
        sounds: 'Paisagens Sonoras — Respira',
        music: 'Músicas para Relaxar — Respira',
      };
      document.title = titles[activeTab];
    }
  }, [activeTab]);

  // Stores
  const {
    practices,
    userProgress,
    selectedCategory: practiceCategory,
    selectedDuration,
    selectedLevel,
    selectedFormat,
    searchQuery: practiceSearchQuery,
    isLoading: isPracticesLoading,
    setSelectedCategory: setPracticeCategory,
    setSelectedDuration,
    setSelectedLevel,
    setSelectedFormat,
    setSearchQuery: setPracticeSearchQuery,
    resetFilters: resetPracticeFilters,
    toggleFavorite: togglePracticeFavorite,
    fetchPractices,
    fetchUserProgress,
    getFilteredPractices,
  } = usePracticeStore();

  const {
    soundscapes,
    currentSoundscape,
    isPlaying: isSoundPlaying,
    volume: soundVolume,
    timerMinutes: soundTimerMinutes,
    remainingSeconds: soundRemainingSeconds,
    favoriteIds: favoriteSoundIds,
    searchQuery: soundSearchQuery,
    selectedCategory: soundCategory,
    setSearchQuery: setSoundSearchQuery,
    setSelectedCategory: setSoundCategory,
    playSoundscape,
    togglePlayPause: toggleSoundPlayPause,
    stopSoundscape,
    setVolume: setSoundVolume,
    setTimer: setSoundTimer,
    toggleFavoriteSound,
    loadSavedPreferences: loadSoundPreferences,
  } = useSoundscapeStore();

  const {
    tracks: musicTracks,
    currentTrack,
    isPlaying: isMusicPlaying,
    positionSeconds: musicPosition,
    durationSeconds: musicDuration,
    volume: musicVolume,
    timerMinutes: musicTimerMinutes,
    remainingTimerSeconds: musicRemainingSeconds,
    favoriteTrackIds,
    searchQuery: musicSearchQuery,
    selectedCategory: musicCategory,
    setSearchQuery: setMusicSearchQuery,
    setSelectedCategory: setMusicCategory,
    playTrack,
    togglePlayPause: toggleMusicPlayPause,
    pauseTrack: pauseMusicTrack,
    nextTrack,
    prevTrack,
    seekTo: seekMusic,
    setVolume: setMusicVolume,
    setTimer: setMusicTimer,
    toggleFavorite: toggleMusicFavorite,
    loadSavedPreferences: loadMusicPreferences,
  } = useMusicStore();

  // Modais de Controle
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSoundPlayerModal, setShowSoundPlayerModal] = useState(false);
  const [showMusicPlayerModal, setShowMusicPlayerModal] = useState(false);

  useEffect(() => {
    fetchPractices();
    fetchUserProgress(userId);
    loadSoundPreferences(userId);
    loadMusicPreferences(userId);
  }, [userId]);

  // =========================================================================
  // CATEGORIAS DAS 3 ABAS
  // =========================================================================
  const practiceCategories = [
    { id: 'all', label: 'Todas' },
    { id: 'breathing', label: 'Respiração' },
    { id: 'guided_meditation', label: 'Meditação' },
    { id: 'body_movement', label: 'Corpo e movimento' },
    { id: 'relaxation', label: 'Relaxamento' },
    { id: 'sleep', label: 'Sono' },
    { id: 'focus', label: 'Foco' },
    { id: 'favorites', label: 'Favoritas' },
  ];

  const soundCategories = [
    { id: 'all', label: 'Todos' },
    { id: 'water', label: 'Água' },
    { id: 'nature', label: 'Natureza' },
    { id: 'ambient', label: 'Ambiente' },
    { id: 'noise', label: 'Ruídos' },
    { id: 'favorites', label: 'Favoritos' },
  ];

  const musicCategories = [
    { id: 'all', label: 'Todas' },
    { id: 'relax', label: 'Relaxar' },
    { id: 'sleep', label: 'Dormir' },
    { id: 'study', label: 'Estudar' },
    { id: 'meditate', label: 'Meditar' },
    { id: 'decelerate', label: 'Desacelerar' },
    { id: 'pause', label: 'Pausa' },
    { id: 'favorites', label: 'Favoritas' },
  ];

  // Listas filtradas
  const filteredPracticesList = useMemo(() => {
    return getFilteredPractices();
  }, [practices, practiceCategory, selectedDuration, selectedLevel, selectedFormat, practiceSearchQuery]);

  const filteredSoundsList = useMemo(() => {
    return soundscapes.filter((s) => {
      if (soundCategory === 'favorites') {
        if (!favoriteSoundIds.includes(s.id)) return false;
      } else if (soundCategory !== 'all' && s.category !== soundCategory) {
        return false;
      }

      if (soundSearchQuery.trim()) {
        const q = soundSearchQuery.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesSub = s.subtitle.toLowerCase().includes(q);
        const matchesDesc = s.description.toLowerCase().includes(q);
        const matchesCat = s.categoryLabel.toLowerCase().includes(q);
        if (!matchesName && !matchesSub && !matchesDesc && !matchesCat) return false;
      }

      return true;
    });
  }, [soundscapes, soundCategory, favoriteSoundIds, soundSearchQuery]);

  const filteredMusicList = useMemo(() => {
    return musicTracks.filter((m) => {
      if (musicCategory === 'favorites') {
        if (!favoriteTrackIds.includes(m.id)) return false;
      } else if (musicCategory !== 'all' && m.category !== musicCategory) {
        return false;
      }

      if (musicSearchQuery.trim()) {
        const q = musicSearchQuery.toLowerCase().trim();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesArtist = m.artist.toLowerCase().includes(q);
        const matchesDesc = m.description.toLowerCase().includes(q);
        const matchesCat = m.categoryLabel.toLowerCase().includes(q);
        if (!matchesTitle && !matchesArtist && !matchesDesc && !matchesCat) return false;
      }

      return true;
    });
  }, [musicTracks, musicCategory, favoriteTrackIds, musicSearchQuery]);

  const formatTimer = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AppShell>
      <View style={[styles.screenContainer, isDesktop && styles.screenContainerDesktop]}>
        {/* ========================================================================= */}
        {/* CABEÇALHO DA PÁGINA COM SELETOR DE 3 ABAS */}
        {/* ========================================================================= */}
        <View style={styles.headerSection}>
          <Text style={[styles.pageTitle, { color: isDark ? '#FFFFFF' : '#1F2927' }]}>
            Práticas
          </Text>
          <Text style={[styles.pageSubtitle, { color: isDark ? '#CBD5E1' : '#68736F' }]}>
            Exercícios guiados, paisagens sonoras e músicas para seu bem-estar
          </Text>

          {/* Seletor de 3 Abas Principais */}
          <View
            style={[
              styles.mainTabsContainer,
              {
                backgroundColor: isDark ? '#1C2624' : '#ECEFEF',
                borderColor: isDark ? '#2E3D3A' : '#DFE4E1',
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setActiveTab('practices')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'practices' }}
              accessibilityLabel="Aba Práticas"
              style={[
                styles.mainTabBtn,
                activeTab === 'practices' && [
                  styles.mainTabBtnActive,
                  { backgroundColor: isDark ? '#243431' : '#FFFFFF' },
                ],
              ]}
            >
              <Sparkles
                size={16}
                color={activeTab === 'practices' ? '#247B74' : isDark ? '#94A3B8' : '#68736F'}
                strokeWidth={2}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.mainTabBtnText,
                  {
                    color: activeTab === 'practices' ? (isDark ? '#5ECFC3' : '#247B74') : isDark ? '#CBD5E1' : '#566460',
                    fontWeight: activeTab === 'practices' ? '700' : '500',
                  },
                ]}
              >
                Práticas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('sounds')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'sounds' }}
              accessibilityLabel="Aba Sons"
              style={[
                styles.mainTabBtn,
                activeTab === 'sounds' && [
                  styles.mainTabBtnActive,
                  { backgroundColor: isDark ? '#243431' : '#FFFFFF' },
                ],
              ]}
            >
              <Headphones
                size={16}
                color={activeTab === 'sounds' ? '#247B74' : isDark ? '#94A3B8' : '#68736F'}
                strokeWidth={2}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.mainTabBtnText,
                  {
                    color: activeTab === 'sounds' ? (isDark ? '#5ECFC3' : '#247B74') : isDark ? '#CBD5E1' : '#566460',
                    fontWeight: activeTab === 'sounds' ? '700' : '500',
                  },
                ]}
              >
                Sons
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('music')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'music' }}
              accessibilityLabel="Aba Músicas"
              style={[
                styles.mainTabBtn,
                activeTab === 'music' && [
                  styles.mainTabBtnActive,
                  { backgroundColor: isDark ? '#243431' : '#FFFFFF' },
                ],
              ]}
            >
              <Music
                size={16}
                color={activeTab === 'music' ? '#247B74' : isDark ? '#94A3B8' : '#68736F'}
                strokeWidth={2}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.mainTabBtnText,
                  {
                    color: activeTab === 'music' ? (isDark ? '#5ECFC3' : '#247B74') : isDark ? '#CBD5E1' : '#566460',
                    fontWeight: activeTab === 'music' ? '700' : '500',
                  },
                ]}
              >
                Músicas
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* ABA 1: PRÁTICAS GUIADAS */}
        {/* ========================================================================= */}
        {activeTab === 'practices' && (
          <View style={styles.tabContent}>
            {/* Campo de Busca e Botão de Filtro */}
            <View style={styles.searchRow}>
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#DFE4E1',
                  },
                ]}
              >
                <Search size={18} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} />
                <TextInput
                  value={practiceSearchQuery}
                  onChangeText={setPracticeSearchQuery}
                  placeholder="Buscar por prática, instrutor ou foco..."
                  placeholderTextColor={isDark ? colors.textMuted : '#8F9B97'}
                  style={[styles.searchInput, { color: isDark ? colors.text : '#1F2927' }]}
                />
                {practiceSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setPracticeSearchQuery('')}>
                    <X size={16} color="#68736F" strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setShowFilterModal(true)}
                accessibilityRole="button"
                accessibilityLabel="Abrir filtros de práticas"
                style={[
                  styles.filterIconBtn,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#DFE4E1',
                  },
                ]}
              >
                <SlidersHorizontal size={18} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />
              </TouchableOpacity>
            </View>

            {/* Chips Horizontais de Categoria */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPillsScroll}
            >
              {practiceCategories.map((cat) => {
                const isSelected = practiceCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setPracticeCategory(cat.id as any)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    style={[
                      styles.categoryPill,
                      isSelected && { backgroundColor: '#247B74', borderColor: '#247B74' },
                      !isSelected && {
                        backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                        borderColor: isDark ? colors.border : '#DFE4E1',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        { color: isSelected ? '#FFFFFF' : isDark ? colors.text : '#1F2927' },
                        isSelected && { fontWeight: '600' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Contador de Resultados */}
            <View style={styles.resultsHeaderRow}>
              <Text style={[styles.resultsCountText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                {filteredPracticesList.length} {filteredPracticesList.length === 1 ? 'prática encontrada' : 'práticas encontradas'}
              </Text>
            </View>

            {/* Lista de Práticas */}
            {isPracticesLoading ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator size="large" color="#247B74" />
                <Text style={[styles.loadingText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  Carregando práticas...
                </Text>
              </View>
            ) : filteredPracticesList.length === 0 ? (
              <View style={styles.emptyBlock}>
                <Compass size={40} color={isDark ? colors.textMuted : '#8F9B97'} strokeWidth={1.5} />
                <Text style={[styles.emptyTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Nenhuma prática encontrada
                </Text>
                <Text style={[styles.emptySubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  Tente ajustar a busca ou limpar os filtros para ver mais opções.
                </Text>
                <TouchableOpacity
                  onPress={resetPracticeFilters}
                  style={styles.emptyActionBtn}
                >
                  <Text style={styles.emptyActionBtnText}>Limpar filtros</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.practicesGrid}>
                {filteredPracticesList.map((prat) => {
                  const prog = userProgress[prat.id];
                  return (
                    <PracticeCard
                      key={prat.id}
                      practice={prat}
                      progress={prog}
                      variant="horizontal"
                      onPress={() => router.push(`/practices/player/${prat.id}` as any)}
                      onToggleFavorite={() => togglePracticeFavorite(prat.id)}
                    />
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: SONS (PAISAGENS SONORAS) */}
        {/* ========================================================================= */}
        {activeTab === 'sounds' && (
          <View style={styles.tabContent}>
            {/* Busca de Sons */}
            <View style={styles.searchRow}>
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#DFE4E1',
                    flex: 1,
                  },
                ]}
              >
                <Search size={18} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} />
                <TextInput
                  value={soundSearchQuery}
                  onChangeText={setSoundSearchQuery}
                  placeholder="Buscar som da natureza, água, ruídos..."
                  placeholderTextColor={isDark ? colors.textMuted : '#8F9B97'}
                  style={[styles.searchInput, { color: isDark ? colors.text : '#1F2927' }]}
                />
                {soundSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSoundSearchQuery('')}>
                    <X size={16} color="#68736F" strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Chips de Categoria de Sons */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPillsScroll}
            >
              {soundCategories.map((cat) => {
                const isSelected = soundCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSoundCategory(cat.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    style={[
                      styles.categoryPill,
                      isSelected && { backgroundColor: '#247B74', borderColor: '#247B74' },
                      !isSelected && {
                        backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                        borderColor: isDark ? colors.border : '#DFE4E1',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        { color: isSelected ? '#FFFFFF' : isDark ? colors.text : '#1F2927' },
                        isSelected && { fontWeight: '600' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Contador de Sons */}
            <View style={styles.resultsHeaderRow}>
              <Text style={[styles.resultsCountText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                {filteredSoundsList.length} {filteredSoundsList.length === 1 ? 'som disponível' : 'sons disponíveis'}
              </Text>
            </View>

            {/* Grid de Cards de Sons */}
            {filteredSoundsList.length === 0 ? (
              <View style={styles.emptyBlock}>
                <Headphones size={40} color={isDark ? colors.textMuted : '#8F9B97'} strokeWidth={1.5} />
                <Text style={[styles.emptyTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Nenhum som encontrado
                </Text>
                <Text style={[styles.emptySubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  Tente buscar por outro termo ou selecione a categoria "Todos".
                </Text>
              </View>
            ) : (
              <View style={styles.audioCardsGrid}>
                {filteredSoundsList.map((sound) => {
                  const isCurrent = currentSoundscape?.id === sound.id;
                  const isPlaying = isCurrent && isSoundPlaying;
                  const isFav = favoriteSoundIds.includes(sound.id);

                  return (
                    <TouchableOpacity
                      key={sound.id}
                      activeOpacity={0.88}
                      onPress={() => {
                        if (isCurrent) {
                          toggleSoundPlayPause();
                        } else {
                          playSoundscape(sound);
                        }
                      }}
                      style={[
                        styles.audioCard,
                        {
                          backgroundColor: isDark ? colors.surface : '#FFFFFF',
                          borderColor: isCurrent ? '#247B74' : isDark ? colors.border : '#DFE4E1',
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: sound.thumbnailUrl }}
                        style={styles.audioCardCover}
                        resizeMode="cover"
                      />

                      <View style={styles.audioCardContent}>
                        <View style={styles.audioCardTopRow}>
                          <Text
                            style={[
                              styles.audioCardTitle,
                              { color: isCurrent ? '#247B74' : isDark ? colors.text : '#1F2927' },
                            ]}
                            numberOfLines={1}
                          >
                            {sound.name}
                          </Text>

                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              toggleFavoriteSound(sound.id, userId);
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Bookmark
                              size={18}
                              color={isFav ? '#247B74' : isDark ? colors.textMuted : '#8F9B97'}
                              fill={isFav ? '#247B74' : 'transparent'}
                            />
                          </TouchableOpacity>
                        </View>

                        <Text
                          style={[styles.audioCardSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}
                          numberOfLines={1}
                        >
                          {sound.subtitle}
                        </Text>

                        <View style={styles.audioCardFooter}>
                          <View style={[styles.badgeTag, { backgroundColor: isDark ? '#1C3833' : '#EDF7F5' }]}>
                            <Text style={[styles.badgeTagText, { color: '#247B74' }]}>
                              {sound.categoryLabel}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.playCircleBtn,
                              { backgroundColor: isPlaying ? '#247B74' : isDark ? '#243431' : '#EDF7F5' },
                            ]}
                          >
                            {isPlaying ? (
                              <Pause size={14} color="#FFFFFF" />
                            ) : (
                              <Play size={14} color={isCurrent ? '#247B74' : isDark ? '#CBD5E1' : '#247B74'} style={{ marginLeft: 2 }} />
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: MÚSICAS INSTRUMENTAIS */}
        {/* ========================================================================= */}
        {activeTab === 'music' && (
          <View style={styles.tabContent}>
            {/* Busca de Músicas */}
            <View style={styles.searchRow}>
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#DFE4E1',
                    flex: 1,
                  },
                ]}
              >
                <Search size={18} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} />
                <TextInput
                  value={musicSearchQuery}
                  onChangeText={setMusicSearchQuery}
                  placeholder="Buscar faixa de piano, violão ou ambiente..."
                  placeholderTextColor={isDark ? colors.textMuted : '#8F9B97'}
                  style={[styles.searchInput, { color: isDark ? colors.text : '#1F2927' }]}
                />
                {musicSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setMusicSearchQuery('')}>
                    <X size={16} color="#68736F" strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Chips de Finalidade das Músicas */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPillsScroll}
            >
              {musicCategories.map((cat) => {
                const isSelected = musicCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setMusicCategory(cat.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    style={[
                      styles.categoryPill,
                      isSelected && { backgroundColor: '#247B74', borderColor: '#247B74' },
                      !isSelected && {
                        backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                        borderColor: isDark ? colors.border : '#DFE4E1',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        { color: isSelected ? '#FFFFFF' : isDark ? colors.text : '#1F2927' },
                        isSelected && { fontWeight: '600' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Contador de Músicas */}
            <View style={styles.resultsHeaderRow}>
              <Text style={[styles.resultsCountText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                {filteredMusicList.length} {filteredMusicList.length === 1 ? 'faixa disponível' : 'faixas disponíveis'}
              </Text>
            </View>

            {/* Lista de Músicas */}
            {filteredMusicList.length === 0 ? (
              <View style={styles.emptyBlock}>
                <Music size={40} color={isDark ? colors.textMuted : '#8F9B97'} strokeWidth={1.5} />
                <Text style={[styles.emptyTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Nenhuma música encontrada
                </Text>
                <Text style={[styles.emptySubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  Tente buscar por outro termo ou escolha outra finalidade.
                </Text>
              </View>
            ) : (
              <View style={styles.audioCardsGrid}>
                {filteredMusicList.map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const isPlaying = isCurrent && isMusicPlaying;
                  const isFav = favoriteTrackIds.includes(track.id);

                  return (
                    <TouchableOpacity
                      key={track.id}
                      activeOpacity={0.88}
                      onPress={() => {
                        if (isCurrent) {
                          toggleMusicPlayPause();
                        } else {
                          playTrack(track);
                        }
                      }}
                      style={[
                        styles.audioCard,
                        {
                          backgroundColor: isDark ? colors.surface : '#FFFFFF',
                          borderColor: isCurrent ? '#247B74' : isDark ? colors.border : '#DFE4E1',
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: track.thumbnailUrl }}
                        style={styles.audioCardCover}
                        resizeMode="cover"
                      />

                      <View style={styles.audioCardContent}>
                        <View style={styles.audioCardTopRow}>
                          <Text
                            style={[
                              styles.audioCardTitle,
                              { color: isCurrent ? '#247B74' : isDark ? colors.text : '#1F2927' },
                            ]}
                            numberOfLines={1}
                          >
                            {track.title}
                          </Text>

                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              toggleMusicFavorite(track.id, userId);
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Bookmark
                              size={18}
                              color={isFav ? '#247B74' : isDark ? colors.textMuted : '#8F9B97'}
                              fill={isFav ? '#247B74' : 'transparent'}
                            />
                          </TouchableOpacity>
                        </View>

                        <Text
                          style={[styles.audioCardSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}
                          numberOfLines={1}
                        >
                          {track.artist} · {track.durationMinutes} min
                        </Text>

                        <View style={styles.audioCardFooter}>
                          <View style={[styles.badgeTag, { backgroundColor: isDark ? '#1C3833' : '#EDF7F5' }]}>
                            <Text style={[styles.badgeTagText, { color: '#247B74' }]}>
                              {track.categoryLabel}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.playCircleBtn,
                              { backgroundColor: isPlaying ? '#247B74' : isDark ? '#243431' : '#EDF7F5' },
                            ]}
                          >
                            {isPlaying ? (
                              <Pause size={14} color="#FFFFFF" />
                            ) : (
                              <Play size={14} color={isCurrent ? '#247B74' : isDark ? '#CBD5E1' : '#247B74'} style={{ marginLeft: 2 }} />
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* MINI PLAYER FLUTUANTE DE SONS / MÚSICAS */}
        {/* ========================================================================= */}
        {(currentSoundscape || currentTrack) && (
          <View
            style={[
              styles.floatingMiniPlayer,
              {
                backgroundColor: isDark ? '#1C2624' : '#FFFFFF',
                borderColor: isDark ? '#2E3D3A' : '#DFE4E1',
              },
            ]}
          >
            {currentSoundscape && (
              <View style={styles.miniPlayerInner}>
                <TouchableOpacity
                  onPress={() => setShowSoundPlayerModal(true)}
                  style={styles.miniPlayerInfo}
                >
                  <Headphones size={18} color="#247B74" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.miniPlayerTitle, { color: isDark ? '#FFFFFF' : '#1F2927' }]}
                      numberOfLines={1}
                    >
                      {currentSoundscape.name}
                    </Text>
                    <Text style={[styles.miniPlayerStatus, { color: '#247B74' }]}>
                      {isSoundPlaying ? 'Tocando som ambiente' : 'Pausado'}
                      {soundRemainingSeconds ? ` · ${formatTimer(soundRemainingSeconds)}` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={toggleSoundPlayPause}
                  style={styles.miniPlayerActionBtn}
                >
                  {isSoundPlaying ? (
                    <Pause size={18} color="#FFFFFF" />
                  ) : (
                    <Play size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={stopSoundscape}
                  style={{ padding: 6, marginLeft: 4 }}
                >
                  <X size={16} color={isDark ? '#94A3B8' : '#68736F'} />
                </TouchableOpacity>
              </View>
            )}

            {!currentSoundscape && currentTrack && (
              <View style={styles.miniPlayerInner}>
                <TouchableOpacity
                  onPress={() => setShowMusicPlayerModal(true)}
                  style={styles.miniPlayerInfo}
                >
                  <Music size={18} color="#247B74" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.miniPlayerTitle, { color: isDark ? '#FFFFFF' : '#1F2927' }]}
                      numberOfLines={1}
                    >
                      {currentTrack.title}
                    </Text>
                    <Text style={[styles.miniPlayerStatus, { color: '#247B74' }]}>
                      {isMusicPlaying ? 'Reproduzindo música' : 'Pausada'}
                      {musicRemainingSeconds ? ` · Timer ${formatTimer(musicRemainingSeconds)}` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={toggleMusicPlayPause}
                  style={styles.miniPlayerActionBtn}
                >
                  {isMusicPlaying ? (
                    <Pause size={18} color="#FFFFFF" />
                  ) : (
                    <Play size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={pauseMusicTrack}
                  style={{ padding: 6, marginLeft: 4 }}
                >
                  <X size={16} color={isDark ? '#94A3B8' : '#68736F'} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* MODAL DE FILTRO DE PRÁTICAS */}
        {/* ========================================================================= */}
        <Modal
          visible={showFilterModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalSheet,
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: isDark ? colors.border : '#DFE4E1',
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Filtrar práticas
                </Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)} style={{ padding: 4 }}>
                  <X size={20} color={isDark ? colors.text : '#1F2927'} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Duração */}
                <Text style={[styles.filterGroupTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Duração
                </Text>
                <View style={styles.filterOptionsGrid}>
                  {[
                    { id: 'all', label: 'Qualquer duração' },
                    { id: 'up_to_5', label: 'Até 5 minutos' },
                    { id: '5_to_10', label: '5 a 10 minutos' },
                    { id: '10_to_20', label: '10 a 20 minutos' },
                  ].map((dur) => (
                    <TouchableOpacity
                      key={dur.id}
                      onPress={() => setSelectedDuration(dur.id as DurationFilter)}
                      style={[
                        styles.filterOptionChip,
                        selectedDuration === dur.id
                          ? { backgroundColor: '#247B74', borderColor: '#247B74' }
                          : {
                              backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                              borderColor: isDark ? colors.border : '#DFE4E1',
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          {
                            color: selectedDuration === dur.id ? '#FFFFFF' : isDark ? colors.text : '#1F2927',
                            fontWeight: selectedDuration === dur.id ? '600' : '400',
                          },
                        ]}
                      >
                        {dur.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Nível */}
                <Text style={[styles.filterGroupTitle, { color: isDark ? colors.text : '#1F2927', marginTop: 16 }]}>
                  Nível
                </Text>
                <View style={styles.filterOptionsGrid}>
                  {[
                    { id: 'all', label: 'Todos os níveis' },
                    { id: 'Iniciante', label: 'Iniciante' },
                    { id: 'Intermediário', label: 'Intermediário' },
                    { id: 'Avançado', label: 'Avançado' },
                  ].map((lvl) => (
                    <TouchableOpacity
                      key={lvl.id}
                      onPress={() => setSelectedLevel(lvl.id as LevelFilter)}
                      style={[
                        styles.filterOptionChip,
                        selectedLevel === lvl.id
                          ? { backgroundColor: '#247B74', borderColor: '#247B74' }
                          : {
                              backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                              borderColor: isDark ? colors.border : '#DFE4E1',
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          {
                            color: selectedLevel === lvl.id ? '#FFFFFF' : isDark ? colors.text : '#1F2927',
                            fontWeight: selectedLevel === lvl.id ? '600' : '400',
                          },
                        ]}
                      >
                        {lvl.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Formato */}
                <Text style={[styles.filterGroupTitle, { color: isDark ? colors.text : '#1F2927', marginTop: 16 }]}>
                  Formato
                </Text>
                <View style={styles.filterOptionsGrid}>
                  {[
                    { id: 'all', label: 'Todos os formatos' },
                    { id: 'audio', label: 'Áudio guiado' },
                    { id: 'interactive', label: 'Interativo' },
                    { id: 'video', label: 'Vídeo' },
                  ].map((fmt) => (
                    <TouchableOpacity
                      key={fmt.id}
                      onPress={() => setSelectedFormat(fmt.id as FormatFilter)}
                      style={[
                        styles.filterOptionChip,
                        selectedFormat === fmt.id
                          ? { backgroundColor: '#247B74', borderColor: '#247B74' }
                          : {
                              backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                              borderColor: isDark ? colors.border : '#DFE4E1',
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          {
                            color: selectedFormat === fmt.id ? '#FFFFFF' : isDark ? colors.text : '#1F2927',
                            fontWeight: selectedFormat === fmt.id ? '600' : '400',
                          },
                        ]}
                      >
                        {fmt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  onPress={resetPracticeFilters}
                  style={[styles.modalResetBtn, { borderColor: isDark ? colors.border : '#DFE4E1' }]}
                >
                  <Text style={[styles.modalResetBtnText, { color: isDark ? colors.text : '#1F2927' }]}>
                    Redefinir
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowFilterModal(false)}
                  style={styles.modalApplyBtn}
                >
                  <Text style={styles.modalApplyBtnText}>Aplicar filtros</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL PLAYER COMPLETO DE PAISAGENS SONORAS */}
        {/* ========================================================================= */}
        {currentSoundscape && (
          <Modal
            visible={showSoundPlayerModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowSoundPlayerModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalSheet,
                  {
                    backgroundColor: isDark ? colors.surface : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#DFE4E1',
                    maxHeight: '85%',
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                    Paisagem Sonora
                  </Text>
                  <TouchableOpacity onPress={() => setShowSoundPlayerModal(false)} style={{ padding: 4 }}>
                    <X size={20} color={isDark ? colors.text : '#1F2927'} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                  <Image
                    source={{ uri: currentSoundscape.thumbnailUrl }}
                    style={styles.playerModalCover}
                    resizeMode="cover"
                  />

                  <Text style={[styles.playerModalTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                    {currentSoundscape.name}
                  </Text>
                  <Text style={[styles.playerModalSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                    {currentSoundscape.description}
                  </Text>

                  {/* Controle de Volume */}
                  <View style={styles.volumeControlRow}>
                    <Volume2 size={18} color="#247B74" style={{ marginRight: 10 }} />
                    <View style={styles.volumeTrack}>
                      <View style={[styles.volumeFill, { width: `${soundVolume * 100}%` }]} />
                    </View>
                  </View>

                  {/* Temporizador de Desligamento */}
                  <View style={styles.timerSection}>
                    <View style={styles.timerHeaderRow}>
                      <Clock size={16} color="#247B74" style={{ marginRight: 6 }} />
                      <Text style={[styles.timerSectionTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                        Temporizador de desligamento: {soundRemainingSeconds ? formatTimer(soundRemainingSeconds) : 'Desativado'}
                      </Text>
                    </View>

                    <View style={styles.timerPillsRow}>
                      {[5, 10, 15, 30, 45, 60].map((min) => (
                        <TouchableOpacity
                          key={min}
                          onPress={() => setSoundTimer(soundTimerMinutes === min ? null : min)}
                          style={[
                            styles.timerPill,
                            soundTimerMinutes === min
                              ? { backgroundColor: '#247B74', borderColor: '#247B74' }
                              : {
                                  backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                                  borderColor: isDark ? colors.border : '#DFE4E1',
                                },
                          ]}
                        >
                          <Text
                            style={[
                              styles.timerPillText,
                              { color: soundTimerMinutes === min ? '#FFFFFF' : isDark ? colors.text : '#1F2927' },
                            ]}
                          >
                            {min} min
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Botão Play / Pause Principal */}
                  <TouchableOpacity
                    onPress={toggleSoundPlayPause}
                    style={styles.playerMainPlayBtn}
                  >
                    {isSoundPlaying ? (
                      <Pause size={24} color="#FFFFFF" />
                    ) : (
                      <Play size={24} color="#FFFFFF" style={{ marginLeft: 3 }} />
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* ========================================================================= */}
        {/* MODAL PLAYER COMPLETO DE MÚSICAS */}
        {/* ========================================================================= */}
        {currentTrack && (
          <Modal
            visible={showMusicPlayerModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowMusicPlayerModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalSheet,
                  {
                    backgroundColor: isDark ? colors.surface : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#DFE4E1',
                    maxHeight: '85%',
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                    Música Tranquila
                  </Text>
                  <TouchableOpacity onPress={() => setShowMusicPlayerModal(false)} style={{ padding: 4 }}>
                    <X size={20} color={isDark ? colors.text : '#1F2927'} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                  <Image
                    source={{ uri: currentTrack.thumbnailUrl }}
                    style={styles.playerModalCover}
                    resizeMode="cover"
                  />

                  <Text style={[styles.playerModalTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                    {currentTrack.title}
                  </Text>
                  <Text style={[styles.playerModalSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                    {currentTrack.artist} · {currentTrack.categoryLabel}
                  </Text>

                  {/* Barra de Progresso com Minutagem */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(100, Math.max(0, (musicPosition / (musicDuration || 1)) * 100))}%`,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.progressTimeRow}>
                      <Text style={[styles.progressTimeText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                        {formatTimer(musicPosition)}
                      </Text>
                      <Text style={[styles.progressTimeText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                        {formatTimer(musicDuration)}
                      </Text>
                    </View>
                  </View>

                  {/* Controles: Anterior, Play/Pause, Próxima */}
                  <View style={styles.musicControlsRow}>
                    <TouchableOpacity onPress={prevTrack} style={styles.musicSideCtrlBtn}>
                      <SkipBack size={22} color={isDark ? colors.text : '#1F2927'} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={toggleMusicPlayPause} style={styles.playerMainPlayBtn}>
                      {isMusicPlaying ? (
                        <Pause size={24} color="#FFFFFF" />
                      ) : (
                        <Play size={24} color="#FFFFFF" style={{ marginLeft: 3 }} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={nextTrack} style={styles.musicSideCtrlBtn}>
                      <SkipForward size={22} color={isDark ? colors.text : '#1F2927'} />
                    </TouchableOpacity>
                  </View>

                  {/* Temporizador */}
                  <View style={styles.timerSection}>
                    <View style={styles.timerHeaderRow}>
                      <Clock size={16} color="#247B74" style={{ marginRight: 6 }} />
                      <Text style={[styles.timerSectionTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                        Temporizador: {musicRemainingSeconds ? formatTimer(musicRemainingSeconds) : 'Desativado'}
                      </Text>
                    </View>

                    <View style={styles.timerPillsRow}>
                      {[5, 10, 15, 30, 45, 60].map((min) => (
                        <TouchableOpacity
                          key={min}
                          onPress={() => setMusicTimer(musicTimerMinutes === min ? null : min)}
                          style={[
                            styles.timerPill,
                            musicTimerMinutes === min
                              ? { backgroundColor: '#247B74', borderColor: '#247B74' }
                              : {
                                  backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                                  borderColor: isDark ? colors.border : '#DFE4E1',
                                },
                          ]}
                        >
                          <Text
                            style={[
                              styles.timerPillText,
                              { color: musicTimerMinutes === min ? '#FFFFFF' : isDark ? colors.text : '#1F2927' },
                            ]}
                          >
                            {min} min
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    width: '100%',
    paddingBottom: 40,
  },
  screenContainerDesktop: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 14,
  },
  mainTabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  mainTabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  mainTabBtnText: {
    fontSize: 14.5,
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  filterIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillsScroll: {
    gap: 8,
    paddingBottom: 10,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 13.5,
  },
  resultsHeaderRow: {
    marginVertical: 8,
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '500',
  },
  practicesGrid: {
    marginTop: 4,
  },
  audioCardsGrid: {
    marginTop: 4,
    gap: 12,
  },
  audioCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 88,
  },
  audioCardCover: {
    width: 100,
    height: '100%',
    minHeight: 88,
    backgroundColor: '#ECEFEE',
  },
  audioCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  audioCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  audioCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  audioCardSubtitle: {
    fontSize: 13,
    marginBottom: 8,
  },
  audioCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeTagText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  playCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingMiniPlayer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 12,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  miniPlayerInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniPlayerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniPlayerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  miniPlayerStatus: {
    fontSize: 12,
    marginTop: 1,
  },
  miniPlayerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#247B74',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  loadingBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#247B74',
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  filterGroupTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 13,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalResetBtn: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResetBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  modalApplyBtn: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#247B74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '600',
  },
  playerModalCover: {
    width: 140,
    height: 140,
    borderRadius: 16,
    marginBottom: 16,
  },
  playerModalTitle: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  playerModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  volumeControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginBottom: 20,
  },
  volumeTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#DFE4E1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    backgroundColor: '#247B74',
  },
  timerSection: {
    width: '100%',
    paddingVertical: 12,
    marginBottom: 20,
  },
  timerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  timerSectionTitle: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  timerPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  timerPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  timerPillText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  playerMainPlayBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#247B74',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    marginBottom: 10,
  },
  progressSection: {
    width: '90%',
    marginBottom: 16,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#DFE4E1',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#247B74',
  },
  progressTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTimeText: {
    fontSize: 12,
  },
  musicControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  musicSideCtrlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
