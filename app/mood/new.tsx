import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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

  // Recupera rascunho salvo anteriormente
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

  // Salva rascunho automaticamente conforme usuário altera os dados
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
        title={isSaved ? 'Registro Salvo' : 'Como você está?'}
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
                    <Icon
                      size={24}
                      color={isSelected ? '#FFFFFF' : opt.color}
                    />
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

          {/* 5. Observações com Contador de Caracteres */}
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
        /* Confirmação e Recomendação Acolhedora */
        <Card variant="bordered" style={styles.savedCard}>
          <View style={[styles.savedIconCircle, { backgroundColor: colors.highlight }]}>
            <Heart size={44} color={colors.primary} />
          </View>

          <Text style={[styles.savedTitle, { color: colors.text }]}>
            Registro salvo com sucesso!
          </Text>
          <Text style={[styles.savedDesc, { color: colors.textMuted }]}>
            Reconhecer suas emoções é um passo essencial para o autocuidado.
          </Text>

          {/* Sugestão de Prática Customizada */}
          <View
            style={[
              styles.careSuggestionCard,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : colors.highlight,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Sparkles size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.careHeading, { color: colors.primary }]}>
                Sugestão para o seu momento
              </Text>
            </View>

            <Text style={[styles.careTitle, { color: colors.text }]}>
              {anxietyLevel >= 6
                ? 'Exercício de Respiração 4-7-8'
                : 'Pausa Consciente de 3 Minutos'}
            </Text>
            <Text style={[styles.careBody, { color: colors.textMuted }]}>
              {anxietyLevel >= 6
                ? 'Seus batimentos e agitação podem se beneficiar de 4 ciclos de respiração compassada agora.'
                : 'Uma breve pausa de presença ajuda a ancorar os sentimentos e seguir o dia com clareza.'}
            </Text>

            <AppButton
              title="Fazer Prática Agora"
              leftIcon={<Wind size={18} color="#FFFFFF" />}
              onPress={() => router.replace('/practices/breathing')}
              size="md"
              style={{ marginTop: 8 }}
            />
          </View>

          <AppButton
            title="Voltar ao Início"
            variant="outline"
            size="md"
            onPress={() => router.replace('/(tabs)')}
            style={{ marginTop: 14 }}
          />
        </Card>
      )}
    </AppShell>
  );
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
  },
  savedCard: {
    alignItems: 'center',
    padding: 28,
    marginVertical: 16,
  },
  savedIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  savedTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  savedDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  careSuggestionCard: {
    width: '100%',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  careHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  careTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  careBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
});
