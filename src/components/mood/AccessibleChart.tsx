import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MoodStats } from '../../types';
import { useTheme } from '../../hooks/useTheme';

export interface AccessibleChartProps {
  stats: MoodStats;
}

export const AccessibleChart: React.FC<AccessibleChartProps> = ({ stats }) => {
  const { colors, isDark } = useTheme();

  const accessibleSummary = `Evolução semanal: Média de humor ${stats.averageMood} de 5, Média de ansiedade ${stats.averageAnxiety} de 10 em um total de ${stats.totalCheckins} registros.`;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
          borderColor: colors.border,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={accessibleSummary}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Visão da Semana</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Humor (1-5) e Ansiedade (0-10)
        </Text>
      </View>

      {/* Legenda visual */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Humor</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Ansiedade</Text>
        </View>
      </View>

      {/* Gráfico de Barras Acessível */}
      <View style={styles.barsContainer}>
        {stats.weeklyData.map((item, index) => {
          // Escala de humor: 0 a 5 -> 0% a 100%
          const moodHeightPct = Math.max(8, (item.mood / 5) * 100);
          // Escala de ansiedade: 0 a 10 -> 0% a 100%
          const anxietyHeightPct = Math.max(8, (item.anxiety / 10) * 100);

          return (
            <View key={index} style={styles.dayColumn}>
              <View style={styles.barsTrack}>
                {/* Barra de Ansiedade */}
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${anxietyHeightPct}%`,
                      backgroundColor: item.anxiety > 0 ? colors.warning : 'transparent',
                    },
                  ]}
                />
                {/* Barra de Humor */}
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${moodHeightPct}%`,
                      backgroundColor: item.mood > 0 ? colors.primary : 'transparent',
                    },
                  ]}
                />
              </View>

              <Text style={[styles.dayLabel, { color: colors.textMuted }]}>{item.day}</Text>
            </View>
          );
        })}
      </View>

      {/* Alternativa Textual para Acessibilidade (Leitores de tela e clareza cognitiva) */}
      <View style={[styles.textAltContainer, { backgroundColor: colors.highlight }]}>
        <Text style={[styles.textAltTitle, { color: colors.primaryDark }]}>
          Resumo Acessível:
        </Text>
        <Text style={[styles.textAltBody, { color: colors.text }]}>
          {stats.totalCheckins > 0
            ? `Você realizou ${stats.totalCheckins} registros no período. O humor médio foi de ${stats.averageMood}/5 e o nível médio de ansiedade foi ${stats.averageAnxiety}/10.`
            : 'Nenhum registro encontrado para este período. Comece registrando como você está agora!'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginVertical: 12,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barsTrack: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 3,
  },
  bar: {
    width: 10,
    borderRadius: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  textAltContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
  },
  textAltTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  textAltBody: {
    fontSize: 12,
    lineHeight: 18,
  },
});
