import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Bookmark,
  Sparkles,
  CheckCircle2,
  ListFilter,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../ui/Toast';
import { AppButton } from '../ui/AppButton';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { BreathingCircle, BreathingPhase } from './BreathingCircle';
import { PracticeSelectorModal } from './PracticeSelectorModal';
import { soundEngine } from '../../services/sound/soundEngine';
import { hapticService } from '../../services/haptics/hapticService';
import { Practice } from '../../types';

export interface UniversalPracticePlayerProps {
  practice: Practice;
  allPractices: Practice[];
  onSelectPractice: (p: Practice) => void;
  onRecordCompletion: (practiceId: string) => Promise<void>;
  onToggleFavorite: (practiceId: string) => Promise<void>;
  onBack: () => void;
}

export const UniversalPracticePlayer: React.FC<UniversalPracticePlayerProps> = ({
  practice,
  allPractices,
  onSelectPractice,
  onRecordCompletion,
  onToggleFavorite,
  onBack,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const isBreathing = practice.category === 'breathing' && !!practice.breathingConfig;
  const config = practice.breathingConfig || {
    inhaleSeconds: 4,
    holdSeconds: 0,
    exhaleSeconds: 4,
    cycles: 4,
  };

  // State
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Breathing state
  const [phase, setPhase] = useState<BreathingPhase>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState(config.inhaleSeconds);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Step-by-step guided state (Relaxation, Grounding, Mindfulness, Meditation)
  const steps = practice.instructions || [];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepTimer, setStepTimer] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordedCompletionRef = useRef<boolean>(false);

  // Reset player when practice changes
  useEffect(() => {
    soundEngine.stopAll();
    if (timerRef.current) clearInterval(timerRef.current);

    setIsActive(false);
    setIsCompleted(false);
    setPhase('idle');
    setSecondsRemaining(config.inhaleSeconds);
    setCompletedCycles(0);
    setCurrentStepIndex(0);
    setStepTimer(0);
    recordedCompletionRef.current = false;

    return () => {
      soundEngine.stopAll();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [practice.id]);

  // Index of current practice in ordered list
  const currentIndex = allPractices.findIndex((p) => p.id === practice.id);
  const hasNextPractice = currentIndex >= 0 && currentIndex < allPractices.length - 1;
  const nextPractice = hasNextPractice ? allPractices[currentIndex + 1] : null;

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMute = soundEngine.toggleMute();
    setIsMuted(nextMute);
    showToast({
      message: nextMute ? 'Som mutado.' : 'Som ativado.',
      type: 'info',
    });
  };

  // Finish practice
  const handleFinish = useCallback(async () => {
    setIsActive(false);
    setIsCompleted(true);
    soundEngine.playCue('complete');
    hapticService.triggerCycleComplete();

    if (!recordedCompletionRef.current) {
      recordedCompletionRef.current = true;
      try {
        await onRecordCompletion(practice.id);
      } catch (_e) {
        // Completion record error handled gracefully
      }
    }
  }, [onRecordCompletion, practice.id]);

  // Advance to next practice (when user clicks "Continuar")
  const handleAdvanceToNext = () => {
    if (nextPractice) {
      onSelectPractice(nextPractice);
    } else {
      onBack();
    }
  };

  // Start
  const handleStart = () => {
    setIsActive(true);
    setIsCompleted(false);

    if (isBreathing) {
      setPhase('inhale');
      setSecondsRemaining(config.inhaleSeconds);
      soundEngine.playCue('inhale');
      soundEngine.speak('Inspire suavemente pelo nariz');
      hapticService.triggerInhale();
    } else {
      soundEngine.playCue('chime');
      soundEngine.speak(steps[currentStepIndex] || 'Vamos iniciar a prática.');
    }
  };

  // Pause
  const handlePause = () => {
    setIsActive(false);
    soundEngine.stopAll();
  };

  // Reset
  const handleReset = () => {
    soundEngine.stopAll();
    setIsActive(false);
    setPhase('idle');
    setSecondsRemaining(config.inhaleSeconds);
    setCompletedCycles(0);
    setCurrentStepIndex(0);
    setStepTimer(0);
    setIsCompleted(false);
    recordedCompletionRef.current = false;
  };

  // Step-by-step next
  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      soundEngine.playCue('click');
      soundEngine.speak(steps[nextIdx]);
    } else {
      handleFinish();
    }
  };

  // Breathing Loop Timer
  useEffect(() => {
    if (!isBreathing || !isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prevSecs) => {
        if (prevSecs > 1) return prevSecs - 1;

        if (phase === 'inhale') {
          if (config.holdSeconds > 0) {
            setPhase('hold');
            soundEngine.playCue('chime');
            soundEngine.speak('Segure o ar com calma');
            hapticService.triggerHold();
            return config.holdSeconds;
          } else {
            setPhase('exhale');
            soundEngine.playCue('exhale');
            soundEngine.speak('Solte o ar suavemente');
            hapticService.triggerExhale();
            return config.exhaleSeconds;
          }
        } else if (phase === 'hold') {
          setPhase('exhale');
          soundEngine.playCue('exhale');
          soundEngine.speak('Solte o ar pela boca lentamente');
          hapticService.triggerExhale();
          return config.exhaleSeconds;
        } else if (phase === 'exhale') {
          if (config.holdAfterExhaleSeconds && config.holdAfterExhaleSeconds > 0) {
            setPhase('hold_after');
            soundEngine.playCue('chime');
            soundEngine.speak('Mantenha os pulmões vazios');
            hapticService.triggerHold();
            return config.holdAfterExhaleSeconds;
          } else {
            const nextCycles = completedCycles + 1;
            setCompletedCycles(nextCycles);
            if (nextCycles >= config.cycles) {
              handleFinish();
              return 0;
            }
            setPhase('inhale');
            soundEngine.playCue('inhale');
            soundEngine.speak('Inspire suavemente');
            hapticService.triggerInhale();
            return config.inhaleSeconds;
          }
        } else if (phase === 'hold_after') {
          const nextCycles = completedCycles + 1;
          setCompletedCycles(nextCycles);
          if (nextCycles >= config.cycles) {
            handleFinish();
            return 0;
          }
          setPhase('inhale');
          soundEngine.playCue('inhale');
          soundEngine.speak('Inspire pelo nariz');
          hapticService.triggerInhale();
          return config.inhaleSeconds;
        }

        return config.inhaleSeconds;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phase, isBreathing, config, completedCycles, handleFinish]);

  const totalSteps = steps.length > 0 ? steps.length : 1;
  const progressPercent = isBreathing
    ? (completedCycles / config.cycles) * 100
    : ((currentStepIndex + (isCompleted ? 1 : 0)) / totalSteps) * 100;

  return (
    <View style={styles.container}>
      {/* 1. Header de Controle Superior */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Voltar às práticas"
          style={[styles.navIconBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF' }]}
        >
          <ArrowLeft size={18} color="#173D3B" />
        </TouchableOpacity>

        {/* Botão "Alterar Exercício" */}
        <TouchableOpacity
          onPress={() => setIsSelectorOpen(true)}
          style={[
            styles.changePracticeBtn,
            {
              backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
              borderColor: '#2F7F7C',
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Alterar exercício"
        >
          <ListFilter size={15} color="#2F7F7C" />
          <Text style={styles.changePracticeText}>Alterar exercício</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Botão Mute / Unmute */}
          <TouchableOpacity
            onPress={handleToggleMute}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={isMuted ? 'Desmutar som' : 'Mutar som'}
            style={[
              styles.navIconBtn,
              { backgroundColor: isMuted ? '#FDF0F0' : isDark ? colors.surfaceSecondary : '#FFFFFF' },
            ]}
          >
            {isMuted ? (
              <VolumeX size={18} color="#D9534F" />
            ) : (
              <Volume2 size={18} color="#2F7F7C" />
            )}
          </TouchableOpacity>

          {/* Favoritar */}
          <TouchableOpacity
            onPress={() => onToggleFavorite(practice.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={practice.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
            style={[styles.navIconBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF' }]}
          >
            <Bookmark
              size={18}
              color="#2F7F7C"
              fill={practice.isFavorite ? '#2F7F7C' : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Barra de Progresso e Identificação da Atividade */}
      <View style={styles.headerInfo}>
        <View style={styles.badgeRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{practice.level}</Text>
          </View>
          <Text style={[styles.durationText, { color: '#667775' }]}>
            {practice.durationMinutes} min • {practice.category.toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.practiceTitle, { color: '#173D3B' }]}>{practice.title}</Text>
        <Text style={[styles.practiceSub, { color: '#667775' }]}>
          {practice.subtitle || practice.description}
        </Text>
      </View>

      <View style={styles.progressBarWrap}>
        <ProgressBar
          progress={progressPercent}
          label={
            isBreathing
              ? `Ciclo ${completedCycles} de ${config.cycles}`
              : `Etapa ${Math.min(totalSteps, currentStepIndex + 1)} de ${totalSteps}`
          }
          showLabel
        />
      </View>

      {/* Aviso de Movimento Físico Suave quando aplicável */}
      {practice.category === 'relaxation' && (
        <View
          style={[
            styles.safetyBanner,
            {
              backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
              borderColor: '#2F7F7C',
            },
          ]}
        >
          <Text style={[styles.safetyText, { color: '#173D3B' }]}>
            ⚠️ <Text style={{ fontWeight: '700' }}>Atenção:</Text> Faça os movimentos suavemente e
            respeite seus limites. Interrompa se sentir dor ou desconforto.
          </Text>
        </View>
      )}

      {/* 3. Área Central Interativa */}
      {!isCompleted ? (
        <View style={styles.interactiveArea}>
          {isBreathing ? (
            /* Exercício de Respiração Visual */
            <View style={styles.breathingWrap}>
              <BreathingCircle
                phase={phase}
                phaseDurationSeconds={
                  phase === 'inhale'
                    ? config.inhaleSeconds
                    : phase === 'hold'
                    ? config.holdSeconds
                    : phase === 'exhale'
                    ? config.exhaleSeconds
                    : phase === 'hold_after'
                    ? config.holdAfterExhaleSeconds || 4
                    : config.inhaleSeconds
                }
                secondsRemaining={secondsRemaining}
                isActive={isActive}
                hapticsEnabled={true}
              />
            </View>
          ) : (
            /* Exercício Guiado Passo a Passo */
            <Card variant="bordered" style={styles.stepCard}>
              <View style={styles.stepCounterBadge}>
                <Text style={styles.stepCounterText}>
                  Etapa {currentStepIndex + 1} de {steps.length}
                </Text>
              </View>

              <Text style={[styles.stepInstruction, { color: '#173D3B' }]}>
                {steps[currentStepIndex]}
              </Text>

              {isActive && (
                <View style={styles.stepActionsRow}>
                  <AppButton
                    title={
                      currentStepIndex === steps.length - 1
                        ? 'Finalizar Prática'
                        : 'Próxima Etapa'
                    }
                    rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
                    onPress={handleNextStep}
                    size="md"
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </Card>
          )}

          {/* Controles de Reprodução */}
          <View style={styles.controlsRow}>
            {!isActive ? (
              <AppButton
                title={phase === 'idle' && currentStepIndex === 0 ? 'Começar Exercício' : 'Continuar'}
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

            {(isActive || phase !== 'idle' || currentStepIndex > 0) && (
              <TouchableOpacity
                onPress={handleReset}
                accessibilityRole="button"
                accessibilityLabel="Reiniciar exercício"
                style={[
                  styles.resetBtn,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5',
                    borderColor: '#DCE5E2',
                  },
                ]}
              >
                <RotateCcw size={18} color="#667775" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        /* 4. Tela de Conclusão Acolhedora */
        <Card variant="bordered" style={styles.conclusionCard}>
          <View style={styles.conclusionIconCircle}>
            <Sparkles size={36} color="#FFFFFF" />
          </View>

          <Text style={[styles.conclusionTitle, { color: '#173D3B' }]}>
            {practice.title} Concluída!
          </Text>
          <Text style={[styles.conclusionDesc, { color: '#667775' }]}>
            Muito bem! Você completou este momento de autocuidado com presença e calma.
          </Text>

          {/* Botão de Avanço Automático para o Próximo Exercício */}
          {hasNextPractice && nextPractice ? (
            <View style={styles.nextPracticeBox}>
              <Text style={styles.nextPracticeLabel}>PRÓXIMO EXERCÍCIO DISPONÍVEL</Text>
              <Text style={styles.nextPracticeName}>{nextPractice.title}</Text>
              <Text style={styles.nextPracticeMeta}>
                {nextPractice.durationMinutes} min • {nextPractice.subtitle}
              </Text>

              <AppButton
                title="Continuar para o Próximo Exercício"
                rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
                onPress={handleAdvanceToNext}
                size="lg"
                style={{ marginTop: 12 }}
              />
            </View>
          ) : (
            <View style={styles.lastPracticeBox}>
              <Text style={styles.lastPracticeText}>
                Você completou todas as práticas desta sequência!
              </Text>
              <AppButton
                title="Voltar às Práticas"
                onPress={onBack}
                size="lg"
                style={{ marginTop: 12, width: '100%' }}
              />
            </View>
          )}

          {/* Opção de Repetir Exercício Concluído */}
          <TouchableOpacity
            onPress={handleReset}
            style={styles.repeatBtn}
            accessibilityRole="button"
            accessibilityLabel="Reiniciar exercício"
          >
            <RotateCcw size={14} color="#2F7F7C" style={{ marginRight: 4 }} />
            <Text style={styles.repeatBtnText}>Reiniciar exercício</Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Modal de Seleção Dinâmica */}
      <PracticeSelectorModal
        visible={isSelectorOpen}
        practices={allPractices}
        currentPracticeId={practice.id}
        isActivityInProgress={isActive}
        onClose={() => setIsSelectorOpen(false)}
        onSelectPractice={onSelectPractice}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCE5E2',
  },
  changePracticeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  changePracticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F7F7C',
  },
  headerInfo: {
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  levelBadge: {
    backgroundColor: '#2F7F7C',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  practiceTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  practiceSub: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  progressBarWrap: {
    marginVertical: 12,
  },
  safetyBanner: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  safetyText: {
    fontSize: 12,
    lineHeight: 16,
  },
  interactiveArea: {
    marginVertical: 10,
  },
  breathingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  stepCard: {
    padding: 24,
    borderRadius: 18,
    marginVertical: 16,
    alignItems: 'center',
    gap: 14,
  },
  stepCounterBadge: {
    backgroundColor: '#E7F3EF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepCounterText: {
    color: '#2F7F7C',
    fontSize: 11,
    fontWeight: '800',
  },
  stepInstruction: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepActionsRow: {
    width: '100%',
    marginTop: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  resetBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conclusionCard: {
    padding: 28,
    borderRadius: 22,
    alignItems: 'center',
    marginVertical: 16,
  },
  conclusionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2F7F7C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  conclusionTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  conclusionDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  nextPracticeBox: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#E7F3EF',
    borderWidth: 1,
    borderColor: '#C5E2D8',
    marginBottom: 8,
  },
  nextPracticeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2F7F7C',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  nextPracticeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#173D3B',
  },
  nextPracticeMeta: {
    fontSize: 12,
    color: '#567571',
    marginTop: 2,
  },
  lastPracticeBox: {
    width: '100%',
    alignItems: 'center',
  },
  lastPracticeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#173D3B',
    textAlign: 'center',
  },
  repeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 6,
  },
  repeatBtnText: {
    color: '#2F7F7C',
    fontSize: 13,
    fontWeight: '700',
  },
});
