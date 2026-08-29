import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { ShieldAlert, Sparkles, CheckCircle, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { CharacterGuidedCanvas, CharacterPosture } from './CharacterGuidedCanvas';
import { guidedVoiceService } from '../../services/sound/guidedVoiceService';
import { hapticService } from '../../services/haptics/hapticService';
import { Practice } from '../../types';

export interface CharacterBreathingGuideProps {
  practice: Practice;
  isPlaying: boolean;
  onComplete?: () => void;
  onCycleUpdate?: (currentCycle: number, totalCycles: number) => void;
  allowNoHoldMode?: boolean;
}

export const CharacterBreathingGuide: React.FC<CharacterBreathingGuideProps> = ({
  practice,
  isPlaying,
  onComplete,
  onCycleUpdate,
  allowNoHoldMode = true,
}) => {
  const { colors, isDark } = useTheme();

  // Configuração da técnica respiratória
  const rawConfig = practice.breathingConfig || {
    inhaleSeconds: 4,
    holdSeconds: 7,
    exhaleSeconds: 8,
    cycles: 4,
  };

  const [noHoldMode, setNoHoldMode] = useState(false);

  // Configuração ativa respeitando modo de acessibilidade
  const config = {
    ...rawConfig,
    holdSeconds: noHoldMode ? 0 : rawConfig.holdSeconds,
    holdAfterExhaleSeconds: noHoldMode ? 0 : rawConfig.holdAfterExhaleSeconds || 0,
  };

  type Phase = 'intro' | 'inhale' | 'hold' | 'exhale' | 'hold_after_exhale' | 'finished';

  const [currentPhase, setCurrentPhase] = useState<Phase>('intro');
  const [secondsLeft, setSecondsLeft] = useState(3);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [currentCaption, setCurrentCaption] = useState('Prepare-se. Encontre uma postura relaxada.');

  const ringScale = useRef(new Animated.Value(0.7)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Determinar postura da personagem baseada na técnica
  let posture: CharacterPosture = 'breathing_diaphragmatic';
  if (practice.id === 'practice-breathing-box' || practice.id === 'practice-breathing-44') {
    posture = 'breathing_relaxed';
  } else if (practice.id === 'practice-grounding-54321') {
    posture = 'grounding_mug';
  }

  // Narração de introdução
  useEffect(() => {
    if (isPlaying && currentPhase === 'intro') {
      guidedVoiceService.speak(
        `Vamos iniciar a ${practice.title}. Sente-se confortavelmente e relaxe os ombros.`,
        undefined,
        0.88
      );
    }
  }, [isPlaying]);

  // Transições de Fases da Respiração
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (currentPhase === 'finished') {
      return;
    }

    // Gerenciador de contagem regressiva por segundo
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        // Fim da contagem da fase atual -> transitar para a próxima fase
        handlePhaseTransition();
        return 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentPhase, currentCycle, noHoldMode]);

  const handlePhaseTransition = () => {
    if (currentPhase === 'intro') {
      startInhalePhase();
    } else if (currentPhase === 'inhale') {
      if (config.holdSeconds > 0) {
        startHoldPhase();
      } else {
        startExhalePhase();
      }
    } else if (currentPhase === 'hold') {
      startExhalePhase();
    } else if (currentPhase === 'exhale') {
      if (config.holdAfterExhaleSeconds && config.holdAfterExhaleSeconds > 0) {
        startHoldAfterExhalePhase();
      } else {
        advanceCycleOrFinish();
      }
    } else if (currentPhase === 'hold_after_exhale') {
      advanceCycleOrFinish();
    }
  };

  const startInhalePhase = () => {
    setCurrentPhase('inhale');
    setSecondsLeft(config.inhaleSeconds);
    setCurrentCaption('Inspire lentamente pelo nariz, sentindo o ar preencher o abdômen.');
    hapticService.triggerInhale();

    guidedVoiceService.speak('Inspire lentamente pelo nariz.', undefined, 0.9);

    Animated.timing(ringScale, {
      toValue: 1.25,
      duration: config.inhaleSeconds * 1000,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const startHoldPhase = () => {
    setCurrentPhase('hold');
    setSecondsLeft(config.holdSeconds);
    setCurrentCaption('Segure o ar com calma, mantendo o corpo perfeitamente relaxado.');
    hapticService.triggerHold();

    guidedVoiceService.speak('Segure o ar com calma.', undefined, 0.9);
  };

  const startExhalePhase = () => {
    setCurrentPhase('exhale');
    setSecondsLeft(config.exhaleSeconds);
    setCurrentCaption('Solte o ar devagar pela boca, liberando qualquer tensão.');
    hapticService.triggerExhale();

    guidedVoiceService.speak('Solte o ar devagar pela boca.', undefined, 0.88);

    Animated.timing(ringScale, {
      toValue: 0.7,
      duration: config.exhaleSeconds * 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const startHoldAfterExhalePhase = () => {
    setCurrentPhase('hold_after_exhale');
    setSecondsLeft(config.holdAfterExhaleSeconds || 4);
    setCurrentCaption('Pausa suave com os pulmões vazios.');
    hapticService.triggerHold();

    guidedVoiceService.speak('Pausa suave.', undefined, 0.9);
  };

  const advanceCycleOrFinish = () => {
    if (currentCycle < config.cycles) {
      const nextCycle = currentCycle + 1;
      setCurrentCycle(nextCycle);
      onCycleUpdate?.(nextCycle, config.cycles);
      startInhalePhase();
    } else {
      setCurrentPhase('finished');
      setSecondsLeft(0);
      setCurrentCaption('Muito bem! Volte a respirar no seu ritmo natural.');
      guidedVoiceService.speak(
        'Prática concluída. Retorne à sua respiração natural e sinta a sensação de paz.',
        undefined,
        0.88
      );
      onComplete?.();
    }
  };

  const getPhaseTitle = () => {
    switch (currentPhase) {
      case 'intro':
        return 'Prepare-se';
      case 'inhale':
        return 'Inspirar';
      case 'hold':
        return 'Segurar';
      case 'exhale':
        return 'Expirar';
      case 'hold_after_exhale':
        return 'Pausa vazia';
      case 'finished':
        return 'Concluído';
      default:
        return '';
    }
  };

  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'inhale':
        return '#1F766E';
      case 'hold':
      case 'hold_after_exhale':
        return '#D97C5B';
      case 'exhale':
        return '#2E8B80';
      case 'finished':
        return '#10B981';
      default:
        return '#1F766E';
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header do Guia com Ciclo e Acessibilidade */}
      <View style={styles.headerRow}>
        <View style={styles.cycleBadge}>
          <Text style={[styles.cycleText, { color: isDark ? '#5ECFC3' : '#1F766E' }]}>
            {currentPhase === 'finished'
              ? 'Prática finalizada'
              : `Ciclo ${currentCycle} de ${config.cycles}`}
          </Text>
        </View>

        {allowNoHoldMode && rawConfig.holdSeconds > 0 && (
          <TouchableOpacity
            onPress={() => setNoHoldMode(!noHoldMode)}
            style={[
              styles.accessibleBtn,
              {
                backgroundColor: noHoldMode
                  ? isDark
                    ? '#2A4E47'
                    : '#D9ECE7'
                  : isDark
                  ? '#1E2926'
                  : '#F0F4F2',
              },
            ]}
          >
            <Sparkles size={14} color={noHoldMode ? '#1F766E' : colors.textSecondary} />
            <Text
              style={[
                styles.accessibleBtnText,
                { color: noHoldMode ? '#1F766E' : colors.textSecondary },
              ]}
            >
              {noHoldMode ? 'Modo contínuo ativo' : 'Sem pausa respiratória'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Área Visual Central com Personagem e Anel de Respiração */}
      <View style={styles.visualArea}>
        {/* Anel de Respiração Sincronizado */}
        <Animated.View
          style={[
            styles.breathingRing,
            {
              transform: [{ scale: ringScale }],
              borderColor: getPhaseColor(),
              backgroundColor: isDark
                ? 'rgba(31, 118, 110, 0.12)'
                : 'rgba(31, 118, 110, 0.08)',
            },
          ]}
        />

        {/* Personagem Oficial Guiada com Cinemática de Respiração */}
        <View style={styles.characterContainer}>
          <CharacterGuidedCanvas
            phase={currentPhase === 'finished' || currentPhase === 'intro' ? 'idle' : currentPhase}
            phaseDurationSeconds={
              currentPhase === 'inhale'
                ? config.inhaleSeconds
                : currentPhase === 'hold'
                ? config.holdSeconds
                : currentPhase === 'exhale'
                ? config.exhaleSeconds
                : 4
            }
            posture={posture}
          />
        </View>

        {/* Contador Flutuante e Indicador da Fase */}
        {currentPhase !== 'intro' && currentPhase !== 'finished' && (
          <View style={[styles.floatingCounter, { backgroundColor: isDark ? '#1C2825' : '#FFFFFF' }]}>
            <Text style={[styles.phaseTitleText, { color: getPhaseColor() }]}>
              {getPhaseTitle()}
            </Text>
            <Text style={[styles.secondsLeftNumber, { color: isDark ? '#FFFFFF' : '#163F3A' }]}>
              {secondsLeft}s
            </Text>
          </View>
        )}
      </View>

      {/* 3. Legendas em Português Sincronizadas */}
      <View style={[styles.captionBox, { backgroundColor: isDark ? '#1C2624' : '#EFF6F3' }]}>
        <Text style={[styles.captionText, { color: isDark ? '#F1F5F9' : '#163F3A' }]}>
          {currentCaption}
        </Text>
      </View>

      {/* 4. Aviso Educativo e de Segurança */}
      <View style={styles.safetyRow}>
        <ShieldAlert size={14} color={colors.textSecondary} />
        <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
          Faça a prática de forma confortável. Se sentir tontura ou desconforto, volte à respiração normal.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  cycleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 118, 110, 0.12)',
  },
  cycleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  accessibleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  accessibleBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  visualArea: {
    width: '100%',
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  breathingRing: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 3,
    zIndex: 1,
  },
  characterContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  floatingCounter: {
    position: 'absolute',
    bottom: 12,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  phaseTitleText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  secondsLeftNumber: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: -2,
  },
  captionBox: {
    width: '92%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 14,
    alignItems: 'center',
  },
  captionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  safetyText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});
