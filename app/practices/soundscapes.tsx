import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Play,
  Pause,
  Bookmark,
  Volume2,
  Clock,
  CloudRain,
  Waves,
  Trees,
  Flame,
  Radio,
  Wind,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { SOUNDSCAPES, Soundscape } from '../../src/constants/soundscapes';
import { useSoundscapeStore } from '../../src/store/soundscapeStore';
import { useTheme } from '../../src/hooks/useTheme';

export default function SoundscapesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    currentSoundscape,
    isPlaying,
    volume,
    timerMinutes,
    favoriteIds,
    playSoundscape,
    togglePlayPause,
    setVolume,
    setTimer,
    toggleFavoriteSound,
  } = useSoundscapeStore();

  const timers = [
    { label: 'Sem timer', value: null },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '60 min', value: 60 },
  ];

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'cloud-rain':
        return CloudRain;
      case 'waves':
        return Waves;
      case 'trees':
        return Trees;
      case 'flame':
        return Flame;
      case 'radio':
        return Radio;
      case 'wind':
      default:
        return Wind;
    }
  };

  const handleCardPress = (sound: Soundscape) => {
    if (currentSoundscape?.id === sound.id) {
      togglePlayPause();
    } else {
      playSoundscape(sound);
    }
  };

  return (
    <AppShell>
      {/* 1. Header com botão Voltar */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Voltar para práticas"
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color="#173D3B" />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.title, { color: '#173D3B' }]}>Sons e Ambientes</Text>
          <Text style={[styles.subtitle, { color: '#667775' }]}>
            Paisagens sonoras relaxantes para focar, desacelerar ou dormir.
          </Text>
        </View>
      </View>

      {/* 2. Seletor de Temporizador */}
      <View
        style={[
          styles.timerCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#DCE5E2',
          },
        ]}
      >
        <View style={styles.timerTitleRow}>
          <Clock size={16} color="#2F7F7C" style={{ marginRight: 6 }} />
          <Text style={[styles.timerHeading, { color: '#173D3B' }]}>
            Temporizador de reprodução
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timerPillsRow}
        >
          {timers.map((t) => {
            const isSelected = timerMinutes === t.value;
            return (
              <TouchableOpacity
                key={t.label}
                onPress={() => setTimer(t.value)}
                style={[
                  styles.timerPill,
                  isSelected && [
                    styles.timerPillSelected,
                    { backgroundColor: '#2F7F7C', borderColor: '#2F7F7C' },
                  ],
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5',
                    borderColor: isDark ? colors.border : '#EBF1EF',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timerPillText,
                    {
                      color: isSelected ? '#FFFFFF' : '#667775',
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Lista de Paisagens Sonoras */}
      <View style={styles.soundscapesList}>
        {SOUNDSCAPES.map((sound) => {
          const isCurrentTrack = currentSoundscape?.id === sound.id;
          const isTrackPlaying = isCurrentTrack && isPlaying;
          const isFav = favoriteIds.includes(sound.id);
          const IconComp = renderIcon(sound.icon);

          return (
            <TouchableOpacity
              key={sound.id}
              activeOpacity={0.85}
              onPress={() => handleCardPress(sound)}
              accessibilityRole="button"
              accessibilityLabel={`${sound.name}: ${sound.description}`}
              style={[
                styles.soundCard,
                isCurrentTrack && [
                  styles.soundCardActive,
                  { borderColor: '#2F7F7C' },
                ],
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: isDark ? colors.border : '#EBF1EF',
                },
                Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined,
              ]}
            >
              {/* Ícone com fundo suave */}
              <View
                style={[
                  styles.soundIconBox,
                  {
                    backgroundColor: isDark
                      ? colors.surfaceSecondary
                      : sound.bgGradient[0],
                  },
                ]}
              >
                <IconComp size={24} color={sound.accentColor} strokeWidth={2.2} />
              </View>

              {/* Detalhes do Som */}
              <View style={styles.soundInfoCol}>
                <Text style={[styles.soundName, { color: '#173D3B' }]}>
                  {sound.name}
                </Text>
                <Text style={[styles.soundSubtitleText, { color: '#667775' }]} numberOfLines={1}>
                  {sound.subtitle}
                </Text>
                <Text style={[styles.soundDescText, { color: '#567571' }]} numberOfLines={2}>
                  {sound.description}
                </Text>
              </View>

              {/* Ações Direitas (Favoritar & Play/Pause Circular) */}
              <View style={styles.soundActionsCol}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleFavoriteSound(sound.id);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Favoritar som"
                  style={styles.favBtn}
                >
                  <Bookmark
                    size={18}
                    color="#2F7F7C"
                    fill={isFav ? '#2F7F7C' : 'transparent'}
                  />
                </TouchableOpacity>

                <View
                  style={[
                    styles.circlePlayBtn,
                    {
                      backgroundColor: isTrackPlaying
                        ? '#173D3B'
                        : '#2F7F7C',
                    },
                  ]}
                >
                  {isTrackPlaying ? (
                    <Pause size={14} color="#FFFFFF" fill="#FFFFFF" />
                  ) : (
                    <Play size={14} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  backBtn: {
    padding: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },

  // Timer Card
  timerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  timerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timerHeading: {
    fontSize: 13,
    fontWeight: '700',
  },
  timerPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timerPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  timerPillSelected: {},
  timerPillText: {
    fontSize: 12,
  },

  // Soundcards List
  soundscapesList: {
    paddingBottom: 40,
    gap: 10,
  },
  soundCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  soundCardActive: {
    borderWidth: 2,
  },
  soundIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  soundName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  soundSubtitleText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
    marginBottom: 2,
  },
  soundDescText: {
    fontSize: 12,
    lineHeight: 16,
  },
  soundActionsCol: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 54,
    paddingLeft: 4,
  },
  favBtn: {
    padding: 2,
  },
  circlePlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
