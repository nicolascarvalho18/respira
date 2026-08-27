import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
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
  CheckCircle2,
  FileText,
  Clock,
  User,
  Eye,
  SlidersHorizontal,
  Headphones,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { soundEngine } from '../../services/sound/soundEngine';
import { hapticService } from '../../services/haptics/hapticService';
import { BreathingCircle, BreathingPhase } from './BreathingCircle';
import { SquareBreathingVideoGuide } from './SquareBreathingVideoGuide';
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

  const isSquareBreathing =
    practice.id === 'practice-breathing-box' ||
    practice.title.toLowerCase().includes('quadrada');

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPositionSeconds);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.75 | 1 | 1.25 | 1.5>(1);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isAmbientMusicOn, setIsAmbientMusicOn] = useState(false);
  const [isAnimationOnly, setIsAnimationOnly] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Breathing state for interactive breathing practices
  const isInteractiveBreathing =
    !isSquareBreathing &&
    practice.format === 'interactive' &&
    !!practice.breathingConfig;

  const breathingConfig = practice.breathingConfig || {
    inhaleSeconds: 4,
    holdSeconds: 2,
    exhaleSeconds: 4,
    cycles: 4,
  };
  const [breathingPhase, setBreathingPhase] = useState<BreathingPhase>('idle');
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState(
    breathingConfig.inhaleSeconds
  );
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
    if (next && !isAnimationOnly && !isMuted) {
      soundEngine.playAmbience('rain', 0.35);
    } else {
      soundEngine.stopAmbience();
    }
    hapticService.triggerHold();
  };

  // Toggle Animation Only
  const handleToggleAnimationOnly = () => {
    const next = !isAnimationOnly;
    setIsAnimationOnly(next);
    if (next) {
      soundEngine.stopAll();
      setIsAmbientMusicOn(false);
    }
    hapticService.triggerHold();
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (next) {
      soundEngine.stopAll();
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
      const nextTime = Math.max(
        0,
        Math.min(totalDurationSeconds, prev + deltaSeconds)
      );
      onProgressUpdate?.(nextTime, totalDurationSeconds);
      return nextTime;
    });
    hapticService.triggerHold();
  };

  // Speed Change
  const handleCycleSpeed = () => {
    const speeds: (0.75 | 1 | 1.25 | 1.5)[] = [1, 1.25, 1.5, 0.75];
    const nextSpeed =
      speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
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
  }, [
    isPlaying,
    playbackSpeed,
    totalDurationSeconds,
    isInteractiveBreathing,
    breathingPhase,
    breathingConfig,
    onProgressUpdate,
    onComplete,
  ]);

  // Clean up sounds on unmount
  useEffect(() => {
    return () => {
      soundEngine.stopAll();
    };
  }, []);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  };

  const progressPercent =
    totalDurationSeconds > 0
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
      {/* 1. Tela Visual 16:9 */}
      <View style={styles.mediaStage}>
        {isSquareBreathing ? (
          /* A. Modo Respiração Quadrada com Vídeo Demonstrativo e Personagem 2D */
          <SquareBreathingVideoGuide
            isPlaying={isPlaying}
            currentSecond={currentTime}
            totalDurationSeconds={totalDurationSeconds}
            speedMultiplier={playbackSpeed}
            showCaptions={showCaptions}
          />
        ) : isInteractiveBreathing ? (
          /* B. Modo Interativo Respiratório Clássico */
          <View style={styles.interactiveStage}>
            <BreathingCircle
              phase={breathingPhase}
              phaseDurationSeconds={currentPhaseDuration}
              secondsRemaining={breathingSecondsLeft}
              isActive={isPlaying}
            />
          </View>
        ) : practice.format === 'video' ? (
          /* C. Modo Vídeo com Instrutor */
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
                  <User size={13} color="#2F7F7C" aria-hidden={true} />
                </View>
                <View>
                  <Text style={styles.instructorName}>
                    {practice.instructor.name}
                  </Text>
                  <Text style={styles.instructorRole}>
                    {practice.instructor.role}
                  </Text>
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
                <Play
                  size={32}
                  color="#FFFFFF"
                  fill="#FFFFFF"
                  style={{ marginLeft: 4 }}
                  aria-hidden={true}
                />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* D. Modo Áudio com Paisagem Sonora */
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
                <Volume2 size={28} color="#79B8A4" aria-hidden={true} />
              </View>
              <Text style={styles.audioTitle}>{practice.title}</Text>
              <Text style={styles.audioSubtitle}>
                {isAnimationOnly
                  ? 'Modo Somente Animação Ativo'
                  : 'Narração e Áudio Guiado em Português (Brasil)'}
              </Text>
            </View>

            {!isPlaying && (
              <TouchableOpacity
                onPress={handleTogglePlay}
                style={styles.centerPlayButton}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Iniciar reprodução de áudio"
              >
                <Play
                  size={32}
                  color="#FFFFFF"
                  fill="#FFFFFF"
                  style={{ marginLeft: 4 }}
                  aria-hidden={true}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Legendas Sincronizadas (Subtitles) para vídeos gerais */}
        {!isSquareBreathing &&
          showCaptions &&
          currentCaption &&
          isPlaying && (
            <View style={styles.captionsContainer}>
              <Text style={styles.captionText}>{currentCaption.text}</Text>
            </View>
          )}
      </View>

      {/* 2. Barra de Progresso Interativa */}
      <View style={styles.progressTrackWrapper}>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${progressPercent}%` }]}
          />
        </View>
      </View>

      {/* 3. Barra de Controles Multimídia (Touch Targets >= 44px) */}
      <View style={styles.controlsBar}>
        {/* Lado Esquerdo: Play/Pause, -10s, +10s, Contador de Tempo */}
        <View style={styles.leftControls}>
          <TouchableOpacity
            onPress={handleTogglePlay}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pausar' : 'Reproduzir'}
            style={styles.controlIconBtnPrimary}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isPlaying ? (
              <Pause
                size={18}
                color="#FFFFFF"
                fill="#FFFFFF"
                aria-hidden={true}
              />
            ) : (
              <Play
                size={18}
                color="#FFFFFF"
                fill="#FFFFFF"
                style={{ marginLeft: 2 }}
                aria-hidden={true}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSeek(-10)}
            accessibilityRole="button"
            accessibilityLabel="Voltar 10 segundos"
            style={styles.controlIconBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <RotateCcw size={16} color="#E7F3EF" aria-hidden={true} />
            <Text style={styles.seekSecondsText}>10</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSeek(10)}
            accessibilityRole="button"
            accessibilityLabel="Avançar 10 segundos"
            style={styles.controlIconBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <RotateCw size={16} color="#E7F3EF" aria-hidden={true} />
            <Text style={styles.seekSecondsText}>10</Text>
          </TouchableOpacity>

          <Text style={styles.timeCounterText}>
            {formatSeconds(currentTime)} / {formatSeconds(totalDurationSeconds)}
          </Text>
        </View>

        {/* Lado Direito: Somente Animação, Legenda, Áudio/Mudo, Velocidade, Transcrição, Tela Cheia */}
        <View style={styles.rightControls}>
          {/* Opção "Somente animação" */}
          <TouchableOpacity
            onPress={handleToggleAnimationOnly}
            accessibilityRole="button"
            accessibilityLabel={
              isAnimationOnly
                ? 'Desativar modo somente animação (ativar narração)'
                : 'Ativar modo somente animação (silenciar narração)'
            }
            aria-pressed={isAnimationOnly}
            style={[
              styles.controlPillBtn,
              isAnimationOnly && styles.controlPillBtnActive,
            ]}
          >
            <Eye
              size={13}
              color={isAnimationOnly ? '#173D3B' : '#E7F3EF'}
              style={{ marginRight: 4 }}
              aria-hidden={true}
            />
            <Text
              style={[
                styles.controlPillBtnText,
                { color: isAnimationOnly ? '#173D3B' : '#E7F3EF' },
              ]}
            >
              {isAnimationOnly ? 'Somente animação' : 'Narração'}
            </Text>
          </TouchableOpacity>

          {/* Mudo / Volume */}
          <TouchableOpacity
            onPress={handleToggleMute}
            accessibilityRole="button"
            accessibilityLabel={isMuted ? 'Ativar áudio' : 'Desativar áudio'}
            style={[styles.controlIconBtn, isMuted && styles.controlIconBtnActive]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            {isMuted ? (
              <VolumeX size={16} color="#D98968" aria-hidden={true} />
            ) : (
              <Volume2 size={16} color="#E7F3EF" aria-hidden={true} />
            )}
          </TouchableOpacity>

          {/* Legendas PT */}
          <TouchableOpacity
            onPress={() => setShowCaptions(!showCaptions)}
            accessibilityRole="button"
            accessibilityLabel="Alternar legendas em português"
            style={[
              styles.controlIconBtn,
              showCaptions && styles.controlIconBtnActive,
            ]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Captions
              size={16}
              color={showCaptions ? '#79B8A4' : '#8C9E9B'}
              aria-hidden={true}
            />
          </TouchableOpacity>

          {/* Trilha Sonora / Música de Fundo */}
          <TouchableOpacity
            onPress={handleToggleAmbientMusic}
            accessibilityRole="button"
            accessibilityLabel="Música ambiente suave de fundo"
            style={[
              styles.controlIconBtn,
              isAmbientMusicOn && styles.controlIconBtnActive,
            ]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Music
              size={16}
              color={isAmbientMusicOn ? '#79B8A4' : '#8C9E9B'}
              aria-hidden={true}
            />
          </TouchableOpacity>

          {/* Velocidade */}
          <TouchableOpacity
            onPress={handleCycleSpeed}
            accessibilityRole="button"
            accessibilityLabel={`Velocidade de reprodução: ${playbackSpeed}x`}
            style={styles.speedBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.speedBtnText}>{playbackSpeed}x</Text>
          </TouchableOpacity>

          {/* Transcrição */}
          {practice.transcript ? (
            <TouchableOpacity
              onPress={() => setShowTranscript(!showTranscript)}
              accessibilityRole="button"
              accessibilityLabel="Ver transcrição completa da prática"
              style={[
                styles.controlIconBtn,
                showTranscript && styles.controlIconBtnActive,
              ]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <FileText
                size={16}
                color={showTranscript ? '#79B8A4' : '#8C9E9B'}
                aria-hidden={true}
              />
            </TouchableOpacity>
          ) : null}

          {/* Tela Cheia */}
          <TouchableOpacity
            onPress={() => setIsFullscreen(!isFullscreen)}
            accessibilityRole="button"
            accessibilityLabel={
              isFullscreen ? 'Sair de tela cheia' : 'Tela cheia'
            }
            style={styles.controlIconBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            {isFullscreen ? (
              <Minimize2 size={16} color="#E7F3EF" aria-hidden={true} />
            ) : (
              <Maximize2 size={16} color="#E7F3EF" aria-hidden={true} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Painel de Transcrição Expansível */}
      {showTranscript && practice.transcript && (
        <View style={styles.transcriptDrawer}>
          <View style={styles.transcriptHeader}>
            <Text style={styles.transcriptTitle}>
              Transcrição em Português (Brasil)
            </Text>
            <TouchableOpacity
              onPress={() => setShowTranscript(false)}
              accessibilityRole="button"
              accessibilityLabel="Fechar transcrição"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
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
  },
  mediaStage: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#0F1B1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoStage: {
    width: '100%',
    aspectRatio: 16 / 9,
    minHeight: 260,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  videoOverlayShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 27, 26, 0.45)',
  },
  instructorBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 61, 59, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
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
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  instructorRole: {
    color: '#A3D4C5',
    fontSize: 9,
  },
  centerPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(47, 127, 124, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  interactiveStage: {
    width: '100%',
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  audioStage: {
    width: '100%',
    aspectRatio: 16 / 9,
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  audioBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  audioCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  audioIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(47, 127, 124, 0.3)',
    borderWidth: 1.5,
    borderColor: '#79B8A4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  audioTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  audioSubtitle: {
    color: '#A3D4C5',
    fontSize: 12,
    textAlign: 'center',
  },
  captionsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(15, 27, 26, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressTrackWrapper: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressTrack: {
    width: '100%',
    height: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#79B8A4',
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlIconBtnPrimary: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2F7F7C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  controlIconBtnActive: {
    backgroundColor: 'rgba(121, 184, 164, 0.25)',
    borderWidth: 1,
    borderColor: '#79B8A4',
  },
  controlPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlPillBtnActive: {
    backgroundColor: '#79B8A4',
  },
  controlPillBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  seekSecondsText: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    top: 25,
  },
  timeCounterText: {
    color: '#DCE9E5',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  speedBtn: {
    height: 44,
    minWidth: 44,
    paddingHorizontal: 8,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedBtnText: {
    color: '#E7F3EF',
    fontSize: 11,
    fontWeight: '700',
  },
  transcriptDrawer: {
    padding: 16,
    backgroundColor: 'rgba(15, 27, 26, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  transcriptTitle: {
    color: '#79B8A4',
    fontSize: 13,
    fontWeight: '700',
  },
  transcriptCloseText: {
    color: '#D98968',
    fontSize: 12,
    fontWeight: '700',
  },
  transcriptBody: {
    color: '#E7F3EF',
    fontSize: 13,
    lineHeight: 20,
  },
});
