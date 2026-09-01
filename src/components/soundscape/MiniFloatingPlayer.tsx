import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import {
  Play,
  Pause,
  X,
  Volume2,
  VolumeX,
  Clock,
  CloudRain,
  Waves,
  Trees,
  Flame,
  Radio,
  Wind,
  Droplet,
  Coffee,
  Music,
  SkipForward,
  Sliders,
  Maximize2,
} from 'lucide-react-native';
import { useSoundscapeStore } from '../../store/soundscapeStore';
import { useMusicStore } from '../../store/musicStore';
import { useSoundMixerStore } from '../../store/soundMixerStore';
import { useTheme } from '../../hooks/useTheme';
import { FullScreenAudioPlayer } from './FullScreenAudioPlayer';
import { SoundMixerModal } from './SoundMixerModal';

export const MiniFloatingPlayer: React.FC = () => {
  const { colors, isDark } = useTheme();

  // Soundscape store state
  const {
    currentSoundscape,
    isPlaying: isSoundPlaying,
    isMiniPlayerVisible: isSoundMiniVisible,
    remainingSeconds: soundRemainingSeconds,
    volume: soundVolume,
    togglePlayPause: toggleSoundPlayPause,
    closeMiniPlayer: closeSoundMiniPlayer,
    setVolume: setSoundVolume,
  } = useSoundscapeStore();

  // Music store state
  const {
    currentTrack,
    isPlaying: isMusicPlaying,
    volume: musicVolume,
    remainingTimerSeconds: musicRemainingSeconds,
    isFullScreenPlayerOpen,
    togglePlayPause: toggleMusicPlayPause,
    pauseTrack: pauseMusicTrack,
    nextTrack: nextMusicTrack,
    setVolume: setMusicVolume,
    setFullScreenPlayerOpen,
  } = useMusicStore();

  // Sound Mixer state
  const {
    isPlaying: isMixPlaying,
    activeLayers,
    activePresetName,
    isMixerModalOpen,
    togglePlayPause: toggleMixPlayPause,
    stopMix,
    setMixerModalOpen,
  } = useSoundMixerStore();

  const isMixActive = Boolean(isMixPlaying && activeLayers.length > 0);
  const isSoundActive = Boolean(!isMixActive && isSoundMiniVisible && currentSoundscape);
  const isMusicActive = Boolean(!isMixActive && !isSoundActive && currentTrack);

  if (!isMixActive && !isSoundActive && !isMusicActive) {
    return (
      <>
        <FullScreenAudioPlayer
          visible={isFullScreenPlayerOpen}
          onClose={() => setFullScreenPlayerOpen(false)}
        />
        <SoundMixerModal
          visible={isMixerModalOpen}
          onClose={() => setMixerModalOpen(false)}
        />
      </>
    );
  }

  const isPlaying = isMixActive
    ? isMixPlaying
    : isSoundActive
    ? isSoundPlaying
    : isMusicPlaying;

  const volume = isSoundActive ? soundVolume : musicVolume;
  const remainingSeconds = isSoundActive ? soundRemainingSeconds : musicRemainingSeconds;

  const title = isMixActive
    ? activePresetName || `Mistura (${activeLayers.length} sons)`
    : isSoundActive
    ? currentSoundscape!.name
    : currentTrack!.title;

  const subtitle = isMixActive
    ? activeLayers.map((l) => l.name).join(' + ')
    : isSoundActive
    ? currentSoundscape!.subtitle
    : `${currentTrack!.artist} · ${currentTrack!.categoryLabel}`;

  const accentColor = '#247B74';

  const handleTogglePlay = () => {
    if (isMixActive) {
      toggleMixPlayPause();
    } else if (isSoundActive) {
      toggleSoundPlayPause();
    } else {
      toggleMusicPlayPause();
    }
  };

  const handleToggleMute = () => {
    if (isSoundActive) {
      setSoundVolume(soundVolume > 0 ? 0 : 0.8);
    } else if (isMusicActive) {
      setMusicVolume(musicVolume > 0 ? 0 : 0.8);
    }
  };

  const handleClose = () => {
    if (isMixActive) {
      stopMix();
    } else if (isSoundActive) {
      closeSoundMiniPlayer();
    } else {
      pauseMusicTrack();
      useMusicStore.setState({ currentTrack: null, isPlaying: false });
    }
  };

  const handleOpenPlayer = () => {
    if (isMixActive) {
      setMixerModalOpen(true);
    } else if (isMusicActive) {
      setFullScreenPlayerOpen(true);
    } else if (isSoundActive) {
      // Abre modal de som
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <>
      <View style={styles.floatingContainer} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={handleOpenPlayer}
          style={[
            styles.playerBar,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#DCE5E2',
            },
          ]}
        >
          {/* Miniatura ou Ícone */}
          {isMusicActive && currentTrack?.thumbnailUrl ? (
            <Image
              source={{ uri: currentTrack.thumbnailUrl }}
              style={styles.thumbImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.iconCircle, { backgroundColor: accentColor }]}>
              {isMixActive ? (
                <Sliders size={16} color="#FFFFFF" />
              ) : isMusicActive ? (
                <Music size={16} color="#FFFFFF" />
              ) : (
                <CloudRain size={16} color="#FFFFFF" />
              )}
            </View>
          )}

          {/* Informações do Som / Música */}
          <View style={styles.infoCol}>
            <Text style={[styles.soundTitle, { color: isDark ? colors.text : '#173D3B' }]} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.subRow}>
              <Text style={[styles.soundSubtitle, { color: isDark ? colors.textMuted : '#667775' }]} numberOfLines={1}>
                {subtitle}
              </Text>
              {remainingSeconds !== null && remainingSeconds > 0 && (
                <View style={styles.timerBadge}>
                  <Clock size={10} color="#247B74" style={{ marginRight: 3 }} />
                  <Text style={styles.timerText}>{formatTimer(remainingSeconds)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Botão Avançar se for Música */}
          {isMusicActive && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                nextMusicTrack();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Próxima música"
              style={styles.actionBtn}
            >
              <SkipForward size={18} color={isDark ? colors.text : '#1F2927'} />
            </TouchableOpacity>
          )}

          {/* Botão Play / Pause */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleTogglePlay();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pausar reprodução' : 'Iniciar reprodução'}
            style={[styles.playBtn, { backgroundColor: '#247B74' }]}
          >
            {isPlaying ? (
              <Pause size={14} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={14} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>

          {/* Botão Fechar Miniplayer */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Fechar reprodutor"
            style={styles.closeBtn}
          >
            <X size={16} color="#8C9E9B" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {/* Modais Globais de Reprodução */}
      <FullScreenAudioPlayer
        visible={isFullScreenPlayerOpen}
        onClose={() => setFullScreenPlayerOpen(false)}
      />
      <SoundMixerModal
        visible={isMixerModalOpen}
        onClose={() => setMixerModalOpen(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 68,
    left: 12,
    right: 12,
    zIndex: 999,
    alignItems: 'center',
  },
  playerBar: {
    width: '100%',
    maxWidth: 540,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 7,
    gap: 10,
  },
  thumbImage: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  soundTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  soundSubtitle: {
    fontSize: 11.5,
    flexShrink: 1,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F3EF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  timerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#247B74',
  },
  actionBtn: {
    padding: 6,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 6,
  },
});
