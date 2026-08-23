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
  days = 7,
  onSelectRecord,
}) => {
  const { colors, isDark } = useTheme();
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const sliceCount = days === 7 ? 7 : days === 30 ? 14 : 21;
  const sorted = [...records].reverse().slice(-sliceCount);
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
      {/* Detalhe do ponto selecionado */}
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
              {formatDate(activeRecord.createdAt)}
            </Text>
            <Text style={[styles.tooltipEmotions, { color: colors.textSecondary }]} numberOfLines={1}>
              {activeRecord.emotions?.join(', ') || 'Sem emoções anotadas'}
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

      {/* Gráfico de Barras Compacto */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.barsContainer}
      >
        {sorted.map((item) => {
          const isSelected = item.id === activeRecord?.id;
          const moodHeight = (item.mood / 5) * 85;
          const anxietyHeight = (item.anxietyLevel / 10) * 85;

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
                  borderRadius: 8,
                },
              ]}
            >
              <View style={styles.barsPair}>
                {/* Ansiedade */}
                <View
                  style={[
                    styles.barItem,
                    {
                      height: Math.max(6, anxietyHeight),
                      backgroundColor: colors.warning,
                    },
                  ]}
                />
                {/* Humor */}
                <View
                  style={[
                    styles.barItem,
                    {
                      height: Math.max(6, moodHeight),
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
                {new Date(item.createdAt).toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Legenda Acessível */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Humor (1–5)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Ansiedade (0–10)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  tooltipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  tooltipDate: {
    fontSize: 12,
    fontWeight: '700',
  },
  tooltipEmotions: {
    fontSize: 11,
    marginTop: 2,
  },
  tooltipMetrics: {
    flexDirection: 'row',
    gap: 6,
  },
  metricPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metricPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 115,
    paddingVertical: 6,
    gap: 6,
  },
  barColumn: {
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 38,
  },
  barsPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 85,
    gap: 4,
  },
  barItem: {
    width: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  dayLabel: {
    fontSize: 10,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F4',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyChart: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});
