import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export type BreathingPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'hold_after';

export interface BreathingCircleProps {
  phase: BreathingPhase;
  phaseDurationSeconds: number;
  secondsRemaining: number;
  isActive: boolean;
  hapticsEnabled?: boolean;
}

export const BreathingCircle: React.FC<BreathingCircleProps> = ({
  phase,
  phaseDurationSeconds,
  secondsRemaining,
  isActive,
  hapticsEnabled = true,
}) => {
  const { colors, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  // Gatilho de haptics quando a fase muda
  const lastPhaseRef = useRef<BreathingPhase>('idle');
  useEffect(() => {
    if (phase !== lastPhaseRef.current && isActive && hapticsEnabled) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {
          // Ignora caso dispositivo não suporte haptics
        }
      }
      lastPhaseRef.current = phase;
    }
  }, [phase, isActive, hapticsEnabled]);

  useEffect(() => {
    if (reducedMotion || !isActive) {
      scale.value = withTiming(1, { duration: 300 });
      return;
    }

    const durationMs = phaseDurationSeconds * 1000;

    switch (phase) {
      case 'inhale':
        // Expansão suave
        scale.value = withTiming(1.35, {
          duration: durationMs,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
        break;
      case 'hold':
      case 'hold_after':
        // Mantém escala durante a retenção
        break;
      case 'exhale':
        // Contração suave
        scale.value = withTiming(1.0, {
          duration: durationMs,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
        break;
      default:
        scale.value = withTiming(1, { duration: 500 });
        break;
    }
  }, [phase, phaseDurationSeconds, isActive, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getPhaseText = () => {
    if (!isActive) return 'Pronto(a)?';
    switch (phase) {
      case 'inhale':
        return 'Inspire pelo nariz';
      case 'hold':
        return 'Segure o ar';
      case 'exhale':
        return 'Expire suavemente';
      case 'hold_after':
        return 'Mantenha vazio';
      default:
        return 'Inspire';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale':
        return colors.primary;
      case 'hold':
      case 'hold_after':
        return colors.secondary;
      case 'exhale':
        return colors.primaryLight;
      default:
        return colors.primary;
    }
  };

  return (
    <View
      style={styles.wrapper}
      accessibilityRole="timer"
      accessibilityLabel={`${getPhaseText()}, ${secondsRemaining} segundos restantes`}
    >
      {/* Círculo externo com efeito de brilho/halo */}
      <Animated.View
        style={[
          styles.outerCircle,
          {
            backgroundColor: isDark ? 'rgba(46, 111, 115, 0.2)' : colors.highlight,
            borderColor: colors.secondaryLight,
          },
          animatedStyle,
        ]}
      >
        {/* Círculo interno */}
        <View
          style={[
            styles.innerCircle,
            {
              backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
              borderColor: getPhaseColor(),
            },
          ]}
        >
          <Text style={[styles.phaseTitle, { color: getPhaseColor() }]}>{getPhaseText()}</Text>

          {isActive && (
            <Text style={[styles.countdownText, { color: colors.text }]}>
              {secondsRemaining}s
            </Text>
          )}

          {!isActive && (
            <Text style={[styles.hintText, { color: colors.textMuted }]}>
              Toque em Iniciar abaixo
            </Text>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
    height: 280,
  },
  outerCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  phaseTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  countdownText: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
