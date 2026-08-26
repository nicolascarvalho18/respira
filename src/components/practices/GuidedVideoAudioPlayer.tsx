import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Captions,
  Music,
  Gauge,
  Sparkles,
  CheckCircle2,
  FileText,
  Clock,
  User,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { soundEngine } from '../../services/sound/soundEngine';
import { hapticService } from '../../services/haptics/hapticService';
import { BreathingCircle, BreathingPhase } from './BreathingCircle';
import { Practice, PracticeCaption } from '../../types';

export interface GuidedVideoAudioPlayerProps {
  practice: Practice;
  initialPositionSeconds?: number;
  onProgressUpdate?: (positionSeconds: number, totalSeconds: number) => void;
  onComplete?: () => void;
}

export const GuidedVideoAudioPlayer: React.FC<GuidedVideoAudioPlayerProps> = ({
  practice,
  initialPositionSeconds = 0,
  onProgressUpdate,
  onComplete,
}) => {
  const { colors, isDark } = useTheme();

  const totalDurationSeconds = practice.durationMinutes * 60;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPositionSeconds);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.75 | 1 | 1.25 | 1.5>(1);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isAmbientMusicOn, setIsAmbientMusicOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Breathing state for interactive breathing practices
  const isInteractiveBreathing = practice.format === 'interactive' && !!practice.breathingConfig;
  const breathingConfig = practice.breathingConfig || {
    inhaleSeconds: 4,
    holdSeconds: 2,
    exhaleSeconds: 4,
    cycles: 4,
  };
  const [breathingPhase, setBreathingPhase] = useState<BreathingPhase>('idle');
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState(breathingConfig.inhaleSeconds);
  const [completedCycles, setCompletedCycles] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronized Caption calculation
  const currentCaption = practice.captions?.find(
    (c) => currentTime >= c.start && currentTime <= c.end
  );

  // Ambient sound management
  const handleToggleAmbientMusic = () => {
    const next = !isAmbientMusicOn;
    setIsAmbientMusicOn(next);
    if (next) {
      soundEngine.playAmbience('rain', 0.4);
    } else {
      soundEngine.stopAmbience();
    }
    hapticService.triggerHold();
  };

  // Play / Pause
  const handleTogglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    hapticService.triggerInhale();

    if (next && isInteractiveBreathing && breathingPhase === 'idle') {
      setBreathingPhase('inhale');
      setBreathingSecondsLeft(breathingConfig.inhaleSeconds);
    }
  };

  // Seek
  const handleSeek = (deltaSeconds: number) => {
    setCurrentTime((prev) => {
      const nextTime = Math.max(0, Math.min(totalDurationSeconds, prev + deltaSeconds));
      onProgressUpdate?.(nextTime, totalDurationSeconds);
      return nextTime;
    });
    hapticService.triggerHold();
  };

  // Speed Change
  const handleCycleSpeed = () => {
    const speeds: (0.75 | 1 | 1.25 | 1.5)[] = [1, 1.25, 1.5, 0.75];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    hapticService.triggerHold();
  };

  // Main playback timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1;
          onProgressUpdate?.(next, totalDurationSeconds);

          if (next >= totalDurationSeconds) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            onComplete?.();
            return totalDurationSeconds;
          }
          return next;
        });

        // Breathing cycle logic if interactive
        if (isInteractiveBreathing) {
          setBreathingSecondsLeft((prev) => {
            if (prev <= 1) {
              if (breathingPhase === 'inhale') {
                if (breathingConfig.holdSeconds > 0) {
                  setBreathingPhase('hold');
                  return breathingConfig.holdSeconds;
                } else {
                  setBreathingPhase('exhale');
                  return breathingConfig.exhaleSeconds;
                }
              } else if (breathingPhase === 'hold') {
                setBreathingPhase('exhale');
                return breathingConfig.exhaleSeconds;
              } else if (breathingPhase === 'exhale') {
                setCompletedCycles((c) => c + 1);
                setBreathingPhase('inhale');
                return breathingConfig.inhaleSeconds;
              }
              return breathingConfig.inhaleSeconds;
            }
            return prev - 1;
          });
        }
      }, 1000 / playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, totalDurationSeconds, isInteractiveBreathing, breathingPhase, breathingConfig, onProgressUpdate, onComplete]);

  // Clean up sounds on unmount
  useEffect(() => {
    return () => {
      soundEngine.stopAll();
    };
  }, []);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalDurationSeconds > 0
    ? Math.min(100, (currentTime / totalDurationSeconds) * 100)
    : 0;

  const currentPhaseDuration =
    breathingPhase === 'inhale'
      ? breathingConfig.inhaleSeconds
      : breathingPhase === 'hold'
      ? breathingConfig.holdSeconds
      : breathingConfig.exhaleSeconds;

  return (
    <View
      style={[
        styles.container,
        isFullscreen && styles.fullscreenContainer,
        {
          backgroundColor: isDark ? '#0F1B1A' : '#173D3B',
          borderColor: isDark ? colors.border : '#2F7F7C',
        },
      ]}
    >
      {/* 1. Tela Visual 16:9 (Vídeo / Interativo / Áudio) */}
      <View style={styles.mediaStage}>
        {isInteractiveBreathing ? (
          /* Modo Interativo Respiratório */
          <View style={styles.interactiveStage}>
            <BreathingCircle
              phase={breathingPhase}
              phaseDurationSeconds={currentPhaseDuration}
              secondsRemaining={breathingSecondsLeft}
              isActive={isPlaying}
            />
          </View>
        ) : practice.format === 'video' ? (
          /* Modo Vídeo com Capa / Stream e Instrutor */
          <View style={styles.videoStage}>
            {practice.thumbnailUrl ? (
              <Image
                source={{ uri: practice.thumbnailUrl }}
                style={styles.videoBackground}
                resizeMode="cover"
              />
            ) : null}

            <View style={styles.videoOverlayShade} />

            {/* Selo do Instrutor */}
            {practice.instructor ? (
              <View style={styles.instructorBadge}>
                <View style={styles.instructorAvatarCircle}>
                  <User size={13} color="#2F7F7C" />
                </View>
                <View>
                  <Text style={styles.instructorName}>{practice.instructor.name}</Text>
                  <Text style={styles.instructorRole}>{practice.instructor.role}</Text>
                </View>
              </View>
            ) : null}

            {/* Play Button centralizado quando pausado */}
            {!isPlaying && (
              <TouchableOpacity
                onPress={handleTogglePlay}
                style={styles.centerPlayButton}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Iniciar reprodução do vídeo"
              >
                <Play size={32} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* Modo Áudio com Paisagem Sonora */
          <View style={styles.audioStage}>
            {practice.thumbnailUrl ? (
              <Image
                source={{ uri: practice.thumbnailUrl }}
                style={styles.audioBgImage}
                resizeMode="cover"
              />
            ) : null}
            <View style={styles.videoOverlayShade} />

            <View style={styles.audioCenterContent}>
              <View style={styles.audioIconCircle}>
                <Sparkles size={28} color="#79B8A4" />
              </View>
              <Text style={styles.audioTitle}>{practice.title}</Text>
              <Text style={styles.audioSubtitle}>Narração em Português (Brasil)</Text>
            </View>

            {!isPlaying && (
              <TouchableOpacity
                onPress={handleTogglePlay}
                style={styles.centerPlayButton}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Iniciar reprodução de áudio"
              >
                <Play size={32} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Legendas Sincronizadas (Subtitles) */}
        {showCaptions && currentCaption && isPlaying && (
          <View style={styles.captionsContainer}>
            <Text style={styles.captionText}>{currentCaption.text}</Text>
          </View>
        )}
      </View>

      {/* 2. Barra de Progresso Interativa */}
      <View style={styles.progressTrackWrapper}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      {/* 3. Barra de Controles Multimídia */}
      <View style={styles.controlsBar}>
        {/* Lado Esquerdo: Play/Pause, -10s, +10s, Tempo */}
        <View style={styles.leftControls}>
          <TouchableOpacity
            onPress={handleTogglePlay}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pausar' : 'Reproduzir'}
            style={styles.controlIconBtnPrimary}
          >
            {isPlaying ? (
              <Pause size={18} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={18} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSeek(-10)}
            accessibilityRole="button"
            accessibilityLabel="Voltar 10 segundos"
            style={styles.controlIconBtn}
          >
            <RotateCcw size={16} color="#E7F3EF" />
            <Text style={styles.seekSecondsText}>10</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSeek(10)}
            accessibilityRole="button"
            accessibilityLabel="Avançar 10 segundos"
            style={styles.controlIconBtn}
          >
            <RotateCw size={16} color="#E7F3EF" />
            <Text style={styles.seekSecondsText}>10</Text>
          </TouchableOpacity>

          <Text style={styles.timeCounterText}>
            {formatSeconds(currentTime)} / {formatSeconds(totalDurationSeconds)}
          </Text>
        </View>

        {/* Lado Direito: Legenda, Música de Fundo, Velocidade, Transcrição, Tela Cheia */}
        <View style={styles.rightControls}>
          {practice.captions && practice.captions.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowCaptions(!showCaptions)}
              accessibilityRole="button"
              accessibilityLabel="Alternar legendas"
              style={[
                styles.controlIconBtn,
                showCaptions && styles.controlIconBtnActive,
              ]}
            >
              <Captions size={16} color={showCaptions ? '#79B8A4' : '#8C9E9B'} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleToggleAmbientMusic}
            accessibilityRole="button"
            accessibilityLabel="Música ambiente de fundo"
            style={[
              styles.controlIconBtn,
              isAmbientMusicOn && styles.controlIconBtnActive,
            ]}
          >
            <Music size={16} color={isAmbientMusicOn ? '#79B8A4' : '#8C9E9B'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCycleSpeed}
            accessibilityRole="button"
            accessibilityLabel={`Velocidade de reprodução: ${playbackSpeed}x`}
            style={styles.speedBtn}
          >
            <Text style={styles.speedBtnText}>{playbackSpeed}x</Text>
          </TouchableOpacity>

          {practice.transcript ? (
            <TouchableOpacity
              onPress={() => setShowTranscript(!showTranscript)}
              accessibilityRole="button"
              accessibilityLabel="Ver transcrição completa"
              style={[
                styles.controlIconBtn,
                showTranscript && styles.controlIconBtnActive,
              ]}
            >
              <FileText size={16} color={showTranscript ? '#79B8A4' : '#8C9E9B'} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => setIsFullscreen(!isFullscreen)}
            accessibilityRole="button"
            accessibilityLabel={isFullscreen ? 'Sair de tela cheia' : 'Tela cheia'}
            style={styles.controlIconBtn}
          >
            {isFullscreen ? (
              <Minimize2 size={16} color="#E7F3EF" />
            ) : (
              <Maximize2 size={16} color="#E7F3EF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Painel de Transcrição Expansível */}
      {showTranscript && practice.transcript && (
        <View style={styles.transcriptDrawer}>
          <View style={styles.transcriptHeader}>
            <Text style={styles.transcriptTitle}>Transcrição em Português</Text>
            <TouchableOpacity onPress={() => setShowTranscript(false)}>
              <Text style={styles.transcriptCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.transcriptBody}>{practice.transcript}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    borderRadius: 0,
    borderWidth: 0,
  },
  mediaStage: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    backgroundColor: '#0A1312',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  interactiveStage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1E1D',
  },
  videoStage: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  videoOverlayShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 27, 26, 0.45)',
  },
  audioStage: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
  audioCenterContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  audioIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(47, 127, 124, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#79B8A4',
  },
  audioTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  audioSubtitle: {
    fontSize: 12,
    color: '#DCE5E2',
    marginTop: 4,
  },
  instructorBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 27, 26, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructorAvatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructorName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  instructorRole: {
    fontSize: 9,
    color: '#79B8A4',
  },
  centerPlayButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(47, 127, 124, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 2,
  },
  captionsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(10, 19, 18, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 2,
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressTrackWrapper: {
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#79B8A4',
    borderRadius: 2,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlIconBtnPrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2F7F7C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  controlIconBtnActive: {
    backgroundColor: 'rgba(121, 184, 164, 0.2)',
  },
  seekSecondsText: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    top: 9,
  },
  timeCounterText: {
    fontSize: 12,
    color: '#E7F3EF',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speedBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  speedBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  transcriptDrawer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(10, 19, 18, 0.95)',
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transcriptTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#79B8A4',
  },
  transcriptCloseText: {
    fontSize: 12,
    color: '#DCE5E2',
  },
  transcriptBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#E7F3EF',
  },
});
