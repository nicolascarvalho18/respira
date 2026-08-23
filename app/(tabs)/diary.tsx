import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  Heart,
  Smile,
  Activity,
  ChevronDown,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { AppButton } from '../../src/components/ui/AppButton';
import { Chip } from '../../src/components/ui/Chip';
import { AccessibleChart } from '../../src/components/mood/AccessibleChart';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useToast } from '../../src/components/ui/Toast';
import { useMoodStore } from '../../src/store/moodStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { MoodRecord } from '../../src/types';
import { formatDateTime } from '../../src/utils/date';
import { calculateMoodStats } from '../../src/utils/stats';

export default function DiaryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();
  const { showToast } = useToast();

  const { records, deleteRecord } = useMoodStore();
  const [selectedFilterDays, setSelectedFilterDays] = useState<7 | 30 | 90>(7);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  const stats = calculateMoodStats(records);

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    try {
      setIsDeleting(true);
      await deleteRecord(recordToDelete);
      showToast({ message: 'Registro removido com sucesso.', type: 'success' });
      setRecordToDelete(null);
    } catch {
      showToast({ message: 'Erro ao remover registro.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getMoodLabel = (score: number) => {
    switch (score) {
      case 5:
        return 'Muito bem';
      case 4:
        return 'Bem';
      case 3:
        return 'Neutro';
      case 2:
        return 'Difícil';
      default:
        return 'Muito difícil';
    }
  };

  const visibleRecords = records.slice(0, visibleCount);

  // Painel lateral de métricas para Desktop
  const renderDesktopMetricsSidebar = () => (
    <View style={styles.metricsSidebar}>
      <Text style={[styles.sidebarHeading, { color: colors.text }]}>Painel de Evolução</Text>

      {/* Card Média de Humor */}
      <Card variant="bordered" padding="sm" style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Smile size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.metricTitle, { color: colors.text }]}>Média de Humor</Text>
        </View>
        <Text style={{ fontSize: 26, fontWeight: '800', color: colors.primary }}>
          {stats.averageMood.toFixed(1)}{' '}
          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textMuted }}>de 5.0</Text>
        </Text>
      </Card>

      {/* Card Média de Ansiedade */}
      <Card variant="bordered" padding="sm" style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Activity size={18} color={colors.warning} style={{ marginRight: 6 }} />
          <Text style={[styles.metricTitle, { color: colors.text }]}>Média de Ansiedade</Text>
        </View>
        <Text style={{ fontSize: 26, fontWeight: '800', color: colors.warning }}>
          {stats.averageAnxiety.toFixed(1)}{' '}
          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textMuted }}>de 10.0</Text>
        </Text>
      </Card>

      {/* Emoções Mais Frequentes */}
      <Card variant="bordered" padding="sm" style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Heart size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.metricTitle, { color: colors.text }]}>Emoções Recorrentes</Text>
        </View>
        <View style={styles.chipsWrap}>
          {stats.topEmotions.map((emo, idx) => (
            <Badge key={idx} label={emo.emotion} variant="primary" size="sm" style={{ marginRight: 4, marginBottom: 4 }} />
          ))}
        </View>
      </Card>

      {/* Botão Novo Registro */}
      <AppButton
        title="Novo Registro"
        leftIcon={<Plus size={18} color="#FFFFFF" />}
        onPress={() => router.push('/mood/new')}
        size="md"
        style={{ marginTop: 8 }}
      />
    </View>
  );

  return (
    <AppShell rightPanel={renderDesktopMetricsSidebar()}>
      {/* Cabeçalho da Página */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Diário de Humor</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Acompanhe a oscilação das suas emoções e níveis de bem-estar.
          </Text>
        </View>

        {!isDesktop && (
          <AppButton
            title="Novo Registro"
            leftIcon={<Plus size={18} color="#FFFFFF" />}
            onPress={() => router.push('/mood/new')}
            size="sm"
          />
        )}
      </View>

      {/* Seção do Gráfico com Filtros */}
      <Card variant="bordered" style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TrendingUp size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.chartTitle, { color: colors.text }]}>Evolução Recente</Text>
          </View>

          <View style={styles.filterPills}>
            <Chip
              label="7 dias"
              size="sm"
              selected={selectedFilterDays === 7}
              onPress={() => setSelectedFilterDays(7)}
            />
            <Chip
              label="30 dias"
              size="sm"
              selected={selectedFilterDays === 30}
              onPress={() => setSelectedFilterDays(30)}
            />
            <Chip
              label="90 dias"
              size="sm"
              selected={selectedFilterDays === 90}
              onPress={() => setSelectedFilterDays(90)}
            />
          </View>
        </View>

        {/* Gráfico Acessível com Tooltip */}
        <AccessibleChart records={records} days={selectedFilterDays} />
      </Card>

      {/* Lista de Registros Históricos */}
      <View style={styles.historySectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Histórico de Registros ({records.length})
        </Text>
      </View>

      {visibleRecords.length === 0 ? (
        <Card variant="bordered" style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Nenhum check-in registrado ainda
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Comece registrando como você está se sentindo hoje para construir seu histórico.
          </Text>
          <AppButton
            title="Fazer Primeiro Registro"
            leftIcon={<Plus size={18} color="#FFFFFF" />}
            onPress={() => router.push('/mood/new')}
            size="md"
            style={{ marginTop: 14 }}
          />
        </Card>
      ) : (
        <View style={styles.recordsList}>
          {visibleRecords.map((item: MoodRecord) => (
            <Card key={item.id} variant="bordered" style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View>
                  <Text style={[styles.recordDate, { color: colors.text }]}>
                    {formatDateTime(item.createdAt)}
                  </Text>
                  <Text style={[styles.recordMoodSummary, { color: colors.primary }]}>
                    Humor: {getMoodLabel(item.mood)} ({item.mood}/5)
                  </Text>
                </View>

                <Badge
                  label={`Ansiedade: ${item.anxietyLevel}/10`}
                  variant={item.anxietyLevel >= 7 ? 'warning' : 'primary'}
                  size="sm"
                />
              </View>

              {/* Emoções */}
              {item.emotions && item.emotions.length > 0 && (
                <View style={styles.chipsRow}>
                  {item.emotions.map((emo, idx) => (
                    <Badge
                      key={idx}
                      label={emo}
                      variant="neutral"
                      size="sm"
                      style={{ marginRight: 4, marginBottom: 4 }}
                    />
                  ))}
                </View>
              )}

              {/* Observações Pessoais */}
              {item.notes && (
                <View
                  style={[
                    styles.notesBox,
                    {
                      backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.notesText, { color: colors.text }]}>{item.notes}</Text>
                </View>
              )}

              {/* Ações de Edição e Exclusão */}
              <View style={styles.recordActionsRow}>
                <TouchableOpacity
                  onPress={() => router.push(`/mood/edit/${item.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel="Editar registro"
                  style={[styles.recordActionBtn, { backgroundColor: colors.surfaceSecondary }]}
                >
                  <Edit2 size={15} color={colors.primary} />
                  <Text style={[styles.recordActionText, { color: colors.primary }]}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setRecordToDelete(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Excluir registro"
                  style={[styles.recordActionBtn, { backgroundColor: isDark ? '#3D1C1C' : '#FDF0F0' }]}
                >
                  <Trash2 size={15} color={colors.error} />
                  <Text style={[styles.recordActionText, { color: colors.error }]}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}

          {/* Botão de Carregar Mais Registros */}
          {records.length > visibleCount && (
            <TouchableOpacity
              onPress={() => setVisibleCount((prev) => prev + 5)}
              style={[styles.loadMoreBtn, { borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Carregar mais registros anteriores"
            >
              <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                Carregar registros anteriores
              </Text>
              <ChevronDown size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Diálogo de Confirmação de Exclusão */}
      <ConfirmDialog
        visible={!!recordToDelete}
        title="Excluir este registro?"
        message="Tem certeza que deseja apagar este check-in? Esta ação não pode ser desfeita."
        confirmTitle="Excluir Registro"
        cancelTitle="Cancelar"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setRecordToDelete(null)}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  pageSubtitle: {
    fontSize: 14,
    marginTop: 2,
    lineHeight: 20,
  },
  chartCard: {
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  filterPills: {
    flexDirection: 'row',
    gap: 4,
  },
  historySectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  recordsList: {
    gap: 14,
  },
  recordCard: {
    gap: 10,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  recordDate: {
    fontSize: 13,
    fontWeight: '600',
  },
  recordMoodSummary: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  notesBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
  },
  recordActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  recordActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  recordActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginVertical: 12,
    gap: 6,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  metricsSidebar: {
    gap: 6,
  },
  sidebarHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
