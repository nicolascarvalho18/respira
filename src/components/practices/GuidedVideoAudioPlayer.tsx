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
  SlidersHorizontal,
  Headphones,
  Sparkles,
  ShieldAlert,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { soundEngine } from '../../services/sound/soundEngine';
import { guidedVoiceService } from '../../services/sound/guidedVoiceService';
import { hapticService } from '../../services/haptics/hapticService';
import { CharacterBreathingGuide } from './CharacterBreathingGuide';
import { CharacterGuidedCanvas, CharacterPosture } from './CharacterGuidedCanvas';
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

  // Identificação do tipo de prática
  const isBreathingTechnique =
    practice.category === 'breathing' ||
    !!practice.breathingConfig ||
    practice.id.includes('breathing') ||
    practice.title.toLowerCase().includes('respiração');

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPositionSeconds);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.75 | 1 | 1.25 | 1.5>(1);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);

  // Mixer de áudio separado: Narração / Voz vs. Música Ambiente
  const [isVoiceActive, setIsVoiceActive] = useState(true);
  const [isAmbientMusicOn, setIsAmbientMusicOn] = useState(false);
  const [isAnimationOnly, setIsAnimationOnly] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Script de narração da prática
  const narrationScripts = useRef(guidedVoiceService.getNarrationScript(practice.id)).current;
  const lastSpokenIndex = useRef<number>(-1);

  // Legenda sincronizada
  const currentCaption =
    practice.captions?.find((c) => currentTime >= c.start && currentTime <= c.end)?.text ||
    practice.stages?.find((s, idx) => {
      const stageStart = idx * (totalDurationSeconds / (practice.stages?.length || 1));
      const stageEnd = (idx + 1) * (totalDurationSeconds / (practice.stages?.length || 1));
      return currentTime >= stageStart && currentTime < stageEnd;
    })?.instruction ||
    practice.description;

  // Gerenciar Trilha Sonora Ambiente
  const handleToggleAmbientMusic = () => {
    const next = !isAmbientMusicOn;
    setIsAmbientMusicOn(next);
    guidedVoiceService.setAmbientMuted(!next);
    if (next && !isAnimationOnly) {
      soundEngine.playAmbience(
        practice.category === 'sleep' || practice.category === 'bedtime_prep' ? 'rain' : 'waves',
        0.3
      );
    } else {
      soundEngine.stopAmbience();
    }
    hapticService.triggerHold();
  };

  // Gerenciar Voz da Narração
  const handleToggleVoice = () => {
    const next = !isVoiceActive;
    setIsVoiceActive(next);
    guidedVoiceService.setVoiceMuted(!next);
    hapticService.triggerHold();
  };

  // Toggle Apenas Animação (silencia voz e música)
  const handleToggleAnimationOnly = () => {
    const next = !isAnimationOnly;
    setIsAnimationOnly(next);
    if (next) {
      soundEngine.stopAll();
      guidedVoiceService.cancel();
      setIsAmbientMusicOn(false);
      setIsVoiceActive(false);
    } else {
      setIsVoiceActive(true);
      guidedVoiceService.setVoiceMuted(false);
    }
    hapticService.triggerHold();
  };

  // Play / Pause
  const handleTogglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    hapticService.triggerInhale();

    if (next) {
      if (isAmbientMusicOn && !isAnimationOnly) {
        soundEngine.playAmbience('waves', 0.3);
      }
    } else {
      soundEngine.stopAll();
      guidedVoiceService.cancel();
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

  // Velocidade de Reprodução
  const handleCycleSpeed = () => {
    const speeds: (0.75 | 1 | 1.25 | 1.5)[] = [1, 1.25, 1.5, 0.75];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    hapticService.triggerHold();
  };

  // Timer principal de reprodução
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1;
          onProgressUpdate?.(next, totalDurationSeconds);

          if (next >= totalDurationSeconds) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            soundEngine.stopAll();
            guidedVoiceService.cancel();
            onComplete?.();
            return totalDurationSeconds;
          }
          return next;
        });

        // Narração por marcos de tempo para práticas não-respiratórias puras
        if (!isBreathingTechnique && isVoiceActive && !isAnimationOnly) {
          const stageDuration = totalDurationSeconds / Math.max(1, narrationScripts.length);
          const currentScriptIndex = Math.floor(currentTime / stageDuration);

          if (
            currentScriptIndex >= 0 &&
            currentScriptIndex < narrationScripts.length &&
            currentScriptIndex !== lastSpokenIndex.current
          ) {
            lastSpokenIndex.current = currentScriptIndex;
            const item = narrationScripts[currentScriptIndex];
            if (item && item.text) {
              guidedVoiceService.speak(item.text, undefined, 0.88 * playbackSpeed);
            }
          }
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
    isBreathingTechnique,
    isVoiceActive,
    isAnimationOnly,
    currentTime,
    onProgressUpdate,
    onComplete,
  ]);

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      soundEngine.stopAll();
      guidedVoiceService.cancel();
    };
  }, []);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent =
    totalDurationSeconds > 0 ? Math.min(100, (currentTime / totalDurationSeconds) * 100) : 0;

  // Postura da personagem para práticas meditativas / alongamentos
  let characterPosture: CharacterPosture = 'breathing_diaphragmatic';
  if (practice.id === 'practice-grounding-54321') {
    characterPosture = 'grounding_mug';
  } else if (practice.category === 'guided_meditation' || practice.category === 'mindfulness') {
    characterPosture = 'meditation_lotus';
  } else if (practice.id.includes('body-scan') || practice.id.includes('pmr')) {
    characterPosture = 'body_scan';
  } else if (practice.category === 'body_movement' || practice.category === 'morning_routine') {
    characterPosture = 'stretch_arms';
  }

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
      {/* 1. Palco Visual Principal (9:16 ou Adaptado) */}
      <View style={styles.mediaStage}>
        {isBreathingTechnique ? (
          /* A. Modo Respiração com Animação da Personagem Oficial + Anel Sincronizado */
          <CharacterBreathingGuide
            practice={practice}
            isPlaying={isPlaying}
            onComplete={onComplete}
          />
        ) : (
          /* B. Modo Meditação / Atenção Plena / Alongamento Guiado com Personagem */
          <View style={styles.guidedCanvasWrapper}>
            <CharacterGuidedCanvas
              phase={isPlaying ? 'inhale' : 'idle'}
              phaseDurationSeconds={5}
              posture={characterPosture}
            />

            {/* Legenda Flutuante em Tempo Real */}
            {showCaptions && (
              <View style={styles.captionOverlay}>
                <Text style={styles.captionOverlayText}>{currentCaption}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* 2. Barra de Progresso Temporal */}
      <View style={styles.progressBarWrapper}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: isDark ? '#5ECFC3' : '#3DB3A7',
              },
            ]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatSeconds(currentTime)}</Text>
          <Text style={styles.timeText}>{formatSeconds(totalDurationSeconds)}</Text>
        </View>
      </View>

      {/* 3. Painel de Controles com Mixer Separado (Voz vs. Música) */}
      <View style={styles.controlsBar}>
        {/* Lado Esquerdo: Reiniciar e Retroceder 10s */}
        <View style={styles.controlGroup}>
          <TouchableOpacity
            onPress={() => {
              setCurrentTime(0);
              lastSpokenIndex.current = -1;
              onProgressUpdate?.(0, totalDurationSeconds);
              hapticService.triggerHold();
            }}
            style={styles.iconButton}
            accessibilityLabel="Reiniciar exercício"
          >
            <RotateCcw size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSeek(-10)}
            style={styles.iconButton}
            accessibilityLabel="Voltar 10 segundos"
          >
            <Clock size={16} color="#B8D7D3" />
            <Text style={styles.seekMiniText}>-10s</Text>
          </TouchableOpacity>
        </View>

        {/* Centro: Botão Principal de Play / Pause */}
        <TouchableOpacity
          onPress={handleTogglePlay}
          style={[
            styles.mainPlayButton,
            { backgroundColor: isDark ? '#5ECFC3' : '#3DB3A7' },
          ]}
          accessibilityLabel={isPlaying ? 'Pausar exercício' : 'Iniciar exercício'}
        >
          {isPlaying ? (
            <Pause size={28} color="#173D3B" />
          ) : (
            <Play size={28} color="#173D3B" style={{ marginLeft: 3 }} />
          )}
        </TouchableOpacity>

        {/* Lado Direito: Avançar 10s e Mixer de Áudio */}
        <View style={styles.controlGroup}>
          <TouchableOpacity
            onPress={() => handleSeek(10)}
            style={styles.iconButton}
            accessibilityLabel="Avançar 10 segundos"
          >
            <Clock size={16} color="#B8D7D3" />
            <Text style={styles.seekMiniText}>+10s</Text>
          </TouchableOpacity>

          {/* Toggle de Narração (Voz) */}
          <TouchableOpacity
            onPress={handleToggleVoice}
            style={[styles.iconButton, !isVoiceActive && styles.iconButtonDimmed]}
            accessibilityLabel={isVoiceActive ? 'Silenciar narração' : 'Ativar narração'}
          >
            {isVoiceActive ? (
              <Volume2 size={18} color="#5ECFC3" />
            ) : (
              <VolumeX size={18} color="#B8D7D3" />
            )}
          </TouchableOpacity>

          {/* Toggle de Música Ambiente */}
          <TouchableOpacity
            onPress={handleToggleAmbientMusic}
            style={[styles.iconButton, isAmbientMusicOn && styles.iconButtonActive]}
            accessibilityLabel={isAmbientMusicOn ? 'Desativar música de fundo' : 'Ativar música de fundo'}
          >
            <Music size={18} color={isAmbientMusicOn ? '#5ECFC3' : '#B8D7D3'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Barra Secundária de Recursos: Velocidade, Legendas e Modo Apenas Animação */}
      <View style={styles.secondaryBar}>
        <TouchableOpacity
          onPress={handleCycleSpeed}
          style={styles.badgeBtn}
          accessibilityLabel={`Velocidade ${playbackSpeed}x`}
        >
          <Text style={styles.badgeBtnText}>{playbackSpeed}x</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowCaptions(!showCaptions)}
          style={[styles.badgeBtn, showCaptions && styles.badgeBtnActive]}
          accessibilityLabel="Alternar legendas"
        >
          <Captions size={14} color={showCaptions ? '#5ECFC3' : '#B8D7D3'} />
          <Text style={[styles.badgeBtnText, showCaptions && { color: '#5ECFC3' }]}>
            Legendas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleToggleAnimationOnly}
          style={[styles.badgeBtn, isAnimationOnly && styles.badgeBtnActive]}
          accessibilityLabel="Apenas animação visual silenciosa"
        >
          <Sparkles size={14} color={isAnimationOnly ? '#5ECFC3' : '#B8D7D3'} />
          <Text style={[styles.badgeBtnText, isAnimationOnly && { color: '#5ECFC3' }]}>
            Silencioso
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    marginVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
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
    minHeight: 380,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#0F1E1C',
  },
  guidedCanvasWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  captionOverlay: {
    width: '90%',
    backgroundColor: 'rgba(15, 30, 28, 0.85)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 207, 195, 0.2)',
  },
  captionOverlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressBarWrapper: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  progressBarBackground: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    color: '#A2C2BE',
    fontSize: 12,
    fontWeight: '500',
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(94, 207, 195, 0.2)',
  },
  iconButtonDimmed: {
    opacity: 0.5,
  },
  seekMiniText: {
    color: '#B8D7D3',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  mainPlayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  secondaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  badgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeBtnActive: {
    backgroundColor: 'rgba(94, 207, 195, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(94, 207, 195, 0.35)',
  },
  badgeBtnText: {
    color: '#B8D7D3',
    fontSize: 12,
    fontWeight: '600',
  },
});
