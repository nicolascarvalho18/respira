import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { MoodSelector } from '../../../src/components/mood/MoodSelector';
import { AnxietySlider } from '../../../src/components/mood/AnxietySlider';
import { EmotionChip } from '../../../src/components/mood/EmotionChip';
import { AppInput } from '../../../src/components/ui/AppInput';
import { AppButton } from '../../../src/components/ui/AppButton';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { useMoodStore } from '../../../src/store/moodStore';
import { useTheme } from '../../../src/hooks/useTheme';
import { AVAILABLE_EMOTIONS, AVAILABLE_ACTIVITIES } from '../../../src/mocks/moods.mock';
import { MoodValue } from '../../../src/types';

export default function EditMoodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { records, updateRecord } = useMoodStore();

  const [mood, setMood] = useState<MoodValue>(3);
  const [anxietyLevel, setAnxietyLevel] = useState<number>(3);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (id && records.length > 0) {
      const found = records.find((r) => r.id === id);
      if (found) {
        setMood(found.mood);
        setAnxietyLevel(found.anxietyLevel);
        setSelectedEmotions(found.emotions || []);
        setSelectedActivities(found.activities || []);
        setNotes(found.notes || '');
        setLoaded(true);
      }
    }
  }, [id, records]);

  if (!loaded) {
    return (
      <ScreenContainer>
        <AppHeader showBack title="Editar Registro" />
        <LoadingState message="Carregando dados do registro..." />
      </ScreenContainer>
    );
  }

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
    if (!id) return;
    try {
      setIsSaving(true);
      await updateRecord(id, {
        mood,
        anxietyLevel,
        emotions: selectedEmotions,
        activities: selectedActivities,
        notes: notes.trim() || undefined,
      });
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader showBack title="Editar Registro" />

      <View style={styles.formContainer}>
        <MoodSelector value={mood} onChange={setMood} />
        <AnxietySlider value={anxietyLevel} onChange={setAnxietyLevel} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Emoções Selecionadas</Text>
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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Atividades do Momento</Text>
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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Observações</Text>
          <AppInput
            placeholder="Atualize suas anotações..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            inputStyle={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        </View>

        <AppButton
          title="Salvar Alterações"
          leftIcon={<Check size={18} color="#FFFFFF" />}
          onPress={handleSave}
          isLoading={isSaving}
          size="lg"
          style={{ marginTop: 12 }}
        />
      </View>
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
});
