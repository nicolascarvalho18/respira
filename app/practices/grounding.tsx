import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { Card } from '../../src/components/ui/Card';
import { AppButton } from '../../src/components/ui/AppButton';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { useToast } from '../../src/components/ui/Toast';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useTheme } from '../../src/hooks/useTheme';

interface GroundingStep {
  step: number;
  count: number;
  sense: string;
  emoji: string;
  instruction: string;
  examples: string;
}

const STEPS: GroundingStep[] = [
  {
    step: 1,
    count: 5,
    sense: 'Visão',
    emoji: '👀',
    instruction: 'Identifique 5 coisas que você pode ver ao seu redor agora.',
    examples: 'Exemplos: uma caneta na mesa, a cor da parede, um quadro, a luz da janela, suas mãos.',
  },
  {
    step: 2,
    count: 4,
    sense: 'Tato',
    emoji: '✋',
    instruction: 'Note 4 coisas que você pode tocar e sentir o contato físico.',
    examples: 'Exemplos: o tecido da sua roupa, a textura da mesa, a sola dos sapatos no chão, o ar na pele.',
  },
  {
    step: 3,
    count: 3,
    sense: 'Audição',
    emoji: '👂',
    instruction: 'Perceba 3 sons que você consegue ouvir no ambiente.',
    examples: 'Exemplos: o barulho do vento, um relógio distante, respiração suave, tráfego distante.',
  },
  {
    step: 4,
    count: 2,
    sense: 'Olfato',
    emoji: '👃',
    instruction: 'Preste atenção em 2 cheiros presentes ou recorde aromas suaves.',
    examples: 'Exemplos: aroma de café, sabonete, perfume suave ou ar fresco da janela.',
  },
  {
    step: 5,
    count: 1,
    sense: 'Gentileza e Paladar',
    emoji: '🌱',
    instruction: 'Diga a si mesmo(a) 1 palavra ou frase de gentileza e presença.',
    examples: 'Exemplos: "Eu estou seguro(a) aqui e agora", "Este momento é passageiro", "Respiro em paz".',
  },
];

export default function GroundingPracticeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { recordCompletion } = usePracticeStore();
  const { showToast } = useToast();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const current = STEPS[currentStepIndex];
  const progressPercent = ((currentStepIndex + (isFinished ? 1 : 0)) / STEPS.length) * 100;

  const handleNextStep = async () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setCompletedItems([]);
    } else {
      setIsFinished(true);
      await recordCompletion('practice-grounding-54321');
      showToast({ message: 'Exercício de Ancoragem concluído!', type: 'success' });
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setCompletedItems([]);
    setIsFinished(false);
  };

  return (
    <AppShell>
      <PageHeader
        showBack
        title="Ancoragem 5-4-3-2-1"
        subtitle="Técnica sensorial para desacelerar a mente e trazer foco ao presente."
      />

      {/* Barra de Progresso do Exercício */}
      <View style={styles.progressWrap}>
        <ProgressBar
          progress={progressPercent}
          label={`Passo ${Math.min(STEPS.length, currentStepIndex + 1)} de ${STEPS.length}`}
          showLabel
        />
      </View>

      {!isFinished ? (
        <Card variant="bordered" style={styles.stepCard}>
          <View style={[styles.stepIconWrap, { backgroundColor: colors.highlight }]}>
            <Text style={styles.stepEmoji}>{current.emoji}</Text>
          </View>

          <View style={styles.stepInfoRow}>
            <View style={[styles.stepNumberBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>{current.count} itens</Text>
            </View>
            <Text style={[styles.senseTitle, { color: colors.text }]}>{current.sense}</Text>
          </View>

          <Text style={[styles.instructionText, { color: colors.text }]}>
            {current.instruction}
          </Text>

          <View
            style={[
              styles.examplesBox,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.examplesText, { color: colors.textMuted }]}>
              {current.examples}
            </Text>
          </View>

          {/* Checklist interativo dos itens */}
          <View style={styles.checklist}>
            {Array.from({ length: current.count }).map((_, idx) => {
              const isChecked = completedItems.includes(idx);

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (isChecked) {
                      setCompletedItems(completedItems.filter((i) => i !== idx));
                    } else {
                      setCompletedItems([...completedItems, idx]);
                    }
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}
                  accessibilityLabel={`Item ${idx + 1} de ${current.count}`}
                  style={[
                    styles.checklistItem,
                    {
                      backgroundColor: isChecked
                        ? colors.highlight
                        : isDark
                          ? colors.surfaceSecondary
                          : '#FFFFFF',
                      borderColor: isChecked ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <CheckCircle2
                    size={20}
                    color={isChecked ? colors.primary : colors.borderStrong}
                  />
                  <Text
                    style={[
                      styles.checkItemLabel,
                      {
                        color: isChecked ? colors.primaryDark : colors.text,
                        fontWeight: isChecked ? '700' : '500',
                      },
                    ]}
                  >
                    Identifiquei o {idx + 1}º item
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Ações de Avanço */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={handleReset}
              style={[styles.resetBtn, { backgroundColor: colors.surfaceSecondary }]}
              accessibilityRole="button"
              accessibilityLabel="Reiniciar exercício"
            >
              <RotateCcw size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <AppButton
                title={
                  currentStepIndex === STEPS.length - 1
                    ? 'Finalizar Ancoragem'
                    : 'Próximo Sentido'
                }
                rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
                onPress={handleNextStep}
                size="lg"
              />
            </View>
          </View>
        </Card>
      ) : (
        /* Conclusão Acolhedora */
        <Card variant="bordered" style={styles.finishedCard}>
          <View style={[styles.finishedIconCircle, { backgroundColor: colors.highlight }]}>
            <Sparkles size={40} color={colors.primary} />
          </View>

          <Text style={[styles.finishedTitle, { color: colors.text }]}>
            Exercício Concluído!
          </Text>
          <Text style={[styles.finishedBody, { color: colors.textMuted }]}>
            Parabéns por reservar este momento para se reconectar com o aqui e o agora.
            Observe como seu corpo e pensamentos estão se assentando.
          </Text>

          <AppButton
            title="Voltar às Práticas"
            onPress={() => router.replace('/(tabs)/practices')}
            size="lg"
            style={{ width: '100%', marginTop: 12 }}
          />

          <TouchableOpacity
            onPress={handleReset}
            style={{ marginTop: 12, paddingVertical: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Fazer o exercício novamente"
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
              Fazer novamente
            </Text>
          </TouchableOpacity>
        </Card>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  progressWrap: {
    marginBottom: 16,
  },
  stepCard: {
    padding: 24,
    gap: 14,
  },
  stepIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 6,
  },
  stepEmoji: {
    fontSize: 28,
  },
  stepInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stepNumberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  senseTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  examplesBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  examplesText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  checklist: {
    gap: 8,
    marginVertical: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  checkItemLabel: {
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
