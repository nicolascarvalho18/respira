import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Sparkles, Wind, Heart } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { MoodSelector } from '../../src/components/mood/MoodSelector';
import { AnxietySlider } from '../../src/components/mood/AnxietySlider';
import { EmotionChip } from '../../src/components/mood/EmotionChip';
import { AppInput } from '../../src/components/ui/AppInput';
import { AppButton } from '../../src/components/ui/AppButton';
import { useMoodStore } from '../../src/store/moodStore';
import { useTheme } from '../../src/hooks/useTheme';
import { AVAILABLE_EMOTIONS, AVAILABLE_ACTIVITIES } from '../../src/mocks/moods.mock';
import { MoodValue } from '../../src/types';
import { formatDateTime } from '../../src/utils/date';

export default function NewMoodScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { addRecord } = useMoodStore();

  const [mood, setMood] = useState<MoodValue>(4);
  const [anxietyLevel, setAnxietyLevel] = useState<number>(3);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(['Calmo']);
  const [selectedActivities, setSelectedActivities] = useState<string[]>(['Descanso']);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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
      setIsSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader
        showBack
        title={isSaved ? 'Registro Salvo' : 'Como você está?'}
        subtitle={formatDateTime(new Date().toISOString())}
      />

      {!isSaved ? (
        <View style={styles.formContainer}>
          {/* Seletor de Humor 1-5 */}
          <MoodSelector value={mood} onChange={setMood} />

          {/* Slider de Ansiedade 0-10 */}
          <AnxietySlider value={anxietyLevel} onChange={setAnxietyLevel} />

          {/* Emoções */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              O que melhor descreve seus sentimentos?
            </Text>
            <View style={styles.chipsWrap}>
              {AVAILABLE_EMOTIONS.map((emo) => (
                <EmotionChip
                  key={emo}
                  label={emo}
                  selected={selectedEmotions.includes(emo)}
                  onPress={() => toggleEmotion(emo)}
                />
              ))}
            </View>
          </View>

          {/* Atividades Relacionadas */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              O que você estava fazendo?
            </Text>
            <View style={styles.chipsWrap}>
              {AVAILABLE_ACTIVITIES.map((act) => (
                <EmotionChip
                  key={act}
                  label={act}
                  selected={selectedActivities.includes(act)}
                  onPress={() => toggleActivity(act)}
                />
              ))}
            </View>
          </View>

          {/* Anotações Pessoais Opcionais */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Observações ou reflexões (opcional)
            </Text>
            <AppInput
              placeholder="Escreva livremente sobre o que está vivenciando agora..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              inputStyle={{ minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>

          <AppButton
            title="Salvar Registro"
            leftIcon={<Check size={18} color="#FFFFFF" />}
            onPress={handleSave}
            isLoading={isSaving}
            size="lg"
            style={{ marginTop: 12 }}
          />
        </View>
      ) : (
        /* Confirmação Acolhedora Pós-Salvar (Sem diagnóstico, sugerindo prática simples) */
        <View style={styles.savedContainer}>
          <View style={[styles.savedIconCircle, { backgroundColor: colors.highlight }]}>
            <Heart size={44} color={colors.primary} />
          </View>

          <Text style={[styles.savedTitle, { color: colors.text }]}>
            Registro salvo com sucesso!
          </Text>
          <Text style={[styles.savedDesc, { color: colors.textMuted }]}>
            Reconhecer suas emoções é um passo valioso para o seu bem-estar.
          </Text>

          {/* Sugestão de Prática Baseada no Registro */}
          <View
            style={[
              styles.suggestionCard,
              {
                backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Sparkles size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.suggestionHeader, { color: colors.primary }]}>
                Sugestão de Cuidado para Agora
              </Text>
            </View>

            <Text style={[styles.suggestionTitle, { color: colors.text }]}>
              {anxietyLevel >= 6
                ? 'Respiração 4-7-8 para alívio da tensão'
                : 'Pausa Consciente de 2 Minutos'}
            </Text>
            <Text style={[styles.suggestionBody, { color: colors.textMuted }]}>
              {anxietyLevel >= 6
                ? 'Como seu nível de ansiedade está mais elevado, 3 minutos de respiração compassada ajudam o sistema nervoso a reencontrar a calma.'
                : 'Uma breve pausa de presença para integrar o seu momento e continuar o dia com clareza.'}
            </Text>

            <TouchableOpacity
              onPress={() => router.replace('/practices/breathing')}
              activeOpacity={0.8}
              style={[styles.startPracticeBtn, { backgroundColor: colors.primary }]}
            >
              <Wind size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.startPracticeText}>Fazer Prática Agora</Text>
            </TouchableOpacity>
          </View>

          <AppButton
            title="Voltar para o Início"
            variant="outline"
            size="lg"
            onPress={() => router.replace('/(tabs)')}
            style={{ marginTop: 16 }}
          />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    paddingVertical: 12,
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  savedContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 8,
  },
  savedIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  savedTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  savedDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  suggestionCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    width: '100%',
    marginBottom: 12,
  },
  suggestionHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  suggestionBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  startPracticeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  startPracticeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
