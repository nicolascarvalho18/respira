import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { MoodRecord } from '../../types';
import { formatDate } from '../../utils/date';

export interface AccessibleChartProps {
  records: MoodRecord[];
  days?: 7 | 30 | 90;
  onSelectRecord?: (record: MoodRecord) => void;
}

export const AccessibleChart: React.FC<AccessibleChartProps> = ({
  records,
  onSelectRecord,
}) => {
  const { colors, isDark } = useTheme();
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const sorted = [...records].reverse().slice(-14); // últimas entradas ordenadas cronologicamente
  const activeRecord = sorted.find((r) => r.id === selectedRecordId) || sorted[sorted.length - 1];

  if (sorted.length === 0) {
    return (
      <View style={[styles.emptyChart, { backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC' }]}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Nenhum registro no período para gerar o gráfico.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Detalhe interativo do ponto selecionado no topo */}
      {activeRecord && (
        <View
          style={[
            styles.tooltipBox,
            {
              backgroundColor: isDark ? colors.surfaceSecondary : colors.highlight,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.tooltipDate, { color: colors.text }]}>
              📅 {formatDate(activeRecord.createdAt)}
            </Text>
            <Text style={[styles.tooltipEmotions, { color: colors.textMuted }]} numberOfLines={1}>
              Emoções: {activeRecord.emotions.join(', ') || 'Nenhuma registrada'}
            </Text>
          </View>
          <View style={styles.tooltipMetrics}>
            <View style={[styles.metricPill, { backgroundColor: colors.primary }]}>
              <Text style={styles.metricPillText}>Humor {activeRecord.mood}/5</Text>
            </View>
            <View style={[styles.metricPill, { backgroundColor: colors.warning }]}>
              <Text style={styles.metricPillText}>Ansiedade {activeRecord.anxietyLevel}/10</Text>
            </View>
          </View>
        </View>
      )}

      {/* Gráfico de Barras Duplas (Humor e Ansiedade) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.barsContainer}
      >
        {sorted.map((item) => {
          const isSelected = item.id === activeRecord?.id;
          const moodHeight = (item.mood / 5) * 110;
          const anxietyHeight = (item.anxietyLevel / 10) * 110;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => {
                setSelectedRecordId(item.id);
                if (onSelectRecord) onSelectRecord(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Registro de ${formatDate(item.createdAt)}: Humor ${item.mood} de 5, Ansiedade ${item.anxietyLevel} de 10`}
              style={[
                styles.barColumn,
                isSelected && {
                  backgroundColor: isDark ? 'rgba(46, 116, 119, 0.25)' : '#EAF4F3',
                  borderRadius: 12,
                },
              ]}
            >
              <View style={styles.barsPair}>
                {/* Barra de Ansiedade (0-10) */}
                <View
                  style={[
                    styles.barItem,
                    {
                      height: Math.max(8, anxietyHeight),
                      backgroundColor: colors.warning,
                    },
                  ]}
                />
                {/* Barra de Humor (1-5) */}
                <View
                  style={[
                    styles.barItem,
                    {
                      height: Math.max(8, moodHeight),
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.dayLabel,
                  {
                    color: isSelected ? colors.primary : colors.textMuted,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {new Date(item.createdAt).toLocaleDateString('pt-BR', { weekday: 'short' })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Legenda Acessível do Gráfico */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Humor (escala 1 a 5)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Ansiedade (escala 0 a 10)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  tooltipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  tooltipDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  tooltipEmotions: {
    fontSize: 12,
    marginTop: 2,
  },
  tooltipMetrics: {
    flexDirection: 'row',
    gap: 6,
  },
  metricPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    paddingVertical: 10,
    gap: 8,
  },
  barColumn: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 44,
  },
  barsPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 110,
    gap: 4,
  },
  barItem: {
    width: 10,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  dayLabel: {
    fontSize: 11,
    marginTop: 6,
    textTransform: 'capitalize',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyChart: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});
