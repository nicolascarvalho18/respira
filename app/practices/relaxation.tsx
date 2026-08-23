import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { Card } from '../../src/components/ui/Card';
import { AppButton } from '../../src/components/ui/AppButton';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { useToast } from '../../src/components/ui/Toast';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useTheme } from '../../src/hooks/useTheme';

interface MuscleGroup {
  name: string;
  tenseInstruction: string;
  releaseInstruction: string;
  tenseDurationSeconds: number;
  relaxDurationSeconds: number;
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    name: 'Mãos e Antebraços',
    tenseInstruction: 'Feche as mãos em punhos firmes e contraia os antebraços sem causar dor.',
    releaseInstruction: 'Abra as mãos suavemente e sinta o alívio e a circulação retornando aos dedos.',
    tenseDurationSeconds: 5,
    relaxDurationSeconds: 10,
  },
  {
    name: 'Ombros e Pescoço',
    tenseInstruction: 'Eleve os ombros suavemente em direção às orelhas, segurando a tensão.',
    releaseInstruction: 'Solte os ombros de uma vez, deixando-os cair em repouso e relaxamento total.',
    tenseDurationSeconds: 5,
    relaxDurationSeconds: 10,
  },
  {
    name: 'Rosto e Mandíbula',
    tenseInstruction: 'Franza a testa suavemente e aperte levemente os lábios.',
    releaseInstruction: 'Alivie todos os músculos da face, relaxando a mandíbula e a língua.',
    tenseDurationSeconds: 5,
    relaxDurationSeconds: 10,
  },
  {
    name: 'Abdômen e Tronco',
    tenseInstruction: 'Contraia o abdômen suavemente, como se preparasse o tronco.',
    releaseInstruction: 'Solte a musculatura abdominal e deixe a respiração fluir profunda e solta.',
    tenseDurationSeconds: 5,
    relaxDurationSeconds: 10,
  },
  {
    name: 'Pés e Pernas',
    tenseInstruction: 'Aponte os dedos dos pés para baixo e contraia as panturrilhas levemente.',
    releaseInstruction: 'Relaxe as pernas e os pés completamente, sentindo o peso do corpo repousar.',
    tenseDurationSeconds: 5,
    relaxDurationSeconds: 10,
  },
];

export default function ProgressiveRelaxationScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { recordCompletion } = usePracticeStore();
  const { showToast } = useToast();

  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'tense' | 'relax'>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentGroup = MUSCLE_GROUPS[currentGroupIndex];
  const progressPercent = ((currentGroupIndex + (isFinished ? 1 : 0)) / MUSCLE_GROUPS.length) * 100;

  const handleStart = () => {
    setIsActive(true);
    setPhase('tense');
    setSecondsRemaining(currentGroup.tenseDurationSeconds);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('idle');
    setCurrentGroupIndex(0);
    setSecondsRemaining(MUSCLE_GROUPS[0].tenseDurationSeconds);
    setIsFinished(false);
  };

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev > 1) return prev - 1;

        if (phase === 'tense') {
          setPhase('relax');
          return currentGroup.relaxDurationSeconds;
        } else if (phase === 'relax') {
          if (currentGroupIndex < MUSCLE_GROUPS.length - 1) {
            setCurrentGroupIndex((curr) => curr + 1);
            setPhase('tense');
            return MUSCLE_GROUPS[currentGroupIndex + 1].tenseDurationSeconds;
          } else {
            setIsActive(false);
            setIsFinished(true);
            recordCompletion('practice-pmr-relaxation');
            showToast({ message: 'Relaxamento Muscular Concluído!', type: 'success' });
            return 0;
          }
        }
        return 5;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phase, currentGroup, currentGroupIndex, recordCompletion, showToast]);

  return (
    <AppShell>
      <PageHeader
        showBack
        title="Relaxamento Muscular Progressivo"
        subtitle="Técnica de Jacobson para liberação de tensão física e estresse acumulado."
      />

      <View style={styles.progressWrap}>
        <ProgressBar
          progress={progressPercent}
          label={`Grupo ${Math.min(MUSCLE_GROUPS.length, currentGroupIndex + 1)} de ${MUSCLE_GROUPS.length}: ${currentGroup.name}`}
          showLabel
        />
      </View>

      {!isFinished ? (
        <Card variant="bordered" style={styles.contentCard}>
          {/* Indicador de Fase Ativa */}
          <View
            style={[
              styles.phaseBadge,
              {
                backgroundColor:
                  phase === 'tense'
                    ? colors.warning
                    : phase === 'relax'
                      ? colors.success
                      : colors.primary,
              },
            ]}
          >
            <Text style={styles.phaseBadgeText}>
              {phase === 'tense'
                ? 'Contraia suavemente'
                : phase === 'relax'
                  ? 'Solte e relaxe'
                  : 'Pronto(a) para começar?'}
            </Text>
          </View>

          {/* Cronômetro */}
          {isActive && (
            <View style={styles.timerCircle}>
              <Text style={[styles.timerSecs, { color: colors.text }]}>{secondsRemaining}s</Text>
            </View>
          )}

          <Text style={[styles.groupTitle, { color: colors.text }]}>{currentGroup.name}</Text>
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            {phase === 'tense'
              ? currentGroup.tenseInstruction
              : phase === 'relax'
                ? currentGroup.releaseInstruction
                : 'Sente-se confortavelmente e prepare-se para contrair e soltar cada grupo muscular.'}
          </Text>

          {/* Ações de Controle */}
          <View style={styles.controlsRow}>
            {!isActive ? (
              <View style={{ flex: 1 }}>
                <AppButton
                  title={phase === 'idle' ? 'Iniciar Exercício' : 'Continuar'}
                  leftIcon={<Play size={18} color="#FFFFFF" fill="#FFFFFF" />}
                  onPress={handleStart}
                  size="lg"
                />
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Pausar"
                  variant="outline"
                  leftIcon={<Pause size={18} color={colors.primary} />}
                  onPress={handlePause}
                  size="lg"
                />
              </View>
            )}

            <TouchableOpacity
              onPress={handleReset}
              style={[styles.resetBtn, { backgroundColor: colors.surfaceSecondary }]}
              accessibilityRole="button"
              accessibilityLabel="Reiniciar"
            >
              <RotateCcw size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </Card>
      ) : (
        <Card variant="bordered" style={styles.finishedCard}>
          <View style={[styles.finishedIconCircle, { backgroundColor: colors.highlight }]}>
            <Sparkles size={40} color={colors.primary} />
          </View>
          <Text style={[styles.finishedTitle, { color: colors.text }]}>
            Prática Concluída!
          </Text>
          <Text style={[styles.finishedBody, { color: colors.textMuted }]}>
            Excelente! Observe a sensação de calor, peso e relaxamento nos seus músculos.
          </Text>

          <AppButton
            title="Voltar às Práticas"
            onPress={() => router.replace('/(tabs)/practices')}
            size="lg"
            style={{ width: '100%', marginTop: 14 }}
          />
        </Card>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  progressWrap: {
    marginBottom: 16,
  },
  contentCard: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  phaseBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  phaseBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#79B8A4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerSecs: {
    fontSize: 26,
    fontWeight: '800',
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  resetBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedCard: {
    alignItems: 'center',
    padding: 32,
    marginVertical: 20,
  },
  finishedIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  finishedTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  finishedBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
});
