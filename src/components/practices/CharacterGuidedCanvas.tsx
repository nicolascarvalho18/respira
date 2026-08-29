import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Platform, Animated, Easing } from 'react-native';

export type CharacterPosture =
  | 'breathing_diaphragmatic'
  | 'breathing_relaxed'
  | 'meditation_lotus'
  | 'grounding_mug'
  | 'body_scan'
  | 'stretch_arms'
  | 'stretch_neck';

export interface CharacterGuidedCanvasProps {
  phase?: 'inhale' | 'hold' | 'exhale' | 'hold_after_exhale' | 'idle';
  phaseDurationSeconds?: number;
  posture?: CharacterPosture;
  reducedMotion?: boolean;
  intensity?: number;
}

// Imagem PNG oficial de alta resolução com fundo transparente
const characterImageSource = require('../../../assets/images/official_breathing_character.png');

export const CharacterGuidedCanvas: React.FC<CharacterGuidedCanvasProps> = ({
  phase = 'idle',
  phaseDurationSeconds = 4,
  reducedMotion = false,
  intensity = 1,
}) => {
  // Animação de expansão e recolhimento corporal suave
  const breathAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      breathAnim.setValue(1);
      translateYAnim.setValue(0);
      return;
    }

    const durationMs = Math.max(600, phaseDurationSeconds * 1000);

    if (phase === 'inhale') {
      // Inspiração: Expansão suave e elevação sutil
      Animated.parallel([
        Animated.timing(breathAnim, {
          toValue: 1 + 0.045 * intensity,
          duration: durationMs,
          easing: Easing.bezier(0.35, 0.0, 0.2, 1),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(translateYAnim, {
          toValue: -3 * intensity,
          duration: durationMs,
          easing: Easing.bezier(0.35, 0.0, 0.2, 1),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else if (phase === 'hold' || phase === 'hold_after_exhale') {
      // Retenção/Pausa: Corpo perfeitamente estável e em repouso
    } else if (phase === 'exhale') {
      // Expiração: Recolhimento lento e suave de volta à posição base
      Animated.parallel([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: durationMs,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: durationMs,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else {
      // Idle / Concluído
      Animated.parallel([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [phase, phaseDurationSeconds, reducedMotion, intensity]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.characterWrapper,
          {
            transform: [
              { scale: breathAnim },
              { translateY: translateYAnim },
            ],
          },
        ]}
      >
        <Image
          source={characterImageSource}
          style={styles.characterImage}
          resizeMode="contain"
          accessibilityLabel="Personagem do Respira sentada em postura de meditação"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  characterWrapper: {
    width: '100%',
    height: '100%',
    maxWidth: 290,
    maxHeight: 340,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        filter: 'drop-shadow(0px 8px 20px rgba(18, 48, 45, 0.18))',
      },
      default: {
        shadowColor: '#12302D',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
        elevation: 4,
      },
    }),
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
});
