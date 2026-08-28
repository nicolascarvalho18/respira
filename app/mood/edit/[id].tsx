import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Check,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  Trash2,
} from 'lucide-react-native';
import { AppShell } from '../../../src/components/layout/AppShell';
import { PageHeader } from '../../../src/components/ui/PageHeader';
import { Card } from '../../../src/components/ui/Card';
import { AppButton } from '../../../src/components/ui/AppButton';
import { AppTextarea } from '../../../src/components/ui/AppTextarea';
import { Chip } from '../../../src/components/ui/Chip';
import { AnxietySlider } from '../../../src/components/mood/AnxietySlider';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { useToast } from '../../../src/components/ui/Toast';
import { useMoodStore } from '../../../src/store/moodStore';
import { useTheme } from '../../../src/hooks/useTheme';
import { AVAILABLE_EMOTIONS, AVAILABLE_ACTIVITIES } from '../../../src/mocks/moods.mock';
import { MoodRecord, MoodValue } from '../../../src/types';
import { formatDateTime } from '../../../src/utils/date';

export default function EditMoodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { records, updateRecord, deleteRecord } = useMoodStore();
  const { showToast } = useToast();

  const [record, setRecord] = useState<MoodRecord | null>(null);
  const [mood, setMood] = useState<MoodValue>(4);
  const [anxietyLevel, setAnxietyLevel] = useState<number>(3);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id && records.length > 0) {
      const found = records.find((r) => r.id === id);
      if (found) {
        setRecord(found);
        setMood(found.mood);
        setAnxietyLevel(found.anxietyLevel);
        setSelectedEmotions(found.emotions || []);
        setSelectedActivities(found.activities || []);
        setNotes(found.notes || '');
      }
    }
  }, [id, records]);

  if (!record) {
    return (
      <AppShell>
        <PageHeader showBack title="Editar Registro" />
        <Card variant="bordered" style={{ padding: 24, alignItems: 'center' }}>
          <Text style={{ color: colors.textMuted }}>Registro não encontrado.</Text>
        </Card>
      </AppShell>
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
    try {
      setIsSaving(true);
      await updateRecord(record.id, {
        mood,
        anxietyLevel,
        emotions: selectedEmotions,
        activities: selectedActivities,
        notes: notes.trim() || undefined,
      });
      showToast({ message: 'Alterações salvas', type: 'success' });
      router.back();
    } catch {
      showToast({ message: 'Erro ao atualizar check-in.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteRecord(record.id);
      showToast({ message: 'Registro excluído.', type: 'success' });
      router.back();
    } catch {
      showToast({ message: 'Erro ao excluir.', type: 'error' });
    } finally {
      setIsDeleting(false);
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
        title="Editar Check-in"
        subtitle={formatDateTime(record.createdAt)}
      />

      <View style={styles.formContainer}>
        {/* 1. Humor */}
        <Card variant="bordered" style={styles.sectionCard}>
          <Text style={[styles.blockTitle, { color: colors.text }]}>Estado Geral</Text>
          <View style={styles.moodSelectorRow}>
            {moodOptions.map((opt) => {
              const isSelected = mood === opt.value;
              const Icon = opt.icon;

              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setMood(opt.value)}
                  accessibilityRole="radio"
                  accessibilityLabel={`Humor ${opt.value}: ${opt.label}`}
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
                  <Icon size={22} color={isSelected ? '#FFFFFF' : opt.color} />
                  <Text
                    style={[
                      styles.moodOptionText,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* 2. Ansiedade */}
        <Card variant="bordered" style={styles.sectionCard}>
          <Text style={[styles.blockTitle, { color: colors.text }]}>Nível de Ansiedade (0 a 10)</Text>
          <AnxietySlider value={anxietyLevel} onChange={setAnxietyLevel} />
        </Card>

        {/* 3. Emoções */}
        <Card variant="bordered" style={styles.sectionCard}>
          <Text style={[styles.blockTitle, { color: colors.text }]}>Sentimentos</Text>
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

        {/* 4. Atividades */}
        <Card variant="bordered" style={styles.sectionCard}>
          <Text style={[styles.blockTitle, { color: colors.text }]}>Contexto e Atividades</Text>
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

        {/* 5. Observações */}
        <Card variant="bordered" style={styles.sectionCard}>
          <Text style={[styles.blockTitle, { color: colors.text }]}>Anotações</Text>
          <AppTextarea
            value={notes}
            onChangeText={setNotes}
            maxLength={500}
            minHeight={90}
          />
        </Card>

        {/* Ações */}
        <View style={styles.actionsRow}>
          <View style={{ flex: 1 }}>
            <AppButton
              title="Salvar Alterações"
              leftIcon={<Check size={18} color="#FFFFFF" />}
              onPress={handleSave}
              isLoading={isSaving}
              size="lg"
            />
          </View>

          <AppButton
            title="Excluir"
            variant="danger"
            leftIcon={<Trash2 size={18} color="#FFFFFF" />}
            onPress={() => setShowDeleteModal(true)}
            size="lg"
          />
        </View>
      </View>

      <ConfirmDialog
        visible={showDeleteModal}
        title="Excluir check-in?"
        message="Esta ação é permanente e removerá o registro do seu diário."
        confirmTitle="Excluir"
        cancelTitle="Cancelar"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    gap: 16,
    paddingBottom: 24,
  },
  sectionCard: {
    gap: 12,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  moodSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodOptionItem: {
    flex: 1,
    minWidth: 85,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
  },
  moodOptionText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
});
