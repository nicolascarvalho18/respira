import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Check,
  Sparkles,
  Wind,
  Heart,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  Compass,
  Headphones,
  Footprints,
  FileText,
  Activity,
  ArrowRight,
  ChevronRight,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { Card } from '../../src/components/ui/Card';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppTextarea } from '../../src/components/ui/AppTextarea';
import { Chip } from '../../src/components/ui/Chip';
import { AnxietySlider } from '../../src/components/mood/AnxietySlider';
import { useToast } from '../../src/components/ui/Toast';
import { useMoodStore } from '../../src/store/moodStore';
import { useTheme } from '../../src/hooks/useTheme';
import { AVAILABLE_EMOTIONS, AVAILABLE_ACTIVITIES } from '../../src/mocks/moods.mock';
import { MoodValue } from '../../src/types';
import { formatDateTime } from '../../src/utils/date';
import { storage } from '../../src/services/storage/asyncStorage';

const DRAFT_STORAGE_KEY = 'respira_mood_draft';

interface PracticeOption {
  id: string;
  title: string;
  desc: string;
  duration: string;
  icon: any;
  route: string;
}

const SUPPORT_PRACTICES: PracticeOption[] = [
  {
    id: 'p-breath-2m',
    title: 'Respiração de 2 minutos',
    desc: 'Ciclos suaves de inspiração e expiração para desacelerar o ritmo.',
    duration: '2 min',
    icon: Wind,
    route: '/practices/breathing',
  },
  {
    id: 'p-breath-478',
    title: 'Respiração 4-7-8',
    desc: 'Técnica compassada de relaxamento e ancoragem do sistema nervoso.',
    duration: '4 min',
    icon: Wind,
    route: '/practices/breathing',
  },
  {
    id: 'p-54321',
    title: 'Técnica 5-4-3-2-1',
    desc: 'Aterramento sensorial com os 5 sentidos para sair da sobrecarga mental.',
    duration: '3 min',
    icon: Compass,
    route: '/practices/grounding',
  },
  {
    id: 'p-pause',
    title: 'Pausa consciente',
    desc: 'Momento de silêncio e presença para observar o corpo sem julgamento.',
    duration: '3 min',
    icon: Heart,
    route: '/practices/relaxation',
  },
  {
    id: 'p-stretch',
    title: 'Alongamento leve',
    desc: 'Movimentos suaves nos ombros, pescoço e coluna para aliviar a tensão.',
    duration: '5 min',
    icon: Activity,
    route: '/practices/relaxation',
  },
  {
    id: 'p-muscle',
    title: 'Relaxamento muscular',
    desc: 'Tensionar e soltar grupos musculares para liberar o estresse acumulado.',
    duration: '6 min',
    icon: Activity,
    route: '/practices/relaxation',
  },
  {
    id: 'p-walk',
    title: 'Caminhada breve',
    desc: 'Passos conscientes com atenção ao contato dos pés com o chão.',
    duration: '5 min',
    icon: Footprints,
    route: '/practices/relaxation',
  },
  {
    id: 'p-soundscape',
    title: 'Ouvir uma paisagem sonora',
    desc: 'Sons suaves de chuva, mar ou floresta para descansar a mente.',
    duration: '10 min',
    icon: Headphones,
    route: '/(tabs)/practices',
  },
];

export default function NewMoodScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { addRecord } = useMoodStore();
  const { showToast } = useToast();

  const [mood, setMood] = useState<MoodValue>(4);
  const [anxietyLevel, setAnxietyLevel] = useState<number>(3);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(['Calmo']);
  const [selectedActivities, setSelectedActivities] = useState<string[]>(['Descanso']);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function loadDraft() {
      const draft = await storage.getItem<{
        mood: MoodValue;
        anxietyLevel: number;
        emotions: string[];
        activities: string[];
        notes: string;
      }>(DRAFT_STORAGE_KEY);

      if (draft) {
        setMood(draft.mood || 4);
        setAnxietyLevel(draft.anxietyLevel ?? 3);
        setSelectedEmotions(draft.emotions || ['Calmo']);
        setSelectedActivities(draft.activities || ['Descanso']);
        setNotes(draft.notes || '');
      }
    }
    loadDraft();
  }, []);

  useEffect(() => {
    if (!isSaved) {
      storage.setItem(DRAFT_STORAGE_KEY, {
        mood,
        anxietyLevel,
        emotions: selectedEmotions,
        activities: selectedActivities,
        notes,
      });
    }
  }, [mood, anxietyLevel, selectedEmotions, selectedActivities, notes, isSaved]);

  const toggleEmotion = (emotion: string) => {
    if (selectedEmotions.includes(emotion)) {
      setSelectedEmotions(selectedEmotions.filter((e) => e !== emotion));
    } else {
      setSelectedEmotions([...selectedEmotions, emotion]);
    }
  };

  const toggleActivity = (activity: string) => {
    if (selectedActivities.includes(activity)) {
      setSelectedActivities(selectedActivities.filter((a) => a !== activity));
    } else {
      setSelectedActivities([...selectedActivities, activity]);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      await addRecord({
        userId: 'user-demo-1',
        mood,
        anxietyLevel,
        emotions: selectedEmotions,
        activities: selectedActivities,
        notes: notes.trim() || undefined,
      });
      await storage.removeItem(DRAFT_STORAGE_KEY);
      setIsSaved(true);
      showToast({ message: 'Registro de humor salvo com sucesso!', type: 'success' });
    } catch {
      showToast({ message: 'Erro ao salvar check-in.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const moodOptions: { value: MoodValue; label: string; icon: any; color: string }[] = [
    { value: 5, label: 'Muito bem', icon: Smile, color: colors.primary },
    { value: 4, label: 'Bem', icon: Smile, color: colors.secondary },
    { value: 3, label: 'Neutro', icon: Meh, color: colors.info },
    { value: 2, label: 'Difícil', icon: Frown, color: colors.warning },
    { value: 1, label: 'Muito difícil', icon: AlertCircle, color: colors.error },
  ];

  return (
    <AppShell>
      <PageHeader
        showBack
        title={isSaved ? 'Registro Concluído' : 'Como você está?'}
        subtitle={formatDateTime(new Date().toISOString())}
      />

      {!isSaved ? (
        <View style={styles.formContainer}>
          {/* 1. Bloco de Humor Geral (1 a 5) */}
          <Card variant="bordered" style={styles.sectionCard}>
            <Text style={[styles.blockTitle, { color: colors.text }]}>
              1. Como você descreve seu estado geral agora?
            </Text>
            <View style={styles.moodSelectorRow}>
              {moodOptions.map((opt) => {
                const isSelected = mood === opt.value;
                const Icon = opt.icon;

                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setMood(opt.value)}
                    accessibilityRole="radio"
                    accessibilityLabel={`Humor ${opt.value} de 5: ${opt.label}`}
                    accessibilityState={{ selected: isSelected }}
                    style={[
                      styles.moodOptionItem,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : isDark
                            ? colors.surfaceSecondary
                            : '#FFFFFF',
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Icon size={24} color={isSelected ? '#FFFFFF' : opt.color} />
                    <Text
                      style={[
                        styles.moodOptionText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* 2. Bloco de Ansiedade (0 a 10 Slider) */}
          <Card variant="bordered" style={styles.sectionCard}>
            <Text style={[styles.blockTitle, { color: colors.text }]}>
              2. Qual o seu nível de ansiedade ou agitação? (0 a 10)
            </Text>
            <AnxietySlider value={anxietyLevel} onChange={setAnxietyLevel} />
          </Card>

          {/* 3. Bloco de Emoções */}
          <Card variant="bordered" style={styles.sectionCard}>
            <Text style={[styles.blockTitle, { color: colors.text }]}>
              3. O que melhor descreve seus sentimentos?
            </Text>
            <View style={styles.chipsWrap}>
              {AVAILABLE_EMOTIONS.map((emo) => (
                <Chip
                  key={emo}
                  label={emo}
                  selected={selectedEmotions.includes(emo)}
                  onPress={() => toggleEmotion(emo)}
                />
              ))}
            </View>
          </Card>

          {/* 4. Bloco de Atividades / Contexto */}
          <Card variant="bordered" style={styles.sectionCard}>
            <Text style={[styles.blockTitle, { color: colors.text }]}>
              4. O que você estava fazendo?
            </Text>
            <View style={styles.chipsWrap}>
              {AVAILABLE_ACTIVITIES.map((act) => (
                <Chip
                  key={act}
                  label={act}
                  selected={selectedActivities.includes(act)}
                  onPress={() => toggleActivity(act)}
                />
              ))}
            </View>
          </Card>

          {/* 5. Observações com Contador */}
          <Card variant="bordered" style={styles.sectionCard}>
            <Text style={[styles.blockTitle, { color: colors.text }]}>
              5. Observações ou reflexões (opcional)
            </Text>
            <AppTextarea
              placeholder="Escreva livremente sobre pensamentos, gatilhos ou o que vivenciou..."
              value={notes}
              onChangeText={setNotes}
              maxLength={500}
              minHeight={90}
            />
          </Card>

          {/* Botão Salvar */}
          <AppButton
            title="Salvar Registro"
            leftIcon={<Check size={18} color="#FFFFFF" />}
            onPress={handleSave}
            isLoading={isSaving}
            size="lg"
            style={{ marginTop: 8, marginBottom: 24 }}
          />
        </View>
      ) : (
        /* Fluxo Acolhedor de Práticas Pós-Registro */
        <View style={{ gap: 16, marginBottom: 32 }}>
          <Card variant="bordered" style={styles.savedCard}>
            <View style={[styles.savedIconCircle, { backgroundColor: colors.highlight }]}>
              <Heart size={36} color={colors.primary} />
            </View>

            <Text style={[styles.savedTitle, { color: colors.text }]}>
              Check-in registrado com sucesso!
            </Text>
            <Text style={[styles.savedDesc, { color: colors.textSecondary }]}>
              Reconhecer seu estado é o primeiro passo para cuidar de si.
            </Text>
          </Card>

          {/* Pergunta de Apoio */}
          <View style={styles.practiceSectionHeader}>
            <Sparkles size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.practiceSectionTitle, { color: colors.text }]}>
              Que tipo de apoio faria sentido agora?
            </Text>
          </View>
          <Text style={[styles.practiceSectionSub, { color: colors.textSecondary }]}>
            Escolha uma prática curta para realizar durante o seu dia. Lembre-se: são ferramentas de autocuidado sem promessa médica.
          </Text>

          {/* Lista de Opções de Práticas */}
          <View style={{ gap: 10 }}>
            {SUPPORTPRACTICES_LIST(colors, isDark).map((practice) => {
              const Icon = practice.icon;

              return (
                <TouchableOpacity
                  key={practice.id}
                  onPress={() => router.replace(practice.route as any)}
                  activeOpacity={0.75}
                  style={[
                    styles.practiceCard,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.practiceIconWrap, { backgroundColor: colors.highlight }]}>
                    <Icon size={20} color={colors.primary} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.practiceName, { color: colors.text }]}>{practice.title}</Text>
                      <Text style={[styles.practiceDur, { color: colors.secondaryDark }]}>{practice.duration}</Text>
                    </View>
                    <Text style={[styles.practiceDescription, { color: colors.textSecondary }]}>
                      {practice.desc}
                    </Text>
                  </View>

                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botão Pular / Continuar sem exercício */}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={[styles.skipBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>
              Prefiro continuar sem exercício por enquanto
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </AppShell>
  );
}

function SUPPORTPRACTICES_LIST(colors: any, isDark: boolean): PracticeOption[] {
  return SUPPORT_PRACTICES;
}

const styles = StyleSheet.create({
  formContainer: {
    gap: 16,
  },
  sectionCard: {
    gap: 12,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  moodSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodOptionItem: {
    flex: 1,
    minWidth: 90,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 6,
  },
  moodOptionText: {
    fontSize: 12,
    textAlign: 'center',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  savedCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 18,
  },
  savedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  savedTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  savedDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
  practiceSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  practiceSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  practiceSectionSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  practiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  practiceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceName: {
    fontSize: 14,
    fontWeight: '700',
  },
  practiceDur: {
    fontSize: 12,
    fontWeight: '600',
  },
  practiceDescription: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  skipBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
