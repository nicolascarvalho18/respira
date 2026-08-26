import React, { useState, useEffect } from 'react';
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
  Clock,
  Calendar,
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
import { MoodValue, PlannedExercise } from '../../src/types';
import { formatDateTime } from '../../src/utils/date';
import { storage } from '../../src/services/storage/asyncStorage';

const DRAFT_STORAGE_KEY = 'respira_mood_draft';

const DAILY_EXERCISE_OPTIONS = [
  {
    id: 'ex-walk',
    title: 'Caminhada leve',
    category: 'Corpo e movimento',
    durationMinutes: 5,
    description: 'Passos lentos e conscientes com atenção ao contato dos pés com o chão.',
    icon: Footprints,
  },
  {
    id: 'ex-stretch',
    title: 'Alongamento suave',
    category: 'Corpo e movimento',
    durationMinutes: 5,
    description: 'Soltar os ombros, pescoço e coluna para aliviar a tensão muscular.',
    icon: Activity,
  },
  {
    id: 'ex-guided-breath',
    title: 'Respiração guiada 4-7-8',
    category: 'Respiração',
    durationMinutes: 4,
    description: 'Técnica clássica para desacelerar o ritmo cardíaco e relaxar.',
    icon: Wind,
  },
  {
    id: 'ex-muscle',
    title: 'Relaxamento muscular',
    category: 'Relaxamento',
    durationMinutes: 6,
    description: 'Contrair e soltar grupos musculares aliviando a rigidez corporal.',
    icon: Activity,
  },
  {
    id: 'ex-grounding',
    title: 'Atenção plena 5-4-3-2-1',
    category: 'Atenção e foco',
    durationMinutes: 3,
    description: 'Aterramento sensorial com os 5 sentidos para sair da sobrecarga mental.',
    icon: Compass,
  },
  {
    id: 'ex-pause',
    title: 'Pausa sem telas',
    category: 'Pausas rápidas',
    durationMinutes: 5,
    description: 'Descanso visual e mental olhando para o horizonte ou pela janela.',
    icon: Heart,
  },
  {
    id: 'ex-task',
    title: 'Organizar pequena tarefa',
    category: 'Atividades criativas',
    durationMinutes: 8,
    description: 'Arrumar um cantinho ou mesa com atenção focada para clareza.',
    icon: Sparkles,
  },
  {
    id: 'ex-creative',
    title: 'Atividade criativa / Rabiscar',
    category: 'Atividades criativas',
    durationMinutes: 5,
    description: 'Desenhar ou escrever pensamentos livremente sem cobrança estética.',
    icon: Sparkles,
  },
  {
    id: 'ex-focus',
    title: 'Exercício de concentração',
    category: 'Atenção e foco',
    durationMinutes: 3,
    description: 'Contagem regressiva sincronizada com a respiração calma.',
    icon: Sparkles,
  },
  {
    id: 'ex-sounds',
    title: 'Escuta de sons relaxantes',
    category: 'Sons e ambientes',
    durationMinutes: 10,
    description: 'Sons suaves de chuva, mar ou floresta para descansar a mente.',
    icon: Headphones,
  },
];

export default function NewMoodScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { addRecord } = useMoodStore();
  const { showToast } = useToast();

  // Iniciar sem seleção predefinida (QA-012)
  const [mood, setMood] = useState<MoodValue | null>(null);
  const [anxietyLevel, setAnxietyLevel] = useState<number | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedPlannedExIds, setSelectedPlannedExIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Momento Atual — Respira';
    }

    async function loadDraft() {
      const draft = await storage.getItem<{
        mood?: MoodValue;
        anxietyLevel?: number;
        emotions?: string[];
        activities?: string[];
        plannedExIds?: string[];
        notes?: string;
      }>(DRAFT_STORAGE_KEY);

      if (draft) {
        if (draft.mood) setMood(draft.mood);
        if (draft.anxietyLevel !== undefined) setAnxietyLevel(draft.anxietyLevel);
        if (draft.emotions) setSelectedEmotions(draft.emotions);
        if (draft.activities) setSelectedActivities(draft.activities);
        if (draft.plannedExIds) setSelectedPlannedExIds(draft.plannedExIds);
        if (draft.notes) setNotes(draft.notes);
      }
    }
    loadDraft();
  }, []);

  useEffect(() => {
    if (!isSaved && (mood !== null || anxietyLevel !== null || selectedEmotions.length > 0)) {
      storage.setItem(DRAFT_STORAGE_KEY, {
        mood,
        anxietyLevel,
        emotions: selectedEmotions,
        activities: selectedActivities,
        plannedExIds: selectedPlannedExIds,
        notes,
      });
    }
  }, [mood, anxietyLevel, selectedEmotions, selectedActivities, selectedPlannedExIds, notes, isSaved]);

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

  const togglePlannedExercise = (exId: string) => {
    if (selectedPlannedExIds.includes(exId)) {
      setSelectedPlannedExIds(selectedPlannedExIds.filter((id) => id !== exId));
    } else {
      setSelectedPlannedExIds([...selectedPlannedExIds, exId]);
    }
  };

  const isFormValid = mood !== null && anxietyLevel !== null;

  const handleSave = async () => {
    if (!isFormValid || !mood || anxietyLevel === null || isSaving) return;
    try {
      setIsSaving(true);

      const plannedExercises: PlannedExercise[] = selectedPlannedExIds.map((id) => {
        const option = DAILY_EXERCISE_OPTIONS.find((o) => o.id === id)!;
        return {
          id: `${id}-${Date.now()}`,
          title: option.title,
          category: option.category,
          durationMinutes: option.durationMinutes,
          description: option.description,
          status: 'pending',
        };
      });

      await addRecord({
        userId: 'user-demo-1',
        mood,
        anxietyLevel,
        emotions: selectedEmotions,
        activities: selectedActivities,
        plannedExercises: plannedExercises.length > 0 ? plannedExercises : undefined,
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
    { value: 5, label: 'Muito bem', icon: Smile, color: '#2F7F7C' },
    { value: 4, label: 'Bem', icon: Smile, color: '#79B8A4' },
    { value: 3, label: 'Neutro', icon: Meh, color: '#D98968' },
    { value: 2, label: 'Difícil', icon: Frown, color: '#C87A24' },
    { value: 1, label: 'Muito difícil', icon: AlertCircle, color: '#D9534F' },
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
          <Card
            variant="bordered"
            style={[
              styles.sectionCard,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
            ]}
          >
            <Text
              accessibilityRole="header"
              aria-level={3}
              style={[styles.blockTitle, { color: isDark ? colors.text : '#173D3B' }]}
            >
              1. Como você descreve seu estado geral agora? <Text style={{ color: '#D98968' }}>*</Text>
            </Text>
            <View
              style={styles.moodSelectorRow}
              accessibilityRole="radiogroup"
              aria-label="Escala de estado emocional geral de 1 a 5"
            >
              {moodOptions.map((opt) => {
                const isSelected = mood === opt.value;
                const Icon = opt.icon;

                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setMood(opt.value)}
                    accessibilityRole="radio"
                    accessibilityLabel={`Humor ${opt.value} de 5: ${opt.label}`}
                    accessibilityState={{ checked: isSelected, selected: isSelected }}
                    {...(Platform.OS === 'web' ? ({ type: 'button' } as any) : {})}
                    style={[
                      styles.moodOptionItem,
                      isSelected && { backgroundColor: '#2F7F7C', borderColor: '#2F7F7C' },
                      {
                        backgroundColor: isSelected
                          ? '#2F7F7C'
                          : isDark
                          ? colors.surfaceSecondary
                          : '#FFFFFF',
                        borderColor: isSelected ? '#2F7F7C' : isDark ? colors.border : '#DCE5E2',
                      },
                    ]}
                  >
                    <Icon size={26} color={isSelected ? '#FFFFFF' : opt.color} aria-hidden={true} />
                    <Text
                      style={[
                        styles.moodLabel,
                        {
                          color: isSelected ? '#FFFFFF' : isDark ? colors.text : '#173D3B',
                          fontWeight: isSelected ? '800' : '500',
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

          {/* 2. Bloco de Ansiedade (0 a 10) */}
          <Card
            variant="bordered"
            style={[
              styles.sectionCard,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
            ]}
          >
            <Text
              accessibilityRole="header"
              aria-level={3}
              style={[styles.blockTitle, { color: isDark ? colors.text : '#173D3B' }]}
            >
              2. Qual o nível de ansiedade que você sente neste momento? <Text style={{ color: '#D98968' }}>*</Text>
            </Text>
            <AnxietySlider value={anxietyLevel} onChange={setAnxietyLevel} />
          </Card>

          {/* 3. Bloco de Emoções e Sensações */}
          <Card
            variant="bordered"
            style={[
              styles.sectionCard,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
            ]}
          >
            <Text
              accessibilityRole="header"
              aria-level={3}
              style={[styles.blockTitle, { color: isDark ? colors.text : '#173D3B' }]}
            >
              3. O que melhor descreve seus sentimentos agora? (opcional)
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

          {/* 4. Bloco de Atividades do Momento */}
          <Card
            variant="bordered"
            style={[
              styles.sectionCard,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
            ]}
          >
            <Text
              accessibilityRole="header"
              aria-level={3}
              style={[styles.blockTitle, { color: isDark ? colors.text : '#173D3B' }]}
            >
              4. O que você esteve fazendo antes deste momento? (opcional)
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

          {/* 5. Bloco de Exercícios Planejados para o Dia */}
          <Card
            variant="bordered"
            style={[
              styles.sectionCard,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
            ]}
          >
            <View style={styles.exSectionHeader}>
              <Sparkles size={18} color="#2F7F7C" style={{ marginRight: 6 }} aria-hidden={true} />
              <View style={{ flex: 1 }}>
                <Text
                  accessibilityRole="header"
                  aria-level={3}
                  style={[styles.blockTitle, { color: isDark ? colors.text : '#173D3B', marginBottom: 2 }]}
                >
                  5. Exercícios e atividades para o seu dia
                </Text>
                <Text style={[styles.blockSub, { color: isDark ? colors.textMuted : '#667775' }]}>
                  Selecione práticas simples para cuidar de você hoje (opcional):
                </Text>
              </View>
            </View>

            <View style={{ gap: 8, marginTop: 10 }}>
              {DAILY_EXERCISE_OPTIONS.map((ex) => {
                const isSelected = selectedPlannedExIds.includes(ex.id);
                const Icon = ex.icon;

                return (
                  <TouchableOpacity
                    key={ex.id}
                    onPress={() => togglePlannedExercise(ex.id)}
                    activeOpacity={0.8}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={`${ex.title}, ${ex.durationMinutes} minutos, ${ex.description}`}
                    {...(Platform.OS === 'web' ? ({ type: 'button' } as any) : {})}
                    style={[
                      styles.exerciseCardItem,
                      isSelected && {
                        borderColor: '#2F7F7C',
                        backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
                      },
                      {
                        borderColor: isSelected ? '#2F7F7C' : isDark ? colors.border : '#EBF1EF',
                        backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFA',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.exerciseIconCircle,
                        { backgroundColor: isSelected ? '#2F7F7C' : '#D4EAE3' },
                      ]}
                    >
                      <Icon size={16} color={isSelected ? '#FFFFFF' : '#2F7F7C'} aria-hidden={true} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.exerciseItemTitle, { color: isDark ? colors.text : '#173D3B' }]}>
                          {ex.title}
                        </Text>
                        <Text style={[styles.exerciseDurationText, { color: '#2F7F7C' }]}>
                          {ex.durationMinutes} min
                        </Text>
                      </View>
                      <Text
                        style={[styles.exerciseItemDesc, { color: isDark ? colors.textMuted : '#667775' }]}
                        numberOfLines={2}
                      >
                        {ex.description}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.exerciseCheckCircle,
                        isSelected && { backgroundColor: '#2F7F7C', borderColor: '#2F7F7C' },
                      ]}
                    >
                      {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} aria-hidden={true} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* 6. Bloco de Observações Livres */}
          <Card
            variant="bordered"
            style={[
              styles.sectionCard,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
            ]}
          >
            <Text
              accessibilityRole="header"
              aria-level={3}
              style={[styles.blockTitle, { color: isDark ? colors.text : '#173D3B' }]}
            >
              6. Quer anotar algum pensamento ou acontecimento? (opcional)
            </Text>
            <AppTextarea
              value={notes}
              onChangeText={setNotes}
              placeholder="Escreva livremente o que estiver passando pela sua cabeça..."
              minHeight={90}
            />
          </Card>

          {/* Botão Salvar Registro (Habilitado apenas com campos obrigatórios preenchidos) */}
          <AppButton
            title={isFormValid ? 'Salvar Registro' : 'Selecione o humor e a ansiedade para salvar'}
            leftIcon={<Check size={18} color="#FFFFFF" aria-hidden={true} />}
            onPress={handleSave}
            disabled={!isFormValid || isSaving}
            isLoading={isSaving}
            size="lg"
            style={{ marginVertical: 10 }}
          />
        </View>
      ) : (
        /* Tela de Confirmação Acolhedora */
        <View style={styles.successContainer}>
          <Card
            variant="bordered"
            style={[
              styles.successCard,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
            ]}
          >
            <View style={styles.successIconCircle}>
              <Sparkles size={36} color="#FFFFFF" aria-hidden={true} />
            </View>

            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[styles.successTitle, { color: isDark ? colors.text : '#173D3B' }]}
            >
              Check-in registrado com carinho!
            </Text>
            <Text style={[styles.successDesc, { color: isDark ? colors.textMuted : '#667775' }]}>
              Reconhecer suas emoções é um passo fundamental para o seu autocuidado e autoconhecimento.
            </Text>

            {selectedPlannedExIds.length > 0 && (
              <View style={styles.plannedSummaryBox}>
                <Text style={styles.plannedSummaryTitle}>
                  {selectedPlannedExIds.length} {selectedPlannedExIds.length === 1 ? 'atividade planejada' : 'atividades planejadas'} para hoje:
                </Text>
                {selectedPlannedExIds.map((id) => {
                  const item = DAILY_EXERCISE_OPTIONS.find((o) => o.id === id);
                  return (
                    <Text key={id} style={[styles.plannedSummaryItem, { color: isDark ? colors.text : '#173D3B' }]}>
                      • {item?.title} ({item?.durationMinutes} min)
                    </Text>
                  );
                })}
              </View>
            )}

            <View style={{ width: '100%', gap: 10, marginTop: 16 }}>
              <AppButton
                title="Ver meu histórico de evolução"
                leftIcon={<Calendar size={18} color="#FFFFFF" aria-hidden={true} />}
                onPress={() => router.push('/diary/history' as any)}
                size="md"
              />
              <AppButton
                title="Ir para a página inicial"
                variant="outline"
                onPress={() => router.replace('/(tabs)')}
                size="md"
              />
            </View>
          </Card>
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    gap: 16,
    paddingBottom: 32,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  blockSub: {
    fontSize: 12,
    marginTop: 1,
  },
  moodSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  moodOptionItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodLabel: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exerciseCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  exerciseIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  exerciseDurationText: {
    fontSize: 11,
    fontWeight: '700',
  },
  exerciseItemDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  exerciseCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#DCE5E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    paddingVertical: 20,
  },
  successCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2F7F7C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  successDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  plannedSummaryBox: {
    width: '100%',
    backgroundColor: '#E7F3EF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  plannedSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F7F7C',
    marginBottom: 6,
  },
  plannedSummaryItem: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
});
