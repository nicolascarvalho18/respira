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
  Smartphone,
  PersonStanding,
  Compass,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { AnxietySlider } from '../../src/components/mood/AnxietySlider';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useToast } from '../../src/components/ui/Toast';
import { useMoodStore } from '../../src/store/moodStore';
import { useAuth } from '../../src/hooks/useAuth';
import { authService } from '../../src/services/auth/authService';
import { supabase, isSupabaseConfigured } from '../../src/services/supabase/client';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { AVAILABLE_ACTIVITIES } from '../../src/mocks/moods.mock';
import { MoodValue, PlannedExercise } from '../../src/types';
import { storage } from '../../src/services/storage/asyncStorage';

const DRAFT_STORAGE_KEY = 'respira_mood_draft';

// Tokens de contraste dedicados ao formulário de "Momento Atual" (fundo branco / claro com WCAG AA)
const FORM_THEME = {
  title: '#172321', // Títulos principais (WCAG AA > 11:1)
  question: '#243431', // Perguntas e subtítulos (WCAG AA > 9:1)
  subtitle: '#566460', // Descrições e textos secundários (WCAG AA > 5.5:1)
  labelMuted: '#5F6D69', // Labels auxiliares: "Opcional", "Tranquilo", "Intenso", "0", "10", "• 4 min", "Você poderá escolher mais de uma.", "X/500"
  primaryGreen: '#247B74', // Progresso, links, selecionados e botões
  white: '#FFFFFF',
  border: '#D8DEDB',
  borderSelected: '#247B74',
  cardBg: '#FFFFFF',
  cardBgSelected: '#EDF7F5',
  anxietyWarm: '#D87556',
};

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
];

const ALL_PRACTICES = [...INITIAL_PRACTICES, ...EXTRA_PRACTICES];

const EMOTION_ITEMS = [
  { label: 'Calmo(a)', icon: Smile },
  { label: 'Ansioso(a)', icon: AlertCircle },
  { label: 'Cansado(a)', icon: Frown },
  { label: 'Feliz', icon: Smile },
  { label: 'Triste', icon: Frown },
  { label: 'Irritado(a)', icon: AlertCircle },
  { label: 'Grato(a)', icon: Smile },
  { label: 'Estressado(a)', icon: AlertCircle },
];

export default function NewMoodScreen() {
  const router = useRouter();
  const { isDesktop } = useBreakpoint();
  const { addRecord } = useMoodStore();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [mood, setMood] = useState<MoodValue | null>(4);
  const [anxietyLevel, setAnxietyLevel] = useState<number>(3);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedPracticeId, setSelectedPracticeId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'morning' | 'afternoon' | 'night'>('afternoon');
  const [notes, setNotes] = useState('');

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [isAllPracticesModalOpen, setIsAllPracticesModalOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges =
    mood !== 4 ||
    anxietyLevel !== 3 ||
    selectedEmotions.length > 0 ||
    selectedActivities.length > 0 ||
    selectedPracticeId !== null ||
    notes.trim().length > 0;

  useEffect(() => {
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

      await addRecord({
        userId: activeUserId,
        mood: chosenMood,
        anxietyLevel: chosenAnxiety,
        emotions: selectedEmotions,
        activities: selectedActivities,
        plannedExercises,
        notes: notes.trim() || undefined,
      });

      await useMoodStore.getState().fetchRecords(activeUserId);
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
        {/* Cabeçalho */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={handleHeaderBack}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={styles.headerBackBtn}
            >
              <ArrowLeft size={20} color={FORM_THEME.title} strokeWidth={1.75} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: FORM_THEME.title }]}>
              Registrar momento
            </Text>

            <Text style={[styles.headerStepIndicator, { color: FORM_THEME.primaryGreen }]}>
              {currentStep} de 3
            </Text>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: progressPercent }]} />
          </View>
        </View>

        {/* Conteúdo dos Passos */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ========================================================================= */}
          {/* ETAPA 1 DE 3 */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <View style={styles.stepBlock}>
              <Text
                accessibilityRole="header"
                aria-level={1}
                style={[styles.stepTitle, { color: FORM_THEME.title }]}
              >
                Como você está agora?
              </Text>
              <Text style={[styles.stepSubtitle, { color: FORM_THEME.subtitle }]}>
                Escolha as opções que mais combinam com este momento.
              </Text>

              <View style={styles.questionSection}>
                <Text style={[styles.questionLabel, { color: FORM_THEME.question }]}>
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
                          isSelected && styles.moodCardSelected,
                          !isSelected && styles.moodCardUnselected,
                        ]}
                      >
                        <View style={styles.moodIconWrap}>
                          <Icon
                            size={24}
                            color={
                              isSelected
                                ? FORM_THEME.primaryGreen
                                : opt.value >= 4
                                ? FORM_THEME.primaryGreen
                                : opt.value === 3
                                ? FORM_THEME.subtitle
                                : FORM_THEME.anxietyWarm
                            }
                            strokeWidth={1.75}
                          />
                        </View>
                        <Text
                          style={[
                            styles.moodCardLabel,
                            {
                              color: isSelected ? FORM_THEME.primaryGreen : FORM_THEME.question,
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
                <Text style={[styles.questionLabel, { color: FORM_THEME.question }]}>
                  Qual é o seu nível de ansiedade?
                </Text>

                <AnxietySlider
                  value={anxietyLevel}
                  onChange={setAnxietyLevel}
                />
              </View>
            </View>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 2 DE 3 */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <View style={styles.stepBlock}>
              <Text
                accessibilityRole="header"
                aria-level={1}
                style={[styles.stepTitle, { color: FORM_THEME.title }]}
              >
                Conte um pouco mais
              </Text>
              <Text style={[styles.stepSubtitle, { color: FORM_THEME.subtitle }]}>
                Estas respostas são opcionais e ajudam a dar contexto ao seu registro.
              </Text>

              <View style={styles.questionSection}>
                <Text style={[styles.questionLabel, { color: FORM_THEME.question }]}>
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
                          isSelected && styles.emotionBoxSelected,
                          !isSelected && styles.emotionBoxUnselected,
                        ]}
                      >
                        <Icon
                          size={18}
                          color={isSelected ? FORM_THEME.primaryGreen : FORM_THEME.subtitle}
                          strokeWidth={1.75}
                          style={styles.emotionIcon}
                        />
                        <Text
                          style={[
                            styles.emotionLabel,
                            {
                              color: isSelected ? FORM_THEME.primaryGreen : FORM_THEME.question,
                              fontWeight: isSelected ? '600' : '400',
                            },
                          ]}
                        >
                          {item.label}
                        </Text>

                        {isSelected && (
                          <View style={styles.checkBadge}>
                            <Check size={10} color={FORM_THEME.white} strokeWidth={2.5} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.questionSection}>
                <Text style={[styles.questionLabel, { color: FORM_THEME.question }]}>
                  O que você estava fazendo?
                </Text>

                <TouchableOpacity
                  onPress={() => setIsActivityModalOpen(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Selecione uma atividade"
                  style={styles.activitySelectBox}
                >
                  <Text style={[styles.activitySelectPlaceholder, { color: FORM_THEME.subtitle }]}>
                    Selecione uma atividade
                  </Text>
                  <ChevronDown size={18} color={FORM_THEME.subtitle} strokeWidth={1.75} />
                </TouchableOpacity>

                <Text style={[styles.activityHelperText, { color: FORM_THEME.labelMuted }]}>
                  Você poderá escolher mais de uma.
                </Text>

                {selectedActivities.length > 0 && (
                  <View style={styles.selectedActivitiesRow}>
                    {selectedActivities.map((act) => (
                      <View key={act} style={styles.selectedActivityChip}>
                        <Text style={[styles.selectedActivityChipText, { color: FORM_THEME.primaryGreen }]}>
                          {act}
                        </Text>
                        <TouchableOpacity
                          onPress={() => toggleActivity(act)}
                          accessibilityRole="button"
                          accessibilityLabel={`Remover ${act}`}
                          style={{ padding: 2, marginLeft: 4 }}
                        >
                          <X size={12} color={FORM_THEME.primaryGreen} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 3 DE 3 */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <View style={styles.stepBlock}>
              <Text
                accessibilityRole="header"
                aria-level={1}
                style={[styles.stepTitle, { color: FORM_THEME.title }]}
              >
                Para cuidar de você hoje
              </Text>
              <Text style={[styles.stepSubtitle, { color: FORM_THEME.subtitle }]}>
                Se quiser, escolha uma prática simples para fazer depois.
              </Text>

              <View style={styles.practicesListWrap}>
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
                      style={styles.practiceRow}
                    >
                      <Icon size={20} color={FORM_THEME.primaryGreen} strokeWidth={1.75} style={{ marginRight: 12 }} />

                      <View style={styles.practiceTextCol}>
                        <Text style={[styles.practiceTitleText, { color: FORM_THEME.question }]}>
                          {prat.title}
                          <Text style={[styles.practiceDurationText, { color: FORM_THEME.labelMuted }]}>
                            {' '}• {prat.durationMinutes} min
                          </Text>
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                          !isSelected && styles.radioCircleUnselected,
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
                <Text style={[styles.viewAllPracticesLinkText, { color: FORM_THEME.primaryGreen }]}>
                  Ver todas as práticas
                </Text>
                <ChevronRight size={16} color={FORM_THEME.primaryGreen} strokeWidth={1.75} />
              </TouchableOpacity>

              {selectedPracticeId && (
                <View style={styles.periodSelectorWrap}>
                  <Text style={[styles.periodLabel, { color: FORM_THEME.question }]}>
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
                            isPSelected ? styles.periodPillSelected : styles.periodPillUnselected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.periodPillText,
                              { color: isPSelected ? FORM_THEME.white : FORM_THEME.question },
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
                  <Text style={[styles.questionLabel, { color: FORM_THEME.question }]}>
                    Quer anotar alguma coisa?
                  </Text>
                  <Text style={[styles.optionalTag, { color: FORM_THEME.labelMuted }]}>
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
                  placeholderTextColor="#8F9B97"
                  style={[
                    styles.textareaInput,
                    {
                      backgroundColor: FORM_THEME.cardBg,
                      borderColor: FORM_THEME.border,
                      color: FORM_THEME.question,
                    },
                  ]}
                />

                {notes.length > 0 && (
                  <Text style={[styles.charCounter, { color: FORM_THEME.labelMuted }]}>
                    {notes.length}/500
                  </Text>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Barra Inferior com Botões de Ação */}
        <View style={styles.footerContainer}>
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
                style={styles.secondaryBtn}
              >
                <Text style={[styles.secondaryBtnText, { color: FORM_THEME.primaryGreen }]}>Voltar</Text>
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
                style={styles.secondaryBtn}
              >
                <Text style={[styles.secondaryBtnText, { color: FORM_THEME.primaryGreen }]}>Voltar</Text>
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
                  <ActivityIndicator size="small" color={FORM_THEME.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Salvar registro</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Modal: Selecionar Atividades */}
      <Modal
        visible={isActivityModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsActivityModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: FORM_THEME.title }]}>
                Selecionar atividades
              </Text>
              <TouchableOpacity
                onPress={() => setIsActivityModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar seleção de atividades"
                style={{ padding: 4 }}
              >
                <X size={20} color={FORM_THEME.title} strokeWidth={1.75} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <Search size={16} color={FORM_THEME.subtitle} strokeWidth={1.75} />
              <TextInput
                value={activitySearchQuery}
                onChangeText={setActivitySearchQuery}
                placeholder="Buscar atividade..."
                placeholderTextColor="#8F9B97"
                style={[styles.modalSearchInput, { color: FORM_THEME.question }]}
              />
              {activitySearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setActivitySearchQuery('')}>
                  <X size={14} color={FORM_THEME.subtitle} strokeWidth={2} />
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
                    style={styles.modalOptionRow}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        {
                          color: isSelected ? FORM_THEME.primaryGreen : FORM_THEME.question,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {act}
                    </Text>
                    <View
                      style={[
                        styles.checkboxSquare,
                        isSelected && { backgroundColor: FORM_THEME.primaryGreen, borderColor: FORM_THEME.primaryGreen },
                        !isSelected && { borderColor: FORM_THEME.border },
                      ]}
                    >
                      {isSelected && <Check size={12} color={FORM_THEME.white} strokeWidth={2.5} />}
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

      {/* Modal: Todas as Práticas */}
      <Modal
        visible={isAllPracticesModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAllPracticesModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: FORM_THEME.title }]}>
                Todas as práticas
              </Text>
              <TouchableOpacity
                onPress={() => setIsAllPracticesModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar lista de práticas"
                style={{ padding: 4 }}
              >
                <X size={20} color={FORM_THEME.title} strokeWidth={1.75} />
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
                    style={styles.practiceRow}
                  >
                    <Icon size={20} color={FORM_THEME.primaryGreen} strokeWidth={1.75} style={{ marginRight: 12 }} />
                    <View style={styles.practiceTextCol}>
                      <Text style={[styles.practiceTitleText, { color: FORM_THEME.question }]}>
                        {prat.title}
                        <Text style={[styles.practiceDurationText, { color: FORM_THEME.labelMuted }]}>
                          {' '}• {prat.durationMinutes} min
                        </Text>
                      </Text>
                      <Text
                        style={[styles.practiceDescModal, { color: FORM_THEME.subtitle }]}
                        numberOfLines={1}
                      >
                        {prat.description}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                        !isSelected && styles.radioCircleUnselected,
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
    borderBottomColor: '#E7EBE9',
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
    fontWeight: '600',
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
    backgroundColor: '#EDF7F5',
    borderColor: '#247B74',
    borderWidth: 1.5,
  },
  moodCardUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8DEDB',
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
    backgroundColor: '#EDF7F5',
    borderColor: '#247B74',
    borderWidth: 1.5,
  },
  emotionBoxUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8DEDB',
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
    borderColor: '#D8DEDB',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#EDF7F5',
    borderColor: '#247B74',
  },
  selectedActivityChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  practicesListWrap: {
    borderTopWidth: 1,
    borderTopColor: '#E7EBE9',
    marginBottom: 8,
  },
  practiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EBE9',
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
  radioCircleSelected: {
    borderColor: '#247B74',
    backgroundColor: '#247B74',
  },
  radioCircleUnselected: {
    borderColor: '#D8DEDB',
    backgroundColor: 'transparent',
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
  periodPillSelected: {
    backgroundColor: '#247B74',
    borderColor: '#247B74',
  },
  periodPillUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8DEDB',
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
    maxWidth: 680,
    marginHorizontal: 'auto',
    width: '100%',
    alignSelf: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E7EBE9',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  } as any,
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
    borderColor: '#247B74',
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
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 16 : 0,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderRadius: Platform.OS === 'web' ? 16 : undefined,
    maxWidth: 540,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D8DEDB',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EBE9',
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
    height: 48,
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
