import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
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
} from 'lucide-react-native';
import { useSoundscapeStore } from '../../store/soundscapeStore';
import { useTheme } from '../../hooks/useTheme';

export const MiniFloatingPlayer: React.FC = () => {
  const { colors, isDark } = useTheme();
  const {
    currentSoundscape,
    isPlaying,
    isMiniPlayerVisible,
    remainingSeconds,
    volume,
    togglePlayPause,
    closeMiniPlayer,
    setVolume,
  } = useSoundscapeStore();

  if (!isMiniPlayerVisible || !currentSoundscape) return null;

  const renderIcon = () => {
    switch (currentSoundscape.icon) {
      case 'cloud-rain':
        return <CloudRain size={16} color="#FFFFFF" />;
      case 'waves':
        return <Waves size={16} color="#FFFFFF" />;
      case 'trees':
        return <Trees size={16} color="#FFFFFF" />;
      case 'flame':
        return <Flame size={16} color="#FFFFFF" />;
      case 'radio':
        return <Radio size={16} color="#FFFFFF" />;
      case 'wind':
      default:
        return <Wind size={16} color="#FFFFFF" />;
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <View
        style={[
          styles.playerBar,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#DCE5E2',
          },
        ]}
      >
        {/* Ícone com cor de destaque */}
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: currentSoundscape.accentColor || '#2F7F7C' },
          ]}
        >
          {renderIcon()}
        </View>

        {/* Informações do Som & Temporizador */}
        <View style={styles.infoCol}>
          <Text style={[styles.soundTitle, { color: '#173D3B' }]} numberOfLines={1}>
            {currentSoundscape.name}
          </Text>
          <View style={styles.subRow}>
            <Text style={[styles.soundSubtitle, { color: '#667775' }]} numberOfLines={1}>
              {currentSoundscape.subtitle}
            </Text>
            {remainingSeconds !== null && (
              <View style={styles.timerBadge}>
                <Clock size={10} color="#2F7F7C" style={{ marginRight: 3 }} />
                <Text style={styles.timerText}>{formatTimer(remainingSeconds)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Controle de Volume */}
        <TouchableOpacity
          onPress={() => setVolume(volume > 0 ? 0 : 0.7)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Ajustar volume"
          style={styles.actionBtn}
        >
          {volume === 0 ? (
            <VolumeX size={18} color="#8C9E9B" />
          ) : (
            <Volume2 size={18} color="#2F7F7C" />
          )}
        </TouchableOpacity>

        {/* Botão Play / Pause */}
        <TouchableOpacity
          onPress={togglePlayPause}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pausar som' : 'Reproduzir som'}
          style={[styles.playBtn, { backgroundColor: '#2F7F7C' }]}
        >
          {isPlaying ? (
            <Pause size={14} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <Play size={14} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>

        {/* Botão Fechar Miniplayer */}
        <TouchableOpacity
          onPress={closeMiniPlayer}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Fechar reprodutor"
          style={styles.closeBtn}
        >
          <X size={16} color="#8C9E9B" />
        </TouchableOpacity>
      </View>
    </View>
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
    maxWidth: 500,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
  },
  soundTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  soundSubtitle: {
    fontSize: 11,
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
    color: '#2F7F7C',
  },
  actionBtn: {
    padding: 4,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 4,
  },
});
