import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Play, Pause, RotateCcw, Check, Vibrate, Sparkles } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { BreathingCircle, BreathingPhase } from '../../src/components/practices/BreathingCircle';
import { AppButton } from '../../src/components/ui/AppButton';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useTheme } from '../../src/hooks/useTheme';

interface BreathingTechnique {
  id: string;
  name: string;
  subtitle: string;
  inhale: number;
  hold: number;
  exhale: number;
  holdAfter?: number;
}

const TECHNIQUES: BreathingTechnique[] = [
  {
    id: '4-7-8',
    name: '4-7-8 Relaxante',
    subtitle: 'Para alívio de tensão e relaxamento',
    inhale: 4,
    hold: 7,
    exhale: 8,
  },
  {
    id: 'box',
    name: 'Quadrada (4-4-4-4)',
    subtitle: 'Para foco e clareza mental',
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdAfter: 4,
  },
  {
    id: 'cardiac',
    name: 'Coerência (5-5)',
    subtitle: 'Para harmonização do ritmo cardíaco',
    inhale: 5,
    hold: 0,
    exhale: 5,
  },
];

export default function BreathingScreen() {
  const { colors, isDark } = useTheme();
  const { recordCompletion } = usePracticeStore();

  const [selectedTech, setSelectedTech] = useState<BreathingTechnique>(TECHNIQUES[0]);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathingPhase>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState(selectedTech.inhale);
  const [completedCycles, setCompletedCycles] = useState(0);
  const targetCycles = 4;
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleFinish = useCallback(async () => {
    setIsActive(false);
    setIsCompleted(true);
    await recordCompletion('practice-breathing-478');
  }, [recordCompletion]);

  const handleStart = () => {
    setIsActive(true);
    setIsCompleted(false);
    setPhase('inhale');
    setSecondsRemaining(selectedTech.inhale);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('idle');
    setSecondsRemaining(selectedTech.inhale);
    setCompletedCycles(0);
    setIsCompleted(false);
  };

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prevSecs) => {
        if (prevSecs > 1) {
          return prevSecs - 1;
        }

        // Transição de fases
        if (phase === 'inhale') {
          if (selectedTech.hold > 0) {
            setPhase('hold');
            return selectedTech.hold;
          } else {
            setPhase('exhale');
            return selectedTech.exhale;
          }
        } else if (phase === 'hold') {
          setPhase('exhale');
          return selectedTech.exhale;
        } else if (phase === 'exhale') {
          if (selectedTech.holdAfter && selectedTech.holdAfter > 0) {
            setPhase('hold_after');
            return selectedTech.holdAfter;
          } else {
            const nextCycles = completedCycles + 1;
            setCompletedCycles(nextCycles);
            if (nextCycles >= targetCycles) {
              handleFinish();
              return 0;
            }
            setPhase('inhale');
            return selectedTech.inhale;
          }
        } else if (phase === 'hold_after') {
          const nextCycles = completedCycles + 1;
          setCompletedCycles(nextCycles);
          if (nextCycles >= targetCycles) {
            handleFinish();
            return 0;
          }
          setPhase('inhale');
          return selectedTech.inhale;
        }

        return selectedTech.inhale;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phase, selectedTech, completedCycles, targetCycles, handleFinish]);

  const getPhaseDuration = () => {
    switch (phase) {
      case 'inhale':
        return selectedTech.inhale;
      case 'hold':
        return selectedTech.hold;
      case 'exhale':
        return selectedTech.exhale;
      case 'hold_after':
        return selectedTech.holdAfter || 4;
      default:
        return selectedTech.inhale;
    }
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader showBack title="Exercício de Respiração" />

      {/* Seletor de Técnicas (quando pausado/inativo) */}
      {!isActive && (
        <View style={styles.techniqueRow}>
          {TECHNIQUES.map((tech) => {
            const isSelected = selectedTech.id === tech.id;

            return (
              <TouchableOpacity
                key={tech.id}
                onPress={() => {
                  setSelectedTech(tech);
                  setPhase('idle');
                  setSecondsRemaining(tech.inhale);
                  setCompletedCycles(0);
                }}
                style={[
                  styles.techButton,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : isDark
                        ? colors.surfaceSubtle
                        : '#FFFFFF',
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityLabel={`Técnica: ${tech.name}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.techButtonText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {tech.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Círculo Interativo Animado de Respiração */}
      <BreathingCircle
        phase={phase}
        phaseDurationSeconds={getPhaseDuration()}
        secondsRemaining={secondsRemaining}
        isActive={isActive}
        hapticsEnabled={hapticsEnabled}
      />

      {/* Contador de Ciclos */}
      <View style={styles.cyclesInfo}>
        <Text style={[styles.cyclesText, { color: colors.text }]}>
          Ciclo {Math.min(targetCycles, completedCycles + 1)} de {targetCycles}
        </Text>
        <Text style={[styles.techSubtitle, { color: colors.textMuted }]}>
          {selectedTech.subtitle}
        </Text>
      </View>

      {/* Conclusão Acolhedora */}
      {isCompleted && (
        <View style={[styles.completedCard, { backgroundColor: colors.highlight }]}>
          <Sparkles size={24} color={colors.primary} style={{ marginBottom: 6 }} />
          <Text style={[styles.completedTitle, { color: colors.primaryDark }]}>
            Excelente! Prática concluída.
          </Text>
          <Text style={[styles.completedDesc, { color: colors.text }]}>
            Observe como seu corpo está se sentindo agora. Reserve alguns instantes para apreciar
            essa pausa de autocuidado.
          </Text>
        </View>
      )}

      {/* Controles de Ação */}
      <View style={styles.controlsRow}>
        {!isActive ? (
          <View style={{ flex: 1 }}>
            <AppButton
              title={completedCycles > 0 ? 'Continuar Respiração' : 'Iniciar Prática'}
              leftIcon={<Play size={18} color="#FFFFFF" fill="#FFFFFF" />}
              onPress={handleStart}
              size="lg"
            />
          </View>
        ) : (
          <View style={{ flex: 1, flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Pausar"
                variant="outline"
                leftIcon={<Pause size={18} color={colors.primary} />}
                onPress={handlePause}
                size="lg"
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Finalizar"
                variant="secondary"
                leftIcon={<Check size={18} color={colors.primary} />}
                onPress={handleFinish}
                size="lg"
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={handleReset}
          accessibilityRole="button"
          accessibilityLabel="Reiniciar exercício"
          style={[styles.resetButton, { backgroundColor: colors.surfaceSubtle }]}
        >
          <RotateCcw size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Alternância de Vibração Tátil */}
      <View style={styles.optionsRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Vibrate size={16} color={colors.textMuted} />
          <Text style={[styles.optionText, { color: colors.textMuted }]}>
            Vibração ao mudar de fase
          </Text>
        </View>
        <Switch
          value={hapticsEnabled}
          onValueChange={setHapticsEnabled}
          trackColor={{ false: '#CBD5E1', true: colors.secondary }}
          thumbColor={hapticsEnabled ? colors.primary : '#FFFFFF'}
          accessibilityLabel="Vibração tátil"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  techniqueRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  techButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  techButtonText: {
    fontSize: 12,
  },
  cyclesInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cyclesText: {
    fontSize: 16,
    fontWeight: '700',
  },
  techSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  completedCard: {
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  completedDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  resetButton: {
    width: 52,
    height: 52,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  optionText: {
    fontSize: 13,
  },
});
