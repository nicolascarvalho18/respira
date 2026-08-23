import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, CheckCircle } from 'lucide-react-native';
import { useAudio } from '../../hooks/useAudio';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from '../ui/AppButton';

export interface AudioPlayerProps {
  audioUrl?: string;
  title: string;
  durationMinutes: number;
  onComplete?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  title,
  durationMinutes,
  onComplete,
}) => {
  const { colors, isDark } = useTheme();
  const {
    isPlaying,
    positionMs,
    durationMs,
    volume,
    togglePlayPause,
    seek,
    changeVolume,
  } = useAudio(audioUrl);

  const totalDurationMs = durationMs > 0 ? durationMs : durationMinutes * 60 * 1000;
  const progress = totalDurationMs > 0 ? Math.min(1, positionMs / totalDurationMs) : 0;

  const formatSeconds = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeekDelta = (deltaMs: number) => {
    seek(positionMs + deltaMs);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      {/* Barra de Progresso */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#2D3740' : '#E2E8F0' }]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progress * 100}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>
            {formatSeconds(positionMs)}
          </Text>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>
            {formatSeconds(totalDurationMs)}
          </Text>
        </View>
      </View>

      {/* Controles de Reprodução */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          onPress={() => handleSeekDelta(-10000)}
          accessibilityRole="button"
          accessibilityLabel="Voltar 10 segundos"
          style={styles.seekButton}
        >
          <RotateCcw size={22} color={colors.text} />
          <Text style={[styles.seekText, { color: colors.textMuted }]}>-10s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={togglePlayPause}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
          style={[styles.mainPlayButton, { backgroundColor: colors.primary }]}
        >
          {isPlaying ? (
            <Pause size={28} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <Play size={28} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSeekDelta(10000)}
          accessibilityRole="button"
          accessibilityLabel="Avançar 10 segundos"
          style={styles.seekButton}
        >
          <RotateCw size={22} color={colors.text} />
          <Text style={[styles.seekText, { color: colors.textMuted }]}>+10s</Text>
        </TouchableOpacity>
      </View>

      {/* Controle de Volume e Conclusão */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          onPress={() => changeVolume(volume > 0 ? 0 : 1)}
          accessibilityRole="button"
          accessibilityLabel={volume > 0 ? 'Mutar' : 'Desmutar'}
          style={styles.volumeButton}
        >
          {volume > 0 ? (
            <Volume2 size={20} color={colors.textMuted} />
          ) : (
            <VolumeX size={20} color={colors.error} />
          )}
        </TouchableOpacity>

        {onComplete && (
          <AppButton
            title="Concluir Prática"
            leftIcon={<CheckCircle size={16} color="#FFFFFF" />}
            onPress={onComplete}
            variant="secondary"
            size="sm"
            fullWidth={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginBottom: 20,
  },
  seekButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  seekText: {
    fontSize: 10,
    marginTop: 2,
  },
  mainPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  volumeButton: {
    padding: 8,
  },
});
