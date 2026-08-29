import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  Activity,
  Footprints,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Leaf,
  Sun,
  Heart,
  Target,
  User,
  Waves,
  Users,
  Cloud,
  Zap,
  Smartphone,
  PersonStanding,
  Compass,
  CheckCircle2,
  Headphones,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { AnxietySlider } from '../../src/components/mood/AnxietySlider';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useToast } from '../../src/components/ui/Toast';
import { useMoodStore } from '../../src/store/moodStore';
import { useAuth } from '../../src/hooks/useAuth';
import { authService } from '../../src/services/auth/authService';
import { supabase, isSupabaseConfigured } from '../../src/services/supabase/client';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { AVAILABLE_EMOTIONS, AVAILABLE_ACTIVITIES } from '../../src/mocks/moods.mock';
import { MoodValue, PlannedExercise } from '../../src/types';
import { storage } from '../../src/services/storage/asyncStorage';

const DRAFT_STORAGE_KEY = 'respira_mood_draft';

const INITIAL_PRACTICES = [
  {
    id: 'ex-breathing',
    title: 'Respiração 4–7–8',
    category: 'Respiração',
    durationMinutes: 4,
    description: 'Ciclo respiratório suave para acalmar o sistema nervoso.',
    icon: Activity,
  },
  {
    id: 'ex-stretch',
    title: 'Alongamento suave',
    category: 'Corpo e movimento',
    durationMinutes: 5,
    description: 'Movimentos leves para soltar a tensão acumulada nos ombros.',
    icon: PersonStanding,
  },
  {
    id: 'ex-walk',
    title: 'Caminhada leve',
    category: 'Corpo e movimento',
    durationMinutes: 15,
    description: 'Passos tranquilos para arejar a mente e mudar de ambiente.',
    icon: Footprints,
  },
  {
    id: 'ex-pause',
    title: 'Pausa sem telas',
    category: 'Pausas rápidas',
    durationMinutes: 5,
    description: 'Descanso visual e mental olhando para o horizonte ou pela janela.',
    icon: Smartphone,
  },
];

const EXTRA_PRACTICES = [
  {
    id: 'ex-grounding',
    title: 'Atenção plena 5–4–3–2–1',
    category: 'Atenção e foco',
    durationMinutes: 3,
    description: 'Aterramento sensorial com os 5 sentidos para sair da sobrecarga mental.',
    icon: Compass,
  },
  {
    id: 'ex-task',
    title: 'Organizar pequena tarefa',
    category: 'Atividades práticas',
    durationMinutes: 8,
    description: 'Arrumar um cantinho ou mesa com atenção focada para clareza.',
    icon: CheckCircle2,
  },
  {
    id: 'ex-creative',
    title: 'Atividade criativa',
    category: 'Atividades criativas',
    durationMinutes: 5,
    description: 'Desenhar ou escrever pensamentos livremente sem cobrança.',
    icon: Leaf,
  },
  {
    id: 'ex-focus',
    title: 'Exercício de concentração',
    category: 'Atenção e foco',
    durationMinutes: 3,
    description: 'Contagem regressiva sincronizada com a respiração calma.',
    icon: Target,
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

const ALL_PRACTICES = [...INITIAL_PRACTICES, ...EXTRA_PRACTICES];

const EMOTION_ITEMS = [
  { label: 'Calmo', icon: Leaf },
  { label: 'Esperançoso', icon: Sun },
  { label: 'Grato', icon: Heart },
  { label: 'Alegre', icon: Smile },
  { label: 'Focado', icon: Target },
  { label: 'Presente', icon: User },
  { label: 'Relaxado', icon: Waves },
  { label: 'Conectado', icon: Users },
  { label: 'Preocupado', icon: Cloud },
  { label: 'Inquieto', icon: Zap },
];

export default function NewMoodScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();
  const { addRecord } = useMoodStore();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [mood, setMood] = useState<MoodValue | null>(4);
  const [anxietyLevel, setAnxietyLevel] = useState<number>(3);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedPracticeId, setSelectedPracticeId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'morning' | 'afternoon' | 'night'>('morning');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [isAllPracticesModalOpen, setIsAllPracticesModalOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const hasChanges = useMemo(() => {
    return (
      mood !== null ||
      anxietyLevel !== 3 ||
      selectedEmotions.length > 0 ||
      selectedActivities.length > 0 ||
      selectedPracticeId !== null ||
      notes.trim().length > 0
    );
  }, [mood, anxietyLevel, selectedEmotions, selectedActivities, selectedPracticeId, notes]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Registrar momento — Respira';
    }

    async function loadDraft() {
      try {
        const draft = await storage.getItem<{
          mood?: MoodValue;
          anxietyLevel?: number;
          emotions?: string[];
          activities?: string[];
          practiceId?: string;
          notes?: string;
          step?: 1 | 2 | 3;
        }>(DRAFT_STORAGE_KEY);

        if (draft) {
          if (draft.mood) setMood(draft.mood);
          if (draft.anxietyLevel !== undefined) setAnxietyLevel(draft.anxietyLevel);
          if (draft.emotions) setSelectedEmotions(draft.emotions);
          if (draft.activities) setSelectedActivities(draft.activities);
          if (draft.practiceId) setSelectedPracticeId(draft.practiceId);
          if (draft.notes) setNotes(draft.notes);
          if (draft.step) setCurrentStep(draft.step);
        }
      } catch {
        // ignore
      }
    }
    loadDraft();
  }, []);

  useEffect(() => {
    if (hasChanges) {
      storage.setItem(DRAFT_STORAGE_KEY, {
        mood,
        anxietyLevel,
        emotions: selectedEmotions,
        activities: selectedActivities,
        practiceId: selectedPracticeId,
        notes,
        step: currentStep,
      });
    }
  }, [mood, anxietyLevel, selectedEmotions, selectedActivities, selectedPracticeId, notes, currentStep, hasChanges]);

  const handleHeaderBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    } else {
      if (hasChanges) {
        setShowExitConfirm(true);
      } else {
        router.back();
      }
    }
  };

  const handleDiscardAndLeave = async () => {
    await storage.removeItem(DRAFT_STORAGE_KEY);
    setShowExitConfirm(false);
    router.back();
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!mood) setMood(4);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const toggleEmotion = (emotion: string) => {
    if (selectedEmotions.includes(emotion)) {
      setSelectedEmotions(selectedEmotions.filter((e) => e !== emotion));
    } else {
      setSelectedEmotions([...selectedEmotions, emotion]);
    }
  };

  const toggleActivity = (act: string) => {
    if (selectedActivities.includes(act)) {
      setSelectedActivities(selectedActivities.filter((a) => a !== act));
    } else {
      setSelectedActivities([...selectedActivities, act]);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);

      // Obter ID do usuário autenticado real
      let activeUserId = user?.id;
      if (!activeUserId) {
        const stored = await authService.getStoredSession();
        activeUserId = stored?.id;
      }
      if (!activeUserId && isSupabaseConfigured) {
        try {
          const { data: sbData } = await supabase.auth.getUser();
          activeUserId = sbData?.user?.id;
        } catch (_e) {
          // Ignorado
        }
      }

      if (!activeUserId) {
        showToast({ message: 'Faça login para registrar seu momento.', type: 'error' });
        setIsSaving(false);
        return;
      }

      const chosenMood: MoodValue = mood ?? 4;
      const chosenAnxiety: number = anxietyLevel ?? 3;

      let plannedExercises: PlannedExercise[] | undefined;
      if (selectedPracticeId) {
        const option = ALL_PRACTICES.find((o) => o.id === selectedPracticeId);
        if (option) {
          const mappedPracticeId =
            option.id === 'ex-breathing'
              ? 'practice-breathing-478'
              : option.id === 'ex-stretch'
              ? 'practice-morning-gentle-stretch'
              : option.id === 'ex-walk'
              ? 'practice-physical-mindful-walk'
              : option.id === 'ex-pause'
              ? 'practice-quick-conscious-pause'
              : option.id === 'ex-grounding'
              ? 'practice-grounding-54321'
              : option.id === 'ex-sounds'
              ? 'practice-soundscape-rain'
              : option.id === 'ex-focus'
              ? 'practice-focus-recovery'
              : 'practice-breathing-478';

          plannedExercises = [
            {
              id: `${option.id}-${Date.now()}`,
              practiceId: mappedPracticeId,
              title: option.title,
              category: option.category,
              durationMinutes: option.durationMinutes,
              description: option.description,
              scheduledPeriod: selectedPeriod,
              status: 'pending',
            },
          ];
        }
      }

      // Persistência real no Supabase e store
      await addRecord({
        userId: activeUserId,
        mood: chosenMood,
        anxietyLevel: chosenAnxiety,
        emotions: selectedEmotions,
        activities: selectedActivities,
        plannedExercises,
        notes: notes.trim() || undefined,
      });

      // Recarrega imediatamente os registros da store para refletir médias e gráfico
      await useMoodStore.getState().fetchRecords(activeUserId);

      // Limpar rascunho após confirmação de sucesso
      await storage.removeItem(DRAFT_STORAGE_KEY);
      showToast({ message: 'Momento registrado', type: 'success' });
      router.replace('/(tabs)/diary');
    } catch (err: any) {
      console.error('[NewMoodScreen Save Error]:', err);
      showToast({ message: 'Não foi possível registrar seu momento. Tente novamente.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const moodOptions: { value: MoodValue; label: string; icon: any }[] = [
    { value: 5, label: 'Muito bem', icon: Smile },
    { value: 4, label: 'Bem', icon: Smile },
    { value: 3, label: 'Neutro', icon: Meh },
    { value: 2, label: 'Difícil', icon: Frown },
    { value: 1, label: 'Muito difícil', icon: AlertCircle },
  ];

  const filteredActivities = useMemo(() => {
    if (!activitySearchQuery.trim()) return AVAILABLE_ACTIVITIES;
    return AVAILABLE_ACTIVITIES.filter((a) =>
      a.toLowerCase().includes(activitySearchQuery.toLowerCase().trim())
    );
  }, [activitySearchQuery]);

  const progressPercent = currentStep === 1 ? '33.3%' : currentStep === 2 ? '66.6%' : '100%';

  return (
    <AppShell scrollable={false}>
      <View style={[styles.screenContainer, isDesktop && styles.screenContainerDesktop]}>
        <View style={[styles.headerContainer, { borderBottomColor: isDark ? colors.border : '#E7EBE9' }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={handleHeaderBack}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={styles.headerBackBtn}
            >
              <ArrowLeft size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: isDark ? colors.text : '#1F2927' }]}>
              Registrar momento
            </Text>

            <Text style={styles.headerStepIndicator}>
              {currentStep} de 3
            </Text>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: progressPercent }]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 1 && (
            <View style={styles.stepBlock}>
              <Text
                accessibilityRole="header"
                aria-level={1}
                style={[styles.stepTitle, { color: isDark ? colors.text : '#1F2927' }]}
              >
                Como você está agora?
              </Text>
              <Text style={[styles.stepSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                Escolha as opções que mais combinam com este momento.
              </Text>

              <View style={styles.questionSection}>
                <Text style={[styles.questionLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                  Como está seu humor?
                </Text>

                <View style={styles.moodOptionsRow} accessibilityRole="radiogroup" aria-label="Como está seu humor?">
                  {moodOptions.map((opt) => {
                    const isSelected = mood === opt.value;
                    const Icon = opt.icon;

                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setMood(opt.value)}
                        activeOpacity={0.8}
                        accessibilityRole="radio"
                        accessibilityLabel={`Humor: ${opt.label}`}
                        accessibilityState={{ checked: isSelected, selected: isSelected }}
                        style={[
                          styles.moodCard,
                          isSelected && [
                            styles.moodCardSelected,
                            {
                              backgroundColor: isDark ? '#1C3833' : '#EDF7F5',
                              borderColor: '#247B74',
                            },
                          ],
                          !isSelected && {
                            backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                            borderColor: isDark ? colors.border : '#D8DEDB',
                          },
                        ]}
                      >
                        <View style={styles.moodIconWrap}>
                          <Icon
                            size={24}
                            color={
                              isSelected
                                ? '#247B74'
                                : opt.value >= 4
                                ? '#247B74'
                                : opt.value === 3
                                ? isDark ? colors.textMuted : '#68736F'
                                : '#D87556'
                            }
                            strokeWidth={1.75}
                          />
                        </View>
                        <Text
                          style={[
                            styles.moodCardLabel,
                            {
                              color: isSelected
                                ? '#247B74'
                                : isDark
                                ? colors.text
                                : '#1F2927',
                              fontWeight: isSelected ? '600' : '400',
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.questionSection}>
                <Text style={[styles.questionLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                  Qual é o seu nível de ansiedade?
                </Text>

                <AnxietySlider
                  value={anxietyLevel}
                  onChange={setAnxietyLevel}
                />
              </View>
            </View>
          )}

          {currentStep === 2 && (
            <View style={styles.stepBlock}>
              <Text
                accessibilityRole="header"
                aria-level={1}
                style={[styles.stepTitle, { color: isDark ? colors.text : '#1F2927' }]}
              >
                Conte um pouco mais
              </Text>
              <Text style={[styles.stepSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                Estas respostas são opcionais e ajudam a dar contexto ao seu registro.
              </Text>

              <View style={styles.questionSection}>
                <Text style={[styles.questionLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                  Como você se sente?
                </Text>

                <View style={styles.emotionsGrid}>
                  {EMOTION_ITEMS.map((item) => {
                    const isSelected = selectedEmotions.includes(item.label);
                    const Icon = item.icon;

                    return (
                      <TouchableOpacity
                        key={item.label}
                        onPress={() => toggleEmotion(item.label)}
                        activeOpacity={0.75}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={`Sentimento: ${item.label}`}
                        style={[
                          styles.emotionBox,
                          isSelected && [
                            styles.emotionBoxSelected,
                            {
                              backgroundColor: isDark ? '#1C3833' : '#EDF7F5',
                              borderColor: '#247B74',
                            },
                          ],
                          !isSelected && {
                            backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                            borderColor: isDark ? colors.border : '#D8DEDB',
                          },
                        ]}
                      >
                        <Icon
                          size={18}
                          color={isSelected ? '#247B74' : isDark ? colors.textMuted : '#68736F'}
                          strokeWidth={1.75}
                          style={styles.emotionIcon}
                        />
                        <Text
                          style={[
                            styles.emotionLabel,
                            {
                              color: isSelected ? '#247B74' : isDark ? colors.text : '#1F2927',
                              fontWeight: isSelected ? '600' : '400',
                            },
                          ]}
                        >
                          {item.label}
                        </Text>

                        {isSelected && (
                          <View style={styles.checkBadge}>
                            <Check size={10} color="#FFFFFF" strokeWidth={2.5} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.questionSection}>
                <Text style={[styles.questionLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                  O que você estava fazendo?
                </Text>

                <TouchableOpacity
                  onPress={() => setIsActivityModalOpen(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Selecione uma atividade"
                  style={[
                    styles.activitySelectBox,
                    {
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                      borderColor: isDark ? colors.border : '#D8DEDB',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.activitySelectPlaceholder,
                      { color: isDark ? colors.textMuted : '#68736F' },
                    ]}
                  >
                    Selecione uma atividade
                  </Text>
                  <ChevronDown size={18} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} />
                </TouchableOpacity>

                <Text style={[styles.activityHelperText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  Você poderá escolher mais de uma.
                </Text>

                {selectedActivities.length > 0 && (
                  <View style={styles.selectedActivitiesRow}>
                    {selectedActivities.map((act) => (
                      <View
                        key={act}
                        style={[
                          styles.selectedActivityChip,
                          {
                            backgroundColor: isDark ? '#1C3833' : '#EDF7F5',
                            borderColor: '#247B74',
                          },
                        ]}
                      >
                        <Text style={[styles.selectedActivityChipText, { color: '#247B74' }]}>
                          {act}
                        </Text>
                        <TouchableOpacity
                          onPress={() => toggleActivity(act)}
                          accessibilityRole="button"
                          accessibilityLabel={`Remover ${act}`}
                          style={{ padding: 2, marginLeft: 4 }}
                        >
                          <X size={12} color="#247B74" strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {currentStep === 3 && (
            <View style={styles.stepBlock}>
              <Text
                accessibilityRole="header"
                aria-level={1}
                style={[styles.stepTitle, { color: isDark ? colors.text : '#1F2927' }]}
              >
                Para cuidar de você hoje
              </Text>
              <Text style={[styles.stepSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                Se quiser, escolha uma prática simples para fazer depois.
              </Text>

              <View style={[styles.practicesListWrap, { borderTopColor: isDark ? colors.border : '#E7EBE9' }]}>
                {INITIAL_PRACTICES.map((prat) => {
                  const isSelected = selectedPracticeId === prat.id;
                  const Icon = prat.icon;

                  return (
                    <TouchableOpacity
                      key={prat.id}
                      onPress={() => setSelectedPracticeId(isSelected ? null : prat.id)}
                      activeOpacity={0.7}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected, selected: isSelected }}
                      accessibilityLabel={`${prat.title}, ${prat.durationMinutes} minutos`}
                      style={[
                        styles.practiceRow,
                        { borderBottomColor: isDark ? colors.border : '#E7EBE9' },
                      ]}
                    >
                      <Icon size={20} color="#247B74" strokeWidth={1.75} style={{ marginRight: 12 }} />

                      <View style={styles.practiceTextCol}>
                        <Text style={[styles.practiceTitleText, { color: isDark ? colors.text : '#1F2927' }]}>
                          {prat.title}
                          <Text style={[styles.practiceDurationText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                            {' '}• {prat.durationMinutes} min
                          </Text>
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && { borderColor: '#247B74', backgroundColor: '#247B74' },
                          !isSelected && { borderColor: isDark ? colors.border : '#D8DEDB' },
                        ]}
                      >
                        {isSelected && <View style={styles.radioInnerDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={() => setIsAllPracticesModalOpen(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Ver todas as práticas"
                style={styles.viewAllPracticesLink}
              >
                <Text style={styles.viewAllPracticesLinkText}>
                  Ver todas as práticas
                </Text>
                <ChevronRight size={16} color="#247B74" strokeWidth={1.75} />
              </TouchableOpacity>

              {selectedPracticeId && (
                <View style={styles.periodSelectorWrap}>
                  <Text style={[styles.periodLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                    Momento planejado para a prática:
                  </Text>
                  <View style={styles.periodPillsRow}>
                    {(['morning', 'afternoon', 'night'] as const).map((p) => {
                      const isPSelected = selectedPeriod === p;
                      const pLabel = p === 'morning' ? 'Manhã' : p === 'afternoon' ? 'Tarde' : 'Noite';
                      return (
                        <TouchableOpacity
                          key={p}
                          onPress={() => setSelectedPeriod(p)}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: isPSelected }}
                          accessibilityLabel={`Período: ${pLabel}`}
                          style={[
                            styles.periodPill,
                            isPSelected
                              ? { backgroundColor: '#247B74', borderColor: '#247B74' }
                              : {
                                  backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                                  borderColor: isDark ? colors.border : '#D8DEDB',
                                },
                          ]}
                        >
                          <Text
                            style={[
                              styles.periodPillText,
                              { color: isPSelected ? '#FFFFFF' : isDark ? colors.text : '#1F2927' },
                            ]}
                          >
                            {pLabel}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={styles.notesSection}>
                <View style={styles.notesLabelRow}>
                  <Text style={[styles.questionLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                    Quer anotar alguma coisa?
                  </Text>
                  <Text style={[styles.optionalTag, { color: isDark ? colors.textMuted : '#68736F' }]}>
                    Opcional
                  </Text>
                </View>

                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  maxLength={500}
                  multiline
                  numberOfLines={4}
                  placeholder="Escreva algo que queira lembrar sobre este momento."
                  placeholderTextColor={isDark ? colors.textMuted : '#8F9B97'}
                  style={[
                    styles.textareaInput,
                    {
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                      borderColor: isDark ? colors.border : '#D8DEDB',
                      color: isDark ? colors.text : '#1F2927',
                    },
                  ]}
                />

                {notes.length > 0 && (
                  <Text style={[styles.charCounter, { color: isDark ? colors.textMuted : '#68736F' }]}>
                    {notes.length}/500
                  </Text>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footerContainer, { borderTopColor: isDark ? colors.border : '#E7EBE9', backgroundColor: isDark ? colors.surface : '#FFFFFF' }]}>
          {currentStep === 1 && (
            <TouchableOpacity
              onPress={handleNextStep}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Continuar"
              style={styles.primaryFullBtn}
            >
              <Text style={styles.primaryBtnText}>Continuar</Text>
            </TouchableOpacity>
          )}

          {currentStep === 2 && (
            <View style={styles.footerTwoBtnsRow}>
              <TouchableOpacity
                onPress={() => setCurrentStep(1)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Voltar para etapa 1"
                style={[styles.secondaryBtn, { borderColor: '#247B74' }]}
              >
                <Text style={[styles.secondaryBtnText, { color: '#247B74' }]}>Voltar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextStep}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Continuar para etapa 3"
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentStep === 3 && (
            <View style={styles.footerTwoBtnsRow}>
              <TouchableOpacity
                onPress={() => setCurrentStep(2)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Voltar para etapa 2"
                style={[styles.secondaryBtn, { borderColor: '#247B74' }]}
              >
                <Text style={[styles.secondaryBtnText, { color: '#247B74' }]}>Voltar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Salvar registro"
                style={[styles.primaryBtn, isSaving && { opacity: 0.7 }]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Salvar registro</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={isActivityModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsActivityModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: isDark ? colors.border : '#D8DEDB',
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                Selecionar atividades
              </Text>
              <TouchableOpacity
                onPress={() => setIsActivityModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar seleção de atividades"
                style={{ padding: 4 }}
              >
                <X size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.modalSearchBox,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#F7F8F5',
                  borderColor: isDark ? colors.border : '#D8DEDB',
                },
              ]}
            >
              <Search size={16} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} />
              <TextInput
                value={activitySearchQuery}
                onChangeText={setActivitySearchQuery}
                placeholder="Buscar atividade..."
                placeholderTextColor={isDark ? colors.textMuted : '#8F9B97'}
                style={[styles.modalSearchInput, { color: isDark ? colors.text : '#1F2927' }]}
              />
              {activitySearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setActivitySearchQuery('')}>
                  <X size={14} color="#68736F" strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {filteredActivities.map((act) => {
                const isSelected = selectedActivities.includes(act);
                return (
                  <TouchableOpacity
                    key={act}
                    onPress={() => toggleActivity(act)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    style={[
                      styles.modalOptionRow,
                      { borderBottomColor: isDark ? colors.border : '#E7EBE9' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        {
                          color: isSelected ? '#247B74' : isDark ? colors.text : '#1F2927',
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {act}
                    </Text>
                    <View
                      style={[
                        styles.checkboxSquare,
                        isSelected && { backgroundColor: '#247B74', borderColor: '#247B74' },
                        !isSelected && { borderColor: isDark ? colors.border : '#D8DEDB' },
                      ]}
                    >
                      {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={2.5} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setIsActivityModalOpen(false)}
              style={styles.modalConfirmBtn}
            >
              <Text style={styles.modalConfirmBtnText}>Concluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isAllPracticesModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAllPracticesModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: isDark ? colors.border : '#D8DEDB',
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                Todas as práticas
              </Text>
              <TouchableOpacity
                onPress={() => setIsAllPracticesModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar lista de práticas"
                style={{ padding: 4 }}
              >
                <X size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {ALL_PRACTICES.map((prat) => {
                const isSelected = selectedPracticeId === prat.id;
                const Icon = prat.icon;

                return (
                  <TouchableOpacity
                    key={prat.id}
                    onPress={() => {
                      setSelectedPracticeId(isSelected ? null : prat.id);
                      setIsAllPracticesModalOpen(false);
                    }}
                    style={[
                      styles.practiceRow,
                      { borderBottomColor: isDark ? colors.border : '#E7EBE9' },
                    ]}
                  >
                    <Icon size={20} color="#247B74" strokeWidth={1.75} style={{ marginRight: 12 }} />
                    <View style={styles.practiceTextCol}>
                      <Text style={[styles.practiceTitleText, { color: isDark ? colors.text : '#1F2927' }]}>
                        {prat.title}
                        <Text style={[styles.practiceDurationText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                          {' '}• {prat.durationMinutes} min
                        </Text>
                      </Text>
                      <Text
                        style={[styles.practiceDescModal, { color: isDark ? colors.textMuted : '#68736F' }]}
                        numberOfLines={1}
                      >
                        {prat.description}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && { borderColor: '#247B74', backgroundColor: '#247B74' },
                        !isSelected && { borderColor: isDark ? colors.border : '#D8DEDB' },
                      ]}
                    >
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={showExitConfirm}
        title="Descartar registro?"
        message="As informações preenchidas até agora serão perdidas."
        confirmTitle="Descartar"
        cancelTitle="Continuar editando"
        isDestructive
        onConfirm={handleDiscardAndLeave}
        onCancel={() => setShowExitConfirm(false)}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F7F8F5',
  },
  screenContainerDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E7EBE9',
    backgroundColor: '#F7F8F5',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
  },
  headerTopRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  headerStepIndicator: {
    fontSize: 14,
    fontWeight: '500',
    color: '#247B74',
    minWidth: 44,
    textAlign: 'right',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#E7EBE9',
    width: '100%',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#247B74',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 110,
  },
  stepBlock: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 26,
  },
  questionSection: {
    marginBottom: 28,
  },
  questionLabel: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  moodOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  moodCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  moodCardSelected: {
    borderWidth: 1.5,
  },
  moodIconWrap: {
    marginBottom: 6,
  },
  moodCardLabel: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 15,
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionBox: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    position: 'relative',
  },
  emotionBoxSelected: {
    borderWidth: 1.5,
  },
  emotionIcon: {
    marginRight: 8,
  },
  emotionLabel: {
    fontSize: 14,
    flex: 1,
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#247B74',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  activitySelectBox: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activitySelectPlaceholder: {
    fontSize: 15,
  },
  activityHelperText: {
    fontSize: 13,
    marginTop: 6,
    paddingLeft: 2,
  },
  selectedActivitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  selectedActivityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  selectedActivityChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  practicesListWrap: {
    borderTopWidth: 1,
    marginBottom: 8,
  },
  practiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  practiceTextCol: {
    flex: 1,
  },
  practiceTitleText: {
    fontSize: 15,
    fontWeight: '500',
  },
  practiceDurationText: {
    fontSize: 14,
    fontWeight: '400',
  },
  practiceDescModal: {
    fontSize: 12,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  viewAllPracticesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    marginBottom: 12,
  },
  viewAllPracticesLinkText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#247B74',
  },
  periodSelectorWrap: {
    marginBottom: 20,
    paddingTop: 4,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  periodPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodPillText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  notesSection: {
    marginTop: 4,
  },
  notesLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionalTag: {
    fontSize: 13,
    fontWeight: '400',
  },
  textareaInput: {
    height: 110,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  primaryFullBtn: {
    backgroundColor: '#247B74',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerTwoBtnsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#247B74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 15,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtn: {
    backgroundColor: '#247B74',
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
