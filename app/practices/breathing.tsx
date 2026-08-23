import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Play, Pause, RotateCcw, Check, Vibrate, Volume2, Mic, Sparkles } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { BreathingCircle, BreathingPhase } from '../../src/components/practices/BreathingCircle';
import { AppButton } from '../../src/components/ui/AppButton';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useTheme } from '../../src/hooks/useTheme';
import { hapticService } from '../../src/services/haptics/hapticService';
import { audioGuideService } from '../../src/services/audio/audioGuideService';

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
    name: 'Respiração 4-7-8',
    subtitle: 'Exercício guiado para desacelerar',
    inhale: 4,
    hold: 7,
    exhale: 8,
  },
  {
    id: 'box',
    name: 'Respiração Quadrada',
    subtitle: 'Quatro tempos iguais de respiração',
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdAfter: 4,
  },
  {
    id: 'cardiac',
    name: 'Coerência (5-5)',
    subtitle: 'Respiração contínua e suave',
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

  // Audio & Haptic preferences
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceVolume, setVoiceVolume] = useState(0.8);
  const [ambienceVolume, setAmbienceVolume] = useState(0.5);

  const [isCompleted, setIsCompleted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleFinish = useCallback(async () => {
    setIsActive(false);
    setIsCompleted(true);
    hapticService.triggerCycleComplete();
    audioGuideService.speakGuidance('Prática concluída com sucesso. Observe como seu corpo se sente agora.');
    await recordCompletion('practice-breathing-478');
  }, [recordCompletion]);

  const handleStart = () => {
    setIsActive(true);
    setIsCompleted(false);
    setPhase('inhale');
    setSecondsRemaining(selectedTech.inhale);
    hapticService.triggerInhale();
    if (voiceEnabled) audioGuideService.speakGuidance('Inspire suavemente pelo nariz');
  };

  const handlePause = () => {
    setIsActive(false);
    audioGuideService.stopVoice();
  };

  const handleReset = () => {
    setIsActive(false);
    audioGuideService.stopVoice();
    setPhase('idle');
    setSecondsRemaining(selectedTech.inhale);
    setCompletedCycles(0);
    setIsCompleted(false);
  };

  useEffect(() => {
    hapticService.setEnabled(hapticsEnabled);
  }, [hapticsEnabled]);

  useEffect(() => {
    audioGuideService.setVoiceEnabled(voiceEnabled);
    audioGuideService.setVoiceVolume(voiceVolume);
    audioGuideService.setAmbienceVolume(ambienceVolume);
  }, [voiceEnabled, voiceVolume, ambienceVolume]);

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
            hapticService.triggerHold();
            if (voiceEnabled) audioGuideService.speakGuidance('Segure o ar com calma');
            return selectedTech.hold;
          } else {
            setPhase('exhale');
            hapticService.triggerExhale();
            if (voiceEnabled) audioGuideService.speakGuidance('Solte o ar suavemente');
            return selectedTech.exhale;
          }
        } else if (phase === 'hold') {
          setPhase('exhale');
          hapticService.triggerExhale();
          if (voiceEnabled) audioGuideService.speakGuidance('Solte o ar pela boca lentamente');
          return selectedTech.exhale;
        } else if (phase === 'exhale') {
          if (selectedTech.holdAfter && selectedTech.holdAfter > 0) {
            setPhase('hold_after');
            hapticService.triggerHold();
            if (voiceEnabled) audioGuideService.speakGuidance('Mantenha os pulmões vazios');
            return selectedTech.holdAfter;
          } else {
            const nextCycles = completedCycles + 1;
            setCompletedCycles(nextCycles);
            if (nextCycles >= targetCycles) {
              handleFinish();
              return 0;
            }
            setPhase('inhale');
            hapticService.triggerInhale();
            if (voiceEnabled) audioGuideService.speakGuidance('Inspire suavemente');
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
          hapticService.triggerInhale();
          if (voiceEnabled) audioGuideService.speakGuidance('Inspire pelo nariz');
          return selectedTech.inhale;
        }

        return selectedTech.inhale;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    isActive,
    phase,
    selectedTech,
    completedCycles,
    targetCycles,
    voiceEnabled,
    handleFinish,
  ]);

  return (
    <ScreenContainer scrollable={true}>
      <AppHeader title="Respiração Guiada" showBack={true} />

      {/* Seleção de Técnica */}
      {!isActive && !isCompleted && (
        <View style={styles.techniqueSelector}>
          {TECHNIQUES.map((tech) => {
            const isSelected = selectedTech.id === tech.id;
            return (
              <TouchableOpacity
                key={tech.id}
                onPress={() => {
                  setSelectedTech(tech);
                  setSecondsRemaining(tech.inhale);
                  setCompletedCycles(0);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.techniqueCard,
                  isSelected && [
                    styles.techniqueCardActive,
                    { borderColor: '#2F7F7C', backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF' },
                  ],
                  {
                    backgroundColor: isDark ? colors.surface : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#EBF1EF',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.techniqueName,
                    { color: isSelected ? '#2F7F7C' : '#173D3B' },
                  ]}
                >
                  {tech.name}
                </Text>
                <Text style={[styles.techniqueSubtitle, { color: '#667775' }]}>
                  {tech.subtitle}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Círculo Animado de Respiração */}
      <View style={styles.circleContainer}>
        <BreathingCircle
          phase={phase}
          phaseDurationSeconds={
            phase === 'inhale'
              ? selectedTech.inhale
              : phase === 'hold'
              ? selectedTech.hold
              : phase === 'exhale'
              ? selectedTech.exhale
              : phase === 'hold_after'
              ? selectedTech.holdAfter || 4
              : selectedTech.inhale
          }
          secondsRemaining={secondsRemaining}
          isActive={isActive}
          hapticsEnabled={hapticsEnabled}
        />
      </View>

      {/* Contador de Ciclos */}
      <View style={styles.cyclesContainer}>
        <Text style={[styles.cyclesText, { color: '#667775' }]}>
          Ciclo {completedCycles} de {targetCycles}
        </Text>
        <View style={styles.dotsRow}>
          {Array.from({ length: targetCycles }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i < completedCycles
                      ? '#2F7F7C'
                      : isDark
                      ? colors.surfaceSecondary
                      : '#DCE5E2',
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Controles de Reprodução */}
      <View style={styles.controlsRow}>
        {!isActive ? (
          <AppButton
            title={phase === 'idle' ? 'Começar Exercício' : 'Continuar'}
            leftIcon={<Play size={18} color="#FFFFFF" fill="#FFFFFF" />}
            onPress={handleStart}
            size="lg"
            style={{ flex: 1 }}
          />
        ) : (
          <AppButton
            title="Pausar"
            variant="outline"
            leftIcon={<Pause size={18} color="#2F7F7C" fill="#2F7F7C" />}
            onPress={handlePause}
            size="lg"
            style={{ flex: 1 }}
          />
        )}

        {(isActive || phase !== 'idle') && (
          <TouchableOpacity
            onPress={handleReset}
            accessibilityRole="button"
            accessibilityLabel="Reiniciar exercício"
            style={[
              styles.resetButton,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5',
                borderColor: isDark ? colors.border : '#DCE5E2',
              },
            ]}
          >
            <RotateCcw size={18} color="#667775" />
          </TouchableOpacity>
        )}
      </View>

      {/* Configurações de Voz e Feedback Tátil */}
      <View
        style={[
          styles.optionsBox,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#EBF1EF',
          },
        ]}
      >
        <View style={styles.optionRow}>
          <View style={styles.optionLabelRow}>
            <Mic size={16} color="#2F7F7C" style={{ marginRight: 8 }} />
            <View>
              <Text style={[styles.optionTitle, { color: '#173D3B' }]}>Voz guiada</Text>
              <Text style={[styles.optionSub, { color: '#667775' }]}>
                Narração suave das etapas
              </Text>
            </View>
          </View>
          <Switch
            value={voiceEnabled}
            onValueChange={setVoiceEnabled}
            trackColor={{ false: '#DCE5E2', true: '#2F7F7C' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.optDivider, { backgroundColor: isDark ? colors.border : '#F0F5F3' }]} />

        <View style={styles.optionRow}>
          <View style={styles.optionLabelRow}>
            <Vibrate size={16} color="#2F7F7C" style={{ marginRight: 8 }} />
            <View>
              <Text style={[styles.optionTitle, { color: '#173D3B' }]}>Feedback tátil</Text>
              <Text style={[styles.optionSub, { color: '#667775' }]}>
                Vibração suave a cada fase
              </Text>
            </View>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
            trackColor={{ false: '#DCE5E2', true: '#2F7F7C' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Mensagem de Conclusão */}
      {isCompleted && (
        <View
          style={[
            styles.completedCard,
            {
              backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
              borderColor: isDark ? colors.border : '#C7E5DC',
            },
          ]}
        >
          <View style={styles.completedIconCircle}>
            <Check size={20} color="#FFFFFF" strokeWidth={3} />
          </View>
          <Text style={[styles.completedTitle, { color: '#173D3B' }]}>
            Muito bem! Prática concluída.
          </Text>
          <Text style={[styles.completedDesc, { color: '#567571' }]}>
            Você completou os 4 ciclos de respiração consciente.
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  techniqueSelector: {
    gap: 8,
    marginBottom: 16,
  },
  techniqueCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  techniqueCardActive: {
    borderWidth: 2,
  },
  techniqueName: {
    fontSize: 14,
    fontWeight: '800',
  },
  techniqueSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  cyclesContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  cyclesText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  resetButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  optionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionSub: {
    fontSize: 11,
    marginTop: 1,
  },
  optDivider: {
    height: 1,
    width: '100%',
  },
  completedCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  completedIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2F7F7C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  completedTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  completedDesc: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
});
