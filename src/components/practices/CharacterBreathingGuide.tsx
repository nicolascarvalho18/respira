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
import { ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { CharacterGuidedCanvas } from './CharacterGuidedCanvas';
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

  // Ciclo padrão calibrado: 4s Inspirar, 2s Segurar, 6s Expirar, 2s Pausa
  const defaultBreathingConfig = {
    inhaleSeconds: 4,
    holdSeconds: 2,
    exhaleSeconds: 6,
    holdAfterExhaleSeconds: 2,
    cycles: 4,
  };

  const rawConfig = practice.breathingConfig || defaultBreathingConfig;

  const [noHoldMode, setNoHoldMode] = useState(false);

  // Configuração ativa respeitando modo de acessibilidade
  const config = {
    inhaleSeconds: rawConfig.inhaleSeconds,
    holdSeconds: noHoldMode ? 0 : rawConfig.holdSeconds,
    exhaleSeconds: rawConfig.exhaleSeconds,
    holdAfterExhaleSeconds: noHoldMode ? 0 : (rawConfig.holdAfterExhaleSeconds ?? 2),
    cycles: rawConfig.cycles || 4,
  };

  type Phase = 'intro' | 'inhale' | 'hold' | 'exhale' | 'hold_after_exhale' | 'finished';

  const [currentPhase, setCurrentPhase] = useState<Phase>('intro');
  const [secondsLeft, setSecondsLeft] = useState(3);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [currentCaption, setCurrentCaption] = useState('Encontre uma posição confortável e relaxe os ombros.');

  const ringScale = useRef(new Animated.Value(0.82)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Narração de introdução ao iniciar
  useEffect(() => {
    if (isPlaying && currentPhase === 'intro') {
      guidedVoiceService.speak(
        'Encontre uma posição confortável e relaxe os ombros.',
        undefined,
        0.80
      );
    }
  }, [isPlaying]);

  // Gerenciamento dos temporizadores e transição entre fases da respiração
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      guidedVoiceService.cancel();
      return;
    }

    if (currentPhase === 'finished') {
      return;
    }

    // Cronômetro exato de 1 segundo real (1000ms)
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

  // Transição de Fases da Respiração
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
      if (config.holdAfterExhaleSeconds > 0) {
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
    setCurrentCaption('Inspire lentamente pelo nariz.');
    hapticService.triggerInhale();

    // Narração inicial com silêncio em seguida
    guidedVoiceService.speak('Inspire lentamente pelo nariz.', undefined, 0.80);

    // Animação suave e contínua do círculo expandindo
    Animated.timing(ringScale, {
      toValue: 1.26,
      duration: config.inhaleSeconds * 1000,
      easing: Easing.bezier(0.35, 0.0, 0.2, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const startHoldPhase = () => {
    setCurrentPhase('hold');
    setSecondsLeft(config.holdSeconds);
    setCurrentCaption('Segure suavemente.');
    hapticService.triggerHold();

    // Narração inicial
    guidedVoiceService.speak('Segure suavemente.', undefined, 0.80);
  };

  const startExhalePhase = () => {
    setCurrentPhase('exhale');
    setSecondsLeft(config.exhaleSeconds);
    setCurrentCaption('Agora, solte o ar devagar pela boca.');
    hapticService.triggerExhale();

    // Narração inicial
    guidedVoiceService.speak('Agora, solte o ar devagar pela boca.', undefined, 0.80);

    // Animação suave e contínua do círculo recolhendo
    Animated.timing(ringScale, {
      toValue: 0.82,
      duration: config.exhaleSeconds * 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const startHoldAfterExhalePhase = () => {
    setCurrentPhase('hold_after_exhale');
    setSecondsLeft(config.holdAfterExhaleSeconds);
    setCurrentCaption('Pausa suave antes do próximo ciclo.');
    hapticService.triggerHold();
    // 2 segundos de silêncio para tranquilidade
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
      setCurrentCaption('Muito bem! Retorne ao seu ritmo natural.');
      guidedVoiceService.speak(
        'Muito bem. Sinta a sensação de tranquilidade em seu corpo.',
        undefined,
        0.80
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
        return 'Pausa';
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
      {/* 1. Barra Superior com Ciclo e Acessibilidade */}
      <View style={styles.headerRow}>
        <View style={styles.cycleBadge}>
          <Text style={[styles.cycleText, { color: isDark ? '#5ECFC3' : '#1F766E' }]}>
            {currentPhase === 'finished'
              ? 'Prática concluída'
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
            <Sparkles size={13} color={noHoldMode ? '#1F766E' : colors.textSecondary} />
            <Text
              style={[
                styles.accessibleBtnText,
                { color: noHoldMode ? '#1F766E' : colors.textSecondary },
              ]}
            >
              {noHoldMode ? 'Modo sem pausa ativo' : 'Sem pausa'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Palco Visual Central: Círculo de Respiração e Personagem Oficial */}
      <View style={styles.visualArea}>
        {/* Círculo de Respiração Suave */}
        <Animated.View
          style={[
            styles.breathingRing,
            {
              transform: [{ scale: ringScale }],
              borderColor: getPhaseColor(),
              backgroundColor: isDark
                ? 'rgba(31, 118, 110, 0.10)'
                : 'rgba(31, 118, 110, 0.06)',
            },
          ]}
        />

        {/* Personagem Oficial Centralizada (Corpo Inteiro com Almofada) */}
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
                : 2
            }
          />
        </View>

        {/* Indicador Flutuante da Etapa e Contagem em Segundos Reais */}
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

      {/* 3. Legenda Sincronizada em Português */}
      <View style={[styles.captionBox, { backgroundColor: isDark ? '#1C2624' : '#EFF6F3' }]}>
        <Text style={[styles.captionText, { color: isDark ? '#F1F5F9' : '#163F3A' }]}>
          {currentCaption}
        </Text>
      </View>

      {/* 4. Aviso de Conforto e Segurança */}
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
    paddingVertical: 10,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  cycleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
    backgroundColor: 'rgba(31, 118, 110, 0.12)',
  },
  cycleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  accessibleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  accessibleBtnText: {
    fontSize: 11,
    fontWeight: '500',
  },
  visualArea: {
    width: '100%',
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  breathingRing: {
    position: 'absolute',
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 2.5,
    zIndex: 1,
  },
  characterContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    paddingHorizontal: 12,
  },
  floatingCounter: {
    position: 'absolute',
    bottom: 8,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },
  phaseTitleText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  secondsLeftNumber: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: -2,
  },
  captionBox: {
    width: '92%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
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
    marginTop: 8,
  },
  safetyText: {
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
});
