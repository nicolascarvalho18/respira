import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Trash2, Edit3, Filter, Calendar } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { AccessibleChart } from '../../src/components/mood/AccessibleChart';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { AppButton } from '../../src/components/ui/AppButton';
import { useMoodStore } from '../../src/store/moodStore';
import { useTheme } from '../../src/hooks/useTheme';
import { formatDateTime } from '../../src/utils/date';
import { getMoodColor, getMoodEmoji, getMoodLabel, getAnxietyDescription } from '../../src/utils/format';
import { MoodRecord } from '../../src/types';

export default function DiaryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    stats,
    selectedTimeRange,
    setTimeRange,
    getFilteredRecords,
    deleteRecord,
  } = useMoodStore();

  const [recordToDelete, setRecordToDelete] = useState<MoodRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredRecords = getFilteredRecords();

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    try {
      setIsDeleting(true);
      await deleteRecord(recordToDelete.id);
      setRecordToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader
        title="Diário de Humor"
        subtitle="Acompanhe sua evolução com acolhimento"
        rightAction={
          <TouchableOpacity
            onPress={() => router.push('/mood/new')}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Novo registro de humor"
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Filtros de Período */}
      <View style={styles.filterRow}>
        {(['7d', '30d', 'all'] as const).map((range) => {
          const isSelected = selectedTimeRange === range;
          const label =
            range === '7d' ? 'Últimos 7 dias' : range === '30d' ? '30 dias' : 'Todos';

          return (
            <TouchableOpacity
              key={range}
              onPress={() => setTimeRange(range)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : isDark
                      ? colors.surfaceSubtle
                      : '#FFFFFF',
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Filtrar por ${label}`}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isSelected ? '#FFFFFF' : colors.text,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Gráfico Acessível de Evolução */}
      <AccessibleChart stats={stats} />

      {/* Cartões de Médias Rápidas */}
      <View style={styles.statsCardsRow}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.statCardLabel, { color: colors.textMuted }]}>Média de Humor</Text>
          <Text style={[styles.statCardValue, { color: colors.primary }]}>
            {stats.averageMood > 0 ? `${stats.averageMood} / 5` : '-'}
          </Text>
          <Text style={[styles.statCardSub, { color: colors.textMuted }]}>
            {stats.averageMood > 0 ? getMoodLabel(Math.round(stats.averageMood) as any) : 'Sem dados'}
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.statCardLabel, { color: colors.textMuted }]}>Média de Ansiedade</Text>
          <Text style={[styles.statCardValue, { color: colors.warning }]}>
            {stats.averageAnxiety > 0 ? `${stats.averageAnxiety} / 10` : '-'}
          </Text>
          <Text style={[styles.statCardSub, { color: colors.textMuted }]}>
            {stats.averageAnxiety > 0 ? getAnxietyDescription(stats.averageAnxiety) : 'Sem dados'}
          </Text>
        </View>
      </View>

      {/* Lista de Registros */}
      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, { color: colors.text }]}>Histórico de Registros</Text>
        <Text style={[styles.listCount, { color: colors.textMuted }]}>
          {filteredRecords.length} {filteredRecords.length === 1 ? 'registro' : 'registros'}
        </Text>
      </View>

      {filteredRecords.length === 0 ? (
        <EmptyState
          title="Nenhum registro encontrado"
          description="Você ainda não possui anotações neste período. Que tal registrar como está se sentindo agora?"
          actionTitle="Novo Registro"
          onActionPress={() => router.push('/mood/new')}
        />
      ) : (
        filteredRecords.map((record) => {
          const moodColor = getMoodColor(record.mood);

          return (
            <View
              key={record.id}
              style={[
                styles.recordCard,
                {
                  backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
              accessibilityRole="text"
              accessibilityLabel={`Registro de ${formatDateTime(record.createdAt)}: humor ${record.mood}, ansiedade ${record.anxietyLevel}`}
            >
              <View style={styles.recordTop}>
                <View style={styles.recordMoodBadge}>
                  <Text style={{ fontSize: 22 }}>{getMoodEmoji(record.mood)}</Text>
                  <View style={{ marginLeft: 8 }}>
                    <Text style={[styles.recordMoodText, { color: moodColor }]}>
                      {getMoodLabel(record.mood)}
                    </Text>
                    <Text style={[styles.recordDateText, { color: colors.textMuted }]}>
                      {formatDateTime(record.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* Ações: Editar e Excluir */}
                <View style={styles.recordActions}>
                  <TouchableOpacity
                    onPress={() => router.push(`/mood/edit/${record.id}`)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Editar este registro"
                    style={{ marginRight: 12 }}
                  >
                    <Edit3 size={18} color={colors.textMuted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setRecordToDelete(record)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Excluir este registro"
                  >
                    <Trash2 size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Nível de Ansiedade */}
              <View style={styles.anxietyIndicatorRow}>
                <Text style={[styles.anxietyLabel, { color: colors.textMuted }]}>
                  Nível de Ansiedade:
                </Text>
                <View style={[styles.anxietyPill, { backgroundColor: colors.highlight }]}>
                  <Text style={[styles.anxietyPillText, { color: colors.primaryDark }]}>
                    {record.anxietyLevel} / 10 • {getAnxietyDescription(record.anxietyLevel)}
                  </Text>
                </View>
              </View>

              {/* Emoções */}
              {record.emotions && record.emotions.length > 0 && (
                <View style={styles.chipsWrap}>
                  {record.emotions.map((emo, i) => (
                    <View
                      key={i}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isDark ? '#23383B' : '#EAF5F1',
                          borderColor: colors.secondaryLight,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: colors.primary }]}>{emo}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Anotação Pessoal */}
              {record.notes ? (
                <View
                  style={[
                    styles.notesBox,
                    {
                      backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.notesText, { color: colors.text }]}>{record.notes}</Text>
                </View>
              ) : null}
            </View>
          );
        })
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        visible={!!recordToDelete}
        title="Excluir registro?"
        message="Tem certeza de que deseja apagar este registro do seu diário? Esta ação não pode ser desfeita."
        confirmTitle="Excluir"
        cancelTitle="Cancelar"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setRecordToDelete(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
  },
  statsCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 6,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  statCardLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  statCardSub: {
    fontSize: 11,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  listCount: {
    fontSize: 13,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  recordTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recordMoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordMoodText: {
    fontSize: 15,
    fontWeight: '700',
  },
  recordDateText: {
    fontSize: 12,
    marginTop: 1,
  },
  recordActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anxietyIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  anxietyLabel: {
    fontSize: 12,
    marginRight: 6,
  },
  anxietyPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  anxietyPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notesBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
